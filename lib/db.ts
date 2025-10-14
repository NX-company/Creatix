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
    await prisma.apiUsage.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        model: params.model,
        endpoint: params.endpoint,
        tokensUsed: params.tokensUsed || 0,
        cost: params.cost || 0
      }
    })
    console.log(`📊 API Usage logged: ${params.provider}/${params.model} - ${params.tokensUsed} tokens ($${params.cost?.toFixed(4)})`)
  } catch (error) {
    console.error('Failed to log API usage:', error)
  }
}


