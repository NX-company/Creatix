import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { logApiUsage, prisma } from '@/lib/db'

export const maxDuration = 60

const FLUX_MODEL_COSTS: Record<string, number> = {
  'black-forest-labs/flux-schnell': 0.003,
  'black-forest-labs/flux-dev': 0.025,
  'black-forest-labs/flux-pro': 0.05,
  'black-forest-labs/flux-1.1-pro': 0.04
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'black-forest-labs/flux-schnell' } = await request.json()

    if (!prompt) {
      console.error('❌ No prompt provided')
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const apiToken = process.env.REPLICATE_API_TOKEN?.trim()
    if (!apiToken) {
      console.error('❌ Replicate API token not configured in environment')
      return NextResponse.json({ error: 'Replicate API token not configured' }, { status: 500 })
    }

    const isPro = model.includes('flux-pro') || model.includes('flux-1.1-pro')
    const modelName = model.includes('flux-1.1-pro') ? 'Flux 1.1 Pro' : (isPro ? 'Flux Pro' : 'Flux Schnell')
    
    console.log(`🎨 ${modelName}: Starting generation...`)
    console.log(`   Model: ${model}`)
    console.log(`   Prompt: "${prompt.substring(0, 100)}..."`)
    console.log(`   Size: ${width}x${height}`)

    const replicate = new Replicate({
      auth: apiToken,
    })

    console.log(`📡 Calling Replicate API with model: ${model}...`)
    
    const input: any = {
      prompt,
      width,
      height,
    }
    
    // Flux Schnell/Dev дополнительно принимает эти параметры
    if (!isPro) {
      input.num_outputs = 1
      input.disable_safety_checker = false
    } else if (model.includes('flux-1.1-pro')) {
      // Flux 1.1 Pro принимает специфичные параметры
      input.prompt_upsampling = false
      input.safety_tolerance = 2
    }
    
    console.log(`📤 Input parameters:`, JSON.stringify(input, null, 2))
    
    const output = await replicate.run(model as `${string}/${string}`, { input })

    console.log(`📦 Replicate response type:`, typeof output)
    console.log(`📦 Is Array:`, Array.isArray(output))
    
    // Проверяем конструктор для диагностики
    if (output && typeof output === 'object' && output.constructor) {
      console.log(`📦 Constructor name:`, output.constructor.name)
    }

    let imageUrl: string | undefined
    let imageBuffer: ArrayBuffer | undefined

    // Обработка разных типов ответов от Replicate API
    try {
      // УНИВЕРСАЛЬНЫЙ ПОДХОД: сначала проверяем, это строка URL
      if (typeof output === 'string') {
        console.log(`📦 Direct string URL detected`)
        imageUrl = output
      }
      // Если это массив - берем первый элемент
      else if (Array.isArray(output) && output.length > 0) {
        console.log(`📦 Array response with ${output.length} items`)
        const firstItem = output[0]
        
        if (typeof firstItem === 'string') {
          console.log(`📦 First item is string URL`)
          imageUrl = firstItem
        } else if (firstItem && typeof firstItem === 'object') {
          console.log(`📦 First item is object, trying to extract URL...`)
          // Пробуем извлечь URL из объекта
          if (typeof (firstItem as any).url === 'function') {
            const urlResult = await (firstItem as any).url()
            imageUrl = typeof urlResult === 'string' ? urlResult : urlResult?.href || urlResult?.toString()
          } else if ((firstItem as any).url && typeof (firstItem as any).url === 'string') {
            imageUrl = (firstItem as any).url
          } else if ((firstItem as any).href && typeof (firstItem as any).href === 'string') {
            imageUrl = (firstItem as any).href
          }
        }
      }
      // Если это объект (FileOutput для Pro моделей)
      else if (output && typeof output === 'object' && !Array.isArray(output)) {
        console.log(`📦 Object response (FileOutput) detected`)
        
        // Пробуем url() метод
        if (typeof (output as any).url === 'function') {
          try {
            console.log(`📦 Calling .url() method...`)
            const urlResult = await (output as any).url()
            
            if (typeof urlResult === 'string') {
              imageUrl = urlResult
            } else if (urlResult?.href) {
              imageUrl = urlResult.href
            } else if (urlResult?.toString) {
              imageUrl = urlResult.toString()
            }
            
            if (imageUrl) {
              console.log(`✅ Got URL from FileOutput: ${imageUrl.substring(0, 100)}...`)
            }
          } catch (e) {
            console.warn(`⚠️  .url() method failed:`, e)
          }
        }
        
        // Если URL не получен, пробуем toString()
        if (!imageUrl && typeof (output as any).toString === 'function') {
          try {
            const str = (output as any).toString()
            if (str && str.startsWith('http')) {
              imageUrl = str
              console.log(`✅ Got URL via toString()`)
            }
          } catch (e) {
            console.warn(`⚠️  .toString() failed:`, e)
          }
        }
      }
      
      if (imageUrl && !imageBuffer) {
        console.log(`⬇️  Downloading image from URL...`)
        const imageResponse = await fetch(imageUrl)
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        imageBuffer = await imageResponse.arrayBuffer()
        if (imageBuffer) {
          console.log(`✅ Downloaded ${imageBuffer.byteLength} bytes`)
        }
      }
      
      // Проверяем, что у нас есть данные изображения
      if (!imageBuffer) {
        console.error('❌ No image data obtained')
        console.error('❌ Output type:', typeof output)
        console.error('❌ Output constructor:', output?.constructor?.name)
        console.error('❌ Output keys:', output && typeof output === 'object' ? Object.keys(output) : 'N/A')
        console.error('❌ Output methods:', output && typeof output === 'object' ? Object.getOwnPropertyNames(Object.getPrototypeOf(output)) : 'N/A')
        
        throw new Error('No image data found in Replicate response')
      }
    } catch (extractError) {
      console.error('❌ Error processing response:', extractError)
      throw new Error(`Failed to process image: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`)
    }

    const base64 = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    console.log(`✅ ${modelName} generation complete`)

    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      
      if (user) {
        const cost = FLUX_MODEL_COSTS[model] || 0.003
        await logApiUsage({
          userId: user.id,
          provider: 'Replicate',
          model: model,
          endpoint: '/api/flux-generate',
          tokensUsed: 0,
          cost: cost
        })
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      originalUrl: imageUrl,
    })
  } catch (error) {
    console.error('❌ Flux generation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    })

    return NextResponse.json(
      {
        error: 'Image generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

