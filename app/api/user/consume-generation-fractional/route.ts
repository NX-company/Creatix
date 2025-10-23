import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

/**
 * POST /api/user/consume-generation-fractional
 * Списывает дробное количество генераций (например, 0.1, 0.3, 1.5)
 * Используется для замены изображений: 1 изображение = 0.1 генерации
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, reason } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        freeMonthlyGenerations: true,
        advancedMonthlyGenerations: true,
        purchasedGenerations: true,
        generationLimit: true,
        subscriptionEndsAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const isFreeMode = user.appMode === 'FREE'
    const isAdvancedMode = user.appMode === 'ADVANCED'

    // === FREE РЕЖИМ ===
    if (isFreeMode) {
      // В FREE режиме замена изображений НЕ поддерживается (нет изображений вообще)
      return NextResponse.json(
        {
          error: 'Замена изображений недоступна в FREE режиме',
          message: 'Купите подписку ADVANCED для работы с изображениями',
        },
        { status: 403 }
      )
    }

    // === ADVANCED РЕЖИМ ===
    if (isAdvancedMode) {
      // Проверка активности подписки
      if (!user.subscriptionEndsAt || user.subscriptionEndsAt < now) {
        return NextResponse.json(
          {
            error: 'Подписка ADVANCED истекла',
            message: 'Продлите подписку для продолжения работы',
            subscriptionExpired: true,
          },
          { status: 403 }
        )
      }

      // Проверка доступных генераций
      const usedFromSubscription = user.advancedMonthlyGenerations
      const availableFromSubscription = 80 - usedFromSubscription
      const availablePurchased = user.purchasedGenerations

      const totalAvailable = availableFromSubscription + availablePurchased

      if (totalAvailable < amount) {
        return NextResponse.json(
          {
            error: 'Недостаточно генераций',
            needed: amount,
            available: totalAvailable,
            message: `Требуется ${amount.toFixed(1)} генераций, доступно ${totalAvailable.toFixed(1)}`,
          },
          { status: 403 }
        )
      }

      // Списание (сначала из подписки, потом из купленных)
      let newAdvancedMonthlyGenerations = usedFromSubscription
      let newPurchasedGenerations = availablePurchased
      let fromSubscription = 0
      let fromPurchased = 0

      if (availableFromSubscription >= amount) {
        // Тратим полностью из подписки
        newAdvancedMonthlyGenerations += amount
        fromSubscription = amount
      } else {
        // Тратим частично из подписки, остальное из купленных
        fromSubscription = availableFromSubscription
        fromPurchased = amount - availableFromSubscription
        newAdvancedMonthlyGenerations += fromSubscription
        newPurchasedGenerations -= fromPurchased
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          advancedMonthlyGenerations: newAdvancedMonthlyGenerations,
          purchasedGenerations: newPurchasedGenerations,
        },
      })

      const newAvailableFromSubscription = 80 - newAdvancedMonthlyGenerations
      const totalRemaining = newAvailableFromSubscription + newPurchasedGenerations

      console.log(
        `💰 [ADVANCED] Consumed ${amount.toFixed(1)}: ${reason || 'N/A'}, subscription=${newAdvancedMonthlyGenerations.toFixed(1)}/80, purchased=${newPurchasedGenerations.toFixed(1)}, remaining=${totalRemaining.toFixed(1)}`
      )

      return NextResponse.json({
        success: true,
        consumed: amount,
        remainingGenerations: totalRemaining,
        fromSubscription,
        fromPurchased,
      })
    }

    // Fallback
    return NextResponse.json({ error: 'Invalid app mode' }, { status: 400 })
  } catch (error) {
    console.error('Consume fractional generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
