import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, credits } = await request.json()

    if (!userId || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Обновляем бонусные генерации пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bonusGenerations: {
          increment: credits
        }
      }
    })

    console.log(`✅ Admin ${admin.username} added ${credits} generations to user ${userId}`)

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.bonusGenerations
    })
  } catch (error) {
    console.error('❌ Error adding credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
