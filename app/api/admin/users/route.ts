import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        appMode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            apiUsage: true,
            projects: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalCost = await prisma.apiUsage.aggregate({
          where: { userId: user.id },
          _sum: { cost: true }
        })

        const totalRevenue = await prisma.transaction.aggregate({
          where: { userId: user.id, status: 'completed' },
          _sum: { amount: true }
        })

        return {
          ...user,
          totalCost: totalCost._sum.cost || 0,
          totalRevenue: totalRevenue._sum.amount || 0,
          balance: (totalRevenue._sum.amount || 0) - (totalCost._sum.cost || 0)
        }
      })
    )

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Ошибка получения пользователей' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, username, password, role, appMode } = await req.json()

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role || 'USER',
        appMode: appMode || 'FREE'
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        appMode: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Ошибка создания пользователя' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId обязателен' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true, message: 'Пользователь удален' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Ошибка удаления пользователя' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, isActive, appMode, role } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId обязателен' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(appMode && { appMode }),
        ...(role && { role })
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        appMode: true,
        isActive: true
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Ошибка обновления пользователя' }, { status: 500 })
  }
}


