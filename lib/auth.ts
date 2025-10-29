import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { prisma } from './db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-this-in-production-min-32-chars'
)

export async function generateToken(userId: string, role: string): Promise<string> {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expires,
    },
  })

  return token
}

export async function verifyTokenForMiddleware(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      id: payload.userId as string,
      role: payload.role as string,
    }
  } catch (error) {
    return null
  }
}

export async function verifyToken(token: string) {
  try {
    console.log('🔍 [verifyToken] Проверка токена:', token.substring(0, 20) + '...')
    const { payload } = await jwtVerify(token, JWT_SECRET)
    console.log('✅ [verifyToken] JWT валиден, payload:', payload)

    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    })

    console.log('🔍 [verifyToken] Сессия из БД:', session ? `Найдена, expires: ${session.expires}` : 'НЕ НАЙДЕНА')

    if (!session || session.expires < new Date()) {
      console.log('❌ [verifyToken] Сессия невалидна или истекла')
      return null
    }

    console.log('✅ [verifyToken] Пользователь:', session.user.email, 'Role:', session.user.role)
    return session.user
  } catch (error) {
    console.log('❌ [verifyToken] Ошибка:', error)
    return null
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  console.log('🔍 [getUserFromRequest] Token из cookies:', token ? `${token.substring(0, 20)}...` : 'НЕТ')

  if (!token) {
    console.log('❌ [getUserFromRequest] Токен отсутствует')
    return null
  }

  return await verifyToken(token)
}

export async function verifyAdmin(req: NextRequest) {
  // Сначала пробуем кастомный токен (для admin API)
  const user = await getUserFromRequest(req)
  if (user && user.role === 'ADMIN') {
    return user
  }

  // Затем пробуем NextAuth токен
  try {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('./auth-options')
    const session = await getServerSession(authOptions)

    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (dbUser && dbUser.role === 'ADMIN') {
        console.log('✅ [verifyAdmin] NextAuth admin:', dbUser.email)
        return dbUser
      }
    }
  } catch (error) {
    console.log('❌ [verifyAdmin] NextAuth error:', error)
  }

  return null
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { sessionToken: token },
  })
}


