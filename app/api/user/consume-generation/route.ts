import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { shouldResetGenerations, calculateGenerationCost, canUserGenerate } from '@/lib/generationLimits'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageCount = 10 } = await request.json()

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
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Определяем текущий режим и выбираем соответствующий счетчик
    const currentMode = user.appMode.toLowerCase()
    const isFreeMode = currentMode === 'free'
    const isAdvancedMode = currentMode === 'advanced'
    
    let currentMonthlyGenerations = isFreeMode 
      ? user.freeMonthlyGenerations 
      : isAdvancedMode 
        ? user.advancedMonthlyGenerations 
        : user.monthlyGenerations
    
    let currentBonusGenerations = user.bonusGenerations

    if (user.lastResetDate && shouldResetGenerations(user.lastResetDate)) {
      currentMonthlyGenerations = 0
      currentBonusGenerations = 0
    }

    const { canGenerate, neededGenerations, availableGenerations } = canUserGenerate(
      currentMonthlyGenerations,
      user.generationLimit,
      currentBonusGenerations,
      imageCount
    )

    if (!canGenerate) {
      return NextResponse.json(
        {
          error: 'Insufficient generations',
          neededGenerations,
          availableGenerations,
        },
        { status: 403 }
      )
    }

    let newMonthlyGenerations = currentMonthlyGenerations
    let newBonusGenerations = currentBonusGenerations
    let generationsFromMonthly = 0
    let generationsFromBonus = 0

    const availableFromMonthly = user.generationLimit - currentMonthlyGenerations
    if (availableFromMonthly >= neededGenerations) {
      generationsFromMonthly = neededGenerations
      newMonthlyGenerations += neededGenerations
    } else {
      generationsFromMonthly = availableFromMonthly
      generationsFromBonus = neededGenerations - availableFromMonthly
      newMonthlyGenerations = user.generationLimit
      newBonusGenerations -= generationsFromBonus
    }

    // Обновляем нужный счетчик в зависимости от режима
    const updateData: any = {
      bonusGenerations: newBonusGenerations,
      lastResetDate: user.lastResetDate || new Date(),
    }
    
    if (isFreeMode) {
      updateData.freeMonthlyGenerations = newMonthlyGenerations
    } else if (isAdvancedMode) {
      updateData.advancedMonthlyGenerations = newMonthlyGenerations
    } else {
      updateData.monthlyGenerations = newMonthlyGenerations
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    })

    const costInfo = calculateGenerationCost(imageCount)

    return NextResponse.json({
      success: true,
      consumedGenerations: neededGenerations,
      generationsFromMonthly,
      generationsFromBonus,
      remainingGenerations: user.generationLimit - newMonthlyGenerations + newBonusGenerations,
      costInfo,
    })
  } catch (error) {
    console.error('Consume generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

