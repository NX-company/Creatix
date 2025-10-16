'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Loader2, Globe, Target } from 'lucide-react'
import { useStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { generateContent, generateHTML, getPromptForAction } from '@/lib/api'
import { parseAIResponse, convertToPriceItems } from '@/lib/jsonParser'
import type { ParsedProposalData, ParsedInvoiceData } from '@/lib/jsonParser'
import { applyAIEdit, isEditCommand } from '@/lib/aiEditor'
import { generateDocumentWithMode } from '@/lib/agents/orchestrator'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { processPlanningMode, processSmartDialogMode, formatPlanForGeneration } from '@/lib/agents/planningAgent'
import { processConversationalPlanning, formatConversationalPlan } from '@/lib/agents/conversationalPlanner'
import { saveHTMLPreview } from '@/lib/storage/indexedDB'
import { recognizeIntent, extractQuantity } from '@/lib/intentRecognition'
import { getBrowserFingerprint } from '@/lib/browserFingerprint'
import { consumeGeneration, checkGenerationAvailability } from '@/lib/consumeGeneration'
import { calculateGenerationCost } from '@/lib/generationLimits'
import ProjectSelector from './ProjectSelector'
import FileUploader from './FileUploader'
import WebsiteModal from './WebsiteModal'
import WebsiteActionModal from './WebsiteActionModal'
import ModeSwitcher from './ModeSwitcher'
import InlinePlanningCard from './InlinePlanningCard'
import GenerationLimitModal from './GenerationLimitModal'
import TrialExpiredModal from './TrialExpiredModal'
import BuyGenerationsModal from './BuyGenerationsModal'
import WelcomeUpgradeModal from './WelcomeUpgradeModal'

export default function ChatPanel() {
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
    guestGenerationsUsed,
    guestGenerationsLimit,
    incrementGuestGenerations,
    getRemainingGenerations,
    hasRemainingGenerations
  } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isWebModalOpen, setIsWebModalOpen] = useState(false)
  const [isParsingWebsite, setIsParsingWebsite] = useState(false)
  const [websiteActionModalOpen, setWebsiteActionModalOpen] = useState(false)
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState('')
  const [pendingWebsiteData, setPendingWebsiteData] = useState<any>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false)
  const [showBuyGenerationsModal, setShowBuyGenerationsModal] = useState(false)
  const [showWelcomeUpgradeModal, setShowWelcomeUpgradeModal] = useState(false)
  const [availableGenerations, setAvailableGenerations] = useState(0)
  const [currentUser, setCurrentUser] = useState<{
    isInTrial?: boolean
    trialDaysLeft?: number
    trialGenerationsLeft?: number
    trialGenerations?: number
    appMode?: string
  } | null>(null)
  const isGeneratingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shownProgressMessages = useRef<Set<string>>(new Set())
  const hasTriggeredAutoGen = useRef(false)

  // Initialize currentUser from NextAuth session
  useEffect(() => {
    if (session?.user && !isGuestMode) {
      const trialEndsAt = session.user.trialEndsAt ? new Date(session.user.trialEndsAt) : null
      const isInTrial = trialEndsAt ? trialEndsAt > new Date() : false
      const trialGenerations = session.user.trialGenerations || 0
      const trialGenerationsLeft = Math.max(0, 30 - trialGenerations)
      const trialDaysLeft = trialEndsAt 
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0
      
      setCurrentUser({
        isInTrial,
        trialDaysLeft,
        trialGenerationsLeft,
        trialGenerations,
        appMode: session.user.appMode
      })
      
      console.log('👤 Current user initialized:', {
        isInTrial,
        trialGenerations,
        trialGenerationsLeft,
        trialDaysLeft
      })
    } else {
      setCurrentUser(null)
    }
  }, [session, isGuestMode])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])
  
  // Auto-generation function (called from welcome page)
  const triggerGeneration = async (userMsg: string) => {
    if (isGeneratingRef.current || loading) {
      console.warn('⚠️ Generation already in progress')
      return
    }
    
    console.log('⚡ Triggering generation with:', userMsg)
    
    // Set input and trigger Run button click after state update
    setInput(userMsg)
    
    // Small delay to ensure state updates
    setTimeout(() => {
      const runButton = document.querySelector('[data-auto-run="true"]') as HTMLButtonElement
      if (runButton) {
        console.log('🎯 Programmatically clicking Run button')
        runButton.click()
      } else {
        console.error('❌ Run button not found!')
      }
    }, 150)
  }
  
  // Listen for auto-generation trigger from welcome page
  useEffect(() => {
    const handleAutoGeneration = (event: Event) => {
      // Use ref to prevent double trigger across component re-renders
      if (hasTriggeredAutoGen.current) {
        console.log('⏭️ Auto-generation already triggered, ignoring duplicate event')
        return
      }
      
      const customEvent = event as CustomEvent
      const prompt = customEvent.detail?.prompt
      
      console.log('🎯 Auto-generation event received!', {
        prompt,
        isGenerating: isGeneratingRef.current,
        loading,
        hasTriggered: hasTriggeredAutoGen.current
      })
      
      if (prompt && !isGeneratingRef.current && !loading && !hasTriggeredAutoGen.current) {
        hasTriggeredAutoGen.current = true
        console.log('🚀 Auto-generating from welcome page...')
        console.log('📝 Prompt:', prompt)
        
        // Small delay to ensure everything is loaded
        setTimeout(() => {
          triggerGeneration(prompt.trim())
        }, 100)
      } else {
        console.log('⚠️ Cannot auto-generate:', {
          hasPrompt: !!prompt,
          isGenerating: isGeneratingRef.current,
          loading,
          hasTriggered: hasTriggeredAutoGen.current
        })
      }
    }
    
    window.addEventListener('trigger-auto-generation', handleAutoGeneration)
    return () => window.removeEventListener('trigger-auto-generation', handleAutoGeneration)
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
    
    // Set generating flag IMMEDIATELY to prevent race conditions
    if (isGeneratingRef.current) {
      console.log('❌ handleRun blocked: generation already in progress')
      return
    }
    isGeneratingRef.current = true
    
    // Check generation limits
    const intent = recognizeIntent(input.trim(), docType)
    const isCreationRequest = intent.action === 'create'
    
    // Guest limit check
    if (isGuestMode && isCreationRequest) {
      // Check if it's the first ADVANCED demo generation
      const wasFirstGeneration = sessionStorage.getItem('first_generation_advanced') === 'true'
      
      if (!wasFirstGeneration) {
        // Not first generation - check limits
        const fingerprint = getBrowserFingerprint()
        
        try {
          const checkResponse = await fetch('/api/check-generation-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint })
          })
          
          const checkData = await checkResponse.json()
          
          if (!checkData.allowed) {
            console.log(`🚫 Backend limit reached: ${checkData.reason}`)
            addMessage({
              role: 'assistant',
              content: `⚠️ ${checkData.message}\n\nЗарегистрируйтесь, чтобы получить неограниченный доступ!`
            })
            setShowLimitModal(true)
            return
          }
        } catch (error) {
          console.error('Error checking backend limit:', error)
        }
        
        if (!hasRemainingGenerations()) {
          console.log('🚫 Local guest limit reached')
          setShowLimitModal(true)
          return
        }
      } else {
        console.log('🎁 First ADVANCED demo generation - skipping limit check')
      }
    }
    
    // Trial limit check for registered users
    if (!isGuestMode && currentUser?.isInTrial && isCreationRequest) {
      const trialGenerationsLeft = currentUser.trialGenerationsLeft || 0
      const trialDaysLeft = currentUser.trialDaysLeft || 0
      
      if (trialGenerationsLeft <= 0 || trialDaysLeft <= 0) {
        console.log('🚫 Trial limit reached')
        addMessage({
          role: 'assistant',
          content: `⚠️ Ваш пробный период завершен!\n\n📊 Вы использовали ${currentUser.trialGenerations || 0} генераций за ${3 - trialDaysLeft} дней.\n\nСвяжитесь с нами для продолжения работы!`
        })
        setShowTrialExpiredModal(true)
        return
      }
    }
    
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
      
      const fullPrompt = contentPrompt 
        ? `${contentPrompt}${websiteContext}${contextInfo}${planContext}${historyContext}${documentContext}${imagesContext}${selectedElementContext}\n\n📝 ТЕКУЩИЙ ЗАПРОС ПОЛЬЗОВАТЕЛЯ: ${userMsg}`
        : `${userMsg}${websiteContext}${contextInfo}${planContext}${historyContext}${documentContext}${imagesContext}${selectedElementContext}`
      
      // Check generation limits ONLY for authenticated users (non-guest, non-trial)
      // Guests and trial users have their own separate limit systems
      const shouldCheckGenerationLimits = !isGuestMode && !currentUser?.isInTrial
      
      if (shouldCheckGenerationLimits) {
        console.log('🔍 Checking generation limits for authenticated user')
        const imageCount = planningData.imageCount || 10
        
        try {
          const availability = await checkGenerationAvailability(imageCount)
          
          if (!availability.canGenerate) {
            console.log('🚫 Generation limit reached for authenticated user')
            const costInfo = calculateGenerationCost(imageCount)
            
            addMessage({
              role: 'assistant',
              content: `⚠️ Недостаточно генераций!\n\nДля создания документа с ${imageCount} AI изображениями требуется ${costInfo.generationsNeeded} ${costInfo.generationsNeeded === 1 ? 'генерация' : costInfo.generationsNeeded < 5 ? 'генерации' : 'генераций'}.\n\nДоступно: ${availability.availableGenerations || 0}`
            })
            
            setAvailableGenerations(availability.availableGenerations || 0)
            setShowLimitModal(true)
            setLoading(false)
            isGeneratingRef.current = false
            return
          }
        } catch (error) {
          console.error('❌ Error checking generation limits:', error)
          // Continue with generation even if check fails
        }
      } else {
        console.log('ℹ️ Skipping generation limit check (guest or trial user)')
      }
      
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
      
      // Debug: Check which flow will be executed
      console.log('🔍 Generation flow check:', {
        isGuestMode,
        isInTrial: currentUser?.isInTrial,
        isCreationRequest,
        shouldCheckGenerationLimits,
        userState: currentUser ? 'trial/paid' : 'guest/unknown'
      })
      
      // Consume generation ONLY for authenticated users (non-guest, non-trial)
      if (shouldCheckGenerationLimits) {
        try {
          const imageCount = result.generatedImages.length || planningData.imageCount || 10
          const consumeResult = await consumeGeneration(imageCount)
          
          console.log(`✅ Consumed ${consumeResult.consumedGenerations} generation(s), remaining: ${consumeResult.remainingGenerations}`)
          
          // Dispatch event to update Sidebar counter
          window.dispatchEvent(new Event('generationConsumed'))
          
          if (consumeResult.remainingGenerations <= 5) {
            addMessage({
              role: 'assistant',
              content: `⚠️ У вас осталось ${consumeResult.remainingGenerations} ${consumeResult.remainingGenerations === 1 ? 'генерация' : consumeResult.remainingGenerations < 5 ? 'генерации' : 'генераций'} до конца месяца.`
            })
          }
        } catch (error) {
          console.error('❌ Error consuming generation:', error)
        }
      }
      
      // Increment generation counter
      if (isGuestMode && isCreationRequest) {
        // Check if this was the first generation from welcome (ADVANCED demo)
        const wasFirstGeneration = sessionStorage.getItem('first_generation_advanced') === 'true'
        
        if (wasFirstGeneration) {
          // Remove flag and switch to FREE mode
          sessionStorage.removeItem('first_generation_advanced')
          console.log('🎁 First ADVANCED generation complete! Switching to FREE mode')
          useStore.setState({ appMode: 'free' })
          
          // Increment guest counter for first demo generation (counts as used)
          incrementGuestGenerations()
          
          const fingerprint = getBrowserFingerprint()
          try {
            await fetch('/api/check-generation-limit', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fingerprint })
            })
          } catch (error) {
            console.error('Error incrementing backend limit:', error)
          }
          
          console.log('✅ First generation used (1/1). Limit reached.')
          
          // Show welcome upgrade modal after a short delay
          setTimeout(() => {
            setShowWelcomeUpgradeModal(true)
          }, 1500)
        } else {
          // Regular guest generation - increment counter
          incrementGuestGenerations()
          
          const fingerprint = getBrowserFingerprint()
          try {
            await fetch('/api/check-generation-limit', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fingerprint })
            })
          } catch (error) {
            console.error('Error incrementing backend limit:', error)
          }
          
          const remaining = getRemainingGenerations()
          console.log(`✅ Guest generation counted. Remaining: ${remaining}/1`)
          
          if (remaining === 0) {
            addMessage({
              role: 'assistant',
              content: '⚡ Это была ваша бесплатная генерация! Зарегистрируйтесь, чтобы получить 30 генераций в месяц.'
            })
            setTimeout(() => setShowWelcomeUpgradeModal(true), 2000)
          }
        }
      } else if (!isGuestMode && currentUser?.isInTrial && isCreationRequest) {
        console.log('🎯 Trial user detected, incrementing generation counter:', {
          isGuestMode,
          isInTrial: currentUser?.isInTrial,
          isCreationRequest,
          trialGenerations: currentUser?.trialGenerations,
          trialGenerationsLeft: currentUser?.trialGenerationsLeft
        })
        
        try {
          const response = await fetch('/api/user/increment-trial-generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (response.ok) {
            const data = await response.json()
            const remaining = data.trialGenerationsLeft
            const limit = data.trialLimit || 30
            
            console.log(`✅ Trial generation counted. Remaining: ${remaining}/${limit}`)
            
            setCurrentUser(prev => prev ? {
              ...prev,
              trialGenerations: data.trialGenerations,
              trialGenerationsLeft: remaining
            } : null)
            
            // Trigger UI update in Sidebar
            window.dispatchEvent(new CustomEvent('trialGenerationConsumed', {
              detail: { 
                trialGenerations: data.trialGenerations,
                trialGenerationsLeft: remaining,
                trialLimit: limit
              }
            }))
            
            if (remaining === 0) {
              addMessage({
                role: 'assistant',
                content: '⚡ Это была ваша последняя пробная генерация! Свяжитесь с нами для продолжения работы.'
              })
              setTimeout(() => setShowTrialExpiredModal(true), 2000)
            } else if (remaining <= 5) {
              addMessage({
                role: 'assistant',
                content: `⚡ У вас осталось ${remaining} пробных генераций. Используйте их с умом!`
              })
            }
          }
        } catch (error) {
          console.error('Error incrementing trial generation:', error)
        }
      }
      
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
            className="flex-1 min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm lg:text-base bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            disabled={loading}
          />
          
          {/* Кнопка выбора области */}
          <button
            onClick={() => {
              const isActive = selectedElement !== null
              setSelectedElement(isActive ? null : { selector: '', textContent: '', outerHTML: '' })
              
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
            onClick={handleRun}
            disabled={loading || !input.trim()}
            data-auto-run="true"
            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] px-2.5 sm:px-3 lg:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
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
      
      {/* Generation Limit Modal for Guests */}
      <GenerationLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        remaining={getRemainingGenerations()}
      />
      
      {/* Trial Expired Modal for Registered Users */}
      <TrialExpiredModal
        isOpen={showTrialExpiredModal}
        onClose={() => setShowTrialExpiredModal(false)}
        trialGenerations={currentUser?.trialGenerations || 0}
        trialDays={3 - (currentUser?.trialDaysLeft || 0)}
      />
      
      {/* Buy Generations Modal */}
      <BuyGenerationsModal
        isOpen={showBuyGenerationsModal}
        onClose={() => setShowBuyGenerationsModal(false)}
        currentGenerations={availableGenerations}
        onSuccess={() => {
          console.log('✅ Generations purchased successfully')
          setShowBuyGenerationsModal(false)
        }}
      />
      
      {/* Welcome Upgrade Modal (after first ADVANCED demo generation) */}
      <WelcomeUpgradeModal
        isOpen={showWelcomeUpgradeModal}
        onClose={() => setShowWelcomeUpgradeModal(false)}
      />
      
      {/* Enhanced Generation Limit Modal for Authenticated Users */}
      <GenerationLimitModal
        isOpen={showLimitModal && !isGuestMode}
        onClose={() => setShowLimitModal(false)}
        remaining={availableGenerations}
        isAuthenticated={!isGuestMode}
        appMode={currentUser?.appMode || 'FREE'}
        onBuyPack={() => {
          setShowLimitModal(false)
          setShowBuyGenerationsModal(false)
        }}
      />
    </div>
  )
}

