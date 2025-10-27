import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        subscriptionStatus: true,
        inpaintOperationsCount: true,
        advancedGenerationsRemaining: true,
        advancedGenerationsUsed: true,
        advancedGenerationsTotal: true,
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

    // Increment inpaint operations counter
    const newCount = user.inpaintOperationsCount + 1

    // Check if we need to consume a generation (every 5th operation)
    const shouldConsumeGeneration = newCount >= 5

    if (shouldConsumeGeneration) {
      // Determine which pool to use
      const useAdvanced =
        user.appMode === 'ADVANCED' &&
        user.subscriptionStatus === 'active' &&
        user.advancedGenerationsRemaining >= 1

      if (useAdvanced) {
        // Consume 1 advanced generation and reset counter
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            inpaintOperationsCount: 0,
            advancedGenerationsRemaining: {
              decrement: 1
            },
            advancedGenerationsUsed: {
              increment: 1
            }
          },
          select: {
            inpaintOperationsCount: true,
            advancedGenerationsRemaining: true,
            advancedGenerationsUsed: true,
            advancedGenerationsTotal: true,
          }
        })

        console.log(`✅ 5 inpaint operations completed, consumed 1 ADVANCED generation for ${session.user.email}`)
        console.log(`   Remaining: ${updatedUser.advancedGenerationsRemaining}/${updatedUser.advancedGenerationsTotal}`)

        return NextResponse.json({
          success: true,
          inpaintOperationsCount: updatedUser.inpaintOperationsCount,
          generationConsumed: true,
          type: 'advanced',
          generationsRemaining: updatedUser.advancedGenerationsRemaining,
          generationsTotal: updatedUser.advancedGenerationsTotal,
        })
      } else {
        // Try to consume from free generations
        if (user.freeGenerationsRemaining < 1) {
          return NextResponse.json(
            {
              error: 'Insufficient generations for inpaint operation',
              remaining: user.freeGenerationsRemaining,
            },
            { status: 400 }
          )
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            inpaintOperationsCount: 0,
            freeGenerationsRemaining: {
              decrement: 1
            },
            freeGenerationsUsed: {
              increment: 1
            }
          },
          select: {
            inpaintOperationsCount: true,
            freeGenerationsRemaining: true,
            freeGenerationsUsed: true,
          }
        })

        console.log(`✅ 5 inpaint operations completed, consumed 1 FREE generation for ${session.user.email}`)
        console.log(`   Remaining: ${updatedUser.freeGenerationsRemaining}/20`)

        return NextResponse.json({
          success: true,
          inpaintOperationsCount: updatedUser.inpaintOperationsCount,
          generationConsumed: true,
          type: 'free',
          generationsRemaining: updatedUser.freeGenerationsRemaining,
          generationsTotal: 20,
        })
      }
    } else {
      // Just increment counter, no generation consumed
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          inpaintOperationsCount: newCount
        },
        select: {
          inpaintOperationsCount: true,
          advancedGenerationsRemaining: true,
          advancedGenerationsTotal: true,
          freeGenerationsRemaining: true,
        }
      })

      console.log(`✅ Inpaint operation counted (${newCount}/5) for ${session.user.email}`)

      const useAdvanced = user.appMode === 'ADVANCED' && user.subscriptionStatus === 'active'

      return NextResponse.json({
        success: true,
        inpaintOperationsCount: updatedUser.inpaintOperationsCount,
        generationConsumed: false,
        type: useAdvanced ? 'advanced' : 'free',
        generationsRemaining: useAdvanced
          ? updatedUser.advancedGenerationsRemaining
          : updatedUser.freeGenerationsRemaining,
        generationsTotal: useAdvanced ? updatedUser.advancedGenerationsTotal : 20,
      })
    }

  } catch (error) {
    console.error('❌ Error consuming inpaint operation:', error)
    return NextResponse.json(
      {
        error: 'Failed to consume inpaint operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
