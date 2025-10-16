import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        appMode: true,
        trialEndsAt: true,
        trialGenerations: true,
        monthlyGenerations: true,
        generationLimit: true,
        bonusGenerations: true,
        lastResetDate: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const isInTrial = user.trialEndsAt ? user.trialEndsAt > now : false
    const trialDaysLeft = user.trialEndsAt
      ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    return NextResponse.json({
      user,
      calculated: {
        isInTrial,
        trialDaysLeft,
        trialGenerationsLeft: Math.max(0, 30 - user.trialGenerations),
        availableMonthlyGenerations: Math.max(0, user.generationLimit - user.monthlyGenerations + user.bonusGenerations)
      }
    })
  } catch (error) {
    console.error('Check user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

