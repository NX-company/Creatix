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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const proxyHost = process.env.PROXY_HOST
    const proxyPort = process.env.PROXY_PORT
    const proxyLogin = process.env.PROXY_LOGIN
    const proxyPassword = process.env.PROXY_PASSWORD

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
      systemPrompt = `You are an expert HTML composer. Convert the provided JSON content into a modern, responsive, and visually appealing HTML document for a ${docType}. Use Tailwind CSS classes for styling. Ensure all images are correctly placed using <img> tags with base64 data URLs. The HTML should be production-ready and well-structured.`
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
      max_tokens: mode === 'content' ? 4000 : 8000,
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


