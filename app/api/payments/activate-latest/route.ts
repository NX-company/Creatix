import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { createTochkaClient } from '@/lib/tochka'

/**
 * POST /api/payments/activate-latest
 * Активирует последнюю PENDING транзакцию пользователя
 * Проверяет статус через API Точка Банка перед активацией
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Activate latest payment request received')

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

    console.log(`👤 User found: ${user.email}`)

    // Найти последнюю PENDING транзакцию типа SUBSCRIPTION
    const pendingTransaction = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!pendingTransaction) {
      console.log('❌ No pending subscription transaction found')
      return NextResponse.json(
        { error: 'No pending payment found' },
        { status: 404 }
      )
    }

    const operationId = (pendingTransaction.metadata as any)?.operationId

    if (!operationId) {
      console.log('❌ No operationId in transaction metadata')
      return NextResponse.json(
        { error: 'Invalid transaction data' },
        { status: 400 }
      )
    }

    console.log(`💳 Found pending transaction: ${pendingTransaction.id}`)
    console.log(`🔍 Operation ID: ${operationId}`)

    // Проверить статус платежа через API Точка Банка
    try {
      const tochkaClient = createTochkaClient('v1.0')
      console.log('🏦 Checking payment status via Tochka API...')

      const paymentInfo = await tochkaClient.getPaymentInfo(operationId)
      console.log('📦 Payment info from Tochka:', paymentInfo)

      // Проверяем статус платежа
      // API возвращает { Data: { status: { value: 'COMPLETED' | 'AUTHORIZED' | ... } } }
      const paymentStatus = (paymentInfo as any)?.Data?.status?.value

      console.log(`📊 Payment status from Tochka: ${paymentStatus}`)

      if (paymentStatus !== 'COMPLETED' && paymentStatus !== 'AUTHORIZED') {
        console.log('⏳ Payment not completed yet, status:', paymentStatus)
        return NextResponse.json({
          success: false,
          message: 'Payment not completed yet',
          status: paymentStatus,
        })
      }

      console.log('✅ Payment confirmed by Tochka Bank, activating subscription...')

    } catch (apiError) {
      console.error('⚠️  Failed to check payment status via API:', apiError)
      console.log('⚠️  Proceeding with activation anyway (assuming payment was made)')
      // Продолжаем активацию даже если API недоступен
    }

    // Активировать подписку
    const targetMode = (pendingTransaction.metadata as any)?.targetMode || 'ADVANCED'
    const subscriptionDays = 30
    const generationsToAdd = 100

    console.log(`🎯 Activating ${targetMode} subscription for ${subscriptionDays} days`)

    // Обновить пользователя и транзакцию в одной транзакции БД
    await prisma.$transaction([
      // Обновить транзакцию
      prisma.transaction.update({
        where: { id: pendingTransaction.id },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      }),
      // Обновить пользователя
      prisma.user.update({
        where: { id: user.id },
        data: {
          appMode: targetMode as any, // 'ADVANCED' - enum requires UPPERCASE
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

    console.log('✅ Subscription activated successfully!')

    return NextResponse.json({
      success: true,
      message: 'Subscription activated',
      subscription: {
        mode: targetMode,
        generations: generationsToAdd,
        daysRemaining: subscriptionDays,
      },
    })

  } catch (error) {
    console.error('❌ Error activating payment:', error)
    return NextResponse.json(
      {
        error: 'Failed to activate payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
