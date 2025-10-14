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
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    })

    if (!session || session.expires < new Date()) {
      return null
    }

    return session.user
  } catch (error) {
    return null
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

export async function verifyAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return user
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { sessionToken: token },
  })
}


