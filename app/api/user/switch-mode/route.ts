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
        trialEndsAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetMode = mode.toUpperCase()
    const now = new Date()
    const hasPaidSubscription = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now

    // В триале только если:
    // 1. НЕТ активной подписки
    // 2. trialEndsAt не истек
    // 3. appMode был FREE (не платный)
    const isInTrial = !hasPaidSubscription &&
                     user.trialEndsAt &&
                     new Date(user.trialEndsAt) > now &&
                     user.appMode === 'FREE'

    // PRO режим пока недоступен
    if (targetMode === 'PRO') {
      return NextResponse.json({
        error: 'PRO mode not available',
        message: 'PRO режим пока недоступен'
      }, { status: 403 })
    }

    // Платные пользователи и trial пользователи могут переключаться между FREE и ADVANCED
    // Обычные бесплатные пользователи (без trial) могут быть только в FREE
    if (!hasPaidSubscription && !isInTrial && targetMode !== 'FREE') {
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

    const userStatus = hasPaidSubscription ? 'PAID' : (isInTrial ? 'TRIAL' : 'FREE')
    console.log(`✅ Mode switched: ${user.appMode} → ${targetMode} for user ${session.user.email} [${userStatus}]`)

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

