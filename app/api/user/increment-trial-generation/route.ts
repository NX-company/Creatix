import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

const TRIAL_LIMIT = 30

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        trialGenerations: true,
        trialEndsAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        trialGenerations: {
          increment: 1
        }
      },
      select: {
        trialGenerations: true,
        trialEndsAt: true
      }
    })

    const trialGenerationsLeft = Math.max(0, TRIAL_LIMIT - updatedUser.trialGenerations)

    console.log(`✅ Trial generation incremented for user ${user.id}: ${updatedUser.trialGenerations}/${TRIAL_LIMIT}, осталось: ${trialGenerationsLeft}`)

    return NextResponse.json({
      success: true,
      trialGenerations: updatedUser.trialGenerations,
      trialGenerationsLeft,
      trialLimit: TRIAL_LIMIT
    })
  } catch (error) {
    console.error('Increment trial generation error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении счетчика' },
      { status: 500 }
    )
  }
}

