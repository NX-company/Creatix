import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'
import { GENERATION_LIMITS } from '@/lib/generationLimits'

/**
 * POST /api/payments/webhook
 * Webhook для обработки уведомлений от Точка Банка
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received from Tochka Bank')

    // Получение тела запроса
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Получение заголовка с подписью (если есть)
    const signature = request.headers.get('x-signature') || ''

    // Проверка подписи webhook'а
    const tochkaClient = createTochkaClient()
    const isValid = tochkaClient.verifyWebhookSignature(rawBody, signature)

    if (!isValid) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Webhook от Точка Банка приходит в формате согласно документации
    // Для acquiringInternetPayment события
    const {
      operationId,  // Уникальный ID операции
      status,       // CREATED, APPROVED, REFUNDED, EXPIRED, etc.
      amount,
      consumerId,   // userId который мы передали при создании
    } = body

    console.log('📦 Webhook data:', {
      operationId,
      status,
      amount,
      consumerId,
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

    // Проверка, что транзакция ещё не обработана
    if (transaction.status === 'COMPLETED') {
      console.log(`⚠️  Transaction already processed: ${operationId}`)
      return NextResponse.json(
        { success: true, message: 'Already processed' },
        { status: 200 }
      )
    }

    // Обработка статуса платежа
    // По документации API статус может быть: CREATED, APPROVED, ON-REFUND, REFUNDED, EXPIRED
    if (status === 'APPROVED') {
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

        if (!targetMode || (targetMode !== 'ADVANCED' && targetMode !== 'PRO')) {
          console.error('❌ Invalid targetMode in transaction metadata')
          return NextResponse.json(
            { error: 'Invalid targetMode' },
            { status: 400 }
          )
        }

        // Обновление пользователя - подписка действует ровно 1 месяц
        const subscriptionEndsAt = new Date()
        subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1)

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            appMode: targetMode,
            generationLimit: GENERATION_LIMITS[targetMode],
            subscriptionEndsAt,
            monthlyGenerations: 0,
            bonusGenerations: 0,
            trialEndsAt: null,
          },
        })

        console.log(`✅ User upgraded to ${targetMode}:`, {
          userId: transaction.userId,
          subscriptionEndsAt,
        })

      } else if (transaction.type === 'BONUS_PACK') {
        // Покупка бонусного пака - действует 1 месяц
        const bonusEndsAt = new Date()
        bonusEndsAt.setMonth(bonusEndsAt.getMonth() + 1)

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            bonusGenerations: {
              increment: 30,
            },
            // Обновляем subscriptionEndsAt если бонусный пак продлевает срок
            subscriptionEndsAt: bonusEndsAt,
          },
        })

        console.log(`✅ Bonus pack added for user:`, {
          userId: transaction.userId,
          bonusGenerations: '+30',
          expiresAt: bonusEndsAt,
        })
      }

    } else if (status === 'EXPIRED') {
      console.log(`❌ Payment expired: ${operationId}`)

      // Обновление статуса транзакции
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      })
    } else {
      console.log(`ℹ️  Payment status: ${status} for operationId: ${operationId}`)
      // Другие статусы: CREATED, ON-REFUND, REFUNDED, REFUNDED_PARTIALLY, AUTHORIZED, WAIT_FULL_PAYMENT
      // Пока не обрабатываем, оставляем PENDING
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
