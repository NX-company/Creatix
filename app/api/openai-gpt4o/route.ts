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

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const proxyHost = process.env.PROXY_HOST?.trim()
    const proxyPort = process.env.PROXY_PORT?.trim()
    const proxyLogin = process.env.PROXY_LOGIN?.trim()
    const proxyPassword = process.env.PROXY_PASSWORD?.trim()

    if (!proxyHost || !proxyPort || !proxyLogin || !proxyPassword) {
      console.error('❌ Proxy not configured')
      return NextResponse.json({ error: 'Proxy not configured' }, { status: 500 })
    }

    console.log(`🤖 GPT-4o (OpenAI): Starting generation via proxy...`)
    console.log(`   Proxy: ${proxyHost}:${proxyPort}`)
    console.log(`   Mode: ${mode}`)
    console.log(`   DocType: ${docType}`)
    console.log(`   Images: ${images.length}`)
    console.log(`   Prompt: "${prompt.substring(0, 100)}..."`)

    const proxyUrl = `http://${proxyLogin}:${proxyPassword}@${proxyHost}:${proxyPort}`
    const agent = new HttpsProxyAgent(proxyUrl)

    const client = new OpenAI({
      apiKey: apiKey,
      httpAgent: agent as any,
    })

    let systemPrompt = ''
    
    if (mode === 'content') {
      systemPrompt = `You are an expert business document creator. Generate professional ${docType} content in JSON format.

Based on the user's request and any provided images/videos, analyze them to extract key information and integrate it into the content.

Always output valid JSON.`
    } else if (mode === 'html') {
      systemPrompt = `You are an expert HTML composer. Create a complete, modern, responsive HTML document for a ${docType}.

CRITICAL RULES:
1. Output ONLY complete HTML (from <!DOCTYPE html> to </html>)
2. For images, use ONLY placeholder strings like: <img src="IMAGE_0" ... />, <img src="IMAGE_1" ... />, etc.
3. NEVER use base64 or data: URLs in src attribute - only IMAGE_0, IMAGE_1, IMAGE_2, etc.
4. Use inline CSS styles (not Tailwind) for maximum compatibility
5. Make it visually stunning with modern design (gradients, shadows, proper spacing)
6. Ensure ALL placeholders IMAGE_0, IMAGE_1, IMAGE_2, etc. mentioned in the prompt are used
7. The HTML must be complete and production-ready

Generate the full HTML document now.`
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ]

    if (images.length > 0) {
      const contentWithImages = [
        { type: 'text', text: prompt },
        ...images.map((img: any) => ({
          type: 'image_url',
          image_url: { url: img.base64, detail: 'high' }
        }))
      ]
      messages.push({ role: 'user', content: contentWithImages })
    } else {
      messages.push({
        role: 'user',
        content: prompt
      })
    }

    console.log(`📡 Calling OpenAI API (gpt-4o)...`)
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: mode === 'content' ? 0.7 : 0.3,
      max_tokens: mode === 'content' ? 4000 : 16000,
      ...(mode === 'content' ? { response_format: { type: 'json_object' } } : {})
    })

    const content = completion.choices[0]?.message?.content || (mode === 'content' ? '{}' : '')
    console.log(`✅ GPT-4o (OpenAI) generated ${content.length} characters`)

    return NextResponse.json({
      success: true,
      content: content,
    })
  } catch (error) {
    console.error('❌ GPT-4o generation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
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


