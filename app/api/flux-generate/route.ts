import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'black-forest-labs/flux-schnell' } = await request.json()

    if (!prompt) {
      console.error('❌ No prompt provided')
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      console.error('❌ Replicate API token not configured in environment')
      return NextResponse.json({ error: 'Replicate API token not configured' }, { status: 500 })
    }

    const isPro = model.includes('flux-pro')
    const modelName = isPro ? 'Flux Pro' : 'Flux Schnell'
    
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
    
    // Flux Schnell дополнительно принимает эти параметры
    if (!isPro) {
      input.num_outputs = 1
      input.disable_safety_checker = false
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
      // Для Flux Pro: FileOutput объект
      if (isPro && output && typeof output === 'object' && !Array.isArray(output)) {
        console.log(`📦 Flux Pro FileOutput detected`)
        
        // Проверяем метод blob() - он есть у FileOutput
        if (typeof (output as any).blob === 'function') {
          try {
            console.log(`📦 Trying to get blob from FileOutput...`)
            const blob = await (output as any).blob()
            console.log(`📦 Got blob, size:`, blob?.size)
            
            if (blob && blob.size > 0) {
              imageBuffer = await blob.arrayBuffer()
              if (imageBuffer) {
                console.log(`✅ Got buffer from blob: ${imageBuffer.byteLength} bytes`)
              }
            }
          } catch (e) {
            console.error(`❌ Error calling .blob():`, e)
          }
        }
        
        // Если blob не сработал, пробуем url()
        if (!imageBuffer && typeof (output as any).url === 'function') {
          try {
            console.log(`📦 Trying to get URL from FileOutput...`)
            const urlResult = await (output as any).url()
            console.log(`📦 URL result:`, urlResult)
            console.log(`📦 URL result type:`, typeof urlResult)
            
            // Если url() вернул строку URL
            if (typeof urlResult === 'string') {
              imageUrl = urlResult
              console.log(`✅ Got URL from FileOutput:`, imageUrl)
            }
            // Если url() вернул объект с полем url или href
            else if (urlResult && typeof urlResult === 'object') {
              if (urlResult.url && typeof urlResult.url === 'string') {
                imageUrl = urlResult.url
                console.log(`✅ Got URL from result.url:`, imageUrl)
              } else if (urlResult.href && typeof urlResult.href === 'string') {
                imageUrl = urlResult.href
                console.log(`✅ Got URL from result.href:`, imageUrl)
              } else if (typeof urlResult.toString === 'function') {
                imageUrl = urlResult.toString()
                console.log(`✅ Got URL via toString():`, imageUrl)
              }
            }
          } catch (e) {
            console.error(`❌ Error calling .url():`, e)
          }
        }
        
        // Если URL и buffer не получены, пробуем другие методы
        if (!imageUrl && !imageBuffer) {
          console.log(`📦 Trying other methods...`)
          
          // Пробуем toString() метод
          if (typeof (output as any).toString === 'function') {
            try {
              const str = (output as any).toString()
              console.log(`📦 toString() result:`, str?.substring(0, 100))
            } catch (e) {
              console.error(`❌ Error calling .toString():`, e)
            }
          }
          
          // Если output это Buffer напрямую
          if (Buffer.isBuffer(output)) {
            const slicedBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength)
            imageBuffer = slicedBuffer instanceof ArrayBuffer ? slicedBuffer : undefined
            if (imageBuffer) {
              console.log(`✅ Got buffer directly: ${imageBuffer.byteLength} bytes`)
            }
          } else if (typeof (output as any).arrayBuffer === 'function') {
            const buffer = await (output as any).arrayBuffer()
            imageBuffer = buffer instanceof ArrayBuffer ? buffer : undefined
            if (imageBuffer) {
              console.log(`✅ Got buffer via arrayBuffer(): ${imageBuffer.byteLength} bytes`)
            }
          }
        }
      }
      // Для Flux Schnell: массив с FileOutput элементами 
      else if (Array.isArray(output) && output.length > 0) {
        console.log(`📦 Array response detected`)
        const firstElement = output[0]
        
        // Flux Schnell тоже может возвращать FileOutput в массиве
        if (firstElement && typeof firstElement === 'object') {
          console.log(`📦 Array element constructor:`, firstElement.constructor?.name)
          
          // Пробуем получить URL
          if (typeof (firstElement as any).url === 'function') {
            try {
              console.log(`📦 Calling .url() on array element...`)
              const urlResult = await (firstElement as any).url()
              console.log(`📦 URL result type:`, typeof urlResult)
              console.log(`📦 URL result value:`, urlResult)
              
              if (typeof urlResult === 'string') {
                imageUrl = urlResult
                console.log(`✅ Got URL from array element:`, imageUrl)
              } else if (urlResult && typeof urlResult === 'object' && urlResult.href) {
                imageUrl = urlResult.href
                console.log(`✅ Got URL from .href:`, imageUrl)
              }
            } catch (e) {
              console.error(`❌ Error calling .url() on array element:`, e)
            }
          }
          
          // Если URL не получен, пробуем как buffer
          if (!imageUrl && !imageBuffer) {
            if (Buffer.isBuffer(firstElement)) {
              const slicedBuffer = firstElement.buffer.slice(firstElement.byteOffset, firstElement.byteOffset + firstElement.byteLength)
              imageBuffer = slicedBuffer instanceof ArrayBuffer ? slicedBuffer : undefined
              if (imageBuffer) {
                console.log(`✅ Got buffer from array: ${imageBuffer.byteLength} bytes`)
              }
            } else if (typeof (firstElement as any).arrayBuffer === 'function') {
              const buffer = await (firstElement as any).arrayBuffer()
              imageBuffer = buffer instanceof ArrayBuffer ? buffer : undefined
              if (imageBuffer) {
                console.log(`✅ Got buffer via arrayBuffer() from array: ${imageBuffer.byteLength} bytes`)
              }
            }
          }
        } else if (typeof firstElement === 'string') {
          // Обычная строка URL
          imageUrl = firstElement
          console.log(`✅ Got URL string from array:`, imageUrl)
        }
      }
      // Если это напрямую строка
      else if (typeof output === 'string') {
        console.log(`📦 String response detected`)
        imageUrl = output
        console.log(`✅ Got URL as string:`, imageUrl)
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

