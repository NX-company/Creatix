import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'useneurox@gmail.com' },
      select: {
        id: true,
        email: true,
        username: true,
        appMode: true,
        freeGenerationsRemaining: true,
        freeGenerationsUsed: true,
        role: true,
      },
    })

    console.log('\n📊 Current user data:')
    console.table(user)

    if (user && user.freeGenerationsRemaining === 0) {
      console.log('\n🔧 Fixing free generations...')
      const updated = await prisma.user.update({
        where: { email: 'useneurox@gmail.com' },
        data: {
          freeGenerationsRemaining: 20,
          freeGenerationsUsed: 0,
        },
        select: {
          freeGenerationsRemaining: true,
          freeGenerationsUsed: true,
        },
      })
      console.log('✅ Updated generations:', updated)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
