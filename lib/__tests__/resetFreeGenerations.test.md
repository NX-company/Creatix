# Тесты для resetFreeGenerations.ts

## ⚠️ Примечание
Эти тесты требуют подключения к базе данных. Запустить их можно будет после настройки локальной PostgreSQL.

---

## 📋 План тестирования

### Тест 1: Проверка сброса для пользователя с истекшей датой
```typescript
// Создать пользователя с freeResetAt в прошлом
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    appMode: 'FREE',
    freeGenerations: 30,
    usedFreeGenerations: 25, // Использовал 25 из 30
    freeResetAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Вчера
  }
})

// Вызвать функцию сброса
const wasReset = await checkAndResetFreeGenerations(user.id)

// Проверки
expect(wasReset).toBe(true)

const updated = await prisma.user.findUnique({ where: { id: user.id } })
expect(updated.freeGenerations).toBe(30)          // Восстановлено
expect(updated.usedFreeGenerations).toBe(0)       // Сброшено
expect(updated.freeResetAt).toBeGreaterThan(now)  // Новая дата установлена
```

---

### Тест 2: Пользователь без необходимости сброса
```typescript
// Создать пользователя с freeResetAt в будущем
const user = await prisma.user.create({
  data: {
    email: 'test2@example.com',
    appMode: 'FREE',
    freeGenerations: 30,
    usedFreeGenerations: 10,
    freeResetAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Через 20 дней
  }
})

// Вызвать функцию сброса
const wasReset = await checkAndResetFreeGenerations(user.id)

// Проверки
expect(wasReset).toBe(false) // Не должен сбросить

const updated = await prisma.user.findUnique({ where: { id: user.id } })
expect(updated.usedFreeGenerations).toBe(10) // Не изменилось
```

---

### Тест 3: Получение информации о FREE генерациях
```typescript
const user = await prisma.user.create({
  data: {
    email: 'test3@example.com',
    appMode: 'FREE',
    freeGenerations: 30,
    usedFreeGenerations: 10,
    freeResetAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Через 15 дней
  }
})

const info = await getFreeGenerationsInfo(user.id)

// Проверки
expect(info.available).toBe(20)        // 30 - 10 = 20
expect(info.used).toBe(10)
expect(info.total).toBe(30)
expect(info.daysUntilReset).toBe(15)   // Через 15 дней
expect(info.wasReset).toBe(false)
```

---

### Тест 4: Использование FREE генерации
```typescript
const user = await prisma.user.create({
  data: {
    email: 'test4@example.com',
    appMode: 'FREE',
    freeGenerations: 30,
    usedFreeGenerations: 5,
    freeResetAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  }
})

const result = await useFreeGeneration(user.id)

// Проверки
expect(result.success).toBe(true)
expect(result.available).toBe(24)      // 30 - 5 - 1 = 24

const updated = await prisma.user.findUnique({ where: { id: user.id } })
expect(updated.usedFreeGenerations).toBe(6) // Увеличился на 1
```

---

### Тест 5: Попытка использовать когда нет доступных
```typescript
const user = await prisma.user.create({
  data: {
    email: 'test5@example.com',
    appMode: 'FREE',
    freeGenerations: 30,
    usedFreeGenerations: 30, // Все использовано
    freeResetAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  }
})

const result = await useFreeGeneration(user.id)

// Проверки
expect(result.success).toBe(false)
expect(result.available).toBe(0)
expect(result.reason).toBe('No FREE generations available')
```

---

### Тест 6: Автоматический сброс при использовании с истекшей датой
```typescript
const user = await prisma.user.create({
  data: {
    email: 'test6@example.com',
    appMode: 'FREE',
    freeGenerations: 30,
    usedFreeGenerations: 30, // Все использовано
    freeResetAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Дата истекла
  }
})

// Функция должна автоматически сбросить перед использованием
const result = await useFreeGeneration(user.id)

// Проверки
expect(result.success).toBe(true)      // Успешно (после сброса)
expect(result.available).toBe(29)       // 30 - 1 = 29

const updated = await prisma.user.findUnique({ where: { id: user.id } })
expect(updated.usedFreeGenerations).toBe(1) // Сброшено и использовано 1
```

---

### Тест 7: GUEST пользователь не имеет FREE генераций в БД
```typescript
const user = await prisma.user.create({
  data: {
    email: 'guest@example.com',
    appMode: 'GUEST',
    freeGenerations: 30,
    usedFreeGenerations: 0,
  }
})

const wasReset = await checkAndResetFreeGenerations(user.id)
expect(wasReset).toBe(false) // Гости не сбрасываются

const info = await getFreeGenerationsInfo(user.id)
expect(info.available).toBe(0) // Гости не имеют FREE в БД
```

---

### Тест 8: ADVANCED пользователь получает FREE генерации
```typescript
const user = await prisma.user.create({
  data: {
    email: 'advanced@example.com',
    appMode: 'ADVANCED',
    freeGenerations: 30,
    usedFreeGenerations: 10,
    advancedGenerations: 100,
    usedAdvancedGenerations: 20,
    freeResetAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  }
})

const info = await getFreeGenerationsInfo(user.id)

// ADVANCED пользователь имеет как ADVANCED так и FREE генерации
expect(info.available).toBe(20)        // 30 - 10 = 20 FREE
expect(info.used).toBe(10)
expect(info.total).toBe(30)
```

---

### Тест 9: Массовый сброс для нескольких пользователей
```typescript
// Создать 3 пользователей с истекшими датами
const users = await Promise.all([
  prisma.user.create({
    data: {
      email: 'mass1@example.com',
      appMode: 'FREE',
      freeGenerations: 30,
      usedFreeGenerations: 30,
      freeResetAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    }
  }),
  prisma.user.create({
    data: {
      email: 'mass2@example.com',
      appMode: 'ADVANCED',
      freeGenerations: 30,
      usedFreeGenerations: 20,
      freeResetAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    }
  }),
  prisma.user.create({
    data: {
      email: 'mass3@example.com',
      appMode: 'FREE',
      freeGenerations: 30,
      usedFreeGenerations: 15,
      freeResetAt: null, // Не установлена
    }
  }),
])

const result = await resetAllExpiredFreeGenerations()

// Проверки
expect(result.resetCount).toBe(3)
expect(result.errors).toBe(0)

// Проверить что все сброшены
for (const user of users) {
  const updated = await prisma.user.findUnique({ where: { id: user.id } })
  expect(updated.usedFreeGenerations).toBe(0)
  expect(updated.freeGenerations).toBe(30)
  expect(updated.freeResetAt).not.toBeNull()
}
```

---

### Тест 10: Статистика FREE генераций
```typescript
// Создать несколько пользователей с разным использованием
await Promise.all([
  prisma.user.create({
    data: { email: 's1@example.com', appMode: 'FREE', freeGenerations: 30, usedFreeGenerations: 0 }
  }),
  prisma.user.create({
    data: { email: 's2@example.com', appMode: 'FREE', freeGenerations: 30, usedFreeGenerations: 30 }
  }),
  prisma.user.create({
    data: { email: 's3@example.com', appMode: 'ADVANCED', freeGenerations: 30, usedFreeGenerations: 10 }
  }),
])

const stats = await getFreeGenerationsStats()

// Проверки
expect(stats.totalUsers).toBeGreaterThanOrEqual(3)
expect(stats.usersWithFreeGenerations).toBeGreaterThanOrEqual(2) // s1 и s3 имеют доступные
expect(stats.totalFreeGenerationsAvailable).toBeGreaterThanOrEqual(50) // 30 + 20 = 50
expect(stats.totalFreeGenerationsUsed).toBeGreaterThanOrEqual(40) // 0 + 30 + 10 = 40
```

---

## 🚀 Запуск тестов (когда БД будет готова)

```bash
# После настройки локальной PostgreSQL:
npx tsx lib/__tests__/resetFreeGenerations.test.ts
```

## ✅ Ожидаемый результат

Все 10 тестов должны пройти успешно, подтверждая:
- Автоматический сброс каждые 30 дней
- Корректное отслеживание использования
- Работа с разными режимами (FREE, ADVANCED, GUEST)
- Массовые операции для cron jobs
- Статистика для admin панели
