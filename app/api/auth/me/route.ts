import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Проверяем активна ли подписка
    const hasActiveSubscription = user.subscriptionEndsAt ? now < user.subscriptionEndsAt : false

    // НОВАЯ МОДЕЛЬ: Trial больше НЕ используется
    // FREE: 10 генераций/месяц (freeMonthlyGenerations)
    // ADVANCED: 80 генераций/месяц + купленные (advancedMonthlyGenerations + purchasedGenerations)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        appMode: user.appMode,
        isActive: user.isActive,
        generationLimit: user.generationLimit,
        freeMonthlyGenerations: user.freeMonthlyGenerations || 0,
        advancedMonthlyGenerations: user.advancedMonthlyGenerations || 0,
        purchasedGenerations: user.purchasedGenerations || 0,
        balance: user.balance || 0,
        autoRenewEnabled: user.autoRenewEnabled || false,
        subscriptionEndsAt: user.subscriptionEndsAt,
        subscriptionStartedAt: user.subscriptionStartedAt,
        hasActiveSubscription,
        // DEPRECATED: trial не используется
        isInTrial: false,
        trialDaysLeft: 0,
        trialGenerationsLeft: 0
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении данных пользователя' },
      { status: 500 }
    )
  }
}


