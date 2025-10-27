/**
 * ============================================
 * DOCUMENT GENERATION ORCHESTRATOR
 * ============================================
 *
 * Главный оркестратор генерации документов.
 * Управляет процессом создания документов в зависимости от режима работы.
 *
 * РЕЖИМЫ РАБОТЫ:
 *
 * 1. ADVANCED (Продвинутый):
 *    - Текст: Claude/Gemini (продвинутая модель)
 *    - Изображения: Flux 1.1 Pro (высокое качество)
 *    - QA проверка: Включена
 *    - Использование: 100 генераций/месяц (подписка)
 *
 * 2. FREE (Бесплатный):
 *    - Текст: Gemini Flash (быстрая модель)
 *    - Изображения: Нет
 *    - QA проверка: Отключена
 *    - Использование: 30 генераций/месяц (регистрация)
 *
 * СХЕМА РАБОТЫ:
 * 1. Генерация текстового контента (режим зависит от appMode)
 * 2. Анализ контента для изображений (только ADVANCED)
 * 3. Генерация AI изображений через Flux (только ADVANCED)
 * 4. Сборка HTML с применением стиля
 * 5. Вставка изображений в плейсхолдеры
 * 6. QA проверка и улучшения (только ADVANCED)
 *
 * @module orchestrator
 */

import type { AppMode, DocType, UploadedImage } from '../store'
import { generateContent, generateContentWithImages, generateHTML } from '../api'
import { generateHTMLWithGPT4o } from '../api-openai'
import { generateImagesForDocument, generateImagesFromPlan, replaceImagePlaceholders, type GeneratedImage } from './imageAgent'
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
  const { prompt, docType, styleConfig, uploadedImages, parsedWebsiteData, onProgress } = params
  
  // Normalize mode to lowercase to ensure compatibility with MODE_CONFIG
  const mode = (params.mode?.toLowerCase() || 'free') as AppMode

  const notify = (message: string) => {
    console.log(message)
    onProgress?.(message)
  }
  
  // Логируем что получили в prompt
  if (prompt.includes('ПЛАН ДОКУМЕНТА')) {
    console.log('✅ Orchestrator received PLAN CONTEXT in prompt')
    const planMatch = prompt.match(/📋 ПЛАН ДОКУМЕНТА[\s\S]*?⚠️ ВАЖНО: Следуй ЭТОМУ плану при генерации документа!/)
    if (planMatch) {
      console.log('📋 Plan section length:', planMatch[0].length, 'chars')
      if (planMatch[0].includes('собран через диалог')) {
        console.log('💬 Conversational plan detected')
      }
    }
  } else {
    console.log('ℹ️ No plan context in prompt (direct build mode)')
  }

  const modeNames = {
    guest: 'гостевом',
    free: 'бесплатном',
    advanced: 'продвинутом',
    pro: 'ADVANCED'
  }
  
  notify(`🚀 Начинаю создание документа в ${modeNames[mode]} режиме`)
  
  if (styleConfig && (styleConfig.name || styleConfig.primaryColor)) {
    const styleName = styleConfig.name || 'Custom'
    notify(`🎨 Применяю стиль: "${styleName}" (${styleConfig.primaryColor})`)
  }

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
        // Используем GPT-4o для анализа изображений в ADVANCED режиме
        const analysisModel = mode === 'advanced'
          ? 'openai/gpt-4o'  // Лучший multimodal анализ
          : config.models.text.model
        console.log(`🔍 Image analysis using model: ${analysisModel}`)
        content = await generateContentWithImages(
          textPrompt, 
          docType, 
          uploadedImages,
          analysisModel
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

      // ============================================
      // ADVANCED РЕЖИМ: Генерация с изображениями
      // ============================================
      if (mode === 'advanced' || mode === 'guest') {
        const isGuest = mode === 'guest'

        if (isGuest) {
          notify(`🎭 Демонстрирую возможности ADVANCED режима с изображениями...`)
        }

        notify(`🎨 Планирую AI изображения для документа...`)

        const planImageCountMatch = prompt.match(/📄 КОЛИЧЕСТВО ИЗОБРАЖЕНИЙ: (\d+)/)
        const userRequestedCount = planImageCountMatch ? parseInt(planImageCountMatch[1]) : undefined

        contentAnalysis = await analyzeContentForImages(prompt, content, docType, previousFeedback, false, uploadedImages.length, userRequestedCount)

        const imageCount = contentAnalysis.imagePrompts.length
        if (imageCount > 0) {
          notify(`🖼️ Создаю ${imageCount} ${imageCount === 1 ? 'изображение' : imageCount < 5 ? 'изображения' : 'изображений'}...`)

          // ADVANCED и GUEST режимы: Flux 1.1 Pro (высокое качество)
          const fluxModel = 'black-forest-labs/flux-1.1-pro'

          const images: GeneratedImage[] = []
          for (let i = 0; i < contentAnalysis.imagePrompts.length; i++) {
            const plan = contentAnalysis.imagePrompts[i]
            const shortPrompt = plan.prompt.length > 50
              ? plan.prompt.substring(0, 50) + '...'
              : plan.prompt
            notify(`🎨 Рисую изображение ${i + 1}/${imageCount}: "${shortPrompt}"`)

            const singleImage = await generateImagesFromPlan([plan], previousFeedback, fluxModel)
            images.push(...singleImage)
          }
          generatedImages = images

          notify(`✅ Все изображения готовы!`)
        } else {
          notify(`ℹ️ Изображения не требуются для этого документа`)
        }

        // ВАЖНО: Загруженные изображения идут ПЕРВЫМИ (IMAGE_0, IMAGE_1, ...), затем AI изображения
        const uploadedImagesCount = uploadedImages.length

        // Преобразуем загруженные изображения в формат GeneratedImage для замены плейсхолдеров
        const uploadedAsGenerated: GeneratedImage[] = uploadedImages.map((img, index) => ({
          prompt: `Uploaded: ${img.name}`,
          dataUrl: img.base64,
          slot: index
        }))

        // Обновляем slot у AI изображений, чтобы они шли ПОСЛЕ загруженных
        const adjustedGeneratedImages = generatedImages.map((img, index) => ({
          ...img,
          slot: uploadedImagesCount + index
        }))

        const allImages = [
          ...uploadedImages,
          ...adjustedGeneratedImages.map((img) => ({
            id: `ai-${img.slot}`,
            name: `AI Generated ${img.slot - uploadedImagesCount + 1}`,
            base64: img.dataUrl,
            type: 'image/png',
          })),
        ]

        notify(`🏗️ Собираю документ с дизайном...`)
        html = await generateHTML(content, docType, styleConfig, allImages)
        notify(`✅ Дизайн применён`)

        notify(`🔧 Вставляю изображения в нужные места...`)
        // Передаем сначала загруженные, потом AI изображения
        const allImagesForReplacement = [...uploadedAsGenerated, ...adjustedGeneratedImages]
        html = replaceImagePlaceholders(html, allImagesForReplacement)

        // Для ADVANCED режима проверяем качество
        if (!isGuest) {
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
        } else {
          // Для GUEST режима - сразу одобряем без проверки
          qaApproved = true
          notify(`✨ Демо готово!`)
        }
      // ============================================
      // FREE РЕЖИМ: Только текст, без AI изображений
      // ============================================
      } else if (mode === 'free') {
        // FREE режим: только текст, без AI генерации изображений
        // Используется для:
        // - Гостей после первой ADVANCED генерации (генерации 2-4)
        // - Зарегистрированных пользователей без подписки (30 генераций/месяц)
        notify(`🏗️ Оформляю документ...`)
        html = await generateHTML(content, docType, styleConfig, uploadedImages)
        notify(`✅ Документ готов`)
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

