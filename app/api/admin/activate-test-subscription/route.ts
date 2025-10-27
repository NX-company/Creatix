import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // For testing: allow any authenticated user to activate test subscription
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - please login first' },
        { status: 401 }
      )
    }

    // Use current user's email if not provided
    const body = await request.json().catch(() => ({}))
    const email = body.email || session.user.email

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate subscription end date (30 days from now)
    const now = new Date()
    const subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Activate subscription and give 100 ADVANCED generations
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'active',
        subscriptionStartedAt: now,
        subscriptionEndsAt: subscriptionEnd,
        advancedGenerationsTotal: user.advancedGenerationsTotal + 100,
        advancedGenerationsRemaining: user.advancedGenerationsRemaining + 100,
        appMode: 'ADVANCED',
      }
    })

    console.log(`✅ Test subscription activated for ${email}`)
    console.log(`   Subscription expires: ${subscriptionEnd.toISOString()}`)
    console.log(`   Advanced generations: ${updatedUser.advancedGenerationsRemaining}/100`)

    return NextResponse.json({
      success: true,
      message: 'Test subscription activated',
      user: {
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
        advancedGenerationsTotal: updatedUser.advancedGenerationsTotal,
        advancedGenerationsRemaining: updatedUser.advancedGenerationsRemaining,
        appMode: updatedUser.appMode,
      }
    })

  } catch (error) {
    console.error('❌ Error activating test subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to activate test subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
