import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Delete all old users except the new admin email
  try {
    await prisma.user.deleteMany({
      where: {
        AND: [
          { role: 'ADMIN' },
          { email: { not: 'useneurox@gmail.com' } }
        ]
      }
    })
    console.log('🗑️  Deleted old admin users')
  } catch (e) {
    console.log('No old admin users to delete')
  }

  const adminPassword = await bcrypt.hash('Lenalove123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'useneurox@gmail.com' },
    update: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      appMode: 'PRO',
      isActive: true,
      name: 'Administrator'
    },
    create: {
      email: 'useneurox@gmail.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      appMode: 'PRO',
      isActive: true,
      name: 'Administrator'
    }
  })

  console.log('✅ Created admin user:', admin.username)
  console.log('   Email: useneurox@gmail.com')
  console.log('   Password: Lenalove123')
  console.log('   ⚠️  Keep this password safe!')

  const modeSettings = await prisma.modeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      freeEnabled: true,
      advancedEnabled: true,
      proEnabled: true
    }
  })

  console.log('✅ Created mode settings')

  console.log('\n🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


