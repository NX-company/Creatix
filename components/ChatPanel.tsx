'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Globe } from 'lucide-react'
import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { generateContent, generateHTML, getPromptForAction } from '@/lib/api'
import { parseAIResponse, convertToPriceItems } from '@/lib/jsonParser'
import type { ParsedProposalData, ParsedInvoiceData } from '@/lib/jsonParser'
import { applyAIEdit, isEditCommand } from '@/lib/aiEditor'
import { generateDocumentWithMode } from '@/lib/agents/orchestrator'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { processPlanningMode, formatPlanForGeneration } from '@/lib/agents/planningAgent'
import { saveHTMLPreview } from '@/lib/storage/indexedDB'
import { recognizeIntent, extractQuantity } from '@/lib/intentRecognition'
import ProjectSelector from './ProjectSelector'
import FileUploader from './FileUploader'
import WebsiteModal from './WebsiteModal'
import WebsiteActionModal from './WebsiteActionModal'
import ModeSwitcher from './ModeSwitcher'
import InlinePlanningCard from './InlinePlanningCard'

export default function ChatPanel() {
  const { 
    messages, 
    addMessage, 
    setHtmlPreview,
    htmlPreview,
    docType, 
    styleConfig, 
    priceItems,
    addGeneratedFile,
    setActiveTab,
    setPriceItems,
    uploadedImages,
    selectedElement,
    setSelectedElement,
    parsedWebsiteData,
    setParsedWebsiteData,
    clearParsedWebsiteData,
    appMode,
    lastGeneratedContent,
    setLastGeneratedContent,
    lastGeneratedImages,
    setLastGeneratedImages,
    setGeneratedImagesForExport,
    workMode,
    setWorkMode,
    planningData,
    setPlanningData,
    resetPlanningData,
    getCurrentProject
  } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isWebModalOpen, setIsWebModalOpen] = useState(false)
  const [isParsingWebsite, setIsParsingWebsite] = useState(false)
  const [websiteActionModalOpen, setWebsiteActionModalOpen] = useState(false)
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState('')
  const [pendingWebsiteData, setPendingWebsiteData] = useState<any>(null)
  const isGeneratingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handlePlanningCardSubmit = (selectedQuestions: string[], pageCount?: number, imageCount?: number, mode?: 'batch' | 'sequential') => {
    setPlanningData({
      selectedQuestions,
      pageCount,
      imageCount,
      answerMode: mode || null,
      currentQuestionIndex: 0,
      collectedAnswers: {}
    })
    
    if (mode === 'sequential' && selectedQuestions.length > 0) {
      addMessage({
        role: 'assistant',
        content: `📋 Отлично! Я задам вам ${selectedQuestions.length} ${selectedQuestions.length === 1 ? 'вопрос' : selectedQuestions.length < 5 ? 'вопроса' : 'вопросов'}.\n\nВопрос 1/${selectedQuestions.length}:\n\n❓ ${selectedQuestions[0]}`
      })
    } else if (mode === 'batch' && selectedQuestions.length > 0) {
      const questionsList = selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
      addMessage({
        role: 'assistant',
        content: `📋 Отлично! Вот вопросы, на которые вы выбрали ответить:\n\n${questionsList}\n\n💬 Напишите ваши ответы в одном сообщении (можно кратко по каждому пункту).`
      })
    }
  }

  const handlePlanningCardSkip = () => {
    addMessage({
      role: 'assistant',
      content: '👌 Понял! Используем свободное планирование. Просто опишите что хотите создать, и я помогу вам.'
    })
  }

  const handleWebsiteParse = async (url: string) => {
    setIsParsingWebsite(true)
    
    addMessage({
      role: 'user',
      content: `🌐 Парсинг сайта: ${url}`
    })
    
    addMessage({
      role: 'assistant',
      content: '🔄 Открываю сайт и извлекаю контент...'
    })

    try {
      const response = await fetchWithTimeout('/api/parse-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }, 90000)

      if (!response.ok) {
        throw new Error('Failed to parse website')
      }

      const data = await response.json()
      
      setPendingWebsiteUrl(url)
      setPendingWebsiteData(data)
      setWebsiteActionModalOpen(true)
      setIsParsingWebsite(false)
      setIsWebModalOpen(false)
    } catch (error) {
      console.error('Website parsing error:', error)
      addMessage({
        role: 'assistant',
        content: `❌ Ошибка при парсинге сайта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      })
    } finally {
      setIsParsingWebsite(false)
    }
  }

  const handleWebsiteAction = (action: 'copy-design' | 'content-only' | 'style-only') => {
    if (!pendingWebsiteData) return
    
    const content = [
      ...pendingWebsiteData.headings.h1,
      ...pendingWebsiteData.headings.h2.slice(0, 5),
      ...pendingWebsiteData.paragraphs.slice(0, 10)
    ].filter(Boolean).join('\n\n')
    
    const websiteData = {
      url: pendingWebsiteData.url,
      title: pendingWebsiteData.title,
      description: pendingWebsiteData.description || '',
      headings: pendingWebsiteData.headings,
      paragraphs: pendingWebsiteData.paragraphs,
      images: pendingWebsiteData.images,
      content: content,
      actionType: action
    }
    
    setParsedWebsiteData(websiteData)
    
    if (action === 'copy-design') {
      addMessage({
        role: 'assistant',
        content: `✅ Сайт проанализирован для точного копирования!\n\n📋 Найдено:\n- ${pendingWebsiteData.headings.h1.length} главных заголовков\n- ${pendingWebsiteData.paragraphs.length} абзацев текста\n- ${pendingWebsiteData.images.length} изображений\n\n💡 Скажите какой тип документа создать (карточка товара, презентация и т.д.) - я повторю дизайн максимально точно!`
      })
    } else if (action === 'content-only') {
      addMessage({
        role: 'assistant',
        content: `✅ Контент извлечён! Применю современный дизайн.\n\n📝 Что извлечено:\n- Заголовки и текст\n- Изображения\n\n🎨 Скажите какой документ создать - применю свой стильный дизайн к этому контенту!`
      })
    } else {
      addMessage({
        role: 'assistant',
        content: `✅ Стиль сайта проанализирован!\n\n🎨 AI извлёк цветовую схему и визуальный стиль.\n\n💡 Теперь опишите контент для нового документа - применю стиль с сайта!`
      })
    }
    
    setWebsiteActionModalOpen(false)
    setPendingWebsiteUrl('')
    setPendingWebsiteData(null)
  }

  const handleRun = async () => {
    if (!input.trim() || loading || isGeneratingRef.current) return
    
    isGeneratingRef.current = true
    const userMsg = input.trim()
    addMessage({ role: 'user', content: userMsg })
    setInput('')
    setLoading(true)

    try {
      if (workMode === 'plan') {
        const conversationHistory = messages.slice(-10)
          .map(msg => `${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content}`)
          .join('\n')
        
        const result = await processPlanningMode(userMsg, docType, planningData, conversationHistory, appMode)
        
        if (result.response === 'SHOW_PLANNING_CARD') {
          addMessage({ 
            role: 'assistant', 
            content: '💬 Давайте спланируем ваш документ для лучшего результата!',
            type: 'interactive-planning',
            interactiveData: { completed: false }
          })
        } else {
          addMessage({ role: 'assistant', content: result.response })
        }
        
        if (Object.keys(result.updatedData).length > 0) {
          setPlanningData(result.updatedData)
        }
        
        setLoading(false)
        isGeneratingRef.current = false
        return
      }
      
      const isDocumentCreationFromWebsite = parsedWebsiteData && (
        userMsg.toLowerCase().includes('создай') ||
        userMsg.toLowerCase().includes('сделай') ||
        userMsg.toLowerCase().includes('кп') ||
        userMsg.toLowerCase().includes('презентацию') ||
        userMsg.toLowerCase().includes('письмо') ||
        userMsg.toLowerCase().includes('документ')
      )
      
      // Используем интеллектуальное распознавание намерений
      const intent = recognizeIntent(userMsg, docType)
      const isCreationRequest = intent.action === 'create'
      
      const isEdit = htmlPreview && !isDocumentCreationFromWebsite && !isCreationRequest
      console.log(`🔍 Intent: ${intent.action}, quantity: ${intent.quantity || 'N/A'}, subject: ${intent.subject || 'N/A'}`)
      console.log(`🔍 Is edit mode: ${isEdit} (has preview: ${!!htmlPreview}, creation request: ${isCreationRequest})`)
      console.log(`📝 User message: "${userMsg}"`)
      
      if (isEdit) {
        console.log('🔧 Edit mode activated!')
        console.log('🎯 Selected element:', selectedElement)
        
        let editMessage = '✏️ Вношу изменения'
        if (selectedElement) {
          editMessage += ' в выбранный элемент'
        }
        addMessage({ role: 'assistant', content: editMessage + '...' })
        
        try {
          const editResult = await applyAIEdit(htmlPreview, userMsg, selectedElement, appMode)
          console.log('✅ AI edit successful, HTML length:', editResult.html.length)
          console.log(`🔧 Contextual edit: ${editResult.isContextual}, selector: ${editResult.selector || 'N/A'}`)
          
          let finalHtml = editResult.html
          
          // 🔧 Если контекстное редактирование - заменяем элемент в полном HTML
          if (editResult.isContextual && editResult.selector) {
            console.log(`🔧 Replacing element ${editResult.selector} in full HTML...`)
            
            try {
              // Используем DOMParser для безопасной замены элемента
              const parser = new DOMParser()
              const doc = parser.parseFromString(htmlPreview, 'text/html')
              const element = doc.querySelector(editResult.selector)
              
              if (element) {
                element.outerHTML = editResult.html
                finalHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
                console.log(`✅ Element ${editResult.selector} replaced successfully`)
              } else {
                console.warn(`⚠️ Element ${editResult.selector} not found, using edited HTML as-is`)
                finalHtml = editResult.html
              }
            } catch (domError) {
              console.error('❌ DOM replacement failed:', domError)
              finalHtml = editResult.html
            }
          }
          
          // Проверяем, нужно ли сгенерировать изображение
          if (finalHtml.includes('IMAGE_PLACEHOLDER')) {
            console.log('🖼️ Detected IMAGE_PLACEHOLDER, checking for uploaded images...')
            
            // 🔍 НОВОЕ: Проверяем, есть ли загруженные изображения с actionType='use-as-is'
            const imageToInsert = uploadedImages.find(img => img.actionType === 'use-as-is')
            
            if (imageToInsert) {
              // Вставляем загруженное фото как есть
              addMessage({ 
                role: 'assistant', 
                content: `✅ Вставляю загруженное фото "${imageToInsert.name}"` 
              })
              
              // Заменяем IMAGE_PLACEHOLDER на загруженное изображение
              finalHtml = finalHtml.replace(/IMAGE_PLACEHOLDER/g, imageToInsert.base64)
              
              setHtmlPreview(finalHtml)
              const project = getCurrentProject()
              if (project) {
                const storageKey = `${project.id}-${docType}`
                await saveHTMLPreview(storageKey, finalHtml)
              }
              
              addMessage({
                role: 'assistant',
                content: `✅ Изображение "${imageToInsert.name}" вставлено!`
              })
            } else {
              // Нет загруженных изображений - генерируем через AI
              console.log('🖼️ No uploaded images, generating with AI...')
              
              // Проверяем, доступна ли генерация изображений в текущем режиме
              const { MODE_CONFIG } = await import('@/lib/config/modes')
              const modeConfig = MODE_CONFIG[appMode]
              
              if (!modeConfig.features.aiImageGeneration) {
                // В бесплатном режиме генерация недоступна
                addMessage({ 
                  role: 'assistant', 
                  content: '⚠️ Изменения применены, но генерация изображений доступна только в Продвинутом и PRO режимах. Переключитесь на другой режим для генерации изображений.' 
                })
                // Оставляем placeholder для пользователя
              } else {
                addMessage({ 
                  role: 'assistant', 
                  content: '🎨 Генерирую изображение для вставки...' 
                })
              
              try {
                // Генерируем изображение на основе контекста (Flux 1.1 Pro для PRO, Flux Schnell для остальных)
                const { generateImagesFromPlan } = await import('@/lib/agents/imageAgent')
                
                // Определяем тип изображения из контекста
                const lowerMsg = userMsg.toLowerCase()
                let imageType: 'product' | 'logo' | 'illustration' | 'hero' | 'background' = 'product'
                if (lowerMsg.includes('логотип') || lowerMsg.includes('logo')) {
                  imageType = 'logo'
                } else if (lowerMsg.includes('фон') || lowerMsg.includes('background')) {
                  imageType = 'background'
                } else if (lowerMsg.includes('иллюстрац')) {
                  imageType = 'illustration'
                }
                
                // Улучшаем промпт для генерации, извлекая ключевые слова
                let enhancedPrompt = userMsg
                // Убираем лишние слова
                enhancedPrompt = enhancedPrompt.replace(/вставь|добавь|сюда|туда|здесь|замени|это|фото|на/gi, '').trim()
                if (!enhancedPrompt) {
                  enhancedPrompt = 'professional high quality image'
                }
                
                // 🌍 Если промпт на русском - переводим через GPT-4o для лучшего понимания Flux
                if (/[а-яё]/i.test(enhancedPrompt)) {
                  console.log(`🌍 Translating Russian prompt to English: "${enhancedPrompt}"`)
                  
                  try {
                    const translateResponse = await fetchWithTimeout('/api/openrouter-chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        messages: [{
                          role: 'user',
                          content: `Convert this to a detailed English image generation prompt for Flux Schnell AI model:

"${enhancedPrompt}"

Requirements:
- Focus on the main subject/object described
- Add details for professional/product photography style
- Keep it concise (max 80 words)
- Optimize for realistic image generation
- Include relevant photography terms (e.g., "close-up", "studio lighting", "clean background")

Output ONLY the English prompt, nothing else. No quotes, no explanations.`
                        }],
                        model: 'openai/gpt-4o',
                        temperature: 0.3
                      }),
                    }, 30000) // 30 sec timeout for translation
                    
                    if (translateResponse.ok) {
                      const data = await translateResponse.json()
                      const translatedPrompt = data.content.trim().replace(/^["']|["']$/g, '')
                      console.log(`✅ Translated to: "${translatedPrompt}"`)
                      enhancedPrompt = translatedPrompt
                    } else {
                      console.warn('⚠️ Translation failed, using original prompt')
                    }
                  } catch (translateError) {
                    console.warn('⚠️ Translation error:', translateError)
                    // Fallback: используем оригинальный промпт
                  }
                }
                
                enhancedPrompt += '. Professional, high quality, modern style, clean background'
                
                console.log(`🎨 Generating image with prompt: "${enhancedPrompt}"`)
                
                const imagePlan = [{
                  type: imageType,
                  prompt: enhancedPrompt,
                  reasoning: `User requested to add image: ${userMsg}`,
                  slot: 0
                }]
                
                let generatedImages
                
                // Выбираем модель в зависимости от режима
                const imageModel = appMode === 'pro'
                  ? 'black-forest-labs/flux-1.1-pro'  // PRO: Flux 1.1 Pro (лучшее качество)
                  : 'black-forest-labs/flux-schnell'   // Free/Advanced: Flux Schnell (быстро и бесплатно)
                
                // Таймаут для генерации изображения (60 секунд)
                const imagePromise = generateImagesFromPlan(imagePlan, undefined, imageModel)
                
                const timeoutPromise = new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Image generation timeout')), 60000)
                )
                
                generatedImages = await Promise.race([imagePromise, timeoutPromise])
                
                if (generatedImages && generatedImages.length > 0) {
                  // Заменяем IMAGE_PLACEHOLDER на сгенерированное изображение
                  finalHtml = finalHtml.replace(/IMAGE_PLACEHOLDER/g, generatedImages[0].dataUrl)
                  console.log('✅ Image generated and inserted')
                  addMessage({ 
                    role: 'assistant', 
                    content: '✅ Изображение сгенерировано и вставлено!' 
                  })
                } else {
                  console.warn('⚠️ No images generated')
                  addMessage({ 
                    role: 'assistant', 
                    content: '⚠️ Изменения применены, но изображение не было создано.' 
                  })
                }
              } catch (imgError) {
                console.error('❌ Image generation failed:', imgError)
                const errorMsg = imgError instanceof Error && imgError.message.includes('timeout')
                  ? '⚠️ Превышено время ожидания генерации изображения (60 сек). Попробуйте еще раз.'
                  : '⚠️ Изменения применены, но не удалось сгенерировать изображение. Попробуйте еще раз.'
                addMessage({ 
                  role: 'assistant', 
                  content: errorMsg
                })
              }
            }
          }
          }
          
          setHtmlPreview(finalHtml)
          
          addMessage({ 
            role: 'assistant', 
            content: '✅ Готово! Изменения применены к документу.' 
          })
        } catch (editError) {
          console.error('❌ AI edit failed:', editError)
          addMessage({
            role: 'assistant',
            content: `❌ Не получилось применить изменения: ${editError instanceof Error ? editError.message : 'Попробуйте еще раз'}`
          })
        }
        
        setLoading(false)
        return
      }
      
      const contentPrompt = getPromptForAction(docType, 'contentGeneration')
      const selectedStyleName = useStore.getState().selectedStyleName
      
      // Если есть данные сайта, добавляем их в промпт
      let websiteContext = ''
      if (isDocumentCreationFromWebsite && parsedWebsiteData) {
        websiteContext = `\n\n📊 ДАННЫЕ С САЙТА "${parsedWebsiteData.title}" (${parsedWebsiteData.url}):

ОПИСАНИЕ САЙТА:
${parsedWebsiteData.description}

ОСНОВНОЙ КОНТЕНТ:
${parsedWebsiteData.content}

ИЗОБРАЖЕНИЯ: ${parsedWebsiteData.images.length} шт.

ВАЖНО: Используй эту информацию для создания документа. Возьми реальные данные, услуги, продукты с этого сайта.`
        
        // Очищаем данные сайта после использования
        clearParsedWebsiteData()
      }
      
      // Добавляем контекст о выбранном стиле и изображениях
      let contextInfo = ''
      
      if (selectedStyleName) {
        contextInfo += `\n\n🎨 ВЫБРАННЫЙ СТИЛЬ: "${selectedStyleName}"\nОбязательно упомяни в ответе пользователю что работаешь на основе этого стиля.`
      }
      
      if (uploadedImages.length > 0) {
        contextInfo += `\n\n📸 ЗАГРУЖЕНО ИЗОБРАЖЕНИЙ: ${uploadedImages.length} шт.\nОбязательно упомяни что используешь загруженные изображения.`
      }
      
      // 💬 ИСТОРИЯ ДИАЛОГА (последние 10 сообщений для контекста)
      const recentMessages = messages.slice(-10)
      const conversationHistory = recentMessages.length > 0
        ? recentMessages
            .map(msg => {
              const role = msg.role === 'user' ? '👤 Пользователь' : '🤖 Ассистент'
              return `${role}: ${msg.content}`
            })
            .join('\n')
        : ''
      
      const historyContext = conversationHistory 
        ? `\n\n💬 ИСТОРИЯ ДИАЛОГА (для контекста, учитывай предыдущие сообщения):\n${conversationHistory}\n` 
        : ''
      
      // 📄 ТЕКУЩИЙ ДОКУМЕНТ (что было сгенерировано ранее)
      let documentContext = ''
      if (lastGeneratedContent && lastGeneratedContent.length > 0) {
        const contentPreview = lastGeneratedContent.length > 2000 
          ? lastGeneratedContent.substring(0, 2000) + '...'
          : lastGeneratedContent
        documentContext = `\n\n📄 ТЕКУЩИЙ ДОКУМЕНТ (структура того, что ты создал):\n${contentPreview}\n\nПользователь может ссылаться на это содержимое ("вариант 3", "измени заголовок", "поменяй это").`
      }
      
      // 🎨 СГЕНЕРИРОВАННЫЕ ИЗОБРАЖЕНИЯ (что было создано AI)
      let imagesContext = ''
      if (lastGeneratedImages.length > 0) {
        imagesContext = `\n\n🎨 СГЕНЕРИРОВАННЫЕ AI ИЗОБРАЖЕНИЯ:\n`
        lastGeneratedImages.forEach((img, i) => {
          imagesContext += `Изображение ${i + 1}: "${img.prompt}"\n`
        })
        imagesContext += `\nПользователь может просить изменить конкретное изображение ("поменяй картинку 2", "измени изображение на огурец").`
      }
      
      // 🎯 ВЫДЕЛЕННЫЙ ЭЛЕМЕНТ (пользователь навел курсор)
      let selectedElementContext = ''
      if (selectedElement) {
        // Определяем тип элемента по селектору
        let elementType = 'элемент'
        const selector = selectedElement.selector.toLowerCase()
        if (selector.includes('img')) {
          elementType = 'изображение'
        } else if (selector.match(/h[1-6]/)) {
          elementType = 'заголовок'
        } else if (selector.includes('button')) {
          elementType = 'кнопка'
        } else if (selector.includes('p')) {
          elementType = 'параграф'
        } else if (selector.includes('div')) {
          elementType = 'блок'
        }
        
        selectedElementContext = `\n\n🎯 ВЫДЕЛЕННЫЙ ЭЛЕМЕНТ (пользователь навел курсор и хочет изменить ЭТО):
Тип: ${elementType}
Селектор: ${selectedElement.selector}
Текущий текст: ${selectedElement.textContent.substring(0, 300)}${selectedElement.textContent.length > 300 ? '...' : ''}
HTML: ${selectedElement.innerHTML.substring(0, 500)}${selectedElement.innerHTML.length > 500 ? '...' : ''}

⚠️ КРИТИЧНО ВАЖНО: Когда пользователь говорит "это", "здесь", "поменяй", "измени", "сделай красным" - он имеет в виду ИМЕННО ЭТОТ выделенный элемент! Применяй изменения только к нему.`
      }
      
      const hasPlanData = planningData.theme || planningData.targetAudience || planningData.goals.length > 0
      const planContext = hasPlanData ? formatPlanForGeneration(planningData, docType) : ''
      
      const fullPrompt = contentPrompt 
        ? `${contentPrompt}${websiteContext}${contextInfo}${planContext}${historyContext}${documentContext}${imagesContext}${selectedElementContext}\n\n📝 ТЕКУЩИЙ ЗАПРОС ПОЛЬЗОВАТЕЛЯ: ${userMsg}`
        : `${userMsg}${websiteContext}${contextInfo}${planContext}${historyContext}${documentContext}${imagesContext}${selectedElementContext}`
      
      const result = await generateDocumentWithMode({
        prompt: fullPrompt,
        docType,
        mode: appMode,
        styleConfig,
        uploadedImages,
        priceItems,
        parsedWebsiteData: isDocumentCreationFromWebsite ? parsedWebsiteData : undefined,
        onProgress: (message: string) => {
          addMessage({ role: 'assistant', content: message })
        }
      })
      
      const parsedData = parseAIResponse(result.content, docType)
      
      if (parsedData) {
        if (docType === 'proposal' && 'priceItems' in parsedData) {
          const data = parsedData as ParsedProposalData
          setPriceItems(convertToPriceItems(data.priceItems))
          addMessage({ 
            role: 'assistant', 
            content: `📊 Загружено ${data.priceItems.length} позиций с ценами` 
          })
        } else if (docType === 'invoice' && 'items' in parsedData) {
          const data = parsedData as ParsedInvoiceData
          setPriceItems(convertToPriceItems(data.items))
          addMessage({ 
            role: 'assistant', 
            content: `📊 Счёт на ${data.items.length} позиций на сумму ${data.total.toFixed(2)} ₽` 
          })
        }
      }
      
      // Сохраняем контент и изображения для следующих команд
      setLastGeneratedContent(result.content)
      
      if (result.generatedImages.length > 0) {
        // Сохраняем информацию об изображениях
        const imageInfo = result.generatedImages.map((img) => ({
          slot: img.slot,
          prompt: img.prompt
        }))
        setLastGeneratedImages(imageInfo)
        
        // Сохраняем полные изображения для экспорта
        setGeneratedImagesForExport(result.generatedImages)
        
        addMessage({
          role: 'assistant',
          content: `🎨 Сгенерировано ${result.generatedImages.length} AI-изображений. Перейдите во вкладку "Изображения" для скачивания.`
        })
      }
      
      if (result.qaReport) {
        const qaEmoji = result.qaReport.score >= 90 ? '🌟' : result.qaReport.score >= 75 ? '✅' : '⚠️'
        addMessage({
          role: 'assistant',
          content: `${qaEmoji} Оценка качества: ${result.qaReport.score}/100 (${result.iterations} ${result.iterations === 1 ? 'итерация' : 'итераций'})`
        })
      }
      
      setHtmlPreview(result.html)
      
      // Сохраняем выделение для возможности дальнейшего редактирования
      
      addMessage({ 
        role: 'assistant', 
        content: '✅ Готово! Проверьте превью справа. Можете сохранить в файлы или попросить изменить.' 
      })
      
      if (hasPlanData) {
        resetPlanningData()
        addMessage({
          role: 'assistant',
          content: '📋 План использован. Для нового документа с планом вернитесь в режим Plan.'
        })
      }
      
    } catch (error) {
      console.error('Generation error:', error)
      addMessage({ 
        role: 'assistant', 
        content: `❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
      })
    } finally {
      setLoading(false)
      isGeneratingRef.current = false
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/10">
      <div className="border-b border-border p-2 sm:p-3 flex items-center justify-between flex-shrink-0 bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-xs sm:text-sm">Чат</h2>
          
          {/* ИНДИКАТОР РЕЖИМА */}
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium transition-all
            ${workMode === 'plan' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }
          `}>
            {workMode === 'plan' ? '📝 Планирование' : '🚀 Разработка'}
          </div>
        </div>
        
        <ProjectSelector />
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            <p className="text-sm sm:text-base">Начните с ввода команды или сообщения</p>
            <p className="text-xs mt-2">Попробуйте: /import, /propose, /choose, /export</p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'interactive-planning' ? (
              <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] w-full">
                <InlinePlanningCard
                  docType={docType}
                  onSubmit={handlePlanningCardSubmit}
                  onSkip={handlePlanningCardSkip}
                />
              </div>
            ) : (
              <div
                className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] px-3 py-2 sm:px-4 rounded-lg shadow-md ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 shadow-md">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs sm:text-sm">Обработка...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border flex-shrink-0 bg-background/80 backdrop-blur-sm shadow-sm">
        {/* Переключатель режимов */}
        <div className="p-2 sm:p-3 border-b border-border flex items-center justify-center" data-tour="mode-switcher">
          <ModeSwitcher />
        </div>
        
        {/* Статус режима */}
        <div className={`
          px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-medium text-center border-b border-border
          ${workMode === 'plan' 
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' 
            : 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
          }
        `}>
          {workMode === 'plan' 
            ? '💬 Режим планирования: опишите детали для лучшего результата'
            : (planningData.theme || planningData.targetAudience || planningData.goals.length > 0)
              ? '⚡ План готов к использованию'
              : '🚀 Быстрая генерация без плана'
          }
        </div>
        
        {/* Поле ввода */}
        <div className="p-2 sm:p-3 flex gap-1.5 sm:gap-2">
          <div data-tour="file-upload">
            <FileUploader />
          </div>
          
          {/* Круглая кнопка "Веб" */}
          <div className="relative" data-tour="website-parse">
            <button
              onClick={() => {
                if (useStore.getState().isFeatureAvailable('parseWebsite')) {
                  setIsWebModalOpen(true)
                }
              }}
              disabled={loading || isParsingWebsite || !useStore.getState().isFeatureAvailable('parseWebsite')}
              className={`min-w-[44px] min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all shadow-md hover:shadow-lg ${
                useStore.getState().isFeatureAvailable('parseWebsite')
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50`}
              title={
                useStore.getState().isFeatureAvailable('parseWebsite')
                  ? 'Парсинг сайта'
                  : 'Доступно в Продвинутом режиме'
              }
            >
              <Globe className="w-5 h-5" />
            </button>
            {!useStore.getState().isFeatureAvailable('parseWebsite') && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Продвинутый режим
              </div>
            )}
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            data-tour="chat-input"
            placeholder={
              workMode === 'plan'
                ? '💬 Опишите что хотите...'
                : '🚀 Опишите задачу...'
            }
            className="flex-1 min-h-[44px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            disabled={loading}
          />
          <button
            onClick={handleRun}
            disabled={loading || !input.trim()}
            className="min-w-[44px] min-h-[44px] px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
      
      {/* Модальное окно для ввода URL */}
      <WebsiteModal
        isOpen={isWebModalOpen}
        onClose={() => setIsWebModalOpen(false)}
        onSubmit={handleWebsiteParse}
        isLoading={isParsingWebsite}
      />
      
      {/* Модальное окно выбора действия с сайтом */}
      <WebsiteActionModal
        isOpen={websiteActionModalOpen}
        websiteUrl={pendingWebsiteUrl}
        onClose={() => {
          setWebsiteActionModalOpen(false)
          setPendingWebsiteUrl('')
          setPendingWebsiteData(null)
        }}
        onAction={handleWebsiteAction}
      />
    </div>
  )
}

