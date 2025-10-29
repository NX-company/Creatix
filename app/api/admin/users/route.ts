import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/admin/users] Начало запроса')
    const token = request.cookies.get('auth-token')?.value
    console.log('🔍 [GET /api/admin/users] Token:', token ? `${token.substring(0, 20)}...` : 'НЕТ ТОКЕНА')

    const admin = await verifyAdmin(request)
    console.log('🔍 [GET /api/admin/users] Admin:', admin ? `ID: ${admin.id}, Role: ${admin.role}` : 'НЕТ АДМИНА')

    if (!admin) {
      console.log('❌ [GET /api/admin/users] Unauthorized - нет админа')
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
        balance: true,
        subscriptionEndsAt: true,
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

    console.log(`✅ [GET /api/admin/users] Найдено пользователей: ${users.length}`)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('❌ [GET /api/admin/users] Users fetch error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, username, password, appMode } = await request.json()

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        appMode: appMode || 'FREE',
        role: 'USER',
        isActive: true
      }
    })

    console.log(`✅ User created by admin: ${newUser.email}`)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        appMode: newUser.appMode
      }
    })
  } catch (error) {
    console.error('User create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId, isActive } = await request.json()

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid parameters' },
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
        { error: 'Cannot modify admin users' },
        { status: 403 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    })

    console.log(`✅ User ${user.email} ${isActive ? 'activated' : 'deactivated'} by admin`)

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
