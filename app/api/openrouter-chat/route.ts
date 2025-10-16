import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { logApiUsage } from '@/lib/db'
import { getRequestManager } from '@/lib/requestManager'

export const maxDuration = 60

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-flash-lite': { input: 0.000075, output: 0.0003 },
  'google/gemini-2.0-flash-001': { input: 0.00015, output: 0.0006 },
  'openai/gpt-4o': { input: 0.005, output: 0.015 },
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006 }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'google/gemini-2.5-flash-lite', temperature = 0.7, max_tokens, priority = 5 } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    console.log(`OpenRouter: Calling ${model}... (priority: ${priority})`)
    console.log(`Messages: ${messages.length}`)

    // Используем новый Request Manager с очередью и пулом ключей
    const requestManager = getRequestManager()
    
    const result = await requestManager.openrouterRequest({
      model,
      messages,
      temperature,
      max_tokens,
      priority,
    })

    console.log(`OpenRouter: Generated ${result.content.length} characters`)

    // Логируем использование API
    const user = await getUserFromRequest(request)
    if (user && result.usage) {
      const tokensUsed = result.usage.total_tokens || 0
      const costs = MODEL_COSTS[model] || { input: 0.0001, output: 0.0003 }
      const inputTokens = result.usage.prompt_tokens || 0
      const outputTokens = result.usage.completion_tokens || 0
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
      content: result.content,
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

