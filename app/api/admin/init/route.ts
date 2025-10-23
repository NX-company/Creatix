import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Этот endpoint можно вызвать один раз для создания админа на продакшене
export async function POST(request: NextRequest) {
  try {
    // Проверяем секретный ключ для безопасности
    const { secret } = await request.json()
    
    if (secret !== process.env.ADMIN_INIT_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'useneurox@gmail.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin already exists',
        admin: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          role: existingAdmin.role
        }
      })
    }

    // Создаем админа
    const adminPassword = await bcrypt.hash('Lenalove123', 10)

    const admin = await prisma.user.create({
      data: {
        email: 'useneurox@gmail.com',
        username: 'admin',
        password: adminPassword,
        role: 'ADMIN',
        appMode: 'ADVANCED',
        isActive: true,
        name: 'Administrator'
      }
    })

    console.log('✅ Admin created:', admin.email)

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Admin init error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

