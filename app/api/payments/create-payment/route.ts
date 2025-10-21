import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createTochkaClient } from '@/lib/tochka'
import { SUBSCRIPTION_PRICES, BONUS_PACK_PRICE } from '@/lib/generationLimits'
import { prisma } from '@/lib/db'

/**
 * POST /api/payments/create-payment
 * Создание платежа через Точка Банк
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получение данных запроса
    const body = await request.json()
    const {
      paymentType, // 'subscription' или 'bonus_pack'
      targetMode,  // 'ADVANCED' или 'PRO' (для subscription)
    } = body

    // Проверка обязательных полей
    if (!paymentType) {
      return NextResponse.json(
        { error: 'Missing paymentType' },
        { status: 400 }
      )
    }

    // Получение пользователя из БД
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Определение суммы и описания платежа
    let amount: number
    let purpose: string
    let paymentDescription: string

    if (paymentType === 'subscription') {
      if (!targetMode || (targetMode !== 'ADVANCED' && targetMode !== 'PRO')) {
        return NextResponse.json(
          { error: 'Invalid targetMode for subscription' },
          { status: 400 }
        )
      }

      // КРИТИЧЕСКИ ВАЖНО: Цена определяется ТОЛЬКО на сервере из констант
      // Игнорируем любые параметры amount из запроса клиента
      amount = SUBSCRIPTION_PRICES[targetMode as 'ADVANCED' | 'PRO']
      const modeText = targetMode === 'ADVANCED' ? 'ADVANCED' : 'PRO'
      purpose = `Подписка Creatix ${modeText}`
      paymentDescription = `Оплата подписки на тариф ${modeText}`

      // Проверка безопасности: Нельзя апгрейдиться до того же режима
      if (user.appMode === targetMode) {
        return NextResponse.json(
          { error: `You already have ${targetMode} subscription` },
          { status: 400 }
        )
      }

      console.log(`💳 Creating subscription payment for ${modeText}: ${amount}₽`)
    } else if (paymentType === 'bonus_pack') {
      // КРИТИЧЕСКИ ВАЖНО: Цена определяется ТОЛЬКО на сервере из констант
      amount = BONUS_PACK_PRICE
      purpose = 'Бонусный пакет генераций Creatix (+30 генераций)'
      paymentDescription = 'Покупка дополнительных генераций'

      console.log(`💳 Creating bonus pack payment: ${amount}₽`)

      // Проверка безопасности: Бонусные паки только для платных подписок
      if (user.appMode === 'FREE') {
        return NextResponse.json(
          { error: 'Bonus packs are only available for ADVANCED and PRO users' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid paymentType' },
        { status: 400 }
      )
    }

    // Создание клиента Точка Банка
    const tochkaClient = createTochkaClient()

    // Определение URL для редиректа
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/payment-success?type=${paymentType}&mode=${targetMode || 'bonus'}`
    const failUrl = `${baseUrl}/payment-failure?type=${paymentType}`

    // Создание платежной ссылки с чеком
    const paymentResult = await tochkaClient.createPaymentWithReceipt({
      amount,
      customerCode: process.env.TOCHKA_CUSTOMER_CODE || '',
      purpose,
      paymentMode: ['card', 'sbp'], // Оплата картой или по СБП
      redirectUrl: successUrl,
      failRedirectUrl: failUrl,
      consumerId: user.id,
      ttl: 60, // Ссылка действительна 60 минут
      client: {
        email: user.email,
      },
      items: [
        {
          name: paymentDescription,
          amount,
          quantity: 1,
        },
      ],
    })

    // API возвращает { Data: { operationId, paymentLink, status, ... }, Links, Meta }
    const paymentData = paymentResult.Data

    if (!paymentData?.operationId || !paymentData?.paymentLink) {
      console.error('❌ Invalid payment response:', paymentResult)
      throw new Error('Invalid response from payment gateway')
    }

    // Сохранение информации о платеже в БД (pending статус)
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        type: paymentType === 'subscription' ? 'SUBSCRIPTION' : 'BONUS_PACK',
        status: 'PENDING',
        metadata: {
          operationId: paymentData.operationId, // operationId, НЕ paymentId
          targetMode: targetMode || null,
          paymentType,
        } as any,
      },
    })

    console.log('✅ Payment link created:', {
      operationId: paymentData.operationId,
      amount,
      type: paymentType,
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentData.paymentLink, // paymentLink, НЕ paymentUrl
      operationId: paymentData.operationId,
      amount,
      status: paymentData.status,
    })

  } catch (error) {
    console.error('❌ Error creating payment:', error)
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
