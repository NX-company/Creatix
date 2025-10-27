import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserAppMode() {
  try {
    console.log('🔧 Fixing user appMode...')

    // Update GUEST users to FREE
    const result = await prisma.user.updateMany({
      where: {
        role: 'USER',
        appMode: 'GUEST',
      },
      data: {
        appMode: 'FREE',
      },
    })

    console.log(`✅ Updated ${result.count} users from GUEST to FREE mode`)

    // Show all users
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        appMode: true,
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
      },
    })

    console.log('\n📊 Current users:')
    console.table(users)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserAppMode()
