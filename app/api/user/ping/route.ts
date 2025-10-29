import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update lastActive timestamp
    await prisma.user.update({
      where: { email: session.user.email },
      data: { lastActive: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating lastActive:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
