import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixAdminRole() {
  try {
    // Найти пользователя admin
    const admin = await prisma.user.findUnique({
      where: { email: 'useneurox@gmail.com' }
    })

    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }

    console.log('📋 Current admin:', {
      email: admin.email,
      username: admin.username,
      role: admin.role
    })

    // Обновить роль на ADMIN и пароль
    const hashedPassword = await bcrypt.hash('Lenalove123', 10)

    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: {
        role: 'ADMIN',
        username: 'admin',
        password: hashedPassword,
        appMode: 'PRO',
        isActive: true
      }
    })

    console.log('✅ Admin updated:', {
      email: updated.email,
      username: updated.username,
      role: updated.role
    })
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminRole()
