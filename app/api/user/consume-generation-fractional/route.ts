import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

/**
 * POST /api/user/consume-generation-fractional
 * Списывает дробное количество генераций (например, 0.1, 0.3, 1.5)
 * Используется для замены изображений: 1 изображение = 0.1 генерации
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, reason } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
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
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentMode = user.appMode.toLowerCase()
    const isFreeMode = currentMode === 'free'
    const isAdvancedMode = currentMode === 'advanced'

    let currentMonthlyGenerations = isFreeMode
      ? user.freeMonthlyGenerations
      : isAdvancedMode
        ? user.advancedMonthlyGenerations
        : user.monthlyGenerations

    let currentBonusGenerations = user.bonusGenerations

    // Проверяем, хватает ли генераций
    const availableFromMonthly = user.generationLimit - currentMonthlyGenerations
    const totalAvailable = availableFromMonthly + currentBonusGenerations

    if (totalAvailable < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient generations',
          needed: amount,
          available: totalAvailable,
        },
        { status: 403 }
      )
    }

    // Списываем генерации (сначала из месячных, потом из бонусных)
    let newMonthlyGenerations = currentMonthlyGenerations
    let newBonusGenerations = currentBonusGenerations

    if (availableFromMonthly >= amount) {
      newMonthlyGenerations += amount
    } else {
      const fromMonthly = availableFromMonthly
      const fromBonus = amount - fromMonthly
      newMonthlyGenerations = user.generationLimit
      newBonusGenerations -= fromBonus
    }

    const updateData: any = {
      bonusGenerations: newBonusGenerations,
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

    const remaining = user.generationLimit - newMonthlyGenerations + newBonusGenerations

    console.log(`💰 Consumed ${amount} generations: ${reason || 'N/A'}. Remaining: ${remaining}`)

    return NextResponse.json({
      success: true,
      consumed: amount,
      remainingGenerations: remaining,
      fromMonthly: Math.min(amount, availableFromMonthly),
      fromBonus: Math.max(0, amount - availableFromMonthly),
    })
  } catch (error) {
    console.error('Consume fractional generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
