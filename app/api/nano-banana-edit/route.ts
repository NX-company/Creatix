import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { canUserGenerate } from '@/lib/generationLimits'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, selectionMask } = await request.json()
    
    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      )
    }
    
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    if (!REPLICATE_API_TOKEN || !OPENROUTER_API_KEY) {
      console.error('❌ API keys not configured')
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      )
    }
    
    console.log('🍌 Nano Banana: Starting image edit...')
    console.log(`   Original prompt (Russian): "${prompt}"`)
    console.log(`   Has selection mask: ${!!selectionMask}`)
    
    // STEP 1: Translate Russian command to precise English prompt using Gemini
    console.log('🔄 Step 1: Translating command with Gemini...')
    
    const translationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL,
        'X-Title': 'NX Studio - Nano Banana Editor',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert at creating precise image editing prompts for Instruct-Pix2Pix model.

TASK: Analyze the image and the user's Russian command, then create a precise English prompt for image editing.

USER'S COMMAND (Russian): "${prompt}"

${selectionMask ? 'NOTE: User selected a specific area - focus edits there.' : ''}

INSTRUCTIONS:
- Understand what the user wants to change
- Create a clear, specific English prompt for Instruct-Pix2Pix
- Be precise about colors, lighting, objects, style
- Keep the prompt concise (1-2 sentences)
- Don't change things the user didn't ask for

EXAMPLES:
"улучши качество" → "enhance image sharpness and details, increase clarity"
"измени фон на пляж" → "change background to a sunny beach with sand and palm trees"
"добавь солнечный свет" → "add warm sunlight from the right side with soft shadows"
"удали этот объект" → "remove the object and fill with matching background"

Return ONLY the English prompt, nothing else.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 150,
      })
    })
    
    if (!translationResponse.ok) {
      console.error('❌ Gemini translation failed:', translationResponse.status)
      throw new Error('Failed to translate prompt')
    }
    
    const translationData = await translationResponse.json()
    const englishPrompt = translationData.choices?.[0]?.message?.content?.trim() || prompt
    
    console.log(`✅ Translated prompt (English): "${englishPrompt}"`)
    
    // STEP 2: Use Replicate's Instruct-Pix2Pix for image editing
    console.log('🎨 Step 2: Editing image with Instruct-Pix2Pix...')
    
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    })
    
    const output = await replicate.run(
      'timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f',
      {
        input: {
          image: imageUrl,
          prompt: englishPrompt,
          negative_prompt: 'low quality, blurry, distorted, watermark, text, signature',
          num_inference_steps: 50,
          image_guidance_scale: 1.5,
          guidance_scale: 7.5,
        }
      }
    ) as any
    
    console.log('📦 Replicate response received')
    
    // Extract image URL from output
    let editedImageUrl = imageUrl // fallback to original
    
    if (typeof output === 'string') {
      editedImageUrl = output
      console.log('✅ Got direct URL from Replicate')
    } else if (Array.isArray(output) && output.length > 0) {
      editedImageUrl = output[0]
      console.log('✅ Got URL from array response')
    } else if (output && typeof output === 'object') {
      // Try to get URL from FileOutput object
      if (typeof output.url === 'function') {
        const urlResult = await output.url()
        editedImageUrl = typeof urlResult === 'string' ? urlResult : urlResult?.href || urlResult?.toString()
      } else if (output.url) {
        editedImageUrl = output.url
      }
      console.log('✅ Got URL from object response')
    }
    
    // Download and convert to data URL
    console.log('⬇️ Downloading edited image...')
    const imageResponse = await fetch(editedImageUrl)
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download edited image: ${imageResponse.status}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`
    
    console.log('✅ Image editing complete')
    
    return NextResponse.json({
      editedImageUrl: dataUrl,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Nano Banana edit error:', error)
    return NextResponse.json(
      {
        error: 'Image editing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

