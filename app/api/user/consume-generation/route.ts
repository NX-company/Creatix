import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { shouldResetGenerations, calculateGenerationCost } from '@/lib/generationLimits'

/**
 * POST /api/user/consume-generation
 * Списывает генерации согласно новой модели:
 * - FREE: 10 генераций/месяц, без изображений
 * - ADVANCED: 80 генераций из подписки + купленные доп. генерации (15₽/шт)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageCount = 10 } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        appMode: true,
        freeMonthlyGenerations: true,
        advancedMonthlyGenerations: true,
        purchasedGenerations: true,
        generationLimit: true,
        lastResetDate: true,
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
      // Проверка лимита
      if (user.freeMonthlyGenerations >= 10) {
        return NextResponse.json(
          {
            error: 'Лимит FREE режима исчерпан',
            message: 'Купите подписку ADVANCED для продолжения работы',
            availableGenerations: 0,
          },
          { status: 403 }
        )
      }

      // Списание
      const newFreeMonthlyGenerations = user.freeMonthlyGenerations + 1

      await prisma.user.update({
        where: { id: user.id },
        data: {
          freeMonthlyGenerations: newFreeMonthlyGenerations,
        },
      })

      const remaining = 10 - newFreeMonthlyGenerations

      console.log(`💰 [FREE] Consumed 1: used=${newFreeMonthlyGenerations}/10, remaining=${remaining}`)

      return NextResponse.json({
        success: true,
        consumedGenerations: 1,
        remainingGenerations: remaining,
        fromFree: 1,
        fromSubscription: 0,
        fromPurchased: 0,
      })
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

      if (totalAvailable < 1) {
        return NextResponse.json(
          {
            error: 'Генерации закончились',
            message: 'Пополните баланс (15₽/генерация) для продолжения работы',
            availableGenerations: 0,
          },
          { status: 403 }
        )
      }

      // Списание (сначала из подписки, потом из купленных)
      let newAdvancedMonthlyGenerations = usedFromSubscription
      let newPurchasedGenerations = availablePurchased
      let fromSubscription = 0
      let fromPurchased = 0

      if (availableFromSubscription >= 1) {
        // Тратим из подписки
        newAdvancedMonthlyGenerations += 1
        fromSubscription = 1
      } else {
        // Тратим из купленных
        newPurchasedGenerations -= 1
        fromPurchased = 1
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
        `💰 [ADVANCED] Consumed 1: subscription=${newAdvancedMonthlyGenerations}/80, purchased=${newPurchasedGenerations.toFixed(1)}, remaining=${totalRemaining.toFixed(1)}`
      )

      const costInfo = calculateGenerationCost(imageCount)

      return NextResponse.json({
        success: true,
        consumedGenerations: 1,
        remainingGenerations: totalRemaining,
        fromFree: 0,
        fromSubscription,
        fromPurchased,
        costInfo,
      })
    }

    // Fallback (не должно происходить)
    return NextResponse.json({ error: 'Invalid app mode' }, { status: 400 })
  } catch (error) {
    console.error('Consume generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
