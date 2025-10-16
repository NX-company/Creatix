import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mode } = await request.json()

    if (!mode || !['FREE', 'ADVANCED', 'PRO'].includes(mode.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        subscriptionEndsAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Проверяем, имеет ли пользователь право переключаться на выбранный режим
    const targetMode = mode.toUpperCase()
    const hasPaidSubscription = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date()

    // Платные пользователи могут свободно переключаться между FREE и ADVANCED
    // Бесплатные пользователи могут быть только в FREE
    if (!hasPaidSubscription && targetMode !== 'FREE') {
      return NextResponse.json({ 
        error: 'Subscription required',
        message: 'Требуется активная подписка для переключения на этот режим' 
      }, { status: 403 })
    }

    // Обновляем режим в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: {
        appMode: targetMode,
      },
    })

    console.log(`✅ Mode switched: ${user.appMode} → ${targetMode} for user ${session.user.email}`)

    return NextResponse.json({
      success: true,
      mode: targetMode,
    })
  } catch (error) {
    console.error('Switch mode error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

