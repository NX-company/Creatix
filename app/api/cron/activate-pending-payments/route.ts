import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'

/**
 * POST /api/cron/activate-pending-payments
 * Фоновая задача для активации PENDING подписок
 * Вызывается через cron каждые 5 минут
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Cron: Starting pending payments activation...')

    // Проверка секретного токена
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken) {
      console.error('❌ CRON_SECRET_TOKEN not configured')
      return NextResponse.json(
        { error: 'Cron token not configured' },
        { status: 500 }
      )
    }

    const providedToken = authHeader?.replace('Bearer ', '')

    if (providedToken !== expectedToken) {
      console.error('❌ Invalid cron token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Найти все PENDING транзакции старше 3 минут
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000)

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        createdAt: {
          lt: threeMinutesAgo, // Только старше 3 минут
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`📊 Found ${pendingTransactions.length} pending transactions`)

    let activated = 0
    let failed = 0
    let skipped = 0

    const tochkaClient = createTochkaClient('v1.0')

    // Обработать каждую транзакцию
    for (const transaction of pendingTransactions) {
      const operationId = (transaction.metadata as any)?.operationId

      if (!operationId) {
        console.log(`⚠️  Transaction ${transaction.id} has no operationId, skipping`)
        skipped++
        continue
      }

      try {
        console.log(`🔍 Checking payment status for operationId: ${operationId}`)

        // Проверить статус платежа через API Точка Банка
        const paymentInfo = await tochkaClient.getPaymentInfo(operationId)
        const paymentData = (paymentInfo as any)?.Data
        const paymentStatus = paymentData?.status?.value

        console.log(`📊 Payment ${operationId} status: ${paymentStatus}`)

        if (paymentStatus === 'COMPLETED' || paymentStatus === 'AUTHORIZED') {
          // Платёж успешен - активировать подписку
          console.log(`✅ Activating subscription for transaction ${transaction.id}`)

          const metadata = transaction.metadata as any
          const targetMode = metadata?.targetMode || 'ADVANCED'
          const subscriptionDays = 30
          const generationsToAdd = 100

          // Обновить транзакцию и пользователя в одной транзакции БД
          await prisma.$transaction([
            // Обновить транзакцию
            prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                status: 'COMPLETED',
                updatedAt: new Date(),
              },
            }),
            // Обновить пользователя
            prisma.user.update({
              where: { id: transaction.userId },
              data: {
                appMode: targetMode as any,
                advancedGenerationsRemaining: {
                  increment: generationsToAdd,
                },
                advancedGenerationsTotal: {
                  increment: generationsToAdd,
                },
                subscriptionStatus: 'active',
                subscriptionStartedAt: new Date(),
                subscriptionEndsAt: new Date(Date.now() + subscriptionDays * 24 * 60 * 60 * 1000),
              },
            }),
          ])

          console.log(`✅ Subscription activated for user ${transaction.user.email}`)
          activated++

        } else if (paymentStatus === 'DECLINED' || paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED') {
          // Платёж отклонён
          console.log(`❌ Payment ${operationId} failed with status: ${paymentStatus}`)

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              updatedAt: new Date(),
            },
          })

          failed++

        } else {
          // Другие статусы (PENDING, PROCESSING и т.д.) - пропустить
          console.log(`⏳ Payment ${operationId} still pending with status: ${paymentStatus}`)
          skipped++
        }

      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.id}:`, error)
        skipped++
      }
    }

    const summary = {
      success: true,
      checked: pendingTransactions.length,
      activated,
      failed,
      skipped,
      timestamp: new Date().toISOString(),
    }

    console.log('✅ Cron job completed:', summary)

    return NextResponse.json(summary)

  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/activate-pending-payments
 * Проверка доступности endpoint'а
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Cron endpoint is ready',
    note: 'Use POST with Authorization header to execute',
  })
}
