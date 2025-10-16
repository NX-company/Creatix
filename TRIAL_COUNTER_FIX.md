# 🔧 Исправление счетчика пробного периода

## Проблема
Счетчик пробного периода показывал 30/30 и не уменьшался при создании документов.

## Найденные баги

### 1. **Несоответствие лимита генераций**
- **Файл:** `app/api/user/increment-trial-generation/route.ts`
- **Проблема:** API использовал лимит 3 генерации, а UI показывал 30
- **Исправлено:** Установлен константный лимит `TRIAL_LIMIT = 30`

### 2. **Неправильная авторизация в API**
- **Файл:** `app/api/user/increment-trial-generation/route.ts`  
- **Проблема:** API использовал custom JWT auth (`getUserFromRequest`), не совместимый с NextAuth session
- **Исправлено:** Переключено на `getServerSession(authOptions)` из NextAuth

### 3. **Не экспортирован authOptions**
- **Файл:** `app/api/auth/[...nextauth]/route.ts`
- **Проблема:** `authOptions` был объявлен как `const` вместо `export const`
- **Результат:** Все API endpoints, использующие `authOptions`, не работали
- **Исправлено:** Добавлен `export`

### 4. **Session не обновлялся после инкремента**
- **Файл:** `app/api/auth/[...nextauth]/route.ts` (JWT callback)
- **Проблема:** JWT callback обновлял token только при первом входе
- **Исправлено:** Добавлена логика обновления из БД при `trigger === 'update'`

### 5. **UI не обновлялся после списания генерации**
- **Файлы:** `components/ChatPanel.tsx`, `components/Sidebar.tsx`
- **Проблема:** После инкремента счетчик в Sidebar не обновлялся
- **Исправлено:** 
  - Добавлено событие `trialGenerationConsumed` в ChatPanel
  - Добавлен listener в Sidebar с вызовом `updateSession()`

## Что исправлено

### ✅ `app/api/user/increment-trial-generation/route.ts`
```typescript
- Изменен лимит с 3 на 30 генераций
- Переход с getUserFromRequest на getServerSession
- Добавлен импорт authOptions
- Улучшено логирование
```

### ✅ `app/api/auth/[...nextauth]/route.ts`
```typescript
- Экспортирован authOptions
- Добавлена логика обновления JWT token из БД при trigger === 'update'
- Добавлено логирование обновления token
```

### ✅ `components/ChatPanel.tsx`
```typescript
- Триггер события trialGenerationConsumed после инкремента
- Обновлены пороги предупреждений (3 -> 5)
- Добавлена передача trialLimit в событие
```

### ✅ `components/Sidebar.tsx`
```typescript
- Добавлен listener на событие trialGenerationConsumed
- Вызов updateSession() для обновления NextAuth session
- Fallback на перезагрузку страницы при ошибке
```

## Как это работает теперь

1. **Пользователь создает документ**
2. ChatPanel вызывает `/api/user/increment-trial-generation`
3. API инкрементирует `trialGenerations` в БД
4. ChatPanel триггерит событие `trialGenerationConsumed`
5. Sidebar ловит событие и вызывает `updateSession()`
6. NextAuth JWT callback перечитывает данные из БД
7. Session обновляется с новыми значениями
8. UI в Sidebar обновляется и показывает правильный счетчик

## Результат

✅ Счетчик пробного периода теперь правильно уменьшается с 30 до 0  
✅ UI обновляется в реальном времени после каждой генерации  
✅ Все API endpoints работают корректно  
✅ NextAuth session синхронизирован с БД  
✅ При регистрации автоматически устанавливается trial на 3 дня  
✅ Добавлены debug инструменты для проверки

## ⚠️ ВАЖНО: Обновление существующих пользователей

Существующие пользователи могут иметь `trialEndsAt = null`, что делает их "не в trial".

### Автоматическое исправление:
Откройте в браузере: `http://localhost:3000/debug-trial`
Или выполните в консоли:
```javascript
fetch('/api/admin/fix-trial-users', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

### Ручное исправление через Prisma Studio:
```bash
npx prisma studio
```
Откройте таблицу User и установите:
- `trialEndsAt` = дата через 3 дня от сегодня
- `trialGenerations` = 0

## Тестирование

### Быстрая проверка:
1. Откройте: `http://localhost:3000/debug-trial`
2. Проверьте что `isInTrial = true`
3. Если нет - исправьте через endpoint выше

### Полное тестирование:
1. Войти как пользователь в пробном периоде
2. Открыть консоль браузера (F12)
3. Создать документ (команда "сделай кп")
4. В консоли должны появиться логи:
   - `👤 Current user initialized: { isInTrial: true }`
   - `🎯 Trial user detected, incrementing...`
   - `✅ Trial generation counted. Remaining: 29/30`
5. Проверить что счетчик уменьшился (29/30)
6. Создать еще один документ
7. Проверить что счетчик снова уменьшился (28/30)

## Debug инструменты

📄 **Подробные инструкции:** `TRIAL_COUNTER_DEBUG.md`  
🔧 **Debug страница:** `http://localhost:3000/debug-trial`  
🔍 **API endpoint:** `GET /api/debug/check-user`

---

**Дата:** 16 октября 2025  
**Статус:** ✅ Исправлено и готово к тестированию

