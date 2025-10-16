import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { shouldResetGenerations, getNextResetDate, getGenerationLimit } from '@/lib/generationLimits'

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
        monthlyGenerations: true,
        generationLimit: true,
        bonusGenerations: true,
        freeMonthlyGenerations: true,
        advancedMonthlyGenerations: true,
        lastResetDate: true,
        subscriptionEndsAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Определяем текущий режим и выбираем соответствующий счетчик
    const currentMode = user.appMode.toLowerCase()
    const isFreeMode = currentMode === 'free'
    const isAdvancedMode = currentMode === 'advanced'
    
    // Initialize fields for users who don't have them yet
    if (user.generationLimit === null || user.generationLimit === undefined) {
      const defaultLimit = getGenerationLimit(user.appMode)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          generationLimit: defaultLimit,
          monthlyGenerations: 0,
          bonusGenerations: 0,
          freeMonthlyGenerations: 0,
          advancedMonthlyGenerations: 0,
          lastResetDate: new Date(),
        },
      })

      user.generationLimit = defaultLimit
      user.monthlyGenerations = 0
      user.bonusGenerations = 0
      user.freeMonthlyGenerations = 0
      user.advancedMonthlyGenerations = 0
      user.lastResetDate = new Date()
    }

    // Reset monthly generations if needed
    if (user.lastResetDate && shouldResetGenerations(user.lastResetDate)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          monthlyGenerations: 0,
          bonusGenerations: 0,
          freeMonthlyGenerations: 0,
          advancedMonthlyGenerations: 0,
          lastResetDate: new Date(),
        },
      })

      user.monthlyGenerations = 0
      user.bonusGenerations = 0
      user.freeMonthlyGenerations = 0
      user.advancedMonthlyGenerations = 0
    }

    // Выбираем счетчик в зависимости от текущего режима
    const currentMonthlyGenerations = isFreeMode 
      ? user.freeMonthlyGenerations 
      : isAdvancedMode 
        ? user.advancedMonthlyGenerations 
        : user.monthlyGenerations

    const availableGenerations =
      (user.generationLimit || 0) - (currentMonthlyGenerations || 0) + (user.bonusGenerations || 0)

    const nextResetDate = getNextResetDate()

    return NextResponse.json({
      appMode: user.appMode,
      monthlyGenerations: currentMonthlyGenerations,
      generationLimit: user.generationLimit,
      bonusGenerations: user.bonusGenerations,
      availableGenerations,
      nextResetDate,
      subscriptionEndsAt: user.subscriptionEndsAt,
      freeMonthlyGenerations: user.freeMonthlyGenerations,
      advancedMonthlyGenerations: user.advancedMonthlyGenerations,
    })
  } catch (error) {
    console.error('Get generations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

