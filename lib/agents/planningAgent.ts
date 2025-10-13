import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'
import type { DocType, PlanningData, AppMode } from '../store'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  proposal: 'коммерческого предложения',
  invoice: 'счёта',
  email: 'письма',
  presentation: 'презентации',
  logo: 'логотипа',
  'product-card': 'карточки товара'
}

async function extractPlanningData(
  answers: Record<string, string>,
  docType: DocType,
  model: string
): Promise<Partial<PlanningData>> {
  const answersText = Object.entries(answers)
    .map(([q, a]) => `${q}: ${a}`)
    .join('\n')

  const prompt = `Извлеки данные планирования из ответов пользователя для ${DOC_TYPE_LABELS[docType]}.

ОТВЕТЫ:
${answersText}

ЗАДАЧА: Извлеки структурированные данные.

ОТВЕТ В JSON:
{
  "theme": "основная тема" или null,
  "targetAudience": "целевая аудитория" или null,
  "goals": ["цель1", "цель2"] или [],
  "keyMessages": ["сообщение1", "сообщение2"] или [],
  "visualPreferences": "визуальные предпочтения" или null,
  "additionalNotes": "дополнительная информация" или null
}`

  try {
    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model,
        temperature: 0.7
      })
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      console.error('Planning extraction API error')
      return {}
    }

    const data = await response.json()
    try {
      const cleanContent = data.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const result = JSON.parse(cleanContent)
      
      const extracted: Partial<PlanningData> = {}
      if (result.theme) extracted.theme = result.theme
      if (result.targetAudience) extracted.targetAudience = result.targetAudience
      if (result.goals?.length > 0) extracted.goals = result.goals
      if (result.keyMessages?.length > 0) extracted.keyMessages = result.keyMessages
      if (result.visualPreferences) extracted.visualPreferences = result.visualPreferences
      if (result.additionalNotes) extracted.additionalNotes = result.additionalNotes
      
      return extracted
    } catch (parseError) {
      console.error('Failed to parse extraction response')
      return {}
    }
  } catch (error) {
    console.error('Planning extraction error:', error)
    return {}
  }
}

export async function processPlanningMode(
  userInput: string,
  docType: DocType,
  currentPlanningData: PlanningData,
  conversationHistory: string,
  appMode: AppMode
): Promise<{ response: string; updatedData: Partial<PlanningData>; isComplete: boolean }> {
  
  const modelByMode: Record<AppMode, string> = {
    free: 'google/gemini-2.5-flash-lite',
    advanced: 'google/gemini-2.0-flash-001',
    pro: 'openai/gpt-4o'
  }
  
  const selectedModel = modelByMode[appMode]
  
  // Показываем карточку планирования, если пользователь еще не выбрал вопросы
  if (!currentPlanningData.selectedQuestions || currentPlanningData.selectedQuestions.length === 0) {
    return {
      response: `SHOW_PLANNING_CARD`,
      updatedData: {},
      isComplete: false
    }
  }
  
  if (currentPlanningData.selectedQuestions && currentPlanningData.selectedQuestions.length > 0) {
    const { selectedQuestions, currentQuestionIndex, answerMode, collectedAnswers } = currentPlanningData
    
    if (answerMode === 'sequential') {
      const currentQuestion = selectedQuestions[currentQuestionIndex]
      const updatedAnswers = { ...collectedAnswers, [currentQuestion]: userInput }
      
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < selectedQuestions.length) {
        return {
          response: `✅ Принял! Вопрос ${nextIndex + 1}/${selectedQuestions.length}:\n\n❓ ${selectedQuestions[nextIndex]}`,
          updatedData: {
            currentQuestionIndex: nextIndex,
            collectedAnswers: updatedAnswers
          },
          isComplete: false
        }
      } else {
        const extractedData = await extractPlanningData(updatedAnswers, docType, selectedModel)
        return {
          response: `✅ Отлично! План собран на основе ваших ответов.\n\n💡 Хотите что-то добавить или уточнить? Если я что-то упустил — не переживайте, вы сможете внести изменения в режиме редактирования после генерации.\n\nПереключайтесь на Build для создания документа!`,
          updatedData: {
            ...extractedData,
            collectedAnswers: updatedAnswers
          },
          isComplete: false
        }
      }
    }
    
    if (answerMode === 'batch') {
      const batchAnswers: Record<string, string> = {}
      selectedQuestions.forEach(q => {
        batchAnswers[q] = userInput
      })
      
      const extractedData = await extractPlanningData(batchAnswers, docType, selectedModel)
      return {
        response: `✅ Принял ваши ответы!\n\n💡 Хотите что-то добавить или уточнить? Может, я забыл учесть какие-то детали? Если понадобится — всегда можно будет отредактировать результат в режиме предпросмотра.\n\nПереключайтесь на Build, когда будете готовы!`,
        updatedData: {
          ...extractedData,
          collectedAnswers: batchAnswers
        },
        isComplete: false
      }
    }
  }
  
  const prompt = `Ты Planning Agent. Извлеки из ответа пользователя информацию для планирования ${DOC_TYPE_LABELS[docType]}.

ОТВЕТ ПОЛЬЗОВАТЕЛЯ: "${userInput}"

ЗАДАЧА: Извлеки данные и поблагодари пользователя. Если нужно, задай уточняющий вопрос.

ОТВЕТ В JSON:
{
  "response": "Твой ответ пользователю (поблагодари и скажи, что он может добавить еще или переключиться на Build)",
  "extractedData": {
    "theme": "тема" или null,
    "targetAudience": "аудитория" или null,
    "goals": ["цель1"] или [],
    "keyMessages": ["сообщение1"] или [],
    "visualPreferences": "визуальные предпочтения" или null,
    "additionalNotes": "дополнительно" или null
  }
}`

  try {
    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: selectedModel,
        temperature: 0.7
      })
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Planning agent API error:', errorText)
      throw new Error('Planning agent failed')
    }

    const data = await response.json()
    let result
    try {
      const cleanContent = data.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse planning response:', data.content)
      return {
        response: data.content.substring(0, 500),
        updatedData: {},
        isComplete: false
      }
    }
    
    const updatedData: Partial<PlanningData> = {}
    if (result.extractedData.theme) updatedData.theme = result.extractedData.theme
    if (result.extractedData.targetAudience) updatedData.targetAudience = result.extractedData.targetAudience
    if (result.extractedData.goals?.length > 0) updatedData.goals = [...currentPlanningData.goals, ...result.extractedData.goals]
    if (result.extractedData.keyMessages?.length > 0) updatedData.keyMessages = [...currentPlanningData.keyMessages, ...result.extractedData.keyMessages]
    if (result.extractedData.visualPreferences) updatedData.visualPreferences = result.extractedData.visualPreferences
    if (result.extractedData.additionalNotes) updatedData.additionalNotes = result.extractedData.additionalNotes
    
    let responseText = result.response
    if (!responseText.includes('редактирован') && !responseText.includes('изменен')) {
      responseText += '\n\n💡 Не забывайте: если что-то потребует корректировки — вы всегда сможете отредактировать результат после генерации.'
    }
    
    return {
      response: responseText,
      updatedData,
      isComplete: false
    }
  } catch (error) {
    console.error('Planning agent error:', error)
    return {
      response: '❌ Ошибка планирования. Попробуйте еще раз.',
      updatedData: {},
      isComplete: false
    }
  }
}

export function formatPlanForGeneration(planningData: PlanningData, docType: DocType): string {
  // Проверяем есть ли вообще данные планирования
  const hasData = planningData.theme || planningData.targetAudience || planningData.goals.length > 0 || 
                  planningData.keyMessages.length > 0 || planningData.visualPreferences || 
                  (planningData.selectedQuestions && planningData.selectedQuestions.length > 0)
  
  if (!hasData) {
    console.log('📋 Plan Context: NO planning data available')
    return ''
  }
  
  let plan = `
📋 УТВЕРЖДЕННЫЙ ПЛАН ДОКУМЕНТА (${docType.toUpperCase()}):

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

  if (planningData.selectedQuestions && planningData.selectedQuestions.length > 0) {
    plan += `\n📋 ОТВЕТЫ НА КОНКРЕТНЫЕ ВОПРОСЫ:\n`
    Object.entries(planningData.collectedAnswers).forEach(([question, answer], i) => {
      plan += `\n${i + 1}. ${question}\n   ➜ ${answer}\n`
    })
    console.log(`📋 Plan Context: ${Object.keys(planningData.collectedAnswers).length} questions answered`)
  }

  plan += `\n⚠️ ВАЖНО: Следуй ЭТОМУ плану при генерации документа!`
  
  console.log(`📋 Plan Context generated (${plan.length} chars):`, plan.substring(0, 200) + '...')
  
  return plan
}
