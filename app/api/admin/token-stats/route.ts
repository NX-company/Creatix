import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_super_secret_jwt_key_min_32_characters_here_for_admin_panel_security'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        appMode: true,
        totalTokensUsed: true,
        totalApiCost: true,
        createdAt: true,
        _count: {
          select: {
            apiUsage: true,
          },
        },
      },
      orderBy: {
        totalTokensUsed: 'desc',
      },
    })

    const detailedStats = await Promise.all(
      users.map(async (user) => {
        const usageByProvider = await prisma.apiUsage.groupBy({
          by: ['provider', 'model'],
          where: { userId: user.id },
          _sum: {
            tokensUsed: true,
            cost: true,
          },
          _count: {
            id: true,
          },
        })

        const last7Days = await prisma.apiUsage.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            createdAt: true,
            tokensUsed: true,
            cost: true,
            provider: true,
            model: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        })

        return {
          ...user,
          usageByProvider,
          recentActivity: last7Days,
        }
      })
    )

    const totalStats = await prisma.user.aggregate({
      _sum: {
        totalTokensUsed: true,
        totalApiCost: true,
      },
    })

    return NextResponse.json({
      users: detailedStats,
      totals: {
        totalTokensUsed: totalStats._sum.totalTokensUsed || 0,
        totalApiCost: totalStats._sum.totalApiCost || 0,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching token stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

