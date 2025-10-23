import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

/**
 * POST /api/balance/buy-generations
 * Покупка дополнительных генераций с баланса (15₽/генерация)
 * Доступно только при активной подписке ADVANCED
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count } = await request.json()

    if (!count || count <= 0) {
      return NextResponse.json({ error: 'Invalid count' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        balance: true,
        purchasedGenerations: true,
        subscriptionEndsAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Проверка режима
    if (user.appMode !== 'ADVANCED') {
      return NextResponse.json(
        {
          error: 'Покупка генераций доступна только в режиме ADVANCED',
          message: 'Купите подписку ADVANCED для доступа к этой функции',
        },
        { status: 403 }
      )
    }

    // Проверка активности подписки
    const now = new Date()
    if (!user.subscriptionEndsAt || user.subscriptionEndsAt < now) {
      return NextResponse.json(
        {
          error: 'Подписка истекла',
          message: 'Продлите подписку ADVANCED для покупки генераций',
          subscriptionExpired: true,
        },
        { status: 403 }
      )
    }

    // Проверка баланса (15₽ за генерацию)
    const pricePerGeneration = 15
    const totalCost = count * pricePerGeneration

    if (user.balance < totalCost) {
      return NextResponse.json(
        {
          error: 'Недостаточно средств',
          required: totalCost,
          available: user.balance,
          message: `Требуется ${totalCost}₽, доступно ${user.balance}₽`,
        },
        { status: 403 }
      )
    }

    // Списание с баланса и добавление генераций
    const newBalance = user.balance - totalCost
    const newPurchasedGenerations = user.purchasedGenerations + count

    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: newBalance,
        purchasedGenerations: newPurchasedGenerations,
      },
    })

    console.log(
      `💳 [BUY GENERATIONS] User ${session.user.email} bought ${count} generations for ${totalCost}₽. Balance: ${user.balance}₽ → ${newBalance}₽, Purchased: ${user.purchasedGenerations} → ${newPurchasedGenerations}`
    )

    return NextResponse.json({
      success: true,
      count,
      totalCost,
      newBalance,
      newPurchasedGenerations,
      pricePerGeneration,
    })
  } catch (error) {
    console.error('Buy generations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
