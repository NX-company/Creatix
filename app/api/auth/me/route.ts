import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Используем NextAuth вместо JWT токенов
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Получаем полные данные пользователя из БД
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Возвращаем базовую информацию о пользователе
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        appMode: user.appMode,
        isActive: user.isActive,
        balance: user.balance || 0,
        subscriptionEndsAt: user.subscriptionEndsAt,
        freeGenerationsRemaining: user.freeGenerationsRemaining || 0,
        freeGenerationsUsed: user.freeGenerationsUsed || 0,
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


