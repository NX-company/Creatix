import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
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

    const trialGenerationsLeft = Math.max(0, 3 - updatedUser.trialGenerations)

    console.log(`✅ Trial generation incremented for user ${user.id}: ${updatedUser.trialGenerations}/3`)

    return NextResponse.json({
      success: true,
      trialGenerations: updatedUser.trialGenerations,
      trialGenerationsLeft
    })
  } catch (error) {
    console.error('Increment trial generation error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении счетчика' },
      { status: 500 }
    )
  }
}

