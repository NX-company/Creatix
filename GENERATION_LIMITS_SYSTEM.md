# Система лимитов генераций

## 📊 Обзор

Реализована полная система управления лимитами генераций с поддержкой FREE, ADVANCED и PRO режимов.

## 💰 Структура тарифов

### 🆓 FREE режим
- **30 генераций/месяц** (без AI изображений)
- Сохранение проектов
- История документов
- Обновление 1-го числа каждого месяца

### ⚡ ADVANCED режим
- **100 генераций/месяц** с AI изображениями
- До 10 Flux Schnell изображений на документ
- Парсинг сайтов
- Приоритетная обработка
- **Стоимость:** 1000₽/месяц
- **Возможность докупки:** +30 генераций за 300₽

### 🚀 PRO режим
- **300 генераций/месяц** с AI изображениями
- До 10 Flux Schnell изображений на документ
- Все возможности ADVANCED
- **Стоимость:** 2500₽/месяц

## 🎯 Формула расчета генераций

```typescript
generationsNeeded = Math.ceil(imageCount / 10)
```

**Примеры:**
- 1-10 изображений = 1 генерация
- 11-20 изображений = 2 генерации
- 21-30 изображений = 3 генерации
- 35 изображений = 4 генерации

## 📁 Реализованные компоненты

### API Endpoints

#### `/api/user/generations` (GET)
Получить информацию о генерациях текущего пользователя.

**Response:**
```json
{
  "appMode": "ADVANCED",
  "monthlyGenerations": 15,
  "generationLimit": 100,
  "bonusGenerations": 30,
  "availableGenerations": 115,
  "nextResetDate": "2025-11-01T00:00:00.000Z",
  "subscriptionEndsAt": "2025-11-15T00:00:00.000Z"
}
```

#### `/api/user/consume-generation` (POST)
Списать генерации при создании документа.

**Request:**
```json
{
  "imageCount": 15
}
```

**Response:**
```json
{
  "success": true,
  "consumedGenerations": 2,
  "generationsFromMonthly": 2,
  "generationsFromBonus": 0,
  "remainingGenerations": 98,
  "costInfo": {
    "generationsNeeded": 2,
    "costInRubles": 20,
    "imagesPerGeneration": 8
  }
}
```

#### `/api/user/buy-generations` (POST)
Купить дополнительные генерации (только для ADVANCED/PRO).

**Response:**
```json
{
  "success": true,
  "newBonusGenerations": 60,
  "addedGenerations": 30,
  "cost": 300
}
```

#### `/api/user/upgrade-mode` (POST)
Апгрейд на ADVANCED или PRO режим.

**Request:**
```json
{
  "targetMode": "ADVANCED"
}
```

**Response:**
```json
{
  "success": true,
  "newMode": "ADVANCED",
  "newLimit": 100,
  "subscriptionEndsAt": "2025-11-15T00:00:00.000Z",
  "cost": 1000
}
```

#### `/api/cron/reset-generations` (POST)
Сброс генераций для всех пользователей (cron job).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "resetCount": 42,
  "message": "Reset generations for 42 users"
}
```

### UI Components

#### `GenerationLimitModal`
Модальное окно с информацией о лимитах:
- Для гостей: предложение регистрации
- Для FREE: предложение апгрейда
- Для ADVANCED/PRO: кнопка покупки дополнительных генераций

#### `BuyGenerationsModal`
Модальное окно покупки пакета +30 генераций за 300₽.

#### `WelcomeUpgradeModal`
Модальное окно на Welcome page после первой генерации с выбором плана.

#### Sidebar - Индикатор генераций
Показывает:
- Текущее количество доступных генераций
- Лимит на месяц
- Бонусные генерации (если есть)
- Прогресс-бар
- Дату следующего обновления
- Кнопку покупки (для ADVANCED/PRO)

### Database Schema

```prisma
model User {
  monthlyGenerations  Int       @default(0)      // Использовано в текущем месяце
  generationLimit     Int       @default(30)     // Лимит на месяц
  bonusGenerations    Int       @default(0)      // Купленные дополнительно
  lastResetDate       DateTime?                   // Дата последнего сброса
  subscriptionEndsAt  DateTime?                   // Дата окончания подписки
}
```

## 🔄 Автосброс генераций

Настроен Vercel Cron Job:
- **Расписание:** 0 0 1 * * (каждое 1-е число месяца в 00:00 UTC)
- **Endpoint:** `/api/cron/reset-generations`
- **Действие:** Сброс `monthlyGenerations` и `bonusGenerations` для всех пользователей

Дополнительно реализована проверка при каждом запросе `/api/user/generations`.

## 🔒 Проверка лимитов в ChatPanel

1. **Перед генерацией:**
   - Проверка доступных генераций
   - Расчет необходимого количества по формуле
   - Показ модалки если недостаточно

2. **После генерации:**
   - Списание генераций через API
   - Обновление UI
   - Предупреждение если осталось ≤5 генераций

## 🎨 User Flow

### Гость на Welcome Page
1. Вводит промт
2. Получает **1 бесплатную ADVANCED генерацию** с AI изображениями
3. Видит результат
4. Показывается модалка с выбором плана:
   - **FREE:** Регистрация → 30 генераций/мес
   - **ADVANCED:** Оплата 1000₽ → 100 генераций/мес

### Зарегистрированный пользователь (FREE)
1. Создает документы (30/месяц без AI изображений)
2. При остатке ≤5: предложение апгрейда
3. При 0: модалка с апгрейдом на ADVANCED

### Пользователь ADVANCED
1. Создает документы с AI изображениями
2. При недостатке: кнопка "Купить +30 за 300₽"
3. Автообновление 1-го числа месяца

## 💸 Экономика

### ADVANCED (1000₽/мес, 100 генераций)

**Затраты:**
- Текст (Gemini 2.0 Flash): $0.001/документ
- AI изображения (10 × Flux Schnell): $0.03/документ
- **Итого:** $0.031/документ
- **100 документов:** $3.10

**Прибыль:**
- Доход: $10.50 (1000₽)
- Затраты: $3.10
- **Прибыль: $7.40 (70% маржа)** ✅

### Дополнительный пакет (300₽, 30 генераций)

**Затраты:**
- **30 документов:** $0.93

**Прибыль:**
- Доход: $3.15 (300₽)
- Затраты: $0.93
- **Прибыль: $2.22 (70% маржа)** ✅

## 🔧 Настройка

### Environment Variables

```env
# В .env.local или Vercel
CRON_SECRET=your-secure-random-string
```

### Vercel Deployment

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reset-generations",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

## 📝 Примеры использования

### Client-side проверка лимитов

```typescript
import { checkGenerationAvailability, consumeGeneration } from '@/lib/consumeGeneration'

// Перед генерацией
const availability = await checkGenerationAvailability(imageCount)
if (!availability.canGenerate) {
  // Показать модалку
  return
}

// После генерации
const result = await consumeGeneration(imageCount)
console.log(`Списано ${result.consumedGenerations} генераций`)
```

### Server-side получение информации

```typescript
import { prisma } from '@/lib/db'
import { shouldResetGenerations } from '@/lib/generationLimits'

const user = await prisma.user.findUnique({ where: { email } })

if (user.lastResetDate && shouldResetGenerations(user.lastResetDate)) {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      monthlyGenerations: 0,
      bonusGenerations: 0,
      lastResetDate: new Date(),
    },
  })
}
```

## ✅ Реализовано

- ✅ База данных (Prisma schema + migration)
- ✅ API endpoints (4 шт)
- ✅ Модальные окна (3 шт)
- ✅ Индикатор генераций в Sidebar
- ✅ Проверка лимитов в ChatPanel
- ✅ Списание генераций после создания
- ✅ Автосброс 1-го числа месяца (Vercel Cron)
- ✅ Формула расчета (Math.ceil(imageCount/10))
- ✅ Покупка дополнительных паков
- ✅ Апгрейд режимов

## 🎯 Готово к тестированию!

