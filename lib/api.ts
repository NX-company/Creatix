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
    
    const modernDesign = getModernDesignPrompt(docType)
    
    const prompt = `
Создай СОВРЕМЕННЫЙ HTML документ на основе этого контента:
${content}

Тип документа: ${docType}
Стиль: ${JSON.stringify(styleConfig)}${imagesInfo}

${modernDesign}

Требования:
- Полный HTML с встроенными CSS стилями
- Адаптивный дизайн
- СОВРЕМЕННЫЙ дизайн 2025 (не как газета!)
- Используй указанные цвета и шрифт
- На русском языке
- Если есть изображения - размести их ЛОГИЧНО согласно правилам выше
`

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Ты эксперт по созданию HTML документов. Создавай только валидный HTML с встроенными CSS стилями. НИКОГДА не вставляй base64 данные изображений - используй ТОЛЬКО текстовые плейсхолдеры IMAGE_0, IMAGE_1 и т.д." },
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
    
    // После генерации заменяем placeholder'ы на реальные base64
    uploadedImages.forEach((img, i) => {
      const placeholder = `IMAGE_${i}`
      html = html.replace(new RegExp(placeholder, 'g'), img.base64)
    })
    
    return html
  } catch (error) {
    console.error('API Error:', error)
    return `<html><body><h1>Ошибка API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}</h1></body></html>`
  }
}

const getSystemPrompt = (docType: string): string => {
  const config = PROMPTS[docType as DocType]
  return config?.system || "Ты помощник по созданию документов."
}

export const getPromptForAction = (
  docType: DocType,
  action: keyof PromptConfig
): string => {
  const config = PROMPTS[docType]
  return config?.[action] || ''
}
