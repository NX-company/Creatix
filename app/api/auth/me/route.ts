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
    const isInTrial = user.trialEndsAt ? now < user.trialEndsAt : false
    const trialDaysLeft = user.trialEndsAt 
      ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
    const trialGenerationsLeft = Math.max(0, 3 - (user.trialGenerations || 0))

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        appMode: user.appMode,
        isActive: user.isActive,
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


