import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    })
    const totalProjects = await prisma.project.count()

    const apiUsageSum = await prisma.apiUsage.aggregate({
      _sum: {
        tokensUsed: true,
        cost: true
      }
    })

    const providerStats = await prisma.apiUsage.groupBy({
      by: ['provider'],
      _sum: {
        tokensUsed: true,
        cost: true
      },
      _count: {
        id: true
      }
    })

    const modelStats = await prisma.apiUsage.groupBy({
      by: ['model'],
      _sum: {
        tokensUsed: true,
        cost: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          cost: 'desc'
        }
      },
      take: 10
    })

    const topUsersBySpending = await prisma.apiUsage.groupBy({
      by: ['userId'],
      _sum: {
        tokensUsed: true,
        cost: true
      },
      orderBy: {
        _sum: {
          cost: 'desc'
        }
      },
      take: 10
    })

    const userIds = topUsersBySpending.map(u => u.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true }
    })

    const topUsers = topUsersBySpending.map(stat => {
      const user = users.find(u => u.id === stat.userId)
      return {
        userId: stat.userId,
        email: user?.email || 'Unknown',
        name: user?.name || 'Unknown',
        tokensUsed: stat._sum.tokensUsed || 0,
        cost: stat._sum.cost || 0
      }
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUsage = await prisma.apiUsage.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    const stats = {
      totalUsers,
      activeUsers,
      totalProjects,
      totalCosts: apiUsageSum._sum.cost || 0,
      totalTokens: apiUsageSum._sum.tokensUsed || 0,
      totalRevenue: 0,
      balance: 0 - (apiUsageSum._sum.cost || 0),
      providerStats,
      modelStats,
      topUsers,
      recentUsage: recentUsage.map(u => ({
        id: u.id,
        userEmail: u.user.email,
        userName: u.user.name,
        provider: u.provider,
        model: u.model,
        endpoint: u.endpoint,
        tokensUsed: u.tokensUsed,
        cost: u.cost,
        createdAt: u.createdAt
      }))
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
