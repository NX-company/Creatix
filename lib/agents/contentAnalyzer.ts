import type { DocType } from '../store'
import { AGENT_MODELS } from '../config/agents'
import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'
import { extractQuantity } from '../intentRecognition'

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
  usePRO: boolean = false,
  uploadedImagesCount: number = 0,
  userRequestedCount?: number
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
  
  let totalImagesNeeded: number
  let numImages: number
  
  if (userRequestedCount && userRequestedCount > 0) {
    totalImagesNeeded = userRequestedCount
    numImages = Math.max(0, userRequestedCount - uploadedImagesCount)
    console.log(`🎨 Using imageCount from planning: ${userRequestedCount}`)
  } else {
    totalImagesNeeded = extractQuantity(userPrompt, defaultCount)
    numImages = Math.max(0, totalImagesNeeded - uploadedImagesCount)
  }
  
  console.log(`🎨 Images to generate: ${numImages} (total needed: ${totalImagesNeeded}, uploaded: ${uploadedImagesCount}, default for ${docType}: ${defaultCount})`)
  
  const analysisPrompt = `You are an intelligent Content Analyzer AI that deeply understands user intent and creates precise image generation plans.

🎯 CONTEXT ANALYSIS:
USER REQUEST: "${userPrompt}"
DOCUMENT TYPE: ${docType}
EXACT IMAGES NEEDED: ${numImages}

GENERATED CONTENT:
${JSON.stringify(contentData, null, 2).substring(0, 2000)}

${previousFeedback ? `\n📋 PREVIOUS QA FEEDBACK:\n${previousFeedback}\n` : ''}

🧠 YOUR INTELLIGENT TASK:

1. DEEPLY UNDERSTAND the user's intent:
   - What is the main subject/product/company?
   - What style/mood does the user want? (professional, playful, minimal, etc.)
   - Are there specific details mentioned? (colors, style, objects, etc.)
   
2. CREATE EXACTLY ${numImages} SPECIFIC image prompts that:
   - MATCH the user's intent and context perfectly
   - Are DETAILED and SPECIFIC (not generic)
   - Include all relevant details from the user request
   - Use appropriate style for the document type

3. EXTRACT all relevant information:
   - Company/brand name (if mentioned)
   - Product name and details
   - Industry/niche
   - Main theme/subject

🎨 IMAGE PROMPT GUIDELINES:

For LOGOS:
- Include company name, industry, style (minimal/playful/professional)
- Specify colors if mentioned
- Reflect brand personality

For PRODUCTS:
- Describe the product accurately
- Include context (lifestyle, studio, detail shots)
- Match the product's actual features

For ILLUSTRATIONS:
- Match the content's theme and mood
- Be specific about the scene/objects
- Include relevant context from user request

⚠️ CRITICAL RULES:
- Generate EXACTLY ${numImages} prompts (no more, no less)
- Be SPECIFIC, not generic (use actual names, details from content)
- Prompts MUST be in English
- Understand context: if user says "одно изображение" → create 1 prompt
- Extract intent: if user says "сделай логотип для кафе" → understand it's a cafe logo

Return ONLY valid JSON:
{
  "mainTheme": "specific theme extracted from user request",
  "companyName": "extracted company/brand name or null",
  "productName": "extracted product name or null",
  "industry": "industry/niche or null",
  "imagePrompts": [
    {
      "type": "logo|hero|illustration|product|background",
      "prompt": "extremely detailed and specific prompt in English that captures user's intent",
      "reasoning": "why this matches the user's request and context",
      "slot": 0
    }
  ]
}`

  try {
    if (usePRO) {
      // PRO режим: используем OpenRouter GPT-4o вместо прямого OpenAI API (чтобы избежать квоты)
      const response = await fetch('/api/openrouter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an expert content analyzer. Always return valid JSON.' },
            { role: 'user', content: analysisPrompt }
          ],
          model: 'openai/gpt-4o',
          temperature: 0.3
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
    'commercial-proposal': 3,
    'business-card': 1,
    'youtube-thumbnail': 1,
    'vk-post': 1,
    'telegram-post': 1,
    'wildberries-card': 3,
    'ozon-card': 3,
    'yandex-market-card': 3,
    'avito-card': 3,
    'brand-book': 5,
    'icon-set': 10,
    'ui-kit': 5,
    'email-template': 2,
    'newsletter': 2,
    'custom-design': 3,
  }
  return counts[docType] || 3
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
    'commercial-proposal': [],
    'business-card': [],
    'youtube-thumbnail': [],
    'vk-post': [],
    'telegram-post': [],
    'wildberries-card': [],
    'ozon-card': [],
    'yandex-market-card': [],
    'avito-card': [],
    'brand-book': [],
    'icon-set': [],
    'ui-kit': [],
    'email-template': [],
    'newsletter': [],
    'custom-design': [],
  }
  
  return defaults[docType] || defaults.proposal
}

