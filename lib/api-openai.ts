import type { DocType, UploadedImage } from './store'
import { getModernDesignPrompt } from './designPrompts'

export async function generateContentWithGPT4o(
  prompt: string,
  docType: DocType,
  uploadedImages: UploadedImage[] = []
): Promise<string> {
  console.log(`🤖 GPT-4o (OpenAI): Generating content for ${docType}...`)
  
  if (uploadedImages.length > 0) {
    console.log(`📸 GPT-4o: Analyzing ${uploadedImages.length} uploaded images...`)
  }

  try {
    const response = await fetch('/api/openai-gpt4o', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        docType,
        images: uploadedImages,
        mode: 'content'
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'GPT-4o generation failed')
    }

    const data = await response.json()
    console.log(`✅ GPT-4o (OpenAI): Generated ${data.content.length} characters`)
    
    return data.content
  } catch (error) {
    console.error('❌ GPT-4o error:', error)
    throw new Error(`GPT-4o generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateHTMLWithGPT4o(
  content: string,
  docType: DocType,
  styleConfig: any,
  uploadedImages: UploadedImage[],
  generatedImages: Array<{ slot: number; dataUrl: string; prompt: string }> = []
): Promise<string> {
  console.log(`🏗️  GPT-4o (OpenAI): Composing HTML for ${docType}...`)
  console.log(`   📸 ${uploadedImages.length} uploaded images`)
  console.log(`   🎨 ${generatedImages.length} AI generated images`)
  
  let imageInstructions = ''
  if (generatedImages.length > 0) {
    imageInstructions = `\n\n🎨 AI GENERATED IMAGES (${generatedImages.length} шт):
${generatedImages.map((img) => 
  `${img.slot + 1}. "${img.prompt.substring(0, 60)}..." → используй placeholder IMAGE_${img.slot}`
).join('\n')}

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
<img src="IMAGE_0" alt="описание" style="max-width: 200px; height: auto;" />

⚠️ КРИТИЧЕСКИ ВАЖНО:
- НЕ ВСТАВЛЯЙ base64 данные изображений! Используй ТОЛЬКО текстовые плейсхолдеры IMAGE_0, IMAGE_1, IMAGE_2 и т.д.
- Плейсхолдер должен быть точно таким: <img src="IMAGE_0" ... /> без префикса data:image
- ОБЯЗАТЕЛЬНО используй ВСЕ указанные изображения согласно правилам выше
- Добавляй CSS стили для красивого отображения (border-radius, box-shadow, etc.)
- Для логотипов: max-width 150-200px, для иллюстраций: max-width 100%`
  }
  
  const modernDesign = getModernDesignPrompt(docType)
  
  const prompt = `Создай СОВРЕМЕННЫЙ HTML документ на основе этого контента:
${content}

Тип документа: ${docType}
Стиль: ${JSON.stringify(styleConfig)}${imageInstructions}

${modernDesign}

Требования:
- Полный HTML с встроенными CSS стилями
- Адаптивный дизайн
- СОВРЕМЕННЫЙ дизайн 2025 (не как газета!)
- На русском языке
- Если есть изображения - размести их ЛОГИЧНО согласно типу документа`

  try {
    const response = await fetch('/api/openai-gpt4o', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        docType,
        images: uploadedImages,
        mode: 'html'
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'GPT-4o HTML generation failed')
    }

    const data = await response.json()
    let html = data.content
    
    // Убираем markdown обертки если есть
    html = html.replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim()
    
    // КРИТИЧЕСКИ ВАЖНО: Убираем весь текст после закрывающего тега </html>
    const htmlEndIndex = html.lastIndexOf('</html>')
    if (htmlEndIndex !== -1) {
      html = html.substring(0, htmlEndIndex + 7) // +7 для '</html>'
    }
    
    // Убираем ВСЕ title атрибуты из ВСЕХ тегов (вызывают tooltip при наведении)
    html = html.replace(/\s+title="[^"]*"/gi, '')
    html = html.replace(/\s+title='[^']*'/gi, '')
    
    console.log(`✅ GPT-4o (OpenAI): Generated HTML (${html.length} characters)`)
    
    return html
  } catch (error) {
    console.error('❌ GPT-4o HTML generation error:', error)
    throw new Error(`GPT-4o HTML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function analyzeVideoWithGPT4o(
  videoBase64: string,
  prompt: string
): Promise<string> {
  console.log(`🎥 GPT-4o (OpenAI): Analyzing video...`)
  
  try {
    const response = await fetch('/api/openai-gpt4o', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Analyze this video and extract key information: ${prompt}`,
        docType: 'presentation',
        images: [{ base64: videoBase64, type: 'video' }],
        mode: 'content'
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'GPT-4o video analysis failed')
    }

    const data = await response.json()
    console.log(`✅ GPT-4o (OpenAI): Video analyzed (${data.content.length} characters)`)
    
    return data.content
  } catch (error) {
    console.error('❌ GPT-4o video analysis error:', error)
    throw new Error(`GPT-4o video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

