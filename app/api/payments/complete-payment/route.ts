import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'
import { GENERATION_LIMITS } from '@/lib/generationLimits'

/**
 * POST /api/payments/complete-payment
 * Проверяет статус платежа через Tochka API и активирует подписку
 *
 * Этот endpoint нужен потому что Точка Банк НЕ отправляет webhooks
 * для карточных платежей (только для СБП).
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { operationId } = await request.json()

    if (!operationId) {
      return NextResponse.json(
        { error: 'operationId is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Checking payment status for operationId: ${operationId}`)
    console.log(`📧 User email: ${session.user.email}`)

    // Поиск транзакции
    console.log(`🔎 Searching for transaction with operationId in metadata...`)
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
      console.error(`💡 This means no transaction in the database has this operationId in metadata.operationId`)
      console.error(`💡 Check if transaction was created on a different environment (local vs production)`)
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Transaction found:`, {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      userId: transaction.userId,
      userEmail: transaction.user.email,
      metadata: transaction.metadata,
    })

    // Проверка, что транзакция принадлежит текущему пользователю
    if (transaction.user.email !== session.user.email) {
      console.error(`❌ Transaction does not belong to user: ${session.user.email}`)
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Если уже обработана - возвращаем успех
    if (transaction.status === 'COMPLETED') {
      console.log(`✅ Transaction already completed: ${operationId}`)
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        alreadyProcessed: true,
      })
    }

    // Проверяем статус платежа через Tochka API
    console.log(`🔗 Calling Tochka Bank API to verify payment status...`)
    const tochkaClient = createTochkaClient()

    try {
      // GET /uapi/acquiring/v1.0/payments/{operationId}
      const paymentStatus = await tochkaClient.getPaymentStatus(operationId)

      console.log(`📊 Payment status from Tochka:`, {
        operationId,
        status: paymentStatus.Data?.status,
        amount: paymentStatus.Data?.amount,
      })

      const status = paymentStatus.Data?.status
      const amount = paymentStatus.Data?.amount

      // Если платеж не подтвержден
      if (status !== 'APPROVED') {
        console.log(`⏳ Payment not yet approved. Status: ${status}`)
        return NextResponse.json({
          success: false,
          message: 'Payment not yet approved',
          status,
        })
      }

      // Платеж подтвержден - активируем подписку
      console.log(`✅ Payment approved: ${operationId}`)

      // КРИТИЧЕСКАЯ ПРОВЕРКА: Валидация суммы
      const metadata = transaction.metadata as any
      const expectedAmount = transaction.amount
      const actualAmount = parseFloat(amount?.toString() || '0')

      if (Math.abs(actualAmount - expectedAmount) > 0.01) {
        console.error('❌ SECURITY ALERT: Payment amount mismatch!', {
          expected: expectedAmount,
          actual: actualAmount,
          operationId,
          userId: transaction.userId,
        })

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

      // Активация подписки в зависимости от типа платежа
      if (transaction.type === 'SUBSCRIPTION') {
        const targetMode = metadata?.targetMode

        if (!targetMode || (targetMode !== 'ADVANCED' && targetMode !== 'PRO')) {
          console.error('❌ Invalid targetMode in transaction metadata')
          return NextResponse.json(
            { error: 'Invalid targetMode' },
            { status: 400 }
          )
        }

        // Подписка действует ровно 1 месяц
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
          email: transaction.user.email,
          subscriptionEndsAt,
        })

        return NextResponse.json({
          success: true,
          message: `Subscription activated: ${targetMode}`,
          targetMode,
          subscriptionEndsAt,
        })

      } else if (transaction.type === 'BONUS_PACK') {
        console.log(`🎁 Processing BONUS_PACK payment...`)

        // Получаем текущее значение bonusGenerations перед обновлением
        const userBefore = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { bonusGenerations: true, subscriptionEndsAt: true },
        })
        console.log(`📊 User before update:`, {
          userId: transaction.userId,
          bonusGenerations: userBefore?.bonusGenerations,
          subscriptionEndsAt: userBefore?.subscriptionEndsAt,
        })

        // Бонусный пак - действует 1 месяц
        const bonusEndsAt = new Date()
        bonusEndsAt.setMonth(bonusEndsAt.getMonth() + 1)

        console.log(`💾 Updating user: adding +30 bonusGenerations...`)
        const updatedUser = await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            bonusGenerations: {
              increment: 30,
            },
            subscriptionEndsAt: bonusEndsAt,
          },
          select: { bonusGenerations: true, subscriptionEndsAt: true },
        })

        console.log(`✅ Bonus pack added for user:`, {
          userId: transaction.userId,
          email: transaction.user.email,
          bonusGenerationsBefore: userBefore?.bonusGenerations,
          bonusGenerationsAfter: updatedUser.bonusGenerations,
          actualIncrement: (updatedUser.bonusGenerations || 0) - (userBefore?.bonusGenerations || 0),
          expiresAt: bonusEndsAt,
        })

        return NextResponse.json({
          success: true,
          message: 'Bonus pack activated (+30 generations)',
          bonusGenerations: 30,
          expiresAt: bonusEndsAt,
        })
      }

    } catch (apiError) {
      console.error('❌ Error checking payment status with Tochka API:', apiError)

      // Если ошибка API - возвращаем более детальную информацию
      return NextResponse.json(
        {
          error: 'Failed to check payment status',
          details: apiError instanceof Error ? apiError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: false,
      message: 'Unknown payment type',
    })

  } catch (error) {
    console.error('❌ Error completing payment:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
