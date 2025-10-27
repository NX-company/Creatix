import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user,
      calculated: {
        freeGenerationsTotal: (user.freeGenerationsRemaining || 0) + (user.freeGenerationsUsed || 0),
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

