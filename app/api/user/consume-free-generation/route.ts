import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
        appMode: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем что это FREE пользователь
    if (user.appMode !== 'FREE') {
      return NextResponse.json(
        { error: 'Эта функция только для FREE пользователей' },
        { status: 403 }
      )
    }

    // Проверяем что есть оставшиеся генерации
    if (user.freeGenerationsRemaining <= 0) {
      return NextResponse.json(
        {
          error: 'Бесплатные генерации исчерпаны',
          remaining: 0,
          used: user.freeGenerationsUsed
        },
        { status: 403 }
      )
    }

    // Списываем генерацию
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        freeGenerationsRemaining: user.freeGenerationsRemaining - 1,
        freeGenerationsUsed: user.freeGenerationsUsed + 1,
      },
      select: {
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
      }
    })

    console.log(`✅ Free generation consumed for user ${user.id}. Remaining: ${updatedUser.freeGenerationsRemaining}`)

    return NextResponse.json({
      success: true,
      remaining: updatedUser.freeGenerationsRemaining,
      used: updatedUser.freeGenerationsUsed,
    })
  } catch (error) {
    console.error('Consume generation error:', error)
    return NextResponse.json(
      { error: 'Ошибка при списании генерации' },
      { status: 500 }
    )
  }
}
