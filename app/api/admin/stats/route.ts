import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true } })
    
    const usersByMode = await prisma.user.groupBy({
      by: ['appMode'],
      _count: true
    })

    const totalCosts = await prisma.apiUsage.aggregate({
      _sum: { cost: true }
    })

    const totalRevenue = await prisma.transaction.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    })

    const costsByProvider = await prisma.apiUsage.groupBy({
      by: ['provider'],
      _sum: { cost: true }
    })

    const totalProjects = await prisma.project.count()

    const recentApiUsage = await prisma.apiUsage.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        usersByMode,
        totalCosts: totalCosts._sum.cost || 0,
        totalRevenue: totalRevenue._sum.amount || 0,
        balance: (totalRevenue._sum.amount || 0) - (totalCosts._sum.cost || 0),
        costsByProvider,
        totalProjects,
        recentApiUsage
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Ошибка получения статистики' }, { status: 500 })
  }
}


