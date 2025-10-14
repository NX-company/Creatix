import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getUserFromRequest } from '@/lib/auth'
import { logApiUsage } from '@/lib/db'

export const maxDuration = 60

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-flash-lite': { input: 0.000075, output: 0.0003 },
  'google/gemini-2.0-flash-001': { input: 0.00015, output: 0.0006 },
  'openai/gpt-4o': { input: 0.005, output: 0.015 },
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006 }
}

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

    const user = await getUserFromRequest(request)
    if (user && completion.usage) {
      const tokensUsed = completion.usage.total_tokens || 0
      const costs = MODEL_COSTS[model] || { input: 0.0001, output: 0.0003 }
      const inputTokens = completion.usage.prompt_tokens || 0
      const outputTokens = completion.usage.completion_tokens || 0
      const cost = (inputTokens / 1000 * costs.input) + (outputTokens / 1000 * costs.output)
      
      await logApiUsage({
        userId: user.id,
        provider: 'OpenRouter',
        model: model,
        endpoint: '/api/openrouter-chat',
        tokensUsed: tokensUsed,
        cost: cost
      })
    }

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

