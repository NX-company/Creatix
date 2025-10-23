import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        role: 'ADMIN'
      }
    })

    if (!user) {
      console.log('❌ Admin user not found:', username)
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    if (!user.password) {
      console.log('❌ Admin has no password set:', username)
      return NextResponse.json(
        { error: 'Ошибка конфигурации пользователя' },
        { status: 500 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin:', username)
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    console.log('✅ Admin login successful:', user.username)

    const token = await generateToken(user.id, user.role)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Disabled for HTTP access (enable after setting up HTTPS)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера при входе' },
      { status: 500 }
    )
  }
}

