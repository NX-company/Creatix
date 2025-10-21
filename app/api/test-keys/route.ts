import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    const openRouterData = await openRouterResponse.json()
    
    // Test Replicate API
    const replicateResponse = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    const replicateData = await replicateResponse.json()

    return NextResponse.json({
      openRouter: {
        status: openRouterResponse.status,
        valid: openRouterResponse.ok,
        models: openRouterData
      },
      replicate: {
        status: replicateResponse.status,
        valid: replicateResponse.ok,
        data: replicateData
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}