import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/payments/check-status?operationId=xxx
 * Проверяет статус транзакции по operationId
 *
 * Используется для polling на странице payment-success
 * чтобы показать пользователю когда платёж активировался
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const operationId = searchParams.get('operationId')

    if (!operationId) {
      return NextResponse.json(
        { error: 'operationId is required' },
        { status: 400 }
      )
    }

    // Ищем транзакцию по operationId
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          path: ['operationId'],
          equals: operationId,
        },
      },
      select: {
        id: true,
        status: true,
        type: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        {
          found: false,
          message: 'Transaction not found',
        },
        { status: 404 }
      )
    }

    // Возвращаем статус транзакции
    return NextResponse.json({
      found: true,
      transaction: {
        id: transaction.id,
        status: transaction.status, // PENDING, COMPLETED, FAILED
        type: transaction.type,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    })

  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
