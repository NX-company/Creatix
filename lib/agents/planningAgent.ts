import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'
import type { DocType, PlanningData, AppMode } from '../store'
import { generateSmartQuestions, parseSmartAnswers, type SmartDialogResult } from './smartDialogAgent'
import { getDocTypeConfig } from '../docTypesConfig'

// Deprecated: Старые лейблы для обратной совместимости
const DOC_TYPE_LABELS: Record<string, string> = {
  proposal: 'коммерческого предложения',
  invoice: 'счёта',
  email: 'письма',
  presentation: 'презентации',
  logo: 'логотипа',
  'product-card': 'карточки товара',
  'commercial-proposal': 'коммерческого предложения',
  'business-card': 'визитной карточки',
  'youtube-thumbnail': 'YouTube превью',
  'vk-post': 'VK поста',
  'telegram-post': 'Telegram поста',
  'wildberries-card': 'карточки товара для Wildberries',
  'ozon-card': 'карточки товара для Ozon',
  'yandex-market-card': 'карточки товара для Яндекс.Маркет',
  'avito-card': 'объявления для Avito',
  'brand-book': 'брендбука',
  'icon-set': 'набора иконок',
  'ui-kit': 'UI Kit',
  'email-template': 'email-шаблона',
  'newsletter': 'email-рассылки',
  'custom-design': 'кастомного дизайна'
}

function getDocTypeLabel(docType: DocType): string {
  const config = getDocTypeConfig(docType)
  return config?.label.toLowerCase() || DOC_TYPE_LABELS[docType] || 'документа'
}

function extractNumberFromText(text: string): number | null {
  if (!text) return null
  
  const textLower = text.toLowerCase().trim()
  
  const numberWords: Record<string, number> = {
    'один': 1, 'одна': 1, 'одно': 1, 'одного': 1,
    'два': 2, 'две': 2, 'двух': 2,
    'три': 3, 'трёх': 3, 'трех': 3,
    'четыре': 4, 'четырёх': 4, 'четырех': 4,
    'пять': 5, 'пяти': 5,
    'шесть': 6, 'шести': 6,
    'семь': 7, 'семи': 7,
    'восемь': 8, 'восьми': 8,
    'девять': 9, 'девяти': 9,
    'десять': 10, 'десяти': 10,
    'одиннадцать': 11, 'одиннадцати': 11,
    'двенадцать': 12, 'двенадцати': 12,
    'тринадцать': 13, 'тринадцати': 13,
    'четырнадцать': 14, 'четырнадцати': 14,
    'пятнадцать': 15, 'пятнадцати': 15,
    'шестнадцать': 16, 'шестнадцати': 16,
    'семнадцать': 17, 'семнадцати': 17,
    'восемнадцать': 18, 'восемнадцати': 18,
    'девятнадцать': 19, 'девятнадцати': 19,
    'двадцать': 20, 'двадцати': 20
  }
  
  for (const [word, num] of Object.entries(numberWords)) {
    if (textLower.includes(word)) {
      return num
    }
  }
  
  const digitMatch = textLower.match(/(\d+)\s*(вариант|изображ|картин|фото|логотип|страниц|лого|штук|шт)/i) || 
                     textLower.match(/(\d+)/)
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10)
    if (!isNaN(num) && num > 0 && num <= 100) {
      return num
    }
  }
  
  return null
}

async function extractPlanningData(
  answers: Record<string, string>,
  docType: DocType,
  model: string
): Promise<Partial<PlanningData>> {
  const answersText = Object.entries(answers)
    .map(([q, a]) => `${q}: ${a}`)
    .join('\n')

  const prompt = `Извлеки данные планирования из ответов пользователя для ${getDocTypeLabel(docType)}.

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
  "additionalNotes": "дополнительная информация" или null,
  "pageCount": число страниц или null,
  "imageCount": количество изображений/логотипов или null
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
      
      if (result.pageCount && typeof result.pageCount === 'number') {
        extracted.pageCount = result.pageCount
      }
      if (result.imageCount && typeof result.imageCount === 'number') {
        extracted.imageCount = result.imageCount
      }
      
      for (const [question, answer] of Object.entries(answers)) {
        const q = question.toLowerCase()
        if (q.includes('количество') && (q.includes('изображ') || q.includes('вариант') || q.includes('логотип') || q.includes('фото') || q.includes('картин'))) {
          const extractedNum = extractNumberFromText(answer)
          if (extractedNum !== null) {
            extracted.imageCount = extractedNum
            console.log(`🔢 Extracted imageCount from answer: "${answer}" -> ${extractedNum}`)
          }
        }
        if (q.includes('количество') && q.includes('страниц')) {
          const extractedNum = extractNumberFromText(answer)
          if (extractedNum !== null) {
            extracted.pageCount = extractedNum
            console.log(`📄 Extracted pageCount from answer: "${answer}" -> ${extractedNum}`)
          }
        }
      }
      
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
    guest: 'google/gemini-2.0-flash-001',
    free: 'google/gemini-2.5-flash-lite',
    advanced: 'google/gemini-2.0-flash-001'
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
  
  const prompt = `Ты Planning Agent. Извлеки из ответа пользователя информацию для планирования ${getDocTypeLabel(docType)}.

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

  if (planningData.imageCount) {
    plan += `\n📄 КОЛИЧЕСТВО ИЗОБРАЖЕНИЙ: ${planningData.imageCount}\n`
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

// Новый режим: Умный диалог (Smart Dialog Mode)
// Вместо длинного списка вопросов - 2-4 умных вопроса на основе первого сообщения
export async function processSmartDialogMode(
  userInput: string,
  docType: DocType,
  currentPlanningData: PlanningData,
  appMode: AppMode,
  isFirstMessage: boolean
): Promise<{ response: string; updatedData: Partial<PlanningData>; isComplete: boolean; smartDialog?: SmartDialogResult }> {
  
  const modelByMode: Record<AppMode, string> = {
    guest: 'google/gemini-2.0-flash-001',
    free: 'google/gemini-2.5-flash-lite',
    advanced: 'google/gemini-2.0-flash-001'
  }
  
  const selectedModel = modelByMode[appMode]
  
  // Первое сообщение: генерируем умные вопросы
  if (isFirstMessage) {
    try {
      const smartDialog = await generateSmartQuestions(userInput, docType, selectedModel)
      
      const questionsText = smartDialog.questions
        .map((q, i) => {
          const optionsText = q.options ? `\n   Варианты: ${q.options.join(', ')}` : ''
          return `${i + 1}. ${q.question}${optionsText}`
        })
        .join('\n\n')
      
      const response = `${smartDialog.analysis}\n\n📝 Ответьте на ${smartDialog.questions.length} вопроса:\n\n${questionsText}\n\n💡 Можете ответить списком или одним сообщением.`
      
      return {
        response,
        updatedData: {
          theme: smartDialog.extractedData.theme || userInput,
          additionalNotes: JSON.stringify(smartDialog.extractedData),
          selectedQuestions: smartDialog.questions.map(q => q.question),
          currentQuestionIndex: 0,
          answerMode: 'sequential',
          collectedAnswers: {}
        },
        isComplete: false,
        smartDialog
      }
    } catch (error) {
      console.error('Smart dialog generation failed:', error)
      // Fallback на обычный режим
      return {
        response: `✅ Понял вашу задачу!\n\nЧто еще важно учесть? Расскажите подробнее о:\n• Целевой аудитории\n• Ключевых сообщениях\n• Визуальных предпочтениях\n\nКогда будете готовы - переключайтесь на Build!`,
        updatedData: {
          theme: userInput
        },
        isComplete: false
      }
    }
  }
  
  // Второе и последующие сообщения: обрабатываем ответы по очереди
  if (currentPlanningData.selectedQuestions && currentPlanningData.selectedQuestions.length > 0) {
    const { selectedQuestions, currentQuestionIndex, answerMode, collectedAnswers } = currentPlanningData
    
    // Sequential mode: один вопрос за раз
    if (answerMode === 'sequential') {
      const currentQuestion = selectedQuestions[currentQuestionIndex || 0]
      const updatedAnswers = { ...collectedAnswers, [currentQuestion]: userInput }
      
      const nextIndex = (currentQuestionIndex || 0) + 1
      
      // Еще есть вопросы?
      if (nextIndex < selectedQuestions.length) {
        return {
          response: `✅ Принял ответ! Вопрос ${nextIndex + 1}/${selectedQuestions.length}:\n\n❓ ${selectedQuestions[nextIndex]}`,
          updatedData: {
            currentQuestionIndex: nextIndex,
            collectedAnswers: updatedAnswers
          },
          isComplete: false
        }
      } else {
        // Все вопросы заданы - извлекаем финальные данные
        const extractedData = await extractPlanningData(updatedAnswers, docType, selectedModel)
        return {
          response: `✅ Отлично! Все ответы приняты.\n\n💡 План готов. Если хотите что-то изменить или дополнить - пишите, иначе переключайтесь на Build для генерации!`,
          updatedData: {
            ...extractedData,
            collectedAnswers: updatedAnswers,
            isComplete: true
          },
          isComplete: false
        }
      }
    }
  }
  
  // Fallback: если нет selectedQuestions или что-то пошло не так
  const extractedData = await extractPlanningData({ 'Ответы пользователя': userInput }, docType, selectedModel)
  
  return {
    response: `✅ Отлично! Принял ваши ответы.\n\n💡 План готов. Если хотите что-то изменить или дополнить - пишите, иначе переключайтесь на Build для генерации!`,
    updatedData: {
      ...extractedData,
      collectedAnswers: { ...currentPlanningData.collectedAnswers, 'Ответы': userInput }
    },
    isComplete: false
  }
}
