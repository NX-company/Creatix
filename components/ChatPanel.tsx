'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Send, Loader2, Globe, Target, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { generateContent, generateHTML, getPromptForAction } from '@/lib/api'
import { parseAIResponse, convertToPriceItems } from '@/lib/jsonParser'
import type { ParsedProposalData, ParsedInvoiceData } from '@/lib/jsonParser'
import { applyAIEdit, isEditCommand } from '@/lib/aiEditor'
import { countNewImagePlaceholders } from '@/lib/imageRegeneration'
import { generateDocumentWithMode } from '@/lib/agents/orchestrator'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { processPlanningMode, processSmartDialogMode, formatPlanForGeneration } from '@/lib/agents/planningAgent'
import { processConversationalPlanning, formatConversationalPlan } from '@/lib/agents/conversationalPlanner'
import { saveHTMLPreview } from '@/lib/storage/indexedDB'
import { recognizeIntent, extractQuantity } from '@/lib/intentRecognition'
import ProjectSelector from './ProjectSelector'
import FileUploader from './FileUploader'
import WebsiteModal from './WebsiteModal'
import WebsiteActionModal from './WebsiteActionModal'
import ModeSwitcher from './ModeSwitcher'
import InlinePlanningCard from './InlinePlanningCard'
import FreeGenerationsLimitModal from './FreeGenerationsLimitModal'
import GuestDemoCompleteModal from './GuestDemoCompleteModal'

export default function ChatPanel() {
  const router = useRouter()
  const { data: session } = useSession()
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
    getCurrentProject,
    isGuestMode,
    freeGenerationsRemaining,
    consumeFreeGeneration
  } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isWebModalOpen, setIsWebModalOpen] = useState(false)
  const [isParsingWebsite, setIsParsingWebsite] = useState(false)
  const [websiteActionModalOpen, setWebsiteActionModalOpen] = useState(false)
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState('')
  const [pendingWebsiteData, setPendingWebsiteData] = useState<any>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showGuestDemoModal, setShowGuestDemoModal] = useState(false)
  const isGeneratingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const shownProgressMessages = useRef<Set<string>>(new Set())
  const hasTriggeredAutoGen = useRef(false)
  const lastAutoGenTimestamp = useRef<number>(0)
  const guestGenerationCompleted = useRef(false)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])
  
  // Auto-generation function (called from welcome page)
  const triggerGeneration = useCallback(async (userMsg: string) => {
    // DOUBLE-CHECK: Prevent triggering if already in progress
    if (isGeneratingRef.current || loading) {
      console.warn('⚠️ Generation already in progress, ignoring trigger')
      return
    }

    console.log('⚡ Triggering generation with:', userMsg)

    // Set input and trigger Run button click after state update
    setInput(userMsg)

    // Small delay to ensure state updates
    setTimeout(() => {
      // CRITICAL: Check again before clicking - prevent race condition
      if (isGeneratingRef.current || loading) {
        console.warn('⚠️ Generation started during delay, skipping button click')
        return
      }

      const runButton = document.querySelector('[data-auto-run="true"]') as HTMLButtonElement
      if (runButton) {
        // FINAL CHECK: Only click if button would call handleRun, not handleStop
        const buttonWouldStop = runButton.textContent?.includes('Стоп') || runButton.textContent?.includes('Stop')
        if (buttonWouldStop) {
          console.warn('⚠️ Button would stop generation, skipping click')
          return
        }

        console.log('🎯 Programmatically clicking Run button')
        runButton.click()
      } else {
        console.error('❌ Run button not found!')
      }
    }, 150)
  }, [loading])
  
  // Listen for auto-generation trigger from welcome page
  useEffect(() => {
    const handleAutoGeneration = (event: Event) => {
      // ULTRA-CRITICAL: Use timestamp to prevent ANY race condition
      const now = Date.now()
      const timeSinceLastTrigger = now - lastAutoGenTimestamp.current

      // Ignore if triggered within 2 seconds (definitely a duplicate)
      if (timeSinceLastTrigger < 2000) {
        console.log(`⏭️ Auto-generation recently triggered (${timeSinceLastTrigger}ms ago), ignoring duplicate`)
        return
      }

      // ATOMIC: Check and set flag in one operation
      if (hasTriggeredAutoGen.current === true) {
        console.log('⏭️ Auto-generation already triggered (flag check), ignoring')
        return
      }

      // IMMEDIATELY set both flag and timestamp
      hasTriggeredAutoGen.current = true
      lastAutoGenTimestamp.current = now

      const customEvent = event as CustomEvent
      const prompt = customEvent.detail?.prompt

      console.log('🎯 Auto-generation event received!', {
        prompt,
        isGenerating: isGeneratingRef.current,
        loading,
        timeSinceLastTrigger
      })

      if (!prompt || isGeneratingRef.current || loading) {
        console.log('⚠️ Cannot auto-generate:', {
          hasPrompt: !!prompt,
          isGenerating: isGeneratingRef.current,
          loading
        })
        // Reset flag if we can't proceed
        hasTriggeredAutoGen.current = false
        return
      }

      console.log('🚀 Auto-generating from welcome page...')
      console.log('📝 Prompt:', prompt)

      // Delay for UI stability
      setTimeout(() => {
        // Final check before triggering
        if (!isGeneratingRef.current && !loading) {
          triggerGeneration(prompt.trim())
        } else {
          console.warn('⚠️ Generation state changed, skipping auto-trigger')
        }
      }, 500)
    }

    // CRITICAL: Check if listener already exists to prevent duplicates
    const listenerExists = (window as any).__autoGenerationListenerAdded
    if (listenerExists) {
      console.log('🔒 Auto-generation listener already exists, skipping duplicate')
      return
    }

    // Mark that we've added the listener
    (window as any).__autoGenerationListenerAdded = true

    // Use { once: true } for automatic removal after first trigger
    window.addEventListener('trigger-auto-generation', handleAutoGeneration, { once: true })

    return () => {
      window.removeEventListener('trigger-auto-generation', handleAutoGeneration)
      // Clean up the marker
      delete (window as any).__autoGenerationListenerAdded
    }
  }, [loading, triggerGeneration])

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

  const handleStop = () => {
    console.log('🛑 Stop button clicked')

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      console.log('✅ Generation aborted')
    }

    setLoading(false)
    isGeneratingRef.current = false

    // Don't add stop message to chat - user can see generation stopped

    // Возвращаем фокус на поле ввода
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleRun = async () => {
    console.log('🔵 handleRun called')
    console.log('  📝 input:', input)
    console.log('  ⏳ loading:', loading)
    console.log('  🔒 isGeneratingRef:', isGeneratingRef.current)
    console.log('  🛠️ workMode:', workMode)

    if (!input.trim() || loading) {
      console.log('❌ handleRun blocked:', {
        noInput: !input.trim(),
        loading
      })
      return
    }

    // Проверка команды "стой" для остановки текущей генерации
    const stopCommands = ['стой', 'stop', 'остановись', 'останови', 'прекрати']
    if (stopCommands.some(cmd => input.trim().toLowerCase() === cmd)) {
      console.log('🛑 Stop command detected:', input.trim())
      setInput('')
      handleStop()
      return
    }

    // 🔒 GUEST MODE RESTRICTION: Block new prompts after first generation
    // Check if guest has already generated a document (htmlPreview exists)
    const hasGeneratedDocument = htmlPreview && htmlPreview.trim().length > 0
    if (isGuestMode && hasGeneratedDocument) {
      console.log('🔒 Guest mode: blocking new prompt after first generation')
      addMessage({
        role: 'assistant',
        content: '🔒 Демо-режим завершен!\n\n👉 Зарегистрируйтесь, чтобы продолжить создание и редактирование документов.'
      })
      setInput('')
      isGeneratingRef.current = false
      return
    }

    // 🎁 FREE MODE RESTRICTION: Check free generations limit
    if (!isGuestMode && appMode === 'free') {
      if (freeGenerationsRemaining <= 0) {
        console.log('🔒 Free mode: no generations remaining')
        setShowLimitModal(true)
        setInput('')
        return
      }
    }

    // Set generating flag IMMEDIATELY to prevent race conditions
    if (isGeneratingRef.current) {
      console.log('❌ handleRun blocked: generation already in progress')
      return
    }
    isGeneratingRef.current = true

    // Создаём новый AbortController для возможности прерывания
    abortControllerRef.current = new AbortController()
    console.log('✅ AbortController created')
    
    // Check generation limits
    const intent = recognizeIntent(input.trim(), docType)
    const isCreationRequest = intent.action === 'create'

    // GUEST MODE: Allow ONE demo generation with images
    // The check for existing htmlPreview is already done above (line 326)
    
    console.log('✅ handleRun proceeding with generation')
    
    // Clear progress messages tracker for new generation
    shownProgressMessages.current.clear()
    
    const userMsg = input.trim()
    
    // Check if this message is already in the chat (auto-generation from welcome)
    const lastMessage = messages?.[messages?.length - 1]
    const isDuplicate = lastMessage?.role === 'user' && lastMessage?.content === userMsg
    
    if (!isDuplicate) {
      console.log('➕ Adding user message to chat')
      addMessage({ role: 'user', content: userMsg })
    } else {
      console.log('📋 Message already in chat, skipping duplicate')
    }
    
    setInput('')
    setLoading(true)

    // Возвращаем фокус на поле ввода после небольшой задержки
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    try {
      console.log('🔄 Checking workMode:', workMode)
      if (workMode === 'plan') {
        // Используем conversational planning - умный диалог с пониманием контекста
        console.log('💬 Using conversational planning mode')
        
        const result = await processConversationalPlanning(
          userMsg, 
          docType, 
          planningData, 
          messages, // Передаем всю историю для контекста!
          appMode
        )
        
        addMessage({ role: 'assistant', content: result.response })
        
        if (Object.keys(result.updatedData).length > 0) {
          setPlanningData(result.updatedData)
        }
        
        // Автоматическое переключение на Build когда план готов
        if (result.shouldSwitchToBuild) {
          console.log('🚀 Plan ready, switching to Build mode')
          // Очищаем старый preview чтобы создать новый документ
          setHtmlPreview('')
          setTimeout(() => {
            setWorkMode('build')
            addMessage({
              role: 'assistant',
              content: '✨ Отлично! Переключаюсь на режим Build. Напишите "создай" или "делай" для начала генерации.'
            })
          }, 1500)
        }
        
        setLoading(false)
        isGeneratingRef.current = false

        // Возвращаем фокус на поле ввода после планирования
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)

        return
      }
      
      console.log('✅ Not in plan mode, proceeding with build mode')
      
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
      
      // ВАЖНО: Если есть готовый план и пользователь говорит "делай/создай", это создание нового документа
      const hasPlanData = planningData.isComplete || planningData.theme || planningData.targetAudience
      const isStartGenerationCommand = hasPlanData && (
        userMsg.toLowerCase().includes('делай') || 
        userMsg.toLowerCase().includes('создай') ||
        userMsg.toLowerCase().includes('начинай') ||
        userMsg.toLowerCase().includes('генерируй')
      )
      
      const isEdit = htmlPreview && !isDocumentCreationFromWebsite && !isCreationRequest && !isStartGenerationCommand
      console.log(`🔍 Intent: ${intent.action}, quantity: ${intent.quantity || 'N/A'}, subject: ${intent.subject || 'N/A'}`)
      console.log(`🔍 Is edit mode: ${isEdit} (has preview: ${!!htmlPreview}, creation request: ${isCreationRequest})`)
      console.log(`📝 User message: "${userMsg}"`)
      
      if (isEdit) {
        console.log('🔧 Edit mode activated!')
        if (selectedElement) {
          console.log('🎯 Selected element:', {
            selector: selectedElement.selector,
            parentSelector: selectedElement.parentSelector,
            parentContext: selectedElement.parentContext,
            contentLength: selectedElement.outerHTML?.length || selectedElement.innerHTML.length
          })
        }
        
        let editMessage = '✏️ Вношу изменения'
        if (selectedElement) {
          editMessage += ' в выбранный элемент'
        }
        addMessage({ role: 'assistant', content: editMessage + '...' })
        
        try {
          // Map guest mode to advanced for editing capabilities
          const editMode: 'free' | 'advanced' | 'pro' = appMode === 'guest' ? 'advanced' : (appMode as 'free' | 'advanced' | 'pro')
          const editResult = await applyAIEdit(htmlPreview, userMsg, selectedElement, editMode)
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
          
          // 💰 ПРОВЕРКА НОВЫХ ИЗОБРАЖЕНИЙ И СПИСАНИЕ ГЕНЕРАЦИЙ
          const newImageCount = countNewImagePlaceholders(htmlPreview, finalHtml)

          if (newImageCount > 0 && session && !isGuestMode) {
            const generationCost = newImageCount * 0.1
            console.log(`💰 New images detected: ${newImageCount}, cost: ${generationCost} generations`)

            try {
              const consumeResponse = await fetch('/api/user/consume-generation-fractional', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: generationCost,
                  reason: `Image regeneration (${newImageCount} images)`
                })
              })

              if (!consumeResponse.ok) {
                const error = await consumeResponse.json()
                addMessage({
                  role: 'assistant',
                  content: `❌ Недостаточно генераций для добавления ${newImageCount} изображений. Требуется ${generationCost} генерации.`
                })
                isGeneratingRef.current = false
                return
              }

              const consumeData = await consumeResponse.json()
              console.log(`✅ Consumed ${consumeData.consumed} generations, remaining: ${consumeData.remainingGenerations}`)
              addMessage({
                role: 'assistant',
                content: `💰 Списано ${generationCost} генерации за ${newImageCount} ${newImageCount === 1 ? 'изображение' : 'изображений'}`
              })
            } catch (error) {
              console.error('❌ Failed to consume generations:', error)
              addMessage({
                role: 'assistant',
                content: `❌ Ошибка списания генераций. Попробуйте позже.`
              })
              isGeneratingRef.current = false
              return
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
                  content: '⚠️ Изменения применены, но генерация изображений доступна только в Продвинутом (ADVANCED) режиме. Переключитесь на другой режим для генерации изображений.'
                })
                // Оставляем placeholder для пользователя
              } else {
                addMessage({ 
                  role: 'assistant', 
                  content: '🎨 Генерирую изображение для вставки...' 
                })
              
              try {
                // Генерируем изображение на основе контекста (Flux 1.1 Pro для ADVANCED, Flux Schnell для FREE)
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
                const imageModel = appMode === 'advanced'
                  ? 'black-forest-labs/flux-1.1-pro'  // ADVANCED: Flux 1.1 Pro (лучшее качество)
                  : 'black-forest-labs/flux-schnell'   // FREE: Flux Schnell (быстро и бесплатно)
                
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
      
      console.log('🎨 Starting document creation...')
      console.log('  📄 docType:', docType)
      console.log('  🔧 appMode:', appMode)
      
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
      const recentMessages = messages?.slice(-10) || []
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
      
      // hasPlanData уже объявлена выше для проверки команды генерации
      const planContext = hasPlanData ? formatConversationalPlan(planningData, docType) : ''
      
      if (hasPlanData) {
        console.log('📋 Using conversational plan for generation:', {
          theme: planningData.theme,
          audience: planningData.targetAudience,
          goals: planningData.goals?.length || 0,
          pageCount: planningData.pageCount,
          imageCount: planningData.imageCount
        })
      }
      
      // ============================================
      // PRE-GENERATION CHECK: Verify sufficient generations
      // ============================================
      if (!isGuestMode && session?.user) {
        try {
          const statusResponse = await fetch('/api/user/subscription-status')
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            // Calculate estimated cost (we don't know exact image count yet, so estimate max)
            const estimatedImageCount = appMode === 'advanced' ? 5 : 0 // Max 5 images per 1 generation
            const estimatedCost = Math.ceil(estimatedImageCount / 5)

            const useAdvanced = appMode === 'advanced' && statusData.subscriptionStatus === 'active'
            const availableGenerations = useAdvanced
              ? statusData.advancedGenerationsRemaining
              : statusData.freeGenerationsRemaining

            if (availableGenerations < estimatedCost) {
              addMessage({
                role: 'assistant',
                content: `⚠️ Недостаточно генераций!\n\nНеобходимо: ${estimatedCost} генерации\nДоступно: ${availableGenerations} генераций\n\n${useAdvanced ? 'Подождите обновления подписки или переключитесь на FREE режим.' : 'Переключитесь на ADVANCED режим или дождитесь пополнения баланса.'}`
              })
              return
            }
          }
        } catch (error) {
          console.error('Failed to check generation balance:', error)
        }
      }

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
          // Use Set to track shown messages and prevent duplicates completely
          if (!shownProgressMessages.current.has(message)) {
            shownProgressMessages.current.add(message)
            addMessage({ role: 'assistant', content: message })
            console.log('✅ Progress:', message.substring(0, 60) + '...')
          } else {
            console.log('⏭️ Skipping duplicate progress:', message.substring(0, 60) + '...')
          }
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
          const total = data.total || 0
          addMessage({ 
            role: 'assistant', 
            content: `📊 Счёт на ${data.items.length} позиций на сумму ${total.toFixed(2)} ₽` 
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

      // ============================================
      // POST-GENERATION: Consume generations based on mode and image count
      // ============================================
      if (!isGuestMode && session?.user) {
        const imageCount = result.generatedImages.length
        const generationCost = Math.ceil(imageCount / 5) || 1 // Minimum 1 generation

        if (appMode === 'advanced') {
          // Try to consume ADVANCED generations
          try {
            const consumeResponse = await fetch('/api/user/consume-advanced-generation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ count: generationCost })
            })

            if (consumeResponse.ok) {
              const consumeData = await consumeResponse.json()
              const remainingMsg = consumeData.type === 'advanced'
                ? `Использовано ${consumeData.consumed} ADVANCED генераций. Осталось: ${consumeData.remaining}/${consumeData.total}`
                : `Использовано ${consumeData.consumed} FREE генераций. Осталось: ${consumeData.remaining}/${consumeData.total}`

              addMessage({
                role: 'assistant',
                content: `💳 ${remainingMsg}`
              })
              console.log(`✅ Generation consumed: ${consumeData.type}, cost: ${generationCost}, remaining: ${consumeData.remaining}`)
            } else {
              console.error('Failed to consume generation:', await consumeResponse.text())
            }
          } catch (error) {
            console.error('Error consuming generation:', error)
          }
        } else if (appMode === 'free') {
          // Consume FREE generation
          const success = await consumeFreeGeneration()
          if (success) {
            console.log(`✅ Free generation consumed. Remaining: ${freeGenerationsRemaining - 1}`)
          }
        }
      }

      // 🎯 Show registration modal for guest users after demo
      if (isGuestMode && !guestGenerationCompleted.current) {
        guestGenerationCompleted.current = true
        console.log('🎯 Guest demo completed, showing registration modal in 3 seconds...')

        setTimeout(() => {
          setShowGuestDemoModal(true)
        }, 3000)
      }

    } catch (error) {
      console.error('Generation error:', error)

      // Проверяем, была ли генерация прервана пользователем
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⛔ Generation was aborted by user')
        // Сообщение уже добавлено в handleStop()
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        })
      }
    } finally {
      setLoading(false)
      isGeneratingRef.current = false
      abortControllerRef.current = null

      // Возвращаем фокус на поле ввода после завершения генерации
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
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
        {(!messages || messages.length === 0) && (
          <div className="text-center text-muted-foreground mt-10">
            <p className="text-sm sm:text-base">Начните с ввода команды или сообщения</p>
            <p className="text-xs mt-2">Попробуйте: /import, /propose, /choose, /export</p>
          </div>
        )}
        {messages?.map((msg) => (
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
        {/* Guest Mode Banner */}
        {isGuestMode && htmlPreview && htmlPreview.trim().length > 0 && (
          <div className="px-3 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20">
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">🎉 Вы создали свой первый документ!</p>
              <p className="text-xs text-muted-foreground mb-3">Зарегистрируйтесь, чтобы создавать и редактировать больше документов</p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        )}

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
            : (planningData?.theme || planningData?.targetAudience || (planningData?.goals?.length || 0) > 0)
              ? '⚡ План готов к использованию'
              : '🚀 Быстрая генерация без плана'
          }
        </div>
        
        {/* Поле ввода */}
        <div className="p-2 sm:p-2.5 lg:p-3 flex gap-1.5 sm:gap-2">
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
              className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex items-center justify-center rounded-full transition-all shadow-md hover:shadow-lg ${
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
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
            {!useStore.getState().isFeatureAvailable('parseWebsite') && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Продвинутый режим
              </div>
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleRun()}
            data-tour="chat-input"
            disabled={!!(isGuestMode && htmlPreview && htmlPreview.trim().length > 0)}
            placeholder={
              isGuestMode && htmlPreview && htmlPreview.trim().length > 0
                ? '🔒 Зарегистрируйтесь для продолжения...'
                : workMode === 'plan'
                ? '💬 Опишите что хотите...'
                : loading
                ? '⚠️ Напишите "стой" для остановки...'
                : '🚀 Опишите задачу...'
            }
            className="flex-1 min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm lg:text-base bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {/* Кнопка выбора области */}
          <button
            onClick={() => {
              const isActive = selectedElement !== null
              setSelectedElement(isActive ? null : { selector: '', innerHTML: '', textContent: '', outerHTML: '' })
              
              if (!isActive) {
                addMessage({
                  role: 'assistant',
                  content: `🎯 Режим выбора области включен!\n\n👆 Кликните на любой элемент в предпросмотре`
                })
              } else {
                addMessage({
                  role: 'assistant',
                  content: '🔴 Режим выбора области выключен'
                })
              }
            }}
            title={selectedElement?.selector ? `Область выбрана: ${selectedElement.selector}` : selectedElement ? 'Режим выбора активен - кликните в превью' : 'Включить режим выбора области'}
            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] px-2 sm:px-3 lg:px-3.5 py-2 rounded-md transition-all shadow-md hover:shadow-lg flex items-center justify-center ${
              selectedElement?.selector 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : selectedElement 
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <Target className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${selectedElement ? 'animate-pulse' : ''}`} />
          </button>
          
          <button
            onClick={loading ? handleStop : handleRun}
            disabled={!!((!loading && !input.trim()) || (isGuestMode && htmlPreview && htmlPreview.trim().length > 0))}
            data-auto-run="true"
            title={
              isGuestMode && htmlPreview && htmlPreview.trim().length > 0
                ? 'Доступно после регистрации'
                : loading
                ? 'Остановить генерацию'
                : 'Отправить сообщение'
            }
            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] px-2.5 sm:px-3 lg:px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center ${
              loading
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {loading ? <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
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

      {/* Free Generations Limit Modal */}
      <FreeGenerationsLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />

      {/* Guest Demo Complete Modal */}
      <GuestDemoCompleteModal
        isOpen={showGuestDemoModal}
        onClose={() => setShowGuestDemoModal(false)}
      />
    </div>
  )
}

