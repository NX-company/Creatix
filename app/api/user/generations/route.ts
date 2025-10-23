import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { shouldResetGenerations, getNextResetDate } from '@/lib/generationLimits'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        freeMonthlyGenerations: true,
        advancedMonthlyGenerations: true,
        purchasedGenerations: true,
        generationLimit: true,
        balance: true,
        autoRenewEnabled: true,
        subscriptionEndsAt: true,
        subscriptionStartedAt: true,
        lastResetDate: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isFreeMode = user.appMode === 'FREE'
    const isAdvancedMode = user.appMode === 'ADVANCED'

    // Сброс FREE генераций если прошел месяц
    if (isFreeMode && user.lastResetDate && shouldResetGenerations(user.lastResetDate)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          freeMonthlyGenerations: 0,
          lastResetDate: new Date(),
        },
      })
      user.freeMonthlyGenerations = 0
    }

    // === FREE РЕЖИМ ===
    if (isFreeMode) {
      const availableGenerations = 10 - user.freeMonthlyGenerations
      const nextResetDate = getNextResetDate()

      console.log(
        `📊 [FREE] Mode check: used=${user.freeMonthlyGenerations}/10, available=${availableGenerations}`
      )

      return NextResponse.json({
        appMode: 'FREE',
        freeMonthlyGenerations: user.freeMonthlyGenerations,
        generationLimit: 10,
        availableGenerations,
        balance: user.balance,
        nextResetDate,
        subscriptionActive: false,
      })
    }

    // === ADVANCED РЕЖИМ ===
    if (isAdvancedMode) {
      const now = new Date()
      const subscriptionActive = user.subscriptionEndsAt ? user.subscriptionEndsAt > now : false

      const usedFromSubscription = user.advancedMonthlyGenerations
      const availableFromSubscription = 80 - usedFromSubscription
      const availablePurchased = user.purchasedGenerations
      const totalAvailable = subscriptionActive
        ? availableFromSubscription + availablePurchased
        : 0 // Если подписка неактивна, генерации недоступны

      console.log(
        `📊 [ADVANCED] Mode check: subscription=${usedFromSubscription}/80, purchased=${availablePurchased.toFixed(1)}, available=${totalAvailable.toFixed(1)}, active=${subscriptionActive}`
      )

      return NextResponse.json({
        appMode: 'ADVANCED',
        advancedMonthlyGenerations: usedFromSubscription,
        purchasedGenerations: availablePurchased,
        generationLimit: 80,
        availableGenerations: totalAvailable,
        availableFromSubscription,
        availablePurchased,
        balance: user.balance,
        autoRenewEnabled: user.autoRenewEnabled,
        subscriptionActive,
        subscriptionEndsAt: user.subscriptionEndsAt,
        subscriptionStartedAt: user.subscriptionStartedAt,
      })
    }

    // Fallback
    return NextResponse.json({ error: 'Invalid app mode' }, { status: 400 })
  } catch (error) {
    console.error('Get generations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
