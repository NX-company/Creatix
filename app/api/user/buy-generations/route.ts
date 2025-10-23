import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { BONUS_PACK_GENERATIONS, BONUS_PACK_PRICE } from '@/lib/generationLimits'

export async function POST(request: NextRequest) {
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
        bonusGenerations: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.appMode !== 'ADVANCED') {
      return NextResponse.json(
        { error: 'Only ADVANCED users can buy generation packs' },
        { status: 403 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        bonusGenerations: user.bonusGenerations + BONUS_PACK_GENERATIONS,
      },
    })

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: BONUS_PACK_PRICE,
        type: 'BONUS_PACK',
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({
      success: true,
      newBonusGenerations: updatedUser.bonusGenerations,
      addedGenerations: BONUS_PACK_GENERATIONS,
      cost: BONUS_PACK_PRICE,
    })
  } catch (error) {
    console.error('Buy generations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

