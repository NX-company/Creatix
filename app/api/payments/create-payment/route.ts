import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createTochkaClient } from '@/lib/tochka'
import { prisma } from '@/lib/db'

// Subscription price (moved from generationLimits)
const ADVANCED_SUBSCRIPTION_PRICE = 1000 // 10 rubles in kopecks (для теста, потом будет 100000 для 1000₽)

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
      paymentType, // 'subscription' only
      targetMode,  // 'ADVANCED' (для subscription)
    } = body

    // Проверка обязательных полей
    if (!paymentType || paymentType !== 'subscription') {
      return NextResponse.json(
        { error: 'Invalid paymentType. Only subscription is supported.' },
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

    // Определение суммы и описания платежа для подписки
    if (!targetMode || targetMode !== 'ADVANCED') {
      return NextResponse.json(
        { error: 'Invalid targetMode for subscription' },
        { status: 400 }
      )
    }

    // Проверка безопасности: Нельзя апгрейдиться до того же режима
    if (user.appMode === targetMode) {
      return NextResponse.json(
        { error: `You already have ${targetMode} subscription` },
        { status: 400 }
      )
    }

    // КРИТИЧЕСКИ ВАЖНО: Цена определяется ТОЛЬКО на сервере из констант
    // Игнорируем любые параметры amount из запроса клиента
    const amount = ADVANCED_SUBSCRIPTION_PRICE
    const purpose = 'Подписка Creatix ADVANCED'
    const paymentDescription = 'Оплата подписки на тариф ADVANCED'

    console.log(`💳 Creating subscription payment for ADVANCED: ${amount}₽`)

    // Создание клиента Точка Банка
    const tochkaClient = createTochkaClient()

    // Создание платежной ссылки (без чека, т.к. payments_with_receipt возвращает 501)
    // Редирект на главную страницу после успешной оплаты (подписка активируется через webhook)
    const successUrl = 'https://aicreatix.ru/'
    const failUrl = 'https://aicreatix.ru/?payment=failed'

    const paymentResult = await tochkaClient.createPayment({
      amount,
      customerCode: process.env.TOCHKA_CUSTOMER_CODE || '',
      purpose,
      paymentMode: ['card', 'sbp'], // Оплата картой или по СБП
      redirectUrl: successUrl,
      failRedirectUrl: failUrl,
      consumerId: user.id,
      ttl: 60, // Ссылка действительна 60 минут
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
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        metadata: {
          operationId: paymentData.operationId, // operationId, НЕ paymentId
          targetMode: targetMode,
          paymentType: 'subscription',
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
      paymentLink: paymentData.paymentLink, // Правильное имя поля для фронтенда
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
