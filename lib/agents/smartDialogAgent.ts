import type { DocType } from '../store'
import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'
import { getDocTypeConfig } from '../docTypesConfig'

// Системный промпт для генерации умных вопросов
const SMART_QUESTIONS_SYSTEM_PROMPT = `Ты эксперт по созданию дизайн-документов. Твоя задача - задать 2-4 УМНЫХ уточняющих вопроса на основе начального запроса пользователя.

ПРАВИЛА:
1. Анализируй что пользователь УЖЕ сказал - НЕ переспрашивай об этом
2. Задавай только ВАЖНЫЕ вопросы для качественного результата
3. Вопросы должны быть конкретными, с вариантами ответов
4. Максимум 4 вопроса (оптимально 2-3)
5. Формат: короткие, понятные вопросы
6. Каждый вопрос должен иметь практическую цель

СТРУКТУРА ОТВЕТА (JSON):
{
  "analysis": "Краткий анализ того, что понял из запроса (1-2 предложения)",
  "questions": [
    {
      "question": "Текст вопроса?",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3"] или null,
      "why": "Зачем нужен этот вопрос",
      "key": "краткий_ключ" 
    }
  ],
  "extractedData": {
    "ключ": "значение из запроса"
  }
}

ВАЖНО:
- Верни ТОЛЬКО чистый JSON без дополнительного текста
- НЕ используй markdown разметку
- questions должен содержать 2-4 вопроса
- Если что-то уже упомянуто - не спрашивай снова
- options опционален - добавляй только если варианты ответа очевидны`

type SmartQuestion = {
  question: string
  options?: string[]
  why: string
  key: string
}

export type SmartDialogResult = {
  analysis: string
  questions: SmartQuestion[]
  extractedData: Record<string, any>
}

export async function generateSmartQuestions(
  userInput: string,
  docType: DocType,
  model: string = 'google/gemini-2.0-flash-001'
): Promise<SmartDialogResult> {
  
  const docTypeConfig = getDocTypeConfig(docType)
  const docTypeLabel = docTypeConfig?.label || 'документ'
  const docTypeDescription = docTypeConfig?.description || ''
  
  const contextPrompt = `Пользователь хочет создать: ${docTypeLabel}
Описание: ${docTypeDescription}

ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
"${userInput}"

Проанализируй запрос и задай 2-4 уточняющих вопроса для качественного создания дизайна.
Верни ТОЛЬКО JSON без markdown.`

  try {
    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SMART_QUESTIONS_SYSTEM_PROMPT },
          { role: 'user', content: contextPrompt }
        ],
        model,
        temperature: 0.7
      })
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('Failed to generate questions')
    }

    const data = await response.json()
    
    try {
      const cleanContent = data.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      const result = JSON.parse(cleanContent) as SmartDialogResult
      
      // Валидация
      if (!result.questions || result.questions.length < 2 || result.questions.length > 4) {
        throw new Error('Invalid questions count')
      }
      
      return result
    } catch (parseError) {
      console.error('Failed to parse smart questions response:', parseError)
      // Fallback: базовые вопросы
      return getDefaultQuestionsForDocType(docType, userInput)
    }
  } catch (error) {
    console.error('Smart dialog error:', error)
    // Fallback: базовые вопросы
    return getDefaultQuestionsForDocType(docType, userInput)
  }
}

// Fallback: базовые вопросы для каждого типа документа
function getDefaultQuestionsForDocType(docType: DocType, userInput: string): SmartDialogResult {
  const defaults: Record<string, SmartDialogResult> = {
    'presentation': {
      analysis: 'Понял, нужна презентация. Уточню детали для создания.',
      questions: [
        {
          question: 'Сколько слайдов нужно?',
          options: ['5-10', '10-15', '15-20'],
          why: 'Для структурирования контента',
          key: 'slideCount'
        },
        {
          question: 'Стиль оформления?',
          options: ['Минимализм', 'Корпоративный', 'Креативный'],
          why: 'Определяет визуальный стиль',
          key: 'style'
        },
        {
          question: 'Количество AI изображений для слайдов?',
          options: ['3-5', '6-8', '10+'],
          why: 'Для визуального наполнения',
          key: 'imageCount'
        }
      ],
      extractedData: { theme: userInput }
    },
    'youtube-thumbnail': {
      analysis: 'Создам превью для YouTube. Уточню детали.',
      questions: [
        {
          question: 'Текст на превью (заголовок)?',
          options: undefined,
          why: 'Основной текст привлекает внимание',
          key: 'thumbnailText'
        },
        {
          question: 'Эмоция превью?',
          options: ['Интрига', 'Польза', 'Шок/Удивление'],
          why: 'Определяет стиль визуала',
          key: 'emotion'
        },
        {
          question: 'Стиль?',
          options: ['Яркий и контрастный', 'Минималистичный', 'Премиум'],
          why: 'Визуальная подача',
          key: 'style'
        }
      ],
      extractedData: { topic: userInput }
    },
    'wildberries-card': {
      analysis: 'Создам карточку для Wildberries. Уточню детали товара.',
      questions: [
        {
          question: 'Название товара?',
          options: undefined,
          why: 'Основное название для карточки',
          key: 'productName'
        },
        {
          question: 'Цена товара?',
          options: undefined,
          why: 'Для отображения на карточке',
          key: 'price'
        },
        {
          question: 'Ключевые преимущества (3-5)?',
          options: undefined,
          why: 'Что выделяет товар среди конкурентов',
          key: 'features'
        }
      ],
      extractedData: { category: userInput }
    }
  }
  
  // Базовые вопросы для всех типов
  const fallback: SmartDialogResult = {
    analysis: 'Понял вашу задачу. Задам несколько уточняющих вопросов.',
    questions: [
      {
        question: 'Основная цель этого дизайна?',
        options: null,
        why: 'Понять назначение',
        key: 'purpose'
      },
      {
        question: 'Стиль оформления?',
        options: ['Минимализм', 'Корпоративный', 'Креативный', 'Современный'],
        why: 'Определяет визуальный стиль',
        key: 'style'
      },
      {
        question: 'Цветовая схема?',
        options: ['Автоматически', 'Укажу сам'],
        why: 'Для подбора палитры',
        key: 'colors'
      }
    ],
    extractedData: { description: userInput }
  }
  
  return defaults[docType] || fallback
}

// Обработка ответов пользователя на умные вопросы
export function parseSmartAnswers(
  questions: SmartQuestion[],
  userAnswers: string
): Record<string, string> {
  const answers: Record<string, string> = {}
  
  // Простой парсинг: разбиваем ответы по запятым/точкам с запятой
  const parts = userAnswers.split(/[,;]\s*/)
  
  questions.forEach((q, index) => {
    if (parts[index]) {
      answers[q.key] = parts[index].trim()
    }
  })
  
  return answers
}

