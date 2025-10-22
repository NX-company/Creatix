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

    // В trial только если:
    // 1. Trial не закончился
    // 2. И НЕТ активной подписки
    // 3. И режим FREE (не ADVANCED/PRO)
    const isInTrial = !hasActiveSubscription &&
                      user.trialEndsAt &&
                      now < user.trialEndsAt &&
                      user.appMode === 'FREE'

    const trialDaysLeft = user.trialEndsAt && isInTrial
      ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
    const trialGenerationsLeft = isInTrial
      ? Math.max(0, 30 - (user.trialGenerations || 0))
      : 0

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        appMode: user.appMode,
        isActive: user.isActive,
        generationLimit: user.generationLimit,
        monthlyGenerations: user.monthlyGenerations || 0,
        bonusGenerations: user.bonusGenerations || 0,
        subscriptionEndsAt: user.subscriptionEndsAt,
        hasActiveSubscription,
        trialEndsAt: user.trialEndsAt,
        trialGenerations: user.trialGenerations || 0,
        isInTrial,
        trialDaysLeft,
        trialGenerationsLeft
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


