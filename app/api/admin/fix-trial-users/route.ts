import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all users with trialEndsAt = null and trialGenerations < 30
    const usersToFix = await prisma.user.findMany({
      where: {
        OR: [
          { trialEndsAt: null },
          { trialEndsAt: { lt: new Date() } }
        ],
        trialGenerations: { lt: 30 },
        appMode: 'FREE'
      }
    })

    console.log(`Found ${usersToFix.length} users to fix`)

    let updatedCount = 0

    for (const user of usersToFix) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 3)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          trialEndsAt,
          trialGenerations: 0
        }
      })

      updatedCount++
      console.log(`✅ Updated user ${user.email}: trial set to ${trialEndsAt}`)
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} users`,
      updatedCount
    })
  } catch (error) {
    console.error('Fix trial users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

