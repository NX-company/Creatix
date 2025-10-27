import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'

/**
 * POST /api/payments/webhook
 * Webhook для обработки уведомлений от Точка Банка
 *
 * РОУТЕР: Определяет систему (старая/новая) и делегирует обработку
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received from Tochka Bank')

    // Получение тела запроса
    const body = await request.json()
    console.log('📦 Full webhook payload:', JSON.stringify(body, null, 2))

    // Формат webhook от Точка Банка согласно документации:
    // https://developers.tochka.com/docs/pay-gateway/api/tokenization-decision-notification
    const {
      version,
      merchantSiteUid,
      event,
      createdAt,
      payloadType,
      payload,
    } = body

    // Проверяем что это уведомление о платеже
    if (event !== 'payment-updated') {
      console.log(`ℹ️ Webhook: Ignoring event type: ${event}`)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    if (payloadType !== 'payment') {
      console.log(`ℹ️ Webhook: Ignoring payload type: ${payloadType}`)
      return NextResponse.json({ success: true, message: 'Payload type ignored' })
    }

    // Извлекаем данные платежа из payload
    const {
      paymentUid,      // Это operationId в нашей системе
      orderUid,
      amount: paymentAmount,
      status: paymentStatus,
      metadata,
    } = payload

    const operationId = paymentUid
    const status = paymentStatus?.value // COMPLETED, AUTHORIZED, DECLINED, CANCELLED
    const amount = paymentAmount?.amount ? parseFloat(paymentAmount.amount) : null

    console.log('📦 Webhook data:', {
      event,
      operationId,
      status,
      amount,
      orderUid,
      createdAt,
    })

    // Проверка обязательных полей
    if (!operationId || !status) {
      console.error('❌ Missing required fields in webhook')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Поиск транзакции по operationId
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          path: ['operationId'],
          equals: operationId,
        },
      },
      include: {
        user: true,
      },
    })

    if (!transaction) {
      console.error(`❌ Transaction not found for operationId: ${operationId}`)
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    console.log('🔄 Processing payment webhook')

    // Проверка, что транзакция ещё не обработана
    if (transaction.status === 'COMPLETED') {
      console.log(`⚠️  Transaction already processed: ${operationId}`)
      return NextResponse.json(
        { success: true, message: 'Already processed' },
        { status: 200 }
      )
    }

    // Обработка статуса платежа
    // По документации статусы: COMPLETED, AUTHORIZED, DECLINED, CANCELLED, EXPIRED
    // Успешный платёж = COMPLETED или AUTHORIZED
    if (status === 'COMPLETED' || status === 'AUTHORIZED') {
      console.log(`✅ Payment successful: ${operationId}`)

      // КРИТИЧЕСКАЯ ПРОВЕРКА БЕЗОПАСНОСТИ: Валидация суммы платежа
      const metadata = transaction.metadata as any
      const expectedAmount = transaction.amount
      const actualAmount = parseFloat(amount?.toString() || '0')

      // Проверяем, что оплаченная сумма совпадает с ожидаемой
      if (Math.abs(actualAmount - expectedAmount) > 0.01) {
        console.error('❌ SECURITY ALERT: Payment amount mismatch!', {
          expected: expectedAmount,
          actual: actualAmount,
          operationId,
          userId: transaction.userId,
        })

        // Помечаем транзакцию как неудачную и НЕ активируем подписку
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...metadata,
              securityError: 'Amount mismatch',
              expectedAmount,
              actualAmount,
            }
          },
        })

        return NextResponse.json(
          { error: 'Payment amount mismatch' },
          { status: 400 }
        )
      }

      // Обновление статуса транзакции
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
      })

      // Применение изменений в зависимости от типа платежа
      if (transaction.type === 'SUBSCRIPTION') {
        // Апгрейд подписки
        const targetMode = metadata?.targetMode

        if (!targetMode || targetMode !== 'ADVANCED') {
          console.error('❌ Invalid targetMode in transaction metadata')
          return NextResponse.json(
            { error: 'Invalid targetMode' },
            { status: 400 }
          )
        }

        // Обновление пользователя - подписка действует ровно 30 дней
        const now = new Date()
        const subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 дней

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            appMode: targetMode,
            subscriptionStatus: 'active',
            subscriptionStartedAt: now,
            subscriptionEndsAt: subscriptionEndsAt,
            advancedGenerationsTotal: { increment: 100 },
            advancedGenerationsRemaining: { increment: 100 },
          },
        })

        console.log(`✅ User upgraded to ${targetMode}:`, {
          userId: transaction.userId,
          email: transaction.user.email,
          subscriptionStartedAt: now,
          subscriptionEndsAt,
          advancedGenerationsAdded: 100,
        })
      } else {
        console.error('❌ Invalid transaction type:', transaction.type)
        return NextResponse.json(
          { error: 'Invalid transaction type' },
          { status: 400 }
        )
      }

    } else if (status === 'EXPIRED' || status === 'DECLINED' || status === 'CANCELLED') {
      console.log(`❌ Payment failed: ${operationId}, status: ${status}`)

      // Обновление статуса транзакции
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      })
    } else {
      console.log(`ℹ️  Payment status: ${status} for operationId: ${operationId}`)
      // Другие статусы: пока не обрабатываем, оставляем PENDING
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments/webhook
 * Для проверки доступности webhook endpoint'а
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Tochka Bank webhook endpoint is ready',
  })
}
