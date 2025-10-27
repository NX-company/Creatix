import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUser() {
  try {
    console.log('🔧 Updating user to FREE mode...')

    const updated = await prisma.user.update({
      where: { email: 'useneurox@gmail.com' },
      data: {
        appMode: 'FREE',
        freeGenerationsRemaining: 20,
        freeGenerationsUsed: 0,
      },
      select: {
        id: true,
        email: true,
        appMode: true,
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
      },
    })

    console.log('\n✅ User updated successfully:')
    console.table(updated)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUser()
