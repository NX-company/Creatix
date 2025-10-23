import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'
import { GENERATION_LIMITS } from '@/lib/generationLimits'

/**
 * POST /api/payments/activate-latest
 * Находит последнюю PENDING транзакцию пользователя и активирует её
 * Используется как fallback когда operationId не передался в URL после оплаты
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`🔍 Looking for latest pending transaction for user: ${user.email}`)

    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Находим последнюю PENDING транзакцию
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: dbUser.id,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!transaction) {
      console.log('⚠️ No pending transaction found')
      return NextResponse.json(
        { error: 'No pending transaction found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found pending transaction:`, {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      metadata: transaction.metadata,
    })

    // Получаем operationId из metadata
    const metadata = transaction.metadata as any
    const operationId = metadata?.operationId

    if (!operationId) {
      console.error('❌ Transaction metadata missing operationId')
      return NextResponse.json(
        { error: 'Invalid transaction metadata' },
        { status: 400 }
      )
    }

    // Проверяем статус платежа через Tochka API
    console.log(`🔍 Checking payment status via Tochka API for operationId: ${operationId}`)
    const tochkaClient = createTochkaClient()

    let paymentInfo
    try {
      paymentInfo = await tochkaClient.getPaymentInfo(operationId)
    } catch (error) {
      console.error('❌ Failed to get payment info from Tochka:', error)
      return NextResponse.json(
        { error: 'Failed to verify payment status' },
        { status: 500 }
      )
    }

    console.log('📥 Tochka payment info:', paymentInfo)

    // Проверяем статус оплаты
    const paymentData = (paymentInfo as any)?.Data || paymentInfo
    const tochkaStatus = paymentData?.status
    if (tochkaStatus !== 'AUTHORIZED' && tochkaStatus !== 'CONFIRMED') {
      console.log(`⏳ Payment not yet completed. Status: ${tochkaStatus}`)
      return NextResponse.json(
        {
          error: 'Payment not completed',
          status: tochkaStatus
        },
        { status: 400 }
      )
    }

    console.log(`✅ Payment confirmed by Tochka with status: ${tochkaStatus}`)

    // Активируем транзакцию
    const now = new Date()
    const subscriptionEnd = new Date()
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1)

    if (transaction.type === 'SUBSCRIPTION') {
      const targetMode = metadata.targetMode as 'ADVANCED'

      await prisma.$transaction([
        // Обновляем транзакцию
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            updatedAt: now,
          },
        }),
        // Обновляем пользователя
        prisma.user.update({
          where: { id: dbUser.id },
          data: {
            appMode: targetMode,
            subscriptionEndsAt: subscriptionEnd,
            generationLimit: GENERATION_LIMITS[targetMode],
            monthlyGenerations: 0,
            lastResetDate: now,
          },
        }),
      ])

      console.log(`✅ Subscription activated: ${targetMode} until ${subscriptionEnd.toISOString()}`)

      return NextResponse.json({
        success: true,
        type: 'SUBSCRIPTION',
        targetMode,
        subscriptionEndsAt: subscriptionEnd,
      })

    } else if (transaction.type === 'BONUS_PACK') {
      await prisma.$transaction([
        // Обновляем транзакцию
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            updatedAt: now,
          },
        }),
        // Добавляем бонусные генерации
        prisma.user.update({
          where: { id: dbUser.id },
          data: {
            bonusGenerations: {
              increment: 30,
            },
          },
        }),
      ])

      console.log(`✅ Bonus pack activated: +30 generations`)

      return NextResponse.json({
        success: true,
        type: 'BONUS_PACK',
        bonusGenerations: 30,
      })
    }

    return NextResponse.json(
      { error: 'Unknown transaction type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error activating latest payment:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
