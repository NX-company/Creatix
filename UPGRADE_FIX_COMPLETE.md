# Полное исправление системы апгрейда тарифов

## 🐛 Проблема

После тестовой "оплаты" и апгрейда с FREE на ADVANCED:
- ❌ Режим не менялся (оставался FREE)
- ❌ Счетчик генераций не обновлялся
- ❌ Показывался "Пробный период" вместо "Продвинутый"
- ❌ Данные в session не обновлялись

## 🔍 Найденные проблемы

### 1. **API не завершал trial период**
**Файл:** `app/api/user/upgrade-mode/route.ts`

**Проблема:**
```typescript
// Обновлял appMode и generationLimit, но НЕ завершал trial
data: {
  appMode: targetMode,
  generationLimit: newLimit,
  // ❌ trialEndsAt оставался активным!
  // ❌ bonusGenerations не обнулялся!
}
```

**Результат:** UI показывал "Пробный период" вместо "ADVANCED" бара.

### 2. **NextAuth session не обновлялась**
**Файл:** `components/UpgradeModal.tsx`

**Проблема:**
```typescript
// После апгрейда просто перезагружалась страница
window.location.reload()
// ❌ Но NextAuth session НЕ обновлялась с сервера!
```

**Результат:** После перезагрузки старые данные из JWT токена.

### 3. **Case mismatch: ADVANCED vs advanced**
**Файл:** `app/api/auth/[...nextauth]/route.ts`

**Проблема:**
```typescript
// БД/Prisma: appMode = 'ADVANCED' (uppercase)
// Store: appMode = 'advanced' (lowercase)

token.appMode = dbUser.appMode // ❌ 'ADVANCED'
// app/page.tsx сравнивал и не находил совпадение!
```

**Результат:** `appMode` из session не синхронизировался с store.

### 4. **Sidebar не запрашивал данные для trial**
**Файл:** `components/Sidebar.tsx`

**Проблема:**
```typescript
const fetchGenerationsInfo = async () => {
  // ❌ Блокировал запрос для trial пользователей
  if (isGuestMode || !session?.user || currentUser?.isInTrial) return
}
```

**Результат:** После апгрейда из trial, данные не загружались.

## ✅ Исправления

### 1. **API теперь завершает trial период**

**Файл:** `app/api/user/upgrade-mode/route.ts`

```typescript
const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    appMode: targetMode,
    generationLimit: newLimit,
    subscriptionEndsAt,
    monthlyGenerations: 0,
    lastResetDate: new Date(),
    // ✅ Завершаем trial период при апгрейде
    trialEndsAt: null,
    bonusGenerations: 0,
  },
})
```

**Эффект:**
- ✅ `trialEndsAt = null` → пользователь больше не в trial
- ✅ `bonusGenerations = 0` → чистый старт
- ✅ UI переключается с "Пробный период" на "Генерации"

### 2. **Обновление NextAuth session перед перезагрузкой**

**Файл:** `components/UpgradeModal.tsx`

**Добавлен импорт:**
```typescript
import { useSession } from 'next-auth/react'
```

**В компоненте:**
```typescript
const { update: updateSession } = useSession()
```

**В handleUpgrade:**
```typescript
// Успешно апгрейдили
console.log('✅ Upgrade successful, updating session...')

// ✅ Обновляем NextAuth session с сервера
await updateSession()

console.log('✅ Session updated, reloading page...')

// Перезагрузить страницу
window.location.reload()
```

**Эффект:**
- ✅ `updateSession()` вызывает JWT callback с `trigger: 'update'`
- ✅ JWT callback запрашивает свежие данные из БД
- ✅ Session содержит актуальные данные после перезагрузки

### 3. **Преобразование appMode к lowercase**

**Файл:** `app/api/auth/[...nextauth]/route.ts`

**При sign in:**
```typescript
if (user) {
  token.id = user.id
  token.role = user.role || 'USER'
  // ✅ Convert to lowercase for store compatibility
  token.appMode = (user.appMode || 'FREE').toLowerCase()
  token.trialEndsAt = user.trialEndsAt || null
  token.trialGenerations = user.trialGenerations || 0
}
```

**При session update:**
```typescript
if (dbUser) {
  token.role = dbUser.role
  // ✅ Convert to lowercase for store compatibility
  token.appMode = dbUser.appMode.toLowerCase()
  token.trialEndsAt = dbUser.trialEndsAt
  token.trialGenerations = dbUser.trialGenerations
  console.log(`🔄 Token updated: appMode=${dbUser.appMode}, trialEndsAt=${dbUser.trialEndsAt}`)
}
```

**Эффект:**
- ✅ БД: `'ADVANCED'` → Session: `'advanced'`
- ✅ Совпадает с типом `AppMode` в store
- ✅ Синхронизация в `app/page.tsx` работает корректно

### 4. **Улучшено логирование**

Добавлены детальные логи в JWT callback для отладки:
```typescript
console.log(`🔄 Token updated for user ${dbUser.id}: appMode=${dbUser.appMode}, trialGenerations=${dbUser.trialGenerations}, trialEndsAt=${dbUser.trialEndsAt}`)
```

## 📊 Полная последовательность апгрейда

### ДО исправлений:
```
1. User нажимает "Купить ADVANCED" → API вызов
2. API: appMode = 'ADVANCED', trialEndsAt = STILL ACTIVE ❌
3. UpgradeModal: alert → window.location.reload()
4. NextAuth: берет старую session из JWT (не обновляется) ❌
5. app/page.tsx: session.appMode = 'FREE' (кэш) ❌
6. Sidebar: не запрашивает данные (isInTrial = true) ❌
7. UI: показывает "Пробный период 29/30" ❌
```

### ПОСЛЕ исправлений:
```
1. User нажимает "Купить ADVANCED" → API вызов
2. API: appMode = 'ADVANCED', trialEndsAt = null ✅, bonusGenerations = 0 ✅
3. UpgradeModal: 
   - await updateSession() ✅
   - NextAuth JWT callback: trigger='update'
   - Запрос в БД → свежие данные
   - token.appMode = 'advanced' ✅ (lowercase)
   - token.trialEndsAt = null ✅
4. alert → window.location.reload()
5. NextAuth: session с обновленными данными ✅
6. app/page.tsx: session.appMode = 'advanced' ✅
7. Sidebar: запрашивает generationsInfo (isInTrial = false) ✅
8. UI: показывает "💎 Генерации 100/100" ✅
```

## 🧪 Как проверить

### 1. Обновите страницу
```
Ctrl + Shift + R
```

### 2. Нажмите "Улучшить до Продвинутый"

### 3. В модальном окне нажмите "Купить ADVANCED →"

### 4. Следите за консолью (F12):
```
✅ Upgrade successful, updating session...
🔄 Token updated for user XXX: appMode=ADVANCED, trialGenerations=1, trialEndsAt=null
✅ Session updated, reloading page...
🔄 Syncing appMode from session: advanced
```

### 5. После перезагрузки проверьте:
- ✅ Зеленый бар "Пробный период" исчез
- ✅ Появился синий бар "💎 Генерации"
- ✅ Счетчик: **100/100**
- ✅ Режим: **ADVANCED**
- ✅ Кнопка изменилась на "Купить +30 за 300₽"

## 🎯 Ключевые изменения

| Файл | Проблема | Исправление |
|------|----------|-------------|
| `app/api/user/upgrade-mode/route.ts` | Trial не завершался | Добавлено `trialEndsAt: null, bonusGenerations: 0` |
| `components/UpgradeModal.tsx` | Session не обновлялась | Добавлено `await updateSession()` перед reload |
| `app/api/auth/[...nextauth]/route.ts` | Case mismatch | Добавлено `.toLowerCase()` для appMode |
| Все | Плохое логирование | Добавлены детальные console.log |

## ✅ Статус
✅ **ПОЛНОСТЬЮ ИСПРАВЛЕНО**

## 📅 Дата
16 октября 2025

## 🔗 Связанные документы
- `MODAL_PORTAL_FIX.md` - Исправление отображения модальных окон
- `UPGRADE_BUTTON_ADDED.md` - Добавление кнопки апгрейда

