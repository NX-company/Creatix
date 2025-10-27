import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

/**
 * GET /api/payments/activate-redirect
 * Server-Side Redirect endpoint для мгновенной активации подписки
 *
 * Вызывается Точка Банком после успешной оплаты
 * Мгновенно активирует подписку и редиректит пользователя на payment-success
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Server-side activation redirect received')

    // Получить сессию пользователя
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log('⚠️  No session found, redirecting to payment-success with error')
      return NextResponse.redirect(
        new URL('/payment-success?error=unauthorized', request.url)
      )
    }

    console.log(`👤 User: ${session.user.email}`)

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.redirect(
        new URL('/payment-success?error=user_not_found', request.url)
      )
    }

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
      console.log('⚠️  No pending transaction found, redirecting anyway')
      return NextResponse.redirect(
        new URL('/payment-success?error=no_pending', request.url)
      )
    }

    console.log(`💳 Found pending transaction: ${pendingTransaction.id}`)

    // Получить параметры подписки из metadata
    const metadata = pendingTransaction.metadata as any
    const targetMode = metadata?.targetMode || 'ADVANCED'
    const subscriptionDays = 30
    const generationsToAdd = 100

    console.log(`🎯 Activating ${targetMode} subscription...`)

    try {
      // МГНОВЕННАЯ АКТИВАЦИЯ: обновляем транзакцию и пользователя
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
            appMode: targetMode as any, // 'ADVANCED'
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
      console.log(`   User: ${user.email}`)
      console.log(`   Mode: ${targetMode}`)
      console.log(`   Generations: +${generationsToAdd}`)
      console.log(`   Duration: ${subscriptionDays} days`)

      // Редирект на payment-success с флагом успеха
      return NextResponse.redirect(
        new URL('/payment-success?activated=true&mode=ADVANCED', request.url)
      )

    } catch (activationError) {
      console.error('❌ Error activating subscription:', activationError)

      // Даже если активация не удалась, редиректим на success
      // Cron endpoint подхватит и активирует позже
      return NextResponse.redirect(
        new URL('/payment-success?pending=true', request.url)
      )
    }

  } catch (error) {
    console.error('❌ Critical error in activate-redirect:', error)

    // В любом случае редиректим на payment-success
    // Это лучше чем показывать ошибку 500
    return NextResponse.redirect(
      new URL('/payment-success?error=server', request.url)
    )
  }
}
