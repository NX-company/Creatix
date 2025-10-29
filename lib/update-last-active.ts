import { prisma } from './db'

export async function updateLastActive(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    })
  } catch (error) {
    console.error('Error updating lastActive:', error)
  }
}
