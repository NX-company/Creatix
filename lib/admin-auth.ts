import { prisma } from './db'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'

// For API routes (Node.js runtime, can use getServerSession)
export async function verifyAdminFromNextAuth() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return null
    }

    console.log('✅ [verifyAdminFromNextAuth] NextAuth admin:', dbUser.email)
    return dbUser
  } catch (error) {
    console.log('❌ [verifyAdminFromNextAuth] Error:', error)
    return null
  }
}
