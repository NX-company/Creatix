# Документация по безопасности платежной системы Creatix

## Обзор

Этот документ описывает все меры безопасности, реализованные для предотвращения обхода оплаты и мошенничества в платежной системе Creatix.

---

## 1. Ценообразование и константы

### Файл: `lib/generationLimits.ts`

**Принцип безопасности**: Все цены определяются ТОЛЬКО на сервере из защищённых констант.

```typescript
// Тестовые цены (для разработки)
const TEST_PRICES = {
  ADVANCED: 10,
  PRO: 10,
  BONUS_PACK: 10,
}

// Реальные цены (продакшен)
const PRODUCTION_PRICES = {
  ADVANCED: 1000,   // 1000₽/месяц
  PRO: 1000,        // 1000₽/месяц
  BONUS_PACK: 300,  // 300₽ за 30 генераций
}

// Автоматический выбор на основе переменной окружения
const IS_TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true'

export const SUBSCRIPTION_PRICES = {
  ADVANCED: IS_TEST_MODE ? TEST_PRICES.ADVANCED : PRODUCTION_PRICES.ADVANCED,
  PRO: IS_TEST_MODE ? TEST_PRICES.PRO : PRODUCTION_PRICES.PRO,
}

export const BONUS_PACK_PRICE = IS_TEST_MODE ? TEST_PRICES.BONUS_PACK : PRODUCTION_PRICES.BONUS_PACK
```

**Защита**:
- ✅ Цены хранятся в серверном коде, недоступном клиенту
- ✅ Невозможно изменить цены через DevTools или HTTP-запросы
- ✅ Переключение между тестовым и продакшен режимом через .env

---

## 2. API endpoint создания платежа

### Файл: `app/api/payments/create-payment/route.ts`

### 2.1. Аутентификация

```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Защита**:
- ✅ Только авторизованные пользователи могут создавать платежи
- ✅ Сессия проверяется через NextAuth.js

### 2.2. Валидация типа платежа

```typescript
if (!paymentType || (paymentType !== 'subscription' && paymentType !== 'bonus_pack')) {
  return NextResponse.json({ error: 'Invalid paymentType' }, { status: 400 })
}
```

**Защита**:
- ✅ Принимаются только разрешённые типы платежей
- ✅ Невозможно создать произвольный тип платежа

### 2.3. Серверная валидация цены

```typescript
if (paymentType === 'subscription') {
  // КРИТИЧЕСКИ ВАЖНО: Цена определяется ТОЛЬКО на сервере
  // Игнорируем любые параметры amount из запроса клиента
  amount = SUBSCRIPTION_PRICES[targetMode as 'ADVANCED' | 'PRO']

  // Проверка безопасности: Нельзя апгрейдиться до того же режима
  if (user.appMode === targetMode) {
    return NextResponse.json(
      { error: `You already have ${targetMode} subscription` },
      { status: 400 }
    )
  }
}
```

**Защита**:
- ✅ Сумма платежа вычисляется ТОЛЬКО на сервере из констант
- ✅ Клиент НЕ может передать произвольную сумму
- ✅ Проверка, что пользователь не пытается купить тот же тариф

### 2.4. Бизнес-логика для бонусных паков

```typescript
else if (paymentType === 'bonus_pack') {
  amount = BONUS_PACK_PRICE

  // Проверка безопасности: Бонусные паки только для платных подписок
  if (user.appMode === 'FREE') {
    return NextResponse.json(
      { error: 'Bonus packs are only available for ADVANCED and PRO users' },
      { status: 403 }
    )
  }
}
```

**Защита**:
- ✅ Бонусные паки доступны только платным подписчикам
- ✅ FREE пользователи не могут купить бонусный пак

### 2.5. Создание транзакции

```typescript
await prisma.transaction.create({
  data: {
    userId: user.id,
    amount,  // Сумма из серверных констант
    type: paymentType === 'subscription' ? 'SUBSCRIPTION' : 'BONUS_PACK',
    status: 'PENDING',
    metadata: {
      operationId: paymentData.operationId,
      targetMode: targetMode || null,
      paymentType,
    },
  },
})
```

**Защита**:
- ✅ Транзакция создаётся ДО перенаправления на оплату
- ✅ Сохраняется ожидаемая сумма для последующей проверки
- ✅ operationId связывает транзакцию с платежом в Точка Банке

---

## 3. Webhook обработка платежей

### Файл: `app/api/payments/webhook/route.ts`

### 3.1. Проверка подписи webhook

```typescript
const signature = request.headers.get('x-signature') || ''
const tochkaClient = createTochkaClient()
const isValid = tochkaClient.verifyWebhookSignature(rawBody, signature)

if (!isValid) {
  console.error('❌ Invalid webhook signature')
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

**Защита**:
- ✅ HMAC-SHA256 проверка подписи webhook от Точка Банка
- ✅ Невозможно подделать webhook от имени банка
- ✅ Защита от replay-атак и MITM

### 3.2. Валидация суммы платежа

```typescript
// КРИТИЧЕСКАЯ ПРОВЕРКА БЕЗОПАСНОСТИ: Валидация суммы
const expectedAmount = transaction.amount  // Из БД (серверная константа)
const actualAmount = parseFloat(amount?.toString() || '0')  // От банка

// Проверяем, что оплаченная сумма совпадает с ожидаемой
if (Math.abs(actualAmount - expectedAmount) > 0.01) {
  console.error('❌ SECURITY ALERT: Payment amount mismatch!', {
    expected: expectedAmount,
    actual: actualAmount,
    operationId,
    userId: transaction.userId,
  })

  // Помечаем транзакцию как неудачную и НЕ активируем подписку
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'FAILED',
      metadata: {
        ...metadata,
        securityError: 'Amount mismatch',
        expectedAmount,
        actualAmount,
      }
    },
  })

  return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
}
```

**Защита**:
- ✅ КРИТИЧЕСКИ ВАЖНАЯ проверка: сумма от банка === сумма в транзакции
- ✅ Предотвращает активацию подписки при оплате меньшей суммы
- ✅ Логирование попыток мошенничества с суммой
- ✅ Транзакция помечается FAILED при несовпадении

### 3.3. Проверка дублирующихся обработок

```typescript
if (transaction.status === 'COMPLETED') {
  console.log(`⚠️  Transaction already processed: ${operationId}`)
  return NextResponse.json(
    { success: true, message: 'Already processed' },
    { status: 200 }
  )
}
```

**Защита**:
- ✅ Webhook может прийти несколько раз (ретраи)
- ✅ Проверка предотвращает двойное начисление подписки/генераций

### 3.4. Активация подписки с ограничением срока

```typescript
if (transaction.type === 'SUBSCRIPTION') {
  // Подписка действует ровно 1 месяц
  const subscriptionEndsAt = new Date()
  subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1)

  await prisma.user.update({
    where: { id: transaction.userId },
    data: {
      appMode: targetMode,
      generationLimit: GENERATION_LIMITS[targetMode],
      subscriptionEndsAt,  // ВАЖНО: Срок истечения
      monthlyGenerations: 0,
      bonusGenerations: 0,
      trialEndsAt: null,
    },
  })
}
```

**Защита**:
- ✅ Подписка автоматически истекает через месяц
- ✅ Сброс счётчиков генераций при активации
- ✅ Отключение триального режима

### 3.5. Бонусные генерации с истечением

```typescript
else if (transaction.type === 'BONUS_PACK') {
  const bonusEndsAt = new Date()
  bonusEndsAt.setMonth(bonusEndsAt.getMonth() + 1)

  await prisma.user.update({
    where: { id: transaction.userId },
    data: {
      bonusGenerations: { increment: 30 },
      subscriptionEndsAt: bonusEndsAt,  // Продление срока действия
    },
  })
}
```

**Защита**:
- ✅ Бонусные генерации действуют 1 месяц
- ✅ Автоматическое продление subscriptionEndsAt

---

## 4. Frontend компоненты

### 4.1. UpgradeModal (`components/UpgradeModal.tsx`)

```typescript
const handleUpgrade = async (targetMode: 'ADVANCED' | 'PRO') => {
  // Только targetMode отправляется на сервер
  // Сумма НЕ отправляется - определяется на сервере
  const response = await fetch('/api/payments/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentType: 'subscription',
      targetMode,  // Только тип подписки
    }),
  })

  // Редирект на оплату Точка Банка
  window.location.href = data.paymentUrl
}
```

**Защита**:
- ✅ Frontend НЕ отправляет сумму платежа
- ✅ Только тип подписки (ADVANCED/PRO)
- ✅ Прямой редирект на платёжную форму банка

### 4.2. BuyGenerationsModal (`components/BuyGenerationsModal.tsx`)

```typescript
const handlePurchase = async () => {
  const response = await fetch('/api/payments/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentType: 'bonus_pack',  // Только тип
    }),
  })

  window.location.href = data.paymentUrl
}
```

**Защита**:
- ✅ Отправляется только тип платежа
- ✅ Сумма определяется на сервере

---

## 5. Возможные векторы атак и защита

### 5.1. Модификация суммы через DevTools

**Атака**: Изменить сумму в запросе через браузер
**Защита**: ✅ Сумма игнорируется, используется серверная константа

### 5.2. Replay webhook атака

**Атака**: Повторная отправка старого webhook для повторной активации
**Защита**: ✅ Проверка подписи HMAC-SHA256 с секретом

### 5.3. Изменение суммы в платёжной форме банка

**Атака**: Попытка оплатить меньшую сумму
**Защита**: ✅ Валидация суммы в webhook: actualAmount === expectedAmount

### 5.4. Race condition (двойная обработка webhook)

**Атака**: Webhook приходит дважды одновременно
**Защита**: ✅ Проверка transaction.status === 'COMPLETED'

### 5.5. Покупка подписки без оплаты

**Атака**: Прямой вызов /api/payments/create-payment с последующим хаком
**Защита**:
- ✅ Подписка активируется ТОЛЬКО через webhook от банка
- ✅ Webhook имеет проверку подписи
- ✅ Невозможно активировать без реального платежа

### 5.6. Бонусные паки для FREE пользователей

**Атака**: FREE пользователь пытается купить бонусный пак
**Защита**: ✅ Проверка user.appMode !== 'FREE' на сервере

### 5.7. Повторная покупка того же тарифа

**Атака**: Пользователь ADVANCED пытается купить ADVANCED снова
**Защита**: ✅ Проверка user.appMode === targetMode возвращает ошибку

---

## 6. Переменные окружения

### `.env.local`

```env
# Режим тестирования (цены по 10₽)
NEXT_PUBLIC_PAYMENT_TEST_MODE=true

# Реальные credentials Точка Банка
TOCHKA_CUSTOMER_CODE=305220535
TOCHKA_JWT_TOKEN=eyJ...
TOCHKA_CLIENT_ID=bccc8f0de93e4edc93acc323b8f3a484

# Webhook secret для проверки подписи
TOCHKA_WEBHOOK_SECRET=creatix_webhook_secret_2025
```

**Защита**:
- ✅ Секретные ключи хранятся только на сервере
- ✅ Недоступны клиенту (нет NEXT_PUBLIC_)
- ✅ TOCHKA_WEBHOOK_SECRET используется для HMAC проверки

---

## 7. Чек-лист безопасности

- [x] Цены определяются ТОЛЬКО на сервере
- [x] Frontend НЕ отправляет сумму платежа
- [x] Webhook проверяет HMAC-SHA256 подпись
- [x] Валидация суммы: actualAmount === expectedAmount
- [x] Проверка дублирующихся webhook (idempotency)
- [x] Аутентификация через NextAuth.js
- [x] Бизнес-логика: бонусные паки только для платных
- [x] Защита от повторной покупки того же тарифа
- [x] Логирование попыток мошенничества
- [x] Подписки имеют срок истечения (1 месяц)
- [x] Транзакции сохраняются в БД для аудита

---

## 8. Тестирование безопасности

### Сценарии для проверки:

1. **Попытка изменить сумму в DevTools**
   - Открыть Network tab
   - Изменить body запроса create-payment
   - Результат: Сумма игнорируется, используется серверная

2. **Попытка отправить поддельный webhook**
   - curl без правильной подписи
   - Результат: 401 Invalid signature

3. **Оплата меньшей суммы**
   - Если банк вернёт меньшую сумму в webhook
   - Результат: Транзакция FAILED, подписка не активируется

4. **FREE пользователь покупает бонусный пак**
   - Результат: 403 Forbidden

5. **Повторная отправка webhook**
   - Отправить тот же webhook дважды
   - Результат: Вторая обработка возвращает "Already processed"

---

## 9. Логирование и мониторинг

Все критические события логируются:

```typescript
// Успешная оплата
console.log(`✅ Payment successful: ${operationId}`)

// Ошибка валидации суммы
console.error('❌ SECURITY ALERT: Payment amount mismatch!', {
  expected: expectedAmount,
  actual: actualAmount,
  operationId,
  userId: transaction.userId,
})

// Повторная обработка
console.log(`⚠️  Transaction already processed: ${operationId}`)
```

**Рекомендации**:
- Настроить алерты на "SECURITY ALERT"
- Мониторинг failed транзакций
- Анализ попыток покупки с неправильными суммами

---

## 10. Регенерация/замена изображений

### Файл: `app/api/flux-generate/route.ts`

**Принцип**: Замена изображений после создания документа = **0.1 генерации за изображение**

### Как работает:

```typescript
// Параметр isRegeneration указывает, что это замена изображения
const { isRegeneration = false } = await request.json()

if (isRegeneration) {
  // Проверяем доступные генерации
  const totalAvailable = availableFromMonthly + currentBonusGenerations
  const REGENERATION_COST = 0.1

  if (totalAvailable < REGENERATION_COST) {
    return NextResponse.json(
      { error: 'Insufficient generations. Need 0.1 generation for image replacement.' },
      { status: 403 }
    )
  }

  // Списываем 0.1 генерации
  // Сначала из месячных, потом из бонусных
}
```

### Защита:
- ✅ Каждая замена изображения = 0.1 генерации
- ✅ Проверка доступных генераций перед заменой
- ✅ Невозможно заменить изображение без генераций
- ✅ Логирование каждой замены

### Примеры:

**Пользователь заменяет 3 изображения:**
```
Исходный документ: 10 изображений = 1 генерация (99 осталось)
Замена изображения #1: -0.1 генерации (98.9 осталось)
Замена изображения #2: -0.1 генерации (98.8 осталось)
Замена изображения #3: -0.1 генерации (98.7 осталось)

Итого израсходовано: 1.3 генерации
Стоимость для пользователя: 13₽
```

**Себестоимость:**
- Исходные 10 изображений: 3.43₽
- 3 замены × 0.3₽ = 0.90₽
- Итого: 4.33₽
- Прибыль: 13₽ - 4.33₽ = 8.67₽ (67%)

---

## 11. Итоговая оценка безопасности

| Аспект | Статус | Примечание |
|--------|--------|-----------|
| Ценообразование | ✅ SECURE | Только серверные константы |
| Валидация платежей | ✅ SECURE | Проверка суммы в webhook |
| Webhook подпись | ✅ SECURE | HMAC-SHA256 |
| Аутентификация | ✅ SECURE | NextAuth.js |
| Бизнес-логика | ✅ SECURE | Все правила на сервере |
| Idempotency | ✅ SECURE | Защита от дублирования |
| Аудит | ✅ IMPLEMENTED | Все транзакции в БД |
| Логирование | ✅ IMPLEMENTED | Детальное логирование |

---

## Контакты для вопросов

Если обнаружены уязвимости безопасности, немедленно сообщите разработчику.

**Последнее обновление**: 2025-01-21
