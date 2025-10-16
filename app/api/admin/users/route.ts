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
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const usersWithTrialStatus = users.map(user => ({
      ...user,
      isInTrial: user.trialEndsAt ? new Date(user.trialEndsAt) > new Date() : false,
      _count: {
        projects: user._count?.projects || 0,
        apiUsage: 0
      },
      totalCost: 0
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
