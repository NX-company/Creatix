import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if subscription has expired
    let subscriptionStatus = (user as any).subscriptionStatus || 'none'
    if (subscriptionStatus === 'active' && (user as any).subscriptionEndsAt) {
      const now = new Date()
      if ((user as any).subscriptionEndsAt < now) {
        subscriptionStatus = 'expired'
      }
    }

    return NextResponse.json({
      subscriptionStatus,
      subscriptionEndsAt: (user as any).subscriptionEndsAt || null,
      subscriptionStartedAt: (user as any).subscriptionStartedAt || null,
      appMode: user.appMode,
      advancedGenerationsTotal: (user as any).advancedGenerationsTotal || 0,
      advancedGenerationsRemaining: (user as any).advancedGenerationsRemaining || 0,
      advancedGenerationsUsed: (user as any).advancedGenerationsUsed || 0,
      inpaintOperationsCount: (user as any).inpaintOperationsCount || 0,
      freeGenerationsRemaining: user.freeGenerationsRemaining,
      freeGenerationsUsed: user.freeGenerationsUsed,
    })

  } catch (error) {
    console.error('❌ Error getting subscription status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
