import { PROMPTS, type PromptConfig } from './prompts'
import type { DocType } from './store'
import { fetchWithTimeout } from './fetchWithTimeout'
import { API_TIMEOUTS } from './constants'
import { getModernDesignPrompt } from './designPrompts'

export const generateContent = async (prompt: string, docType: string, model: string = "google/gemini-2.5-flash-lite"): Promise<string> => {
  try {
    const systemPrompt = getSystemPrompt(docType)
    
    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt + "\n\nВАЖНО: Возвращай ТОЛЬКО чистый JSON без текста до или после. Не добавляй объяснения." },
          { role: "user", content: prompt }
        ],
        model: model,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    let content = data.content || "Ошибка генерации контента"
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return content
  } catch (error) {
    console.error('API Error:', error)
    return `Ошибка API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
  }
}

export const generateContentWithImages = async (
  prompt: string,
  docType: string,
  images: Array<{ id: string; name: string; base64: string; type: string }> = [],
  model: string = "google/gemini-2.0-flash-001"
): Promise<string> => {
  try {
    const systemPrompt = getSystemPrompt(docType)
    
    if (images.length === 0) {
      return generateContent(prompt, docType, model)
    }

    console.log(`🔍 Multimodal generation with ${images.length} images using ${model}`)

    const content: any[] = [
      {
        type: "text",
        text: prompt
      }
    ]

    images.forEach((img, i) => {
      content.push({
        type: "image_url",
        image_url: {
          url: img.base64
        }
      })
    })

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt + "\n\nВАЖНО: Возвращай ТОЛЬКО чистый JSON без текста до или после. Не добавляй объяснения." },
          { role: "user", content: content }
        ],
        model: model,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    let result = data.content || "Ошибка генерации контента"
    
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    console.log(`✅ Multimodal generation complete`)
    
    return result
  } catch (error) {
    console.error('Multimodal API Error:', error)
    console.log('⚠️  Falling back to text-only generation')
    return generateContent(prompt, docType, model)
  }
}

export const generateHTML = async (
  content: string,
  docType: string,
  styleConfig: any,
  uploadedImages: Array<{ id: string; name: string; base64: string; type: string }> = [],
  model: string = "google/gemini-2.5-flash-lite"
): Promise<string> => {
  try {
    console.log(`🏗️  HTML Composer: Using model ${model}`)
    console.log(`   Images to include: ${uploadedImages.length}`)
    
    if (uploadedImages.length > 0) {
      uploadedImages.forEach((img, i) => {
        console.log(`      ${i}. ${img.name} (id: ${img.id})`)
      })
    }
    
    // НЕ отправляем base64 в промпт - только названия файлов
    const imagesInfo = uploadedImages.length > 0
      ? `\n\n📸 ЗАГРУЖЕННЫЕ ИЗОБРАЖЕНИЯ (${uploadedImages.length} шт):
${uploadedImages.map((img, i) => `${i + 1}. "${img.name}" → используй placeholder IMAGE_${i}`).join('\n')}

🎯 ПРАВИЛА РАЗМЕЩЕНИЯ ИЗОБРАЖЕНИЙ:

⚠️ КРИТИЧЕСКИ ВАЖНО: ИСПОЛЬЗУЙ ВСЕ ИЗОБРАЖЕНИЯ (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4, IMAGE_5... и так далее)!

Для КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ (proposal):
- IMAGE_0: ЛОГОТИП КОМПАНИИ в шапке документа (вверху справа или по центру, max-width: 180px)
- IMAGE_1+: Все остальные изображения размести в тексте: главная иллюстрация, примеры работ, портфолио, команда
- Распределяй изображения равномерно по разделам документа
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3...)

Для СЧЁТА (invoice):
- IMAGE_0: ЛОГОТИП КОМПАНИИ в верхней части счёта (справа в шапке, max-width: 150px)
- IMAGE_1+: ИЗОБРАЖЕНИЯ ТОВАРОВ/УСЛУГ - размести в таблице позиций рядом с соответствующими товарами (max-width: 80px, вертикальное выравнивание)
- Если товаров больше чем изображений - используй изображения по кругу или оставь некоторые строки без картинок
- Если изображений больше чем товаров - вставь все изображения в компактную галерею под таблицей
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для ПИСЬМА (email):
- IMAGE_0: Логотип в шапке письма (слева или по центру, max-width: 160px)
- IMAGE_1+: Все остальные изображения размести по тексту письма где упоминается продукт/услуга
- Распределяй изображения равномерно, чередуй с текстом
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3...)

Для ПРЕЗЕНТАЦИИ (presentation):
- IMAGE_0: На титульном слайде (как логотип или главное фото, max-width: 300px)
- IMAGE_1+: Распределить все остальные изображения по слайдам равномерно (на каждом слайде максимум 1 изображение)
- Создай столько слайдов, сколько нужно, чтобы использовать ВСЕ изображения
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для ЛОГОТИПА (logo):
- Используй ВСЕ загруженные изображения как варианты логотипа
- Покажи их в сетке (2-3 колонки) для сравнения
- Каждый вариант должен быть одинакового размера (max-width: 300px)
- Если вариантов много (5+) - сделай адаптивную сетку
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для КАРТОЧКИ ТОВАРА (product-card):
- IMAGE_0: Главное изображение товара (большое, max-width: 100%, центрирование)
- IMAGE_1+: Все остальные изображения в галерею под главным фото (max-width: 48% для каждого, сетка 2 колонки)
- Если изображений много - сделай прокручиваемую галерею
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

📝 КАК ВСТАВЛЯТЬ:
<img src="IMAGE_0" alt="${uploadedImages[0]?.name || 'Изображение'}" style="max-width: 200px; height: auto;" />

⚠️ КРИТИЧЕСКИ ВАЖНО:
- НЕ ВСТАВЛЯЙ base64 данные изображений! Используй ТОЛЬКО текстовые плейсхолдеры IMAGE_0, IMAGE_1, IMAGE_2 и т.д.
- Плейсхолдер должен быть точно таким: <img src="IMAGE_0" ... /> без префикса data:image
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения
- Размещай их логично по контексту документа
- Добавляй CSS стили для красивого отображения (border-radius, box-shadow, etc.)
- Для логотипов: max-width 150-200px, для иллюстраций: max-width 100%`
      : ''
    
    const modernDesign = getModernDesignPrompt(docType as any, styleConfig)
    
    const prompt = `
🎯 ЗАДАЧА: Создай ПОЛНЫЙ, СОВРЕМЕННЫЙ HTML документ, который ИДЕАЛЬНО соответствует контексту и намерениям пользователя.

📄 КОНТЕНТ ДЛЯ ДОКУМЕНТА:
${content}

🎨 ПАРАМЕТРЫ:
Тип документа: ${docType}
Стиль: ${JSON.stringify(styleConfig)}${imagesInfo}

${modernDesign}

⚠️ КРИТИЧЕСКИ ВАЖНО - ОБЯЗАТЕЛЬНЫЕ ЦВЕТА:
ИСПОЛЬЗУЙ ТОЛЬКО ЭТИ ЦВЕТА из выбранного стиля:
- PRIMARY COLOR: ${styleConfig.primaryColor} - для всех кнопок, акцентов, цен, бейджей скидки, заголовков, границ
- SECONDARY COLOR: ${styleConfig.secondaryColor} - для градиентов и фоновых элементов
- FONT: ${styleConfig.font}

🚫 ЗАПРЕЩЕНО использовать другие цвета (#667eea, #764ba2, #e31e24 и т.д.) для акцентов!

🎨 ДЛЯ КАРТОЧЕК ТОВАРОВ (product-card):
- Блок цены: background: linear-gradient(135deg, ${styleConfig.primaryColor}, ${styleConfig.secondaryColor})
- Бейдж скидки: background: ${styleConfig.primaryColor}
- Границы преимуществ: border: 2px solid ${styleConfig.primaryColor}
- Фон документа: ВСЕГДА #FFFFFF (белый)

🧠 ИНТЕЛЛЕКТУАЛЬНЫЙ ПОДХОД:

1. ПОНИМАНИЕ КОНТЕКСТА:
   - Внимательно прочитай контент и пойми его суть
   - Определи тон (профессиональный, дружелюбный, минималистичный)
   - Учти особенности типа документа (${docType})

2. СТРУКТУРА И ДИЗАЙН:
   - Создай логичную структуру для ${docType}
   - Используй современный дизайн 2025 (НЕ КАК ГАЗЕТА!)
   - Адаптивный layout с правильными отступами и типографикой
   - Цвета: используй указанные цвета из styleConfig
   - Шрифт: используй указанный шрифт

3. ИЗОБРАЖЕНИЯ (если есть):
   - Размещай согласно правилам выше
   - ОБЯЗАТЕЛЬНО используй ВСЕ изображения (IMAGE_0, IMAGE_1, IMAGE_2...)
   - Логично распределяй по документу

⚠️ КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
- Полный HTML документ (от <!DOCTYPE html> до </html>)
- Встроенные CSS стили (inline + <style> в <head>)
- Адаптивный дизайн (media queries для мобильных)
- Современная типографика и spacing
- На русском языке
- НИКОГДА не вставляй base64 данные - только плейсхолдеры IMAGE_0, IMAGE_1
- Документ должен быть ПОЛНЫМ и готовым к использованию

СОЗДАЙ ИДЕАЛЬНЫЙ ДОКУМЕНТ, КОТОРЫЙ ПОНРАВИТСЯ ПОЛЬЗОВАТЕЛЮ!
`

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: `Ты интеллектуальный эксперт по созданию HTML документов с глубоким пониманием контекста и дизайна.

🎯 ТВОЯ ЗАДАЧА:
- Понимать НАМЕРЕНИЯ пользователя и контекст документа
- Создавать ПОЛНЫЕ, валидные HTML документы с современным дизайном
- Использовать встроенные CSS стили (inline + <style>)
- Адаптивный дизайн для всех устройств

⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ ИЗОБРАЖЕНИЙ:
- НИКОГДА не вставляй base64, data:image, или URL изображений
- Используй ТОЛЬКО текстовые плейсхолдеры: IMAGE_0, IMAGE_1, IMAGE_2 и т.д.
- Плейсхолдер должен быть ТОЧНО таким: <img src="IMAGE_0" alt="..." />
- НЕ ДОБАВЛЯЙ префикс data:image или любой другой префикс или слэш
- Просто IMAGE_0, IMAGE_1, IMAGE_2 в атрибуте src (без / в начале!)

ПРИМЕРЫ ПРАВИЛЬНЫХ ТЕГОВ:
✅ <img src="IMAGE_0" alt="Главное изображение" style="width: 100%;" />
✅ <img src="IMAGE_1" alt="Изображение 2" style="max-width: 300px;" />
✅ <img src="IMAGE_2" alt="Изображение 3" />

ПРИМЕРЫ НЕПРАВИЛЬНЫХ ТЕГОВ:
❌ <img src="/IMAGE_0" /> - НЕТ слэша в начале!
❌ <img src="./IMAGE_0" /> - НЕТ префикса!
❌ <img src="data:image/png;base64,..." />
❌ <img src="https://..." />
❌ <img src="" />
❌ НЕ используй пустые src

ОБЯЗАТЕЛЬНО ВСТАВЬ ВСЕ ПЛЕЙСХОЛДЕРЫ, КОТОРЫЕ УКАЗАНЫ В ПРОМПТЕ!

Ты создаешь документы, которые впечатляют!` },
          { role: "user", content: prompt }
        ],
        model: model,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('HTML generation failed')
    }

    const data = await response.json()
    let html = data.content || "Ошибка генерации HTML"
    
    // Убираем markdown обертки
    html = html.replace(/```html\n?/gi, '')
    html = html.replace(/```\n?/g, '')
    
    // Убираем текст "html" в начале если он есть
    html = html.replace(/^html\s*/i, '')
    
    // Убираем пробелы и переносы в начале
    html = html.trim()
    
    // FALLBACK: Если Gemini не вставил IMAGE плейсхолдеры, вставляем их программно
    const expectedImageCount = uploadedImages.length
    if (expectedImageCount > 0) {
      // Проверяем, есть ли IMAGE_0, IMAGE_1 и т.д. в HTML
      const hasPlaceholders = /IMAGE_\d+/.test(html)
      
      if (!hasPlaceholders) {
        console.log(`⚠️  Gemini didn't insert IMAGE placeholders! Adding them manually...`)
        
        // Вставляем плейсхолдеры в HTML
        // Стратегия: ищем <body> и вставляем изображения после открывающего тега или в начало контента
        const bodyMatch = html.match(/<body[^>]*>/i)
        if (bodyMatch) {
          const insertIndex = bodyMatch.index! + bodyMatch[0].length
          
          // Создаем HTML для изображений в зависимости от типа документа
          let imageHTML = '<div style="margin: 20px 0; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">\n'
          for (let i = 0; i < expectedImageCount; i++) {
            imageHTML += `  <img src="IMAGE_${i}" alt="Image ${i + 1}" style="max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />\n`
          }
          imageHTML += '</div>\n'
          
          html = html.slice(0, insertIndex) + '\n' + imageHTML + html.slice(insertIndex)
          console.log(`✅ Manually inserted ${expectedImageCount} IMAGE placeholders`)
        }
      }
    }
    
    // ⚠️ ВАЖНО: НЕ заменяем placeholders здесь!
    // Вся логика замены IMAGE_X на base64 происходит в imageAgent.ts:replaceImagePlaceholders()
    // Там есть проверка всех вариантов placeholders и финальная очистка битых IMAGE_*
    
    return html
  } catch (error) {
    console.error('API Error:', error)
    return `<html><body><h1>Ошибка API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}</h1></body></html>`
  }
}

const getSystemPrompt = (docType: string): string => {
  const config = PROMPTS[docType as DocType]
  const basePrompt = config?.system || "Ты помощник по созданию документов."
  
  // Добавляем интеллектуальное понимание контекста
  const contextualPrompt = `${basePrompt}

🧠 INTELLIGENT CONTEXT UNDERSTANDING:

You are an AI that deeply understands user intent and context. Your task is to:

1. ANALYZE the user's request carefully:
   - What is the main subject/product/company/topic?
   - What style/tone does the user want? (professional, casual, playful, serious, etc.)
   - Are there specific requirements? (colors, structure, specific details, etc.)
   - What is the user's REAL intent behind their words?

2. EXTRACT all relevant information:
   - Company/brand names mentioned
   - Product names and details
   - Specific numbers, dates, prices
   - Context clues (industry, target audience, purpose)

3. GENERATE content that:
   - MATCHES the user's intent perfectly
   - Uses appropriate tone and style for the context
   - Includes all specific details mentioned
   - Is detailed but concise
   - Follows the document type structure

⚠️ CRITICAL RULES:
- If user mentions specific details (names, numbers, colors, etc.) → USE THEM
- If user specifies "одно изображение" or "1 изображение" → understand they want 1 image
- If user asks for specific style → apply that style
- ALWAYS output valid JSON format
- Extract company names, product names, prices from the request
- Be intelligent: understand context, not just keywords

RESPOND WITH UNDERSTANDING AND PRECISION.`
  
  return contextualPrompt
}

export const getPromptForAction = (
  docType: DocType,
  action: keyof PromptConfig
): string => {
  const config = PROMPTS[docType]
  return config?.[action] || ''
}
