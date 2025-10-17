import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { createTochkaPayment } from '@/lib/tochka-payment'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, type, description } = await req.json()

    if (!amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: Number(amount),
        type,
        status: 'pending',
        description: description || `Оплата ${type}`,
      },
    })

    const paymentResponse = await createTochkaPayment({
      amount: Number(amount),
      orderId: transaction.id,
      description: description || `Оплата услуг Creatix`,
      customerEmail: user.email,
    })

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentId: paymentResponse.paymentId,
        paymentUrl: paymentResponse.paymentUrl,
        status: paymentResponse.status,
      },
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentId: paymentResponse.paymentId,
      paymentUrl: paymentResponse.paymentUrl,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

