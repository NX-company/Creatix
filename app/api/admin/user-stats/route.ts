import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { verifyAdminFromNextAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    let admin = await verifyAdmin(request)
    if (!admin) {
      admin = await verifyAdminFromNextAuth()
    }

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Получаем статистику по API usage (считаем каждый вызов как генерацию)
    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
      prisma.apiUsage.count({
        where: {
          userId,
          createdAt: { gte: todayStart }
        }
      }),
      prisma.apiUsage.count({
        where: {
          userId,
          createdAt: { gte: weekStart }
        }
      }),
      prisma.apiUsage.count({
        where: {
          userId,
          createdAt: { gte: monthStart }
        }
      }),
      prisma.apiUsage.count({
        where: { userId }
      })
    ])

    return NextResponse.json({
      stats: {
        today: todayCount,
        week: weekCount,
        month: monthCount,
        total: totalCount
      }
    })
  } catch (error) {
    console.error('❌ Error fetching user stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
