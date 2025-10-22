import { NextResponse } from 'next/server'

export async function GET() {
  const results = {
    openRouter: null,
    openAI: null,
    replicate: null,
    resend: null,
    database: null
  }

  try {
    // Test OpenRouter API
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || ''
      }
    })
    results.openRouter = {
      status: openRouterRes.status,
      valid: openRouterRes.ok,
      data: await openRouterRes.json().catch(() => null)
    }
  } catch (e) {
    results.openRouter = { error: e.message }
  }

  try {
    // Test OpenAI API
    const openAIRes = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })
    results.openAI = {
      status: openAIRes.status,
      valid: openAIRes.ok,
      data: await openAIRes.json().catch(() => null)
    }
  } catch (e) {
    results.openAI = { error: e.message }
  }

  try {
    // Test Replicate API
    const replicateRes = await fetch('https://api.replicate.com/v1/collections', {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    })
    results.replicate = {
      status: replicateRes.status,
      valid: replicateRes.ok,
      data: await replicateRes.json().catch(() => null)
    }
  } catch (e) {
    results.replicate = { error: e.message }
  }

  try {
    // Test Resend API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    })
    results.resend = {
      status: resendRes.status,
      valid: resendRes.ok,
      data: await resendRes.json().catch(() => null)
    }
  } catch (e) {
    results.resend = { error: e.message }
  }

  try {
    // Test Database connection (using prisma)
    const { prisma } = await import('@/lib/db')
    await prisma.$connect()
    await prisma.$disconnect()
    results.database = {
      status: 200,
      valid: true,
      message: 'Successfully connected to database'
    }
  } catch (e) {
    results.database = { 
      status: 500,
      valid: false,
      error: e.message 
    }
  }

  return NextResponse.json(results)
}