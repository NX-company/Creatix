import type { DocType } from '../store'
import { AGENT_MODELS } from '../config/agents'
import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'

export type ImagePromptPlan = {
  type: 'logo' | 'hero' | 'illustration' | 'product' | 'background'
  prompt: string
  reasoning: string
  slot: number
}

export type ContentAnalysisResult = {
  mainTheme: string
  imagePrompts: ImagePromptPlan[]
  companyName?: string
  productName?: string
  industry?: string
}

export async function analyzeContentForImages(
  userPrompt: string,
  generatedContent: string,
  docType: DocType,
  previousFeedback?: string,
  usePRO: boolean = false
): Promise<ContentAnalysisResult> {
  
  console.log(`🔍 Content Analyzer: Analyzing content for image generation...`)
  
  if (previousFeedback) {
    console.log(`📋 Previous feedback: ${previousFeedback.substring(0, 100)}...`)
  }

  let contentData: any = {}
  try {
    contentData = JSON.parse(generatedContent)
  } catch {
    contentData = { raw: generatedContent }
  }

  const defaultCount = getImageCountForDocType(docType)
  const numImages = extractImageCountFromPrompt(userPrompt, defaultCount)
  
  console.log(`🎨 Images to generate: ${numImages} (default for ${docType}: ${defaultCount})`)
  
  const analysisPrompt = `You are a Content Analyzer AI that creates image generation plans.

USER REQUEST: "${userPrompt}"
DOCUMENT TYPE: ${docType}
IMAGES NEEDED: ${numImages}

GENERATED CONTENT:
${JSON.stringify(contentData, null, 2).substring(0, 2000)}

${previousFeedback ? `\nPREVIOUS QA FEEDBACK:\n${previousFeedback}\n` : ''}

Your task:
1. Extract the MAIN THEME from the content (company name, product, industry, subject)
2. Create ${numImages} SPECIFIC image generation prompts that MATCH the content
3. Make prompts detailed and relevant to the actual content, NOT generic

Requirements:
- If content mentions a specific company name → use it in prompts
- If content is about a product → create product-focused prompts
- If content has industry context → reflect it in style
- Be SPECIFIC, avoid generic terms like "business logo", "corporate background"
- Use English for prompts (translate if needed)

Return ONLY valid JSON:
{
  "mainTheme": "specific theme in English (e.g., 'Bodrое Utro coffee shop', 'iPhone 15 Pro')",
  "companyName": "extracted company name or null",
  "productName": "extracted product name or null",
  "industry": "industry type or null",
  "imagePrompts": [
    {
      "type": "logo",
      "prompt": "detailed specific prompt in English",
      "reasoning": "why this prompt matches the content",
      "slot": 0
    }
  ]
}`

  try {
    if (usePRO) {
      const response = await fetch('/api/openai-gpt4o', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analysisPrompt,
          docType: docType,
          images: [],
          mode: 'content'
        }),
      })

      if (!response.ok) {
        throw new Error('GPT-4o Content Analyzer failed')
      }

      const data = await response.json()
      let result = data.content
      result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      const analysis: ContentAnalysisResult = JSON.parse(result)
      
      // Validate that imagePrompts exists and is an array
      if (!analysis.imagePrompts || !Array.isArray(analysis.imagePrompts)) {
        console.warn('⚠️  Invalid analysis result, using defaults')
        return {
          mainTheme: analysis.mainTheme || 'business',
          imagePrompts: getDefaultImagePrompts(docType)
        }
      }
      
      console.log(`🎯 Theme detected: "${analysis.mainTheme}"`)
      console.log(`📋 Image plan: ${analysis.imagePrompts.length} images`)
      analysis.imagePrompts.forEach((plan, i) => {
        console.log(`   ${i + 1}. [${plan.type}] "${plan.prompt.substring(0, 60)}..."`)
      })
      
      return analysis
    } else {
      const response = await fetchWithTimeout('/api/openrouter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { 
              role: "system", 
              content: "You are a content analysis specialist. Extract themes and create specific, relevant image prompts. Return ONLY valid JSON." 
            },
            { role: "user", content: analysisPrompt }
          ],
          model: AGENT_MODELS.contentAnalyzer,
          temperature: 0.4,
          max_tokens: 1500
        }),
      }, API_TIMEOUTS.DEFAULT)

      if (!response.ok) {
        throw new Error('Content analysis failed')
      }

      const data = await response.json()
      let result = data.content || '{}'
      result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      const analysis: ContentAnalysisResult = JSON.parse(result)
      
      // Validate that imagePrompts exists and is an array
      if (!analysis.imagePrompts || !Array.isArray(analysis.imagePrompts)) {
        console.warn('⚠️  Invalid analysis result, using defaults')
        return {
          mainTheme: analysis.mainTheme || 'business',
          imagePrompts: getDefaultImagePrompts(docType)
        }
      }
      
      console.log(`🎯 Theme detected: "${analysis.mainTheme}"`)
      console.log(`📋 Image plan: ${analysis.imagePrompts.length} images`)
      analysis.imagePrompts.forEach((plan, i) => {
        console.log(`   ${i + 1}. [${plan.type}] "${plan.prompt.substring(0, 60)}..."`)
      })
      
      return analysis
    }
  } catch (error) {
    console.error('❌ Content Analyzer error:', error)
    
    return {
      mainTheme: 'business',
      imagePrompts: getDefaultImagePrompts(docType)
    }
  }
}

function getImageCountForDocType(docType: DocType): number {
  const counts: Record<DocType, number> = {
    proposal: 3,
    invoice: 3,
    email: 2,
    presentation: 3,
    logo: 3,
    'product-card': 3,
  }
  return counts[docType] || 3
}

function extractImageCountFromPrompt(userPrompt: string, defaultCount: number): number {
  // Ищем явное указание количества изображений в промпте пользователя
  const patterns = [
    /(\d+)\s*(изображени|картинк|фото|варианта?|лого)/i,
    /(вставь|сделай|создай|добавь|генери)\s*(\d+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = userPrompt.match(pattern)
    if (match) {
      const num = parseInt(match[1] || match[2])
      if (num > 0 && num <= 10) {
        console.log(`📊 User requested ${num} images (extracted from prompt)`)
        return num
      }
    }
  }
  
  return defaultCount
}

function getDefaultImagePrompts(docType: DocType): ImagePromptPlan[] {
  const defaults: Record<DocType, ImagePromptPlan[]> = {
    proposal: [
      { type: 'logo', prompt: 'professional company logo, minimal design', reasoning: 'fallback', slot: 0 },
      { type: 'hero', prompt: 'business product photography, clean background', reasoning: 'fallback', slot: 1 },
      { type: 'illustration', prompt: 'business team collaboration illustration', reasoning: 'fallback', slot: 2 },
    ],
    presentation: [
      { type: 'logo', prompt: 'presentation title logo, modern design', reasoning: 'fallback', slot: 0 },
      { type: 'background', prompt: 'presentation background, professional style', reasoning: 'fallback', slot: 1 },
      { type: 'illustration', prompt: 'corporate illustration, modern flat design', reasoning: 'fallback', slot: 2 },
    ],
    'product-card': [
      { type: 'product', prompt: 'professional product photography, clean background, high quality, main view', reasoning: 'fallback', slot: 0 },
      { type: 'product', prompt: 'product detail shot, professional lighting, clean white background', reasoning: 'fallback', slot: 1 },
      { type: 'product', prompt: 'product in use, lifestyle photography, natural lighting', reasoning: 'fallback', slot: 2 },
    ],
    invoice: [
      { type: 'logo', prompt: 'company logo, minimal design, corporate identity', reasoning: 'fallback', slot: 0 },
      { type: 'product', prompt: 'professional product photography, clean background, high quality', reasoning: 'fallback', slot: 1 },
      { type: 'product', prompt: 'business product image, professional lighting, clean white background', reasoning: 'fallback', slot: 2 },
    ],
    email: [
      { type: 'logo', prompt: 'email logo, minimal design', reasoning: 'fallback', slot: 0 },
      { type: 'hero', prompt: 'email banner, modern style', reasoning: 'fallback', slot: 1 },
    ],
    logo: [
      { type: 'logo', prompt: 'modern minimal logo design', reasoning: 'fallback', slot: 0 },
      { type: 'logo', prompt: 'creative brand logo design', reasoning: 'fallback', slot: 1 },
      { type: 'logo', prompt: 'elegant business logo', reasoning: 'fallback', slot: 2 },
    ],
  }
  
  return defaults[docType] || defaults.proposal
}

