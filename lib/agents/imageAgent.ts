import type { DocType } from '../store'
import { IMAGE_GENERATION_PROMPTS, IMAGE_SLOTS_CONFIG } from '../config/modes'
import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'
import type { ImagePromptPlan } from './contentAnalyzer'

export type GeneratedImage = {
  prompt: string
  dataUrl: string
  slot: number
}

export async function generateImagesForDocument(
  docType: DocType,
  contentContext?: string,
  userPrompt?: string
): Promise<GeneratedImage[]> {
  const numImages = IMAGE_SLOTS_CONFIG[docType]
  const basePrompts = IMAGE_GENERATION_PROMPTS[docType]

  if (!numImages || numImages === 0) {
    return []
  }

  const images: GeneratedImage[] = []
  const prompts = basePrompts.slice(0, numImages)

  const fullContext = userPrompt ? `${userPrompt}\n\n${contentContext || ''}` : contentContext

  for (let i = 0; i < prompts.length; i++) {
    try {
      const enhancedPrompt = enhancePrompt(prompts[i], fullContext, userPrompt)

      console.log(`Generating image ${i + 1}/${prompts.length} for ${docType}...`)
      console.log(`📝 Prompt: "${enhancedPrompt.substring(0, 80)}..."`)

      const response = await fetchWithTimeout('/api/flux-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          width: 1024,
          height: 1024,
        }),
      }, API_TIMEOUTS.IMAGE_GENERATION)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Image generation failed')
      }

      const data = await response.json()

      images.push({
        prompt: enhancedPrompt,
        dataUrl: data.imageUrl,
        slot: i,
      })

      console.log(`Image ${i + 1} generated successfully`)
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error)
    }
  }

  return images
}

export async function generateImagesFromPlan(
  imagePlans: ImagePromptPlan[],
  previousFeedback?: string,
  model: string = 'black-forest-labs/flux-schnell'
): Promise<GeneratedImage[]> {
  const modelName = model.includes('flux-1.1-pro') 
    ? 'Flux 1.1 Pro' 
    : model.includes('flux-pro') 
    ? 'Flux Pro' 
    : 'Flux Schnell'
  console.log(`🎨 Image Agent (${modelName}): Generating ${imagePlans.length} images from plan...`)
  
  if (previousFeedback) {
    console.log(`📋 Applying feedback: ${previousFeedback.substring(0, 100)}...`)
  }

  const images: GeneratedImage[] = []

  for (let i = 0; i < imagePlans.length; i++) {
    const plan = imagePlans[i]
    
    try {
      console.log(`Generating image ${i + 1}/${imagePlans.length}...`)
      console.log(`📝 Type: ${plan.type}`)
      console.log(`📝 Prompt: "${plan.prompt.substring(0, 80)}..."`)

      const response = await fetchWithTimeout('/api/flux-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: plan.prompt,
          width: 1024,
          height: 1024,
          model: model,
        }),
      }, API_TIMEOUTS.IMAGE_GENERATION)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Image generation failed')
      }

      const data = await response.json()

      images.push({
        prompt: plan.prompt,
        dataUrl: data.imageUrl,
        slot: plan.slot,
      })

      console.log(`✅ Image ${i + 1} generated successfully`)
    } catch (error) {
      console.error(`❌ Failed to generate image ${i + 1}:`, error)
    }
  }

  return images
}

function extractSubjectFromUserPrompt(userPrompt?: string): string | null {
  if (!userPrompt) return null

  const lower = userPrompt.toLowerCase()

  const patterns = [
    /(?:презентаци[ияю]|презентация)\s+(?:о\s+)?(\w+)/i,
    /(?:карточк[ау]|карточка)\s+(?:товара\s+)?(\w+)/i,
    /(?:создай|сделай|генерируй)\s+.*?(?:для|про|о)\s+(\w+)/i,
    /(?:кп|коммерческое предложение)\s+(?:для|про|о)\s+(\w+)/i,
    /(?:логотип|logo)\s+(?:для|про)?\s*(\w+)/i,
  ]

  for (const pattern of patterns) {
    const match = userPrompt.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  const simpleMatch = lower.match(/\b(огурц[а-я]*|помидор[а-я]*|телефон[а-я]*|машин[а-я]*|дом[а-я]*|компьютер[а-я]*|ноутбук[а-я]*|планшет[а-я]*|обув[ия]|одежд[а-я]*|мебел[ия]|книг[а-и]|цвет[а-я]*|еда|еды|продукт[а-я]*)\b/)
  if (simpleMatch) {
    return simpleMatch[1]
  }

  return null
}

function translateToEnglish(russianWord: string): string {
  const dictionary: Record<string, string> = {
    'огурец': 'cucumber',
    'огурца': 'cucumber',
    'огурцов': 'cucumbers',
    'помидор': 'tomato',
    'помидора': 'tomato',
    'помидоров': 'tomatoes',
    'телефон': 'smartphone',
    'телефона': 'smartphone',
    'телефонов': 'smartphones',
    'машина': 'car',
    'машины': 'car',
    'машин': 'cars',
    'дом': 'house',
    'дома': 'house',
    'домов': 'houses',
    'компьютер': 'computer',
    'компьютера': 'computer',
    'ноутбук': 'laptop',
    'ноутбука': 'laptop',
    'планшет': 'tablet',
    'планшета': 'tablet',
    'обувь': 'shoes',
    'обуви': 'shoes',
    'одежда': 'clothing',
    'одежды': 'clothing',
    'мебель': 'furniture',
    'мебели': 'furniture',
    'книга': 'book',
    'книги': 'books',
    'цветок': 'flower',
    'цветы': 'flowers',
    'еда': 'food',
    'еды': 'food',
    'продукт': 'product',
    'продукта': 'product',
  }

  return dictionary[russianWord.toLowerCase()] || russianWord
}

function enhancePrompt(basePrompt: string, context?: string, userPrompt?: string): string {
  if (!context && !userPrompt) return basePrompt

  const subject = extractSubjectFromUserPrompt(userPrompt)

  if (subject) {
    const englishSubject = translateToEnglish(subject)
    console.log(`🎯 Detected subject: "${subject}" → "${englishSubject}"`)

    let enhanced = basePrompt
      .replace(/professional company logo/gi, `${englishSubject} logo`)
      .replace(/company logo/gi, `${englishSubject} logo`)
      .replace(/business product/gi, englishSubject)
      .replace(/corporate teamwork/gi, `${englishSubject} related concept`)
      .replace(/business presentation background/gi, `${englishSubject} themed background`)
      .replace(/professional product photography/gi, `${englishSubject} product photography`)
      .replace(/modern minimal company logo design/gi, `${englishSubject} logo design`)

    if (enhanced === basePrompt) {
      enhanced = `${englishSubject}, ${basePrompt}`
    }

    return enhanced
  }

  const contextWords = (context || '').toLowerCase()

  const industryKeywords: Record<string, string> = {
    'it': 'technology, software, digital',
    'tech': 'technology, innovation, modern',
    'finance': 'financial, banking, professional',
    'medical': 'healthcare, medical, clinical',
    'retail': 'shopping, retail, commercial',
    'food': 'culinary, restaurant, food service',
    'real estate': 'property, real estate, architecture',
    'education': 'educational, academic, learning',
    'marketing': 'advertising, marketing, creative',
    'consulting': 'consulting, business advisory, professional',
  }

  for (const [keyword, addition] of Object.entries(industryKeywords)) {
    if (contextWords.includes(keyword)) {
      return `${basePrompt}, ${addition}`
    }
  }

  return basePrompt
}

export function createImagePlaceholders(images: GeneratedImage[]): string {
  return images
    .map((img, i) => `<!-- IMAGE_SLOT_${i}: ${img.prompt} -->`)
    .join('\n')
}

export function replaceImagePlaceholders(html: string, images: GeneratedImage[]): string {
  console.log(`🔄 Replacing image placeholders: ${images.length} images`)
  
  let result = html
  let imagesWithoutPlaceholders: GeneratedImage[] = []

  images.forEach((img, index) => {
    console.log(`   📸 Image ${index + 1}: slot=${img.slot}, dataUrl length=${img.dataUrl.length}`)
    
    // Различные варианты плейсхолдеров
    const placeholders = [
      `IMAGE_${img.slot}`,
      `/IMAGE_${img.slot}`,
      `./IMAGE_${img.slot}`,
      `IMAGE_SLOT_${img.slot}`,
      `\${IMAGE_${img.slot}}`,
      `{{IMAGE_${img.slot}}}`,
      `[IMAGE_${img.slot}]`,
      `data:image/placeholder;base64,IMAGE_${img.slot}`,
    ]

    let replacementCount = 0
    placeholders.forEach(placeholder => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const matches = (result.match(regex) || []).length
      if (matches > 0) {
        console.log(`      ✅ Found ${matches} occurrences of "${placeholder}"`)
        replacementCount += matches
        result = result.replace(regex, img.dataUrl)
      }
    })
    
    if (replacementCount === 0) {
      console.warn(`      ⚠️  No placeholders found for image slot ${img.slot}`)
      imagesWithoutPlaceholders.push(img)
    }
  })

  // FALLBACK: Если плейсхолдеры не найдены, вставляем изображения программно
  if (imagesWithoutPlaceholders.length > 0) {
    console.log(`⚠️  Gemini didn't insert placeholders for ${imagesWithoutPlaceholders.length} images. Adding them manually...`)
    
    // Стратегия: ищем <body> и вставляем изображения в начало контента
    const bodyMatch = result.match(/<body[^>]*>/i)
    if (bodyMatch) {
      const insertIndex = bodyMatch.index! + bodyMatch[0].length
      
      // Создаем HTML для изображений
      let imageHTML = '\n<div style="margin: 20px auto; max-width: 1200px; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;">\n'
      imagesWithoutPlaceholders.forEach((img) => {
        imageHTML += `  <img src="${img.dataUrl}" alt="AI Generated Image ${img.slot + 1}" style="max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.3s;" />\n`
      })
      imageHTML += '</div>\n'
      
      result = result.slice(0, insertIndex) + imageHTML + result.slice(insertIndex)
      console.log(`✅ Manually inserted ${imagesWithoutPlaceholders.length} images into HTML`)
    } else {
      // Если нет <body>, вставляем перед </html>
      const htmlEndMatch = result.match(/<\/html>/i)
      if (htmlEndMatch) {
        const insertIndex = htmlEndMatch.index!
        let imageHTML = '<div style="margin: 20px auto; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">\n'
        imagesWithoutPlaceholders.forEach((img) => {
          imageHTML += `  <img src="${img.dataUrl}" alt="AI Generated Image ${img.slot + 1}" style="max-width: 300px; height: auto;" />\n`
        })
        imageHTML += '</div>\n'
        result = result.slice(0, insertIndex) + imageHTML + result.slice(insertIndex)
        console.log(`✅ Manually inserted ${imagesWithoutPlaceholders.length} images before </html>`)
      }
    }
  }

  // КРИТИЧЕСКАЯ ФИНАЛЬНАЯ ОЧИСТКА: убираем ВСЕ оставшиеся битые IMAGE_* placeholders
  const remainingPlaceholders = result.match(/IMAGE_\d+/g)
  if (remainingPlaceholders && remainingPlaceholders.length > 0) {
    const uniquePlaceholders = Array.from(new Set(remainingPlaceholders))
    console.warn(`⚠️ Found ${uniquePlaceholders.length} unreplaced placeholders: ${uniquePlaceholders.join(', ')}. Removing them...`)
    
    // АГРЕССИВНАЯ ОЧИСТКА: удаляем ВСЕ теги <img>, которые содержат IMAGE_ в любом месте
    result = result.replace(/<img[^>]*IMAGE_\d+[^>]*\/?>/gi, '')
    
    // Дополнительно: удаляем любые src="IMAGE_X" или src='IMAGE_X' без тегов
    result = result.replace(/src=["']IMAGE_\d+["']/gi, '')
    
    // Удаляем плейсхолдеры, которые остались как текст
    uniquePlaceholders.forEach(placeholder => {
      const regex = new RegExp(placeholder, 'g')
      result = result.replace(regex, '')
    })
    
    console.log(`✅ Removed ${uniquePlaceholders.length} broken placeholder tags`)
  }
  
  console.log(`✅ Placeholder replacement complete`)
  return result
}

