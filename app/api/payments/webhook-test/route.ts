import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/payments/webhook-test
 * Тестовый webhook endpoint для отладки - логирует ВСЁ что приходит
 */
export async function POST(request: NextRequest) {
  try {
    console.log('========================================')
    console.log('TEST WEBHOOK RECEIVED')
    console.log('========================================')
    console.log('URL:', request.url)
    console.log('Method:', request.method)
    console.log('Headers:', JSON.stringify(Object.fromEntries(request.headers), null, 2))

    const body = await request.json()
    console.log('Body:', JSON.stringify(body, null, 2))
    console.log('========================================')

    return NextResponse.json({ success: true, message: 'Test webhook received' })
  } catch (error) {
    console.error('❌ Test webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process test webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Test webhook endpoint is ready',
  })
}
