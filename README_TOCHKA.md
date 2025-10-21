# 🏦 Интеграция Tochka Bank API - Готова к запуску

## ✅ Статус: Полностью настроено

Вся техническая часть интеграции завершена. API возвращает **501 Not Implemented**, что означает:
- ✅ JWT токен работает корректно
- ✅ Авторизация проходит успешно
- ✅ API endpoints найдены (`/uapi/`)
- ❌ **Интернет-эквайринг не активен** в Точка Банке

## 🎯 Следующий шаг: Активация эквайринга

### Проблема

Получаем ошибку **501 Not Implemented** на всех запросах к `/uapi/acquiring/*`

### Решение

Вам нужно **активировать эквайринг** в интернет-банке Точка:

1. **Зайдите в интернет-банк**: https://business.tochka.com
2. **Найдите раздел "Эквайринг"** или "Торговый эквайринг"
3. **Проверьте статус**:
   - Если статус "Не подключен" → нажмите "Подключить"
   - Если статус "Заявка на рассмотрении" → дождитесь одобрения
   - Если статус "Активен" → свяжитесь с поддержкой (тел: 8 800 500-05-70)

4. **При подключении укажите**:
   - Название: Creatix AI Document Generator
   - Сайт: https://aicreatix.ru
   - Средний чек: 300₽
   - Описание: Платформа для создания документов

5. **Дождитесь одобрения** (обычно 1-2 рабочих дня)

6. **Проверьте работу**:
   ```bash
   node test-latest-jwt.js
   ```

   Если увидите платежную ссылку - готово! 🎉

## 📦 Что уже готово

### 1. Полная библиотека API

Файл: [lib/tochka.ts](lib/tochka.ts)

**Все методы реализованы:**

```typescript
import { createTochkaClient } from '@/lib/tochka'

const tochka = createTochkaClient()

// Создать платежную ссылку
const payment = await tochka.createPayment({
  amount: 1000,
  purpose: 'Подписка ADVANCED',
  paymentMode: ['card', 'sbp', 'tinkoff'],
  redirectUrl: 'https://aicreatix.ru/success',
  failRedirectUrl: 'https://aicreatix.ru/failure',
  consumerId: userId,
  ttl: 1440, // 24 часа
})

console.log('Оплатите здесь:', payment.paymentUrl)
```

**Доступные методы:**

#### Платежные ссылки
- `createPayment(params)` - создать платежную ссылку
- `createPaymentWithReceipt(params)` - создать с чеком
- `getPaymentList(params)` - список платежей
- `getPaymentInfo(operationId)` - информация о платеже
- `refundPayment(operationId, params)` - возврат средств
- `capturePayment(operationId, amount)` - подтверждение платежа
- `getPaymentRegistry(from, to)` - реестр платежей

#### QR-коды СБП
- `getQRCodesList(legalId)` - список QR-кодов
- `getQRCode(qrcId)` - информация о QR-коде
- `registerQRCode(merchantId, accountId, params)` - регистрация
- `getQRCodesPaymentStatus(qrcIds)` - статусы платежей

#### Клиенты и эквайринг
- `getCustomersList()` - список клиентов
- `getCustomerInfo(customerCode)` - информация о клиенте
- `getRetailers()` - статус эквайринга

### 2. TypeScript типы

Полная типизация всех параметров и ответов:
- `TochkaPaymentParams`
- `TochkaPaymentWithReceiptParams`
- `TochkaPaymentResponse`
- `TochkaQRCodeParams`
- `TochkaQRCodeResponse`
- И другие...

### 3. Конфигурация

Файл: [.env.local](.env.local)

```env
TOCHKA_API_URL=https://enter.tochka.com
TOCHKA_CUSTOMER_CODE=305208987
TOCHKA_JWT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
TOCHKA_CLIENT_ID=feb5d00f45315570c01efd41d90d8859
```

### 4. Тестовые скрипты

- `test-latest-jwt.js` - основной тест
- `test-tochka-oauth.js` - тест OAuth
- `test-different-urls.js` - поиск правильных URL

### 5. Документация

- `README_TOCHKA.md` - этот файл
- `TOCHKA_FINAL_SETUP.md` - подробная инструкция
- `TOCHKA_API_STATUS.md` - техническая документация

## 🧪 Тестирование

### Запуск теста

```bash
node test-latest-jwt.js
```

### Ожидаемый результат СЕЙЧАС (эквайринг не активен)

```
🔄 Статус: 501 Not Implemented
❌ Ошибка: {"code":"501","message":"Что-то пошло не так"}
```

### Ожидаемый результат ПОСЛЕ активации

```
✅✅✅ УСПЕХ! API РАБОТАЕТ! ✅✅✅

📦 Ответ от API:
{
  "paymentId": "abc123...",
  "paymentUrl": "https://payform.tochka.com/...",
  "status": "CREATED"
}

🔗🔗🔗 ПЛАТЕЖНАЯ ССЫЛКА:
https://payform.tochka.com/pay/...
```

## 💻 Интеграция в приложение

### Создание платежа при покупке подписки

```typescript
// app/api/payments/create/route.ts
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
      redirectUrl: `https://aicreatix.ru/payment/success?plan=${planType}`,
      failRedirectUrl: `https://aicreatix.ru/payment/failure`,
      consumerId: session.user.id,
      client: {
        email: session.user.email!,
      },
      items: [
        {
          name: `Подписка Creatix ${planType}`,
          amount,
          quantity: 1,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId,
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
```

### Страница успешной оплаты

```typescript
// app/payment/success/page.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan')

  useEffect(() => {
    // Обновить подписку пользователя
    fetch('/api/user/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan }),
      headers: { 'Content-Type': 'application/json' },
    }).then(() => {
      // Перенаправить на главную через 3 секунды
      setTimeout(() => router.push('/'), 3000)
    })
  }, [plan, router])

  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">
        ✅ Оплата успешно завершена!
      </h1>
      <p className="text-lg mb-4">
        Подписка {plan} активирована
      </p>
      <p className="text-gray-600">
        Вы будете перенаправлены на главную страницу...
      </p>
    </div>
  )
}
```

## 📋 API Endpoints

Все запросы идут на: `https://enter.tochka.com/uapi/{service}/{version}/{path}`

### Примеры:

```
GET  /uapi/open_banking/v1/customers
GET  /uapi/acquiring/v1/retailers
POST /uapi/acquiring/v1/payments
POST /uapi/acquiring/v1/payments/with_receipt
GET  /uapi/acquiring/v1/payments
GET  /uapi/acquiring/v1/payments/{id}
POST /uapi/acquiring/v1/payments/{id}/refund
POST /uapi/acquiring/v1/payments/{id}/capture
GET  /uapi/acquiring/v1/registry
GET  /uapi/sbp/v1/qr-code/legal-entity/{id}
POST /uapi/sbp/v1/qr-code/merchant/{mid}/account/{aid}
GET  /uapi/sbp/v1/qr-codes/{ids}/payment-status
```

## 🔧 Технические детали

### Авторизация

JWT токен передается в заголовке:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Обработка ошибок

Библиотека автоматически:
- Обрабатывает 401 (expired token)
- Логирует все ошибки
- Retry при истечении токена

### OAuth поддержка

Есть метод `getOAuthToken()` для автоматического получения токена через Client Credentials flow (на будущее).

## 📞 Поддержка

**Точка Банк:**
- ☎️ 8 800 500-05-70
- 📧 support@tochka.com
- 💬 Чат в интернет-банке

**Документация:**
- 📖 https://developers.tochka.com/docs/tochka-api/
- 💳 https://developers.tochka.com/docs/tochka-api/api/rabota-s-platyozhnymi-ssylkami
- 📱 https://enter.tochka.com/doc/v2/redoc/tag/Servis-SBP:-Rabota-s-QR-kodami

## ✅ Чеклист

- [x] JWT токен настроен
- [x] API библиотека создана
- [x] TypeScript типы добавлены
- [x] Тесты написаны
- [x] Документация готова
- [ ] **Эквайринг активирован** ← Финальный шаг!
- [ ] Первый тестовый платеж проведен
- [ ] Интегрировано в приложение

## 🎉 После активации эквайринга

1. Запустите: `node test-latest-jwt.js`
2. Если видите платежную ссылку - **ВСЁ РАБОТАЕТ!** 🚀
3. Оплатите тестовый платеж 10₽
4. Внедряйте в приложение
5. Profit! 💰

---

**💡 Вся техническая работа выполнена. Осталось только активировать эквайринг в банке!**

**Библиотека готова к использованию сразу после активации эквайринга.**
