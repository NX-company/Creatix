import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { shouldResetGenerations } from '@/lib/generationLimits'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { lastResetDate: null },
          { lastResetDate: { lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
        ]
      },
      select: {
        id: true,
        email: true,
        lastResetDate: true,
      }
    })

    let resetCount = 0

    for (const user of users) {
      if (!user.lastResetDate || shouldResetGenerations(user.lastResetDate)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            monthlyGenerations: 0,
            bonusGenerations: 0,
            freeMonthlyGenerations: 0,
            advancedMonthlyGenerations: 0,
            lastResetDate: new Date(),
          },
        })
        resetCount++
      }
    }

    console.log(`✅ Reset generations for ${resetCount} users`)

    return NextResponse.json({
      success: true,
      resetCount,
      message: `Reset generations for ${resetCount} users`,
    })
  } catch (error) {
    console.error('Reset generations error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

