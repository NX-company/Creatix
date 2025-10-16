import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        appMode: true,
        isActive: true,
        trialEndsAt: true,
        trialGenerations: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const usersWithTrialStatus = users.map(user => ({
      ...user,
      isInTrial: user.trialEndsAt ? new Date(user.trialEndsAt) > new Date() : false
    }))

    return NextResponse.json({ users: usersWithTrialStatus })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
