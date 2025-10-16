import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'
import type { DocType, PlanningData, AppMode, Message } from '../store'
import { getDocTypeConfig } from '../docTypesConfig'

interface ConversationalResponse {
  response: string
  updatedData: Partial<PlanningData>
  isComplete: boolean
  shouldSwitchToBuild: boolean
}

/**
 * Conversational Planning Agent
 * Работает как полноценный AI ассистент с пониманием контекста
 */
export async function processConversationalPlanning(
  userInput: string,
  docType: DocType,
  currentPlanningData: PlanningData,
  conversationHistory: Message[],
  appMode: AppMode
): Promise<ConversationalResponse> {
  
  const modelByMode: Record<AppMode, string> = {
    free: 'google/gemini-2.5-flash-lite',
    advanced: 'google/gemini-2.0-flash-001',
    pro: 'openai/gpt-4o'
  }
  
  const selectedModel = modelByMode[appMode]
  const docConfig = getDocTypeConfig(docType)
  const docLabel = docConfig?.label || 'документа'
  
  // Строим контекст текущего плана
  const planContext = buildPlanContext(currentPlanningData)
  
  // БЫСТРАЯ ПРОВЕРКА: команды вариаций с существующим планом
  const hasExistingPlan = currentPlanningData.theme || currentPlanningData.targetAudience || 
    (currentPlanningData.goals && currentPlanningData.goals.length > 0)
  
  const variationKeywords = ['еще', 'такой же', 'таких же', 'похож', 'вариаци', 'вариант', 'штук', 'штуки']
  const isVariationRequest = variationKeywords.some(keyword => 
    userInput.toLowerCase().includes(keyword)
  )
  
  // Если есть план и пользователь просит вариацию - сразу готовим к генерации
  if (hasExistingPlan && isVariationRequest) {
    console.log('🔄 Detected variation request with existing plan - quick path!')
    
    // Пытаемся извлечь количество из запроса
    const numberMatch = userInput.match(/(\d+)\s*(штук|штуки|логотип|изображени|вариант|вариаци)/i)
    const requestedCount = numberMatch ? parseInt(numberMatch[1]) : null
    
    const updatedData: Partial<PlanningData> = {
      isComplete: true
    }
    
    // Обновляем количество изображений если указано
    if (requestedCount) {
      updatedData.imageCount = requestedCount
      console.log(`📊 Updated image count to ${requestedCount}`)
    }
    
    const countText = requestedCount ? `${requestedCount} ` : ''
    const response = `✨ Отлично! Использую параметры из предыдущего плана:
    
📋 План:
• Компания: ${currentPlanningData.theme || 'не указано'}
• Аудитория: ${currentPlanningData.targetAudience || 'не указано'}
• Цели: ${currentPlanningData.goals?.join(', ') || 'не указано'}
• Визуальные предпочтения: ${currentPlanningData.visualPreferences || 'не указано'}
${requestedCount ? `• Количество: ${requestedCount}\n` : ''}
Готово к генерации! 🚀`
    
    return {
      response,
      updatedData,
      isComplete: true,
      shouldSwitchToBuild: true
    }
  }
  
  // Формируем системный промпт
  const systemPrompt = `Ты умный AI-ассистент для планирования ${docLabel}.

Твоя задача:
1. Общаться естественно, как человек
2. Постепенно собирать информацию о документе через диалог
3. Понимать контекст и намерения пользователя
4. Реагировать на команды: "заново", "сначала", "не знаю", "делай", "пропусти"
5. Когда соберешь достаточно информации - предложить начать генерацию

ВАЖНО:
- Не задавай все вопросы сразу списком
- Задавай 1-2 вопроса за раз, уточняя детали
- Если пользователь говорит "не знаю" - предложи варианты или пропусти
- Если пользователь говорит "делай/начинай/генерируй" и план готов - подтверди готовность к генерации
- Если пользователь говорит "заново/сначала" - начни планирование заново
- Будь дружелюбным и гибким

РАБОТА С СУЩЕСТВУЮЩИМ ПЛАНОМ:
${planContext}

КРИТИЧЕСКОЕ ПРАВИЛО ДЛЯ ПОВТОРНЫХ ЗАПРОСОВ:
- Если в плане выше написано "СУЩЕСТВУЮЩИЙ ПЛАН" и пользователь просит "еще N", "такой же", "N штук", "вариации"
- НЕ задавай повторно вопросы о компании, аудитории, целях, цветах!
- Просто подтверди использование существующих параметров и установи intent: "ready_to_generate"
- Обнови только imageCount или pageCount если пользователь указал новое количество
- Пример: "Отлично! Использую те же параметры (Creatix, красно-розовый, технологичность). Сколько вариантов создать?"

⚠️ КРИТИЧЕСКИ ВАЖНО - ФОРМАТ ОТВЕТА:
Ты ОБЯЗАН отвечать ТОЛЬКО валидным JSON. НЕ добавляй текст до или после JSON!

ПРАВИЛЬНО:
{"response": "Отлично! Для какой компании?", "intent": "need_more_info", "extractedData": {"theme": null}, "completeness": 10}

НЕПРАВИЛЬНО (НЕ ДЕЛАЙ ТАК!):
Отлично. Какие цели у этой рассылки?
[markdown блоки с json]

Формат JSON:
{
  "response": "твой ответ пользователю (дружелюбный, естественный)",
  "intent": "continue" | "ready_to_generate" | "reset" | "need_more_info",
  "extractedData": {
    "theme": "тема документа" или null,
    "targetAudience": "целевая аудитория" или null,
    "goals": ["цель1", "цель2"] или [],
    "keyMessages": ["сообщение1"] или [],
    "visualPreferences": "цвета, стиль" или null,
    "additionalNotes": "доп. заметки" или null,
    "pageCount": число или null,
    "imageCount": число или null
  },
  "completeness": 0-100
}

Примеры правильных ответов:
1. Начало: {"response": "Для какой компании нужен логотип?", "intent": "need_more_info", "extractedData": {"theme": null}, "completeness": 5}
2. Сбор данных: {"response": "Отлично! Какая целевая аудитория?", "intent": "continue", "extractedData": {"theme": "Creatix", "goals": ["регистрация в приложении"]}, "completeness": 40}
3. Готово: {"response": "План готов! Переходим к генерации.", "intent": "ready_to_generate", "extractedData": {}, "completeness": 100}`

  try {
    // Преобразуем историю в формат для LLM
    const messages = [
      { role: 'system', content: systemPrompt },
      // Добавляем последние 10 сообщений для контекста
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userInput }
    ]

    console.log('🤖 Conversational Planner: Calling LLM with', messages.length, 'messages')

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 1000
      })
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('LLM request failed')
    }

    const data = await response.json()
    
    // Парсим JSON ответ
    let result
    try {
      let cleanContent = data.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      // Пытаемся найти JSON в тексте если LLM добавил комментарии
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanContent = jsonMatch[0]
      }
      
      result = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('❌ Failed to parse LLM response:', parseError)
      console.log('📄 Raw content:', data.content.substring(0, 200))
      console.warn('⚠️ LLM вернул обычный текст вместо JSON. Создаю fallback JSON...')
      
      // Пытаемся извлечь данные из текстового ответа
      const textContent = data.content
      const fallbackExtracted: any = {}
      
      // Пытаемся найти упоминания о теме/компании в предыдущих сообщениях пользователя
      const recentUserMessages = conversationHistory
        .filter(m => m.role === 'user')
        .slice(-3) // последние 3 сообщения пользователя
        .map(m => m.content)
      
      // Ищем название компании/тему в ответах пользователя
      if (!currentPlanningData.theme) {
        for (const msg of recentUserMessages) {
          // Простая эвристика: слова из 3+ букв заглавными, возможно название компании
          const companyMatch = msg.match(/\b([A-ZА-ЯЁ][a-zа-яё]{2,}[A-ZА-ЯЁa-zа-яё]*)\b/)
          if (companyMatch && !['Creatix', 'Для', 'Какой'].includes(companyMatch[1])) {
            fallbackExtracted.theme = companyMatch[1]
            console.log('🔍 Extracted theme from user message:', companyMatch[1])
            break
          }
        }
      }
      
      // Ищем целевую аудиторию
      if (!currentPlanningData.targetAudience) {
        for (const msg of recentUserMessages) {
          if (msg.match(/для\s+(всех|клиентов|бизнеса|компании)/i)) {
            const audienceMatch = msg.match(/для\s+([^.,\n]+)/i)
            if (audienceMatch) {
              fallbackExtracted.targetAudience = audienceMatch[1].trim()
              console.log('🔍 Extracted audience from user message:', audienceMatch[1])
              break
            }
          }
        }
      }
      
      // Ищем цели
      if ((!currentPlanningData.goals || currentPlanningData.goals.length === 0) && 
          userInput.match(/(зарегистр|купил|узнал|подписал|регистрац)/i)) {
        const goalMatch = userInput.match(/что\s*бы\s+([^.,\n]+)/i) || 
                         userInput.match(/(зарегистр[^.,\n]+|купил[^.,\n]+|узнал[^.,\n]+)/i)
        if (goalMatch) {
          fallbackExtracted.goals = [goalMatch[1].trim()]
          console.log('🔍 Extracted goal from user message:', goalMatch[1])
        }
      }
      
      // Fallback: создаем валидный JSON из текстового ответа
      result = {
        response: data.content,
        intent: 'continue',
        extractedData: fallbackExtracted,
        completeness: Math.min(
          (currentPlanningData.theme || fallbackExtracted.theme ? 20 : 0) +
          (currentPlanningData.targetAudience || fallbackExtracted.targetAudience ? 20 : 0) +
          ((currentPlanningData.goals?.length || fallbackExtracted.goals?.length) > 0 ? 20 : 0) +
          (currentPlanningData.visualPreferences ? 20 : 0) +
          (currentPlanningData.keyMessages?.length > 0 ? 20 : 0),
          80
        )
      }
      console.log('✅ Fallback JSON created with extracted data:', {
        intent: result.intent,
        completeness: result.completeness,
        extracted: Object.keys(fallbackExtracted).length
      })
    }

    // Обрабатываем намерение
    const shouldSwitchToBuild = result.intent === 'ready_to_generate'
    const isComplete = result.completeness >= 80 || shouldSwitchToBuild

    // Подготавливаем обновленные данные
    const updatedData: Partial<PlanningData> = {}
    
    if (result.intent === 'reset') {
      // Сброс планирования
      return {
        response: result.response,
        updatedData: {
          theme: '',
          targetAudience: '',
          goals: [],
          keyMessages: [],
          visualPreferences: '',
          additionalNotes: '',
          isComplete: false,
          selectedQuestions: [],
          currentQuestionIndex: 0,
          collectedAnswers: {}
        },
        isComplete: false,
        shouldSwitchToBuild: false
      }
    }

    // Обновляем данные планирования
    if (result.extractedData) {
      const extracted = result.extractedData
      
      if (extracted.theme) {
        updatedData.theme = extracted.theme
      }
      if (extracted.targetAudience) {
        updatedData.targetAudience = extracted.targetAudience
      }
      if (extracted.goals && extracted.goals.length > 0) {
        // Объединяем с существующими целями
        const existingGoals = currentPlanningData.goals || []
        updatedData.goals = [...new Set([...existingGoals, ...extracted.goals])]
      }
      if (extracted.keyMessages && extracted.keyMessages.length > 0) {
        const existingMessages = currentPlanningData.keyMessages || []
        updatedData.keyMessages = [...new Set([...existingMessages, ...extracted.keyMessages])]
      }
      if (extracted.visualPreferences) {
        updatedData.visualPreferences = extracted.visualPreferences
      }
      if (extracted.additionalNotes) {
        const existingNotes = currentPlanningData.additionalNotes || ''
        updatedData.additionalNotes = existingNotes 
          ? `${existingNotes}\n${extracted.additionalNotes}` 
          : extracted.additionalNotes
      }
      if (extracted.pageCount) {
        updatedData.pageCount = extracted.pageCount
      }
      if (extracted.imageCount) {
        updatedData.imageCount = extracted.imageCount
      }
      
      updatedData.isComplete = isComplete
    }

    console.log('✅ Conversational Planner:', {
      intent: result.intent,
      completeness: result.completeness,
      shouldSwitchToBuild
    })

    return {
      response: result.response,
      updatedData,
      isComplete,
      shouldSwitchToBuild
    }

  } catch (error) {
    console.error('Conversational planning error:', error)
    return {
      response: '😅 Извините, произошла ошибка. Давайте попробуем еще раз!',
      updatedData: {},
      isComplete: false,
      shouldSwitchToBuild: false
    }
  }
}

/**
 * Строит текстовое представление текущего плана для контекста
 */
function buildPlanContext(planningData: PlanningData): string {
  const parts: string[] = []
  
  if (planningData.theme) {
    parts.push(`Тема: ${planningData.theme}`)
  }
  if (planningData.targetAudience) {
    parts.push(`Целевая аудитория: ${planningData.targetAudience}`)
  }
  if (planningData.goals && planningData.goals.length > 0) {
    parts.push(`Цели: ${planningData.goals.join(', ')}`)
  }
  if (planningData.keyMessages && planningData.keyMessages.length > 0) {
    parts.push(`Ключевые сообщения: ${planningData.keyMessages.join(', ')}`)
  }
  if (planningData.visualPreferences) {
    parts.push(`Визуальные предпочтения: ${planningData.visualPreferences}`)
  }
  if (planningData.pageCount) {
    parts.push(`Количество страниц: ${planningData.pageCount}`)
  }
  if (planningData.imageCount) {
    parts.push(`Количество изображений: ${planningData.imageCount}`)
  }
  
  if (parts.length === 0) {
    return 'Планирование только началось, информации пока нет.'
  }
  
  // Если есть готовый план - добавляем подсказку о повторном использовании
  const hasCompleteData = planningData.theme || planningData.targetAudience || 
    (planningData.goals && planningData.goals.length > 0)
  
  if (hasCompleteData) {
    return `📋 СУЩЕСТВУЮЩИЙ ПЛАН (пользователь уже собрал эту информацию ранее):
${parts.join('\n')}

💡 ВАЖНО: Пользователь может:
- Использовать эти параметры повторно ("еще 5 таких же", "сделай еще", "10 штук")
- Изменить что-то конкретное ("измени цвет на синий", "другая компания")
- Создать вариацию с теми же параметрами

ПРАВИЛО: Если пользователь просит "еще N", "такой же", "N штук", "вариации" - ИСПОЛЬЗУЙ ВСЕ параметры из этого плана БЕЗ повторных вопросов, только уточни количество если нужно!`
  }
  
  return parts.join('\n')
}

/**
 * Форматирует план для использования в Build режиме
 */
export function formatConversationalPlan(planningData: PlanningData, docType: DocType): string {
  if (!planningData.theme && !planningData.targetAudience && 
      planningData.goals.length === 0 && planningData.keyMessages.length === 0) {
    console.log('📋 No conversational planning data available')
    return ''
  }
  
  let plan = `
📋 ПЛАН ДОКУМЕНТА (собран через диалог):

🎯 ТЕМА: ${planningData.theme || 'Не указана'}

👥 ЦЕЛЕВАЯ АУДИТОРИЯ: ${planningData.targetAudience || 'Не указана'}

🎯 ЦЕЛИ:
${planningData.goals.length > 0 ? planningData.goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : 'Не указаны'}

💬 КЛЮЧЕВЫЕ СООБЩЕНИЯ:
${planningData.keyMessages.length > 0 ? planningData.keyMessages.map((m, i) => `${i + 1}. ${m}`).join('\n') : 'Не указаны'}

🎨 ВИЗУАЛЬНЫЕ ПРЕДПОЧТЕНИЯ: ${planningData.visualPreferences || 'Не указаны'}

📝 ДОПОЛНИТЕЛЬНО: ${planningData.additionalNotes || 'Нет'}
`

  if (planningData.pageCount) {
    plan += `\n📄 КОЛИЧЕСТВО СТРАНИЦ: ${planningData.pageCount}\n`
  }

  if (planningData.imageCount) {
    plan += `\n🖼️ КОЛИЧЕСТВО ИЗОБРАЖЕНИЙ: ${planningData.imageCount}\n`
  }

  plan += `\n⚠️ ВАЖНО: Следуй ЭТОМУ плану при генерации документа!`
  
  console.log(`📋 Conversational plan generated (${plan.length} chars)`)
  
  return plan
}

