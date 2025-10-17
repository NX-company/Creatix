import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function logApiUsage(params: {
  userId: string
  provider: string
  model: string
  endpoint: string
  tokensUsed?: number
  cost?: number
}) {
  try {
    const tokensUsed = params.tokensUsed || 0
    const cost = params.cost || 0

    await prisma.$transaction([
      prisma.apiUsage.create({
        data: {
          userId: params.userId,
          provider: params.provider,
          model: params.model,
          endpoint: params.endpoint,
          tokensUsed: tokensUsed,
          cost: cost
        }
      }),
      prisma.user.update({
        where: { id: params.userId },
        data: {
          totalTokensUsed: { increment: tokensUsed },
          totalApiCost: { increment: cost },
        },
      }),
    ])

    console.log(`📊 API Usage logged: ${params.provider}/${params.model} - ${tokensUsed} tokens ($${cost.toFixed(4)}) for user ${params.userId}`)
  } catch (error) {
    console.error('❌ Failed to log API usage:', error)
  }
}


