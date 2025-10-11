import type { AppMode, DocType, UploadedImage } from '../store'
import { generateContent, generateContentWithImages, generateHTML } from '../api'
import { generateHTMLWithGPT4o } from '../api-openai'
import { generateImagesForDocument, generateImagesFromPlan, replaceImagePlaceholders, type GeneratedImage } from './imageAgent'
import { generateImagesWithDALLE } from './dalleAgent'
import { MODE_CONFIG } from '../config/modes'
import { analyzeContentForImages, type ContentAnalysisResult } from './contentAnalyzer'
import { reviewDocument, buildFeedbackForAgents, type QAReport } from './qaAgent'
import { AGENT_MODELS, QA_CONFIG } from '../config/agents'

export type GenerationResult = {
  html: string
  content: string
  generatedImages: GeneratedImage[]
  mode: AppMode
  qaReport?: QAReport
  iterations?: number
  contentAnalysis?: ContentAnalysisResult
}

export type ProgressCallback = (message: string) => void

export async function generateDocumentWithMode(params: {
  prompt: string
  docType: DocType
  mode: AppMode
  styleConfig: any
  uploadedImages: UploadedImage[]
  priceItems: any[]
  parsedWebsiteData?: any
  onProgress?: ProgressCallback
}): Promise<GenerationResult> {
  const { prompt, docType, mode, styleConfig, uploadedImages, parsedWebsiteData, onProgress } = params

  const notify = (message: string) => {
    console.log(message)
    onProgress?.(message)
  }

  const modeNames = {
    free: 'бесплатном',
    advanced: 'продвинутом',
    pro: 'PRO'
  }
  
  notify(`🚀 Начинаю создание документа в ${modeNames[mode]} режиме`)

  let iteration = 0
  let qaApproved = false
  let qaReport: QAReport | null = null
  let previousFeedback = ''
  
  let content = ''
  let html = ''
  let generatedImages: GeneratedImage[] = []
  let contentAnalysis: ContentAnalysisResult | null = null

  try {
    const config = MODE_CONFIG[mode]
    const textModel = config.models.text
    const useMultimodal = mode === 'advanced' && 'multimodal' in textModel && textModel.multimodal && uploadedImages.length > 0
    
    while (iteration < QA_CONFIG.maxIterations && !qaApproved) {
      iteration++
      
      if (iteration > 1) {
        notify(`🔄 Улучшаю документ (попытка ${iteration}/${QA_CONFIG.maxIterations})`)
      }
      
      if (previousFeedback) {
        const shortFeedback = previousFeedback.length > 80 
          ? previousFeedback.substring(0, 80) + '...'
          : previousFeedback
        notify(`📋 Учитываю замечания: ${shortFeedback}`)
      }

      if (useMultimodal) {
        notify(`👀 Анализирую ваши ${uploadedImages.length} ${uploadedImages.length === 1 ? 'изображение' : uploadedImages.length < 5 ? 'изображения' : 'изображений'}...`)
        const textPrompt = previousFeedback 
          ? `${prompt}\n\nIMPROVEMENT REQUIRED:\n${previousFeedback}` 
          : prompt
        content = await generateContentWithImages(
          textPrompt, 
          docType, 
          uploadedImages,
          config.models.text.model
        )
        notify(`✅ Изображения проанализированы`)
      } else {
        notify(`📝 Пишу текст документа...`)
        const model = mode === 'advanced' ? AGENT_MODELS.text : AGENT_MODELS.freeMode
        const textPrompt = previousFeedback 
          ? `${prompt}\n\nIMPROVEMENT REQUIRED:\n${previousFeedback}` 
          : prompt
        content = await generateContent(textPrompt, docType, model)
        notify(`✅ Текст готов`)
      }

      if (mode === 'advanced') {
        notify(`🎨 Планирую AI изображения для документа...`)
        contentAnalysis = await analyzeContentForImages(prompt, content, docType, previousFeedback)

        const imageCount = contentAnalysis.imagePrompts.length
        if (imageCount > 0) {
          notify(`🖼️ Создаю ${imageCount} ${imageCount === 1 ? 'изображение' : imageCount < 5 ? 'изображения' : 'изображений'}...`)
          
          const fluxSchnellModel = 'black-forest-labs/flux-schnell'
          
          const images: GeneratedImage[] = []
          for (let i = 0; i < contentAnalysis.imagePrompts.length; i++) {
            const plan = contentAnalysis.imagePrompts[i]
            const shortPrompt = plan.prompt.length > 50 
              ? plan.prompt.substring(0, 50) + '...'
              : plan.prompt
            notify(`🎨 Рисую изображение ${i + 1}/${imageCount}: "${shortPrompt}"`)
            
            const singleImage = await generateImagesFromPlan([plan], previousFeedback, fluxSchnellModel)
            images.push(...singleImage)
          }
          generatedImages = images
          
          notify(`✅ Все изображения готовы!`)
        } else {
          notify(`ℹ️ Изображения не требуются для этого документа`)
        }

        const allImages = [
          ...generatedImages.map((img) => ({
            id: `ai-${img.slot}`,
            name: `AI Generated ${img.slot + 1}`,
            base64: img.dataUrl,
            type: 'image/png',
          })),
          ...uploadedImages,
        ]

        notify(`🏗️ Собираю документ с дизайном...`)
        html = await generateHTML(content, docType, styleConfig, allImages)
        notify(`✅ Дизайн применён`)

        notify(`🔧 Вставляю изображения в нужные места...`)
        html = replaceImagePlaceholders(html, generatedImages)
        
        notify(`🔍 Проверяю качество документа...`)
        qaReport = await reviewDocument(prompt, content, generatedImages, html, docType, iteration)
        
        if (qaReport.approved && qaReport.score >= QA_CONFIG.approvalThreshold) {
          qaApproved = true
          notify(`🎉 Проверка пройдена! Оценка: ${qaReport.score}/100`)
        } else {
          notify(`⚠️ Нужны улучшения (оценка ${qaReport.score}/100)`)
          
          if (iteration < QA_CONFIG.maxIterations) {
            previousFeedback = buildFeedbackForAgents(qaReport)
          } else {
            notify(`⏱️ Достигнут лимит попыток, использую текущий результат`)
          }
        }
      } else if (mode === 'free') {
        notify(`🏗️ Оформляю документ...`)
        html = await generateHTML(content, docType, styleConfig, uploadedImages)
        notify(`✅ Документ готов`)
        qaApproved = true
      } else if (mode === 'pro') {
        notify(`💎 Использую PRO режим с максимальным качеством`)
        
        if (uploadedImages.length > 0) {
          notify(`👀 Анализирую ваши ${uploadedImages.length} ${uploadedImages.length === 1 ? 'изображение' : uploadedImages.length < 5 ? 'изображения' : 'изображений'}...`)
          content = await generateContentWithImages(prompt, docType, uploadedImages, parsedWebsiteData, 'openai/gpt-4o')
          notify(`✅ Изображения проанализированы`)
        } else {
          notify(`📝 Пишу текст документа...`)
          content = await generateContent(prompt, docType, 'openai/gpt-4o')
          notify(`✅ Текст готов`)
        }

        notify(`🎨 Планирую HD изображения...`)
        contentAnalysis = await analyzeContentForImages(prompt, content, docType, previousFeedback, true)
        
        const imageCount = contentAnalysis.imagePrompts.length
        if (imageCount > 0) {
          notify(`🖼️ Создаю ${imageCount} HD ${imageCount === 1 ? 'изображение' : imageCount < 5 ? 'изображения' : 'изображений'}...`)
          
          const images: GeneratedImage[] = []
          for (let i = 0; i < contentAnalysis.imagePrompts.length; i++) {
            const plan = contentAnalysis.imagePrompts[i]
            const shortPrompt = plan.prompt.length > 50 
              ? plan.prompt.substring(0, 50) + '...'
              : plan.prompt
            notify(`🎨 Создаю HD изображение ${i + 1}/${imageCount}: "${shortPrompt}"`)
            
            const singleImage = await generateImagesWithDALLE([plan])
            images.push(...singleImage)
          }
          generatedImages = images
          
          notify(`✅ Все HD изображения готовы!`)
        }

        const allImages = [
          ...generatedImages.map((img) => ({
            id: `ai-dalle-${img.slot}`,
            name: `DALL-E 3 Generated ${img.slot + 1}`,
            base64: img.dataUrl,
            type: 'image/png',
          })),
          ...uploadedImages,
        ]

        notify(`🏗️ Собираю PRO документ с дизайном...`)
        html = await generateHTMLWithGPT4o(content, docType, styleConfig, uploadedImages, generatedImages)
        notify(`✅ PRO дизайн применён`)

        notify(`🔧 Вставляю изображения в нужные места...`)
        html = replaceImagePlaceholders(html, generatedImages)
        
        notify(`✅ PRO документ готов!`)
        qaApproved = true
      }
    }

    notify(`✨ Документ создан успешно!`)

    return {
      html,
      content,
      generatedImages,
      mode,
      qaReport: qaReport || undefined,
      iterations: iteration,
      contentAnalysis: contentAnalysis || undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    notify(`❌ Ошибка при создании документа: ${errorMessage}`)
    console.error('❌ Orchestrator error:', error)
    throw error
  }
}

