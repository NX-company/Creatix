import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'

/**
 * POST /api/user/check-pending-payment
 *
 * Автоматическая проверка PENDING платежей пользователя при входе в приложение
 *
 * Это третий уровень защиты (после webhook и cron):
 * - Проверяет есть ли у пользователя PENDING транзакции старше 2 минут
 * - Если есть - проверяет статус через API Точка Банка
 * - Если оплачено - активирует подписку
 *
 * Вызывается автоматически при каждом входе/обновлении страницы
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Проверить есть ли PENDING транзакции старше 2 минут
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)

    const pendingTransaction = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        createdAt: {
          lt: twoMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Если нет pending транзакций - всё ок
    if (!pendingTransaction) {
      return NextResponse.json({
        hasPendingPayment: false,
        message: 'No pending payments',
      })
    }

    const operationId = (pendingTransaction.metadata as any)?.operationId

    if (!operationId) {
      console.log(`⚠️ Transaction ${pendingTransaction.id} has no operationId`)
      return NextResponse.json({
        hasPendingPayment: true,
        cannotActivate: true,
        message: 'Transaction missing operationId',
      })
    }

    console.log(`🔍 [Auto-check] Found pending transaction for ${user.email}, checking status...`)

    try {
      // Проверить статус платежа через API Точка Банка
      const tochkaClient = createTochkaClient('v1.0')
      const paymentInfo = await tochkaClient.getPaymentInfo(operationId)
      const paymentStatus = (paymentInfo as any)?.Data?.status?.value

      console.log(`📊 [Auto-check] Payment ${operationId} status: ${paymentStatus}`)

      if (paymentStatus === 'COMPLETED' || paymentStatus === 'AUTHORIZED') {
        // Платёж успешен - активировать подписку
        console.log(`✅ [Auto-check] Activating subscription for ${user.email}`)

        const metadata = pendingTransaction.metadata as any
        const targetMode = metadata?.targetMode || 'ADVANCED'
        const subscriptionDays = 30
        const generationsToAdd = 100

        // Обновить транзакцию и пользователя
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: pendingTransaction.id },
            data: {
              status: 'COMPLETED',
              updatedAt: new Date(),
            },
          }),
          prisma.user.update({
            where: { id: user.id },
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

        console.log(`✅ [Auto-check] Subscription activated for ${user.email}`)

        return NextResponse.json({
          success: true,
          activated: true,
          subscription: {
            mode: targetMode,
            generations: generationsToAdd,
            daysRemaining: subscriptionDays,
          },
          message: 'Payment confirmed and subscription activated!',
        })

      } else if (paymentStatus === 'DECLINED' || paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED') {
        // Платёж отклонён
        console.log(`❌ [Auto-check] Payment ${operationId} failed: ${paymentStatus}`)

        await prisma.transaction.update({
          where: { id: pendingTransaction.id },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        })

        return NextResponse.json({
          hasPendingPayment: true,
          failed: true,
          paymentStatus,
          message: 'Payment was declined or cancelled',
        })

      } else {
        // Ещё в процессе
        console.log(`⏳ [Auto-check] Payment ${operationId} still processing: ${paymentStatus}`)

        return NextResponse.json({
          hasPendingPayment: true,
          processing: true,
          paymentStatus,
          message: 'Payment is still being processed',
        })
      }

    } catch (error) {
      console.error(`❌ [Auto-check] Error checking payment status:`, error)

      return NextResponse.json({
        hasPendingPayment: true,
        error: 'Could not check payment status',
        message: 'Please wait or contact support',
      })
    }

  } catch (error) {
    console.error('❌ [Auto-check] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check pending payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
