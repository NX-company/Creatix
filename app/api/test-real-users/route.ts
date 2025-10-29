import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Raw SQL query bypassing Prisma models
    const result: any[] = await prisma.$queryRaw`
      SELECT id, email, username, "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `

    // Also get via Prisma to compare
    const prismaUsers = await prisma.user.findMany({
      select: { id: true, email: true, username: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      rawSQL: {
        total: result.length,
        users: result
      },
      prisma: {
        total: prismaUsers.length,
        users: prismaUsers
      },
      timestamp: new Date().toISOString(),
      match: result.length === prismaUsers.length
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
