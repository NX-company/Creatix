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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        appMode: true,
        isActive: true,
        trialEndsAt: true,
        trialGenerations: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const usersWithTrialStatus = users.map(user => ({
      ...user,
      isInTrial: user.trialEndsAt ? new Date(user.trialEndsAt) > new Date() : false,
      _count: {
        projects: user._count?.projects || 0,
        apiUsage: 0,
        transactions: 0
      },
      totalCost: 0,
      totalRevenue: 0,
      balance: 0
    }))

    return NextResponse.json({ users: usersWithTrialStatus })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    console.log(`✅ User deleted by admin: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
