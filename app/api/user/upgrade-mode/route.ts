import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { getGenerationLimit, SUBSCRIPTION_PRICES } from '@/lib/generationLimits'
import { AppMode } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetMode } = await request.json()

    if (targetMode !== 'ADVANCED' && targetMode !== 'PRO') {
      return NextResponse.json({ error: 'Invalid target mode' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        monthlyGenerations: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newLimit = getGenerationLimit(targetMode as AppMode)
    const subscriptionEndsAt = new Date()
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        appMode: targetMode,
        generationLimit: newLimit,
        subscriptionEndsAt,
        monthlyGenerations: 0,
        lastResetDate: new Date(),
        // Завершаем trial период при апгрейде
        trialEndsAt: null,
        bonusGenerations: 0,
      },
    })

    const cost = targetMode === 'ADVANCED' 
      ? SUBSCRIPTION_PRICES.ADVANCED 
      : SUBSCRIPTION_PRICES.PRO

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: cost,
        type: 'SUBSCRIPTION',
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({
      success: true,
      newMode: updatedUser.appMode,
      newLimit: updatedUser.generationLimit,
      subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      cost,
    })
  } catch (error) {
    console.error('Upgrade mode error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

