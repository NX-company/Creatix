import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      email: 'admin@nxstudio.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      appMode: 'PRO',
      isActive: true
    }
  })

  console.log('✅ Created admin user:', admin.username)
  console.log('   Email: admin@nxstudio.com')
  console.log('   Password: admin123')
  console.log('   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!')

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


