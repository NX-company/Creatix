import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_0CS6NRBsDMeI@ep-red-silence-agh5gmzj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function main() {
  console.log('Checking database...')
  
  const users = await prisma.user.findMany()
  console.log('\nUsers in database:')
  console.log(JSON.stringify(users, null, 2))
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@nxstudio.com' }
  })
  
  if (admin) {
    console.log('\n✅ Admin user found!')
    console.log('Email:', admin.email)
    console.log('Username:', admin.username)
    console.log('Password hash length:', admin.password?.length || 0)
  } else {
    console.log('\n❌ Admin user NOT found!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

