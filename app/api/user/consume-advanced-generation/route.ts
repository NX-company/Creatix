import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { count = 1 } = await request.json()

    if (count < 1) {
      return NextResponse.json(
        { error: 'Invalid generation count' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        subscriptionStatus: true,
        advancedGenerationsRemaining: true,
        advancedGenerationsUsed: true,
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Determine which pool to use
    const useAdvanced =
      user.appMode === 'ADVANCED' &&
      user.subscriptionStatus === 'active' &&
      user.advancedGenerationsRemaining >= count

    if (useAdvanced) {
      // Consume from advanced generations
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          advancedGenerationsRemaining: {
            decrement: count
          },
          advancedGenerationsUsed: {
            increment: count
          }
        },
        select: {
          advancedGenerationsRemaining: true,
          advancedGenerationsUsed: true,
          advancedGenerationsTotal: true,
        }
      })

      console.log(`✅ Consumed ${count} ADVANCED generation(s) for ${session.user.email}`)
      console.log(`   Remaining: ${updatedUser.advancedGenerationsRemaining}/${updatedUser.advancedGenerationsTotal}`)

      return NextResponse.json({
        success: true,
        consumed: count,
        type: 'advanced',
        remaining: updatedUser.advancedGenerationsRemaining,
        total: updatedUser.advancedGenerationsTotal,
        used: updatedUser.advancedGenerationsUsed,
      })
    } else {
      // Try to consume from free generations
      if (user.freeGenerationsRemaining < count) {
        return NextResponse.json(
          {
            error: 'Insufficient generations',
            remaining: user.freeGenerationsRemaining,
            required: count,
          },
          { status: 400 }
        )
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          freeGenerationsRemaining: {
            decrement: count
          },
          freeGenerationsUsed: {
            increment: count
          }
        },
        select: {
          freeGenerationsRemaining: true,
          freeGenerationsUsed: true,
        }
      })

      console.log(`✅ Consumed ${count} FREE generation(s) for ${session.user.email}`)
      console.log(`   Remaining: ${updatedUser.freeGenerationsRemaining}/20`)

      return NextResponse.json({
        success: true,
        consumed: count,
        type: 'free',
        remaining: updatedUser.freeGenerationsRemaining,
        total: 20,
        used: updatedUser.freeGenerationsUsed,
      })
    }

  } catch (error) {
    console.error('❌ Error consuming generation:', error)
    return NextResponse.json(
      {
        error: 'Failed to consume generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
