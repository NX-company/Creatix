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
import ProjectSelector from './ProjectSelector'
import FileUploader from './FileUploader'
import WebsiteModal from './WebsiteModal'
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
    workMode,
    setWorkMode,
    planningData,
    setPlanningData,
    resetPlanningData
  } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isWebModalOpen, setIsWebModalOpen] = useState(false)
  const [isParsingWebsite, setIsParsingWebsite] = useState(false)
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
      
      // Формируем содержимое для AI
      const content = [
        ...data.headings.h1,
        ...data.headings.h2.slice(0, 5),
        ...data.paragraphs.slice(0, 10)
      ].filter(Boolean).join('\n\n')
      
      // Сохраняем данные в store
      const websiteData = {
        url: data.url,
        title: data.title,
        description: data.description || '',
        headings: data.headings,
        paragraphs: data.paragraphs,
        images: data.images,
        content: content
      }
      
      setParsedWebsiteData(websiteData)
      
      const summary = `✅ Сайт успешно проанализирован!

📄 **Заголовок:** ${data.title}
📝 **Описание:** ${data.description || 'Не найдено'}

**Найдено:**
• ${data.headings.h1.length} заголовков H1
• ${data.headings.h2.length} заголовков H2
• ${data.paragraphs.length} абзацев текста
• ${data.images.length} изображений
• ${data.links.length} ссылок

**Основные заголовки:**
${data.headings.h1.slice(0, 3).map((h: string) => `• ${h}`).join('\n')}

💡 **Теперь напишите:** "Создай КП" или "Сделай презентацию"

Данные сайта сохранены и будут использованы для генерации документа!`

      addMessage({
        role: 'assistant',
        content: summary
      })
      
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
      
      // Проверяем, является ли это командой редактирования (только если нет данных сайта)
      if (htmlPreview && !isDocumentCreationFromWebsite && isEditCommand(userMsg)) {
        console.log('🔧 Detected edit command:', userMsg)
        
        let editMessage = '✏️ Вношу изменения'
        if (selectedElement) {
          editMessage += ' в выбранный элемент'
        }
        addMessage({ role: 'assistant', content: editMessage + '...' })
        
        try {
          const editedHtml = await applyAIEdit(htmlPreview, userMsg, selectedElement)
          console.log('✅ AI edit successful, HTML length:', editedHtml.length)
          if (selectedElement) {
            console.log('🎯 Edited selected element:', selectedElement.selector)
          }
          setHtmlPreview(editedHtml)
          
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
        
        addMessage({
          role: 'assistant',
          content: `🎨 Сгенерировано ${result.generatedImages.length} AI-изображений`
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
      
      // Снимаем выделение после успешной правки (если было выделено)
      if (selectedElement) {
        setSelectedElement(null)
      }
      
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
      <div className="border-b border-border p-3 flex items-center justify-between flex-shrink-0 bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Чат</h2>
          
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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            <p>Начните с ввода команды или сообщения</p>
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
              <div className="max-w-[85%] w-full">
                <InlinePlanningCard
                  docType={docType}
                  onSubmit={handlePlanningCardSubmit}
                  onSkip={handlePlanningCardSkip}
                />
              </div>
            ) : (
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg shadow-md ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Обработка...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border flex-shrink-0 bg-background/80 backdrop-blur-sm shadow-sm">
        {/* Переключатель режимов */}
        <div className="p-3 border-b border-border flex items-center justify-center" data-tour="mode-switcher">
          <ModeSwitcher />
        </div>
        
        {/* Статус режима */}
        <div className={`
          px-3 py-2 text-xs font-medium text-center border-b border-border
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
        <div className="p-3 flex gap-2">
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
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-md hover:shadow-lg ${
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
                ? '💬 Опишите что хотите создать, цели, аудиторию...'
                : '🚀 Опишите задачу или напишите "делай"...'
            }
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            disabled={loading}
          />
          <button
            onClick={handleRun}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
    </div>
  )
}

