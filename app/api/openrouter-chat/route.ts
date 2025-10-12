import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'google/gemini-2.5-flash-lite', temperature = 0.7, max_tokens } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY?.trim()
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured')
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    console.log(`OpenRouter: Calling ${model}...`)
    console.log(`Messages: ${messages.length}`)

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://nx-studio.vercel.app",
        "X-Title": "Creatix Agent",
      }
    })

    const completion = await client.chat.completions.create({
      model: model,
      messages: messages as any,
      temperature: temperature,
      ...(max_tokens ? { max_tokens } : {})
    })

    const content = completion.choices[0]?.message?.content || ''
    console.log(`OpenRouter: Generated ${content.length} characters`)

    return NextResponse.json({
      success: true,
      content: content,
    })
  } catch (error) {
    console.error('OpenRouter chat error:', error)
    return NextResponse.json(
      {
        error: 'OpenRouter chat failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

