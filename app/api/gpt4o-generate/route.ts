import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { HttpsProxyAgent } from 'https-proxy-agent'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { prompt, docType, images = [], mode = 'content' } = await request.json()

    if (!prompt) {
      console.error('❌ No prompt provided')
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('❌ OpenRouter API key not configured in environment')
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    const proxyHost = process.env.PROXY_HOST
    const proxyPort = process.env.PROXY_PORT
    const proxyLogin = process.env.PROXY_LOGIN
    const proxyPassword = process.env.PROXY_PASSWORD

    if (!proxyHost || !proxyPort || !proxyLogin || !proxyPassword) {
      console.error('❌ Proxy not configured')
      return NextResponse.json({ error: 'Proxy not configured' }, { status: 500 })
    }

    console.log(`🤖 GPT-4o (OpenRouter): Starting generation via proxy...`)
    console.log(`   Proxy: ${proxyHost}:${proxyPort}`)
    console.log(`   Mode: ${mode}`)
    console.log(`   DocType: ${docType}`)
    console.log(`   Images: ${images.length}`)
    console.log(`   Prompt: "${prompt.substring(0, 100)}..."`)

    const proxyUrl = `http://${proxyLogin}:${proxyPassword}@${proxyHost}:${proxyPort}`
    const agent = new HttpsProxyAgent(proxyUrl)

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      httpAgent: agent,
    })

    let systemPrompt = ''
    
    if (mode === 'content') {
      systemPrompt = `You are an expert business document creator. Generate professional ${docType} content in JSON format.

For proposal: Return JSON with company, title, sections[], benefits[], pricing[]
For invoice: Return JSON with invoiceNumber, date, items[], totalWithoutVAT, vat, total
For email: Return JSON with subject, greeting, body[], signature
For presentation: Return JSON with title, subtitle, slides[] (each with title, content, imageSlot)
For logo: Return JSON with companyName, tagline, concepts[] (3 logo variations with style, colors, description)
For product-card: Return JSON with productName, description, features[], specifications[], price, images[]

Always return valid JSON without markdown formatting.`
    } else if (mode === 'html') {
      systemPrompt = `You are an expert HTML/CSS developer. Convert the provided JSON content into beautiful, modern HTML with inline CSS.

Requirements:
- Use modern CSS with flexbox/grid
- Include smooth animations and transitions
- Make it responsive and professional
- Place image placeholders where needed: {{IMAGE_0}}, {{IMAGE_1}}, etc.
- Return ONLY the HTML body content, no <!DOCTYPE>, no <html>, no <head> tags
- Use inline styles or <style> tag at the beginning
- Make it print-friendly for PDFs`
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    if (images.length > 0) {
      const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
        {
          type: 'text',
          text: prompt
        }
      ]

      images.forEach((img: any) => {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: img.base64,
            detail: 'high'
          }
        })
      })

      messages.push({
        role: 'user',
        content: userContent
      })
    } else {
      messages.push({
        role: 'user',
        content: prompt
      })
    }

    console.log(`📡 Calling OpenRouter API (openai/gpt-4o)...`)
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: messages,
      temperature: mode === 'content' ? 0.7 : 0.3,
      max_tokens: mode === 'content' ? 4000 : 8000,
      ...(mode === 'content' ? { response_format: { type: 'json_object' } } : {})
    })

    const content = completion.choices[0]?.message?.content || (mode === 'content' ? '{}' : '')
    console.log(`✅ GPT-4o (OpenRouter) generated ${content.length} characters`)

    return NextResponse.json({
      success: true,
      content: content,
    })
  } catch (error) {
    console.error('❌ GPT-4o generation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        error: 'GPT-4o generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

