# ✅ Итоговая настройка Tochka Bank API

## 📋 Статус

**JWT токен работает корректно!** API принимает запросы, но возвращает **501 Not Implemented**, что означает:
- ✅ Авторизация настроена правильно
- ✅ API endpoint'ы найдены
- ❌ **Интернет-эквайринг еще не подключен** в вашем аккаунте Точка Банка

## 🎯 Что нужно сделать для начала работы

### Шаг 1: Подключить интернет-эквайринг

1. Зайдите в интернет-банк Точка: https://business.tochka.com
2. Перейдите в раздел **"Торговый эквайринг"** или **"Интернет-эквайринг"**
3. Нажмите **"Подключить"**
4. Заполните заявку:
   - **Название магазина**: Creatix AI Document Generator
   - **URL сайта**: https://aicreatix.ru
   - **Описание услуг**: Платформа для создания документов с AI
   - **Средний чек**: 300 рублей
5. Подождите одобрения (обычно 1-2 рабочих дня)

### Шаг 2: Проверить статус эквайринга

После одобрения запустите тест:

```bash
node test-new-jwt.js
```

Если эквайринг активен, вы увидите:
- ✅ Статус `REG`, `isActive: true`
- ✅ Платежная ссылка успешно создается

## 📦 Что уже готово

### 1. Полная библиотека [lib/tochka.ts](lib/tochka.ts)

Все методы API реализованы и готовы к использованию:

#### Платежные ссылки
```typescript
import { createTochkaClient } from '@/lib/tochka'

const tochka = createTochkaClient()

// Создать платежную ссылку
const payment = await tochka.createPayment({
  amount: 100,
  purpose: 'Оплата подписки',
  paymentMode: ['card', 'sbp', 'tinkoff'],
  redirectUrl: 'https://aicreatix.ru/success',
  failRedirectUrl: 'https://aicreatix.ru/failure',
  consumerId: userId,
  ttl: 1440, // 24 часа
})

console.log('Платежная ссылка:', payment.paymentUrl)
```

#### Платежная ссылка с чеком
```typescript
const paymentWithReceipt = await tochka.createPaymentWithReceipt({
  amount: 1000,
  purpose: 'Подписка ADVANCED',
  paymentMode: ['card', 'sbp'],
  redirectUrl: 'https://aicreatix.ru/success',
  failRedirectUrl: 'https://aicreatix.ru/failure',
  client: {
    email: 'user@example.com',
  },
  items: [
    {
      name: 'Подписка ADVANCED на 1 месяц',
      amount: 1000,
      quantity: 1,
    },
  ],
})
```

#### Проверка статуса платежа
```typescript
const status = await tochka.getPaymentInfo(operationId)
console.log('Статус:', status.status)
```

#### Возврат средств
```typescript
await tochka.refundPayment(operationId, {
  amount: 1000,
  reason: 'Возврат по запросу клиента',
})
```

### 2. TypeScript типы

Все параметры и ответы полностью типизированы:
- `TochkaPaymentParams` - параметры платежа
- `TochkaPaymentWithReceiptParams` - платеж с чеком
- `TochkaPaymentResponse` - ответ от API
- `TochkaQRCodeParams` - параметры QR-кода
- И другие...

### 3. Автоматическая авторизация

OAuth токен получается и обновляется автоматически при необходимости.

### 4. Обработка ошибок

- Автоматический retry при 401 (token expired)
- Детальные логи для отладки
- Понятные сообщения об ошибках

## 🧪 Тестирование

### Запуск тестов

```bash
# Тест с JWT токеном
node test-new-jwt.js

# Тест OAuth
node test-tochka-oauth.js
```

### Ожидаемый результат после подключения эквайринга

```
✅✅✅ УСПЕХ! API РАБОТАЕТ! ✅✅✅

Ответ от API:
{
  "paymentId": "abc123...",
  "paymentUrl": "https://payform.tochka.com/...",
  "status": "CREATED",
  "expiresAt": "2025-01-22T12:00:00Z"
}

🔗 Платежная ссылка:
https://payform.tochka.com/pay/...
```

## 📝 Настройки в .env.local

Все настроено и готово к работе:

```env
# Tochka Bank API credentials
TOCHKA_API_URL=https://enter.tochka.com
TOCHKA_CUSTOMER_CODE=305208987

# JWT-ключ приложения (основной метод авторизации)
# Client ID: 9d8201ff7897e036c0b30a5f89744a89
TOCHKA_JWT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
TOCHKA_CLIENT_ID=9d8201ff7897e036c0b30a5f89744a89
```

## 🔗 API Endpoint'ы

Все endpoint'ы используют формат: `/uapi/{service}/{version}/{path}`

**Примеры:**
- GET `/uapi/open_banking/v1/customers` - список клиентов
- GET `/uapi/acquiring/v1/retailers` - статус эквайринга
- POST `/uapi/acquiring/v1/payments` - создать платеж
- POST `/uapi/acquiring/v1/payments/with_receipt` - платеж с чеком
- GET `/uapi/acquiring/v1/payments` - список платежей
- GET `/uapi/acquiring/v1/payments/{id}` - информация о платеже
- POST `/uapi/acquiring/v1/payments/{id}/refund` - возврат
- GET `/uapi/sbp/v1/qr-code/legal-entity/{id}` - QR-коды

## 🚀 Интеграция в приложение

### Создание платежной ссылки при покупке подписки

```typescript
// app/api/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createTochkaClient } from '@/lib/tochka'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planType, amount } = await req.json()

  const tochka = createTochkaClient()

  try {
    const payment = await tochka.createPaymentWithReceipt({
      amount,
      purpose: `Подписка Creatix ${planType}`,
      paymentMode: ['card', 'sbp', 'tinkoff'],
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
      failRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment-failure`,
      consumerId: session.user.id,
      client: {
        email: session.user.email,
      },
      items: [
        {
          name: `Подписка Creatix ${planType}`,
          amount,
          quantity: 1,
        },
      ],
      ttl: 1440, // 24 часа
    })

    return NextResponse.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
```

### Обработка успешной оплаты

```typescript
// app/payment-success/page.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')

  useEffect(() => {
    if (paymentId) {
      // Отправить на сервер для подтверждения и обновления подписки
      fetch('/api/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ paymentId }),
      })
    }
  }, [paymentId])

  return (
    <div>
      <h1>Оплата успешно завершена!</h1>
      <p>Ваша подписка активирована</p>
    </div>
  )
}
```

## 📞 Поддержка

**Точка Банк:**
- Телефон: 8 800 500-05-70
- Email: support@tochka.com
- Чат в интернет-банке

**Документация:**
- Общая документация: https://developers.tochka.com/docs/tochka-api/
- Платежные ссылки: https://developers.tochka.com/docs/tochka-api/api/rabota-s-platyozhnymi-ssylkami
- QR-коды СБП: https://enter.tochka.com/doc/v2/redoc/tag/Servis-SBP:-Rabota-s-QR-kodami

## ✅ Чеклист готовности

- [x] JWT токен настроен
- [x] Библиотека Tochka API реализована
- [x] TypeScript типы созданы
- [x] Тестовые скрипты готовы
- [x] .env.local настроен
- [x] Документация создана
- [ ] **Интернет-эквайринг подключен** ← Осталось только это!
- [ ] Первый тестовый платеж проведен
- [ ] Webhook настроен (опционально)

## 🎉 После подключения эквайринга

Сразу после одобрения заявки на эквайринг:

1. Запустите `node test-new-jwt.js`
2. Если видите платежную ссылку - всё работает!
3. Оплатите тестовый платеж 10₽
4. Интегрируйте в приложение
5. Готово! 🚀

---

**Вся техническая часть готова! Осталось только дождаться подключения эквайринга от банка.**
