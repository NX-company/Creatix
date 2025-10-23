import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json()

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 6 символов' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email или логином уже существует' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Новая модель: сразу FREE режим с 10 генерациями/месяц
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        appMode: 'FREE',
        generationLimit: 10,
        monthlyGenerations: 0,
        freeMonthlyGenerations: 0,
        advancedMonthlyGenerations: 0,
        bonusGenerations: 0,
        lastResetDate: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        appMode: true,
        generationLimit: true,
        monthlyGenerations: true,
        freeMonthlyGenerations: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      {
        message: 'Регистрация успешна!',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}


