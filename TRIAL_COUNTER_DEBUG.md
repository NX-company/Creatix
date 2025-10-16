# 🐛 Отладка счетчика пробного периода

## Проблема
Счетчик показывает 30/30 и не уменьшается при создании документов.

## ✅ Что исправлено

### 1. **Экспорт authOptions**
- Файл: `app/api/auth/[...nextauth]/route.ts`
- Изменено: `const authOptions` → `export const authOptions`

### 2. **API increment-trial-generation**
- Файл: `app/api/user/increment-trial-generation/route.ts`
- Лимит изменен с 3 на 30
- Авторизация через NextAuth вместо custom JWT
- Добавлено обновление session

### 3. **Инициализация currentUser в ChatPanel**
- Файл: `components/ChatPanel.tsx`
- Добавлен импорт `useSession` из next-auth/react
- Добавлен useEffect для инициализации `currentUser` из session
- Добавлено подробное логирование

### 4. **Sidebar обновление session**
- Файл: `components/Sidebar.tsx`
- Добавлен listener на событие `trialGenerationConsumed`
- Вызов `updateSession()` для обновления NextAuth session

### 5. **Регистрация пользователей**
- Файл: `app/api/auth/register/route.ts`
- При регистрации устанавливается `trialEndsAt` = сейчас + 3 дня
- Раньше было `null`

### 6. **JWT callback обновление**
- Файл: `app/api/auth/[...nextauth]/route.ts`
- При `trigger === 'update'` данные перечитываются из БД

## 🔧 Новые инструменты для отладки

### Debug страница
Откройте: `http://localhost:3000/debug-trial`

Показывает:
- ✅ Данные NextAuth session
- ✅ Данные пользователя из БД
- ✅ Статус trial периода
- ✅ Оставшиеся генерации

### Debug API endpoint
```bash
curl http://localhost:3000/api/debug/check-user
```

### Admin endpoint для исправления существующих пользователей
```bash
curl -X POST http://localhost:3000/api/admin/fix-trial-users \
  -H "Cookie: auth-token=YOUR_ADMIN_TOKEN"
```

## 📋 Пошаговая инструкция для тестирования

### Шаг 1: Проверка текущего пользователя
1. Откройте браузер
2. Перейдите на `http://localhost:3000/debug-trial`
3. Нажмите "Check Database User"
4. Проверьте:
   - `isInTrial` должен быть `true`
   - `trialEndsAt` должна быть дата в будущем
   - `trialGenerations` должно быть 0 (для нового пользователя)

### Шаг 2: Если trial не активен
Если `isInTrial = false` или `trialEndsAt = null`:

**Вариант А: Через консоль браузера (F12)**
```javascript
// Обновить текущего пользователя
fetch('/api/admin/fix-trial-users', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)

// Перезагрузить страницу
location.reload()
```

**Вариант Б: Через Prisma Studio**
1. Откройте терминал
2. Запустите: `npx prisma studio`
3. Откройте таблицу `User`
4. Найдите пользователя `ivanovier@gmail.com`
5. Установите:
   - `trialEndsAt` = дата через 3 дня
   - `trialGenerations` = 0

### Шаг 3: Тестирование счетчика
1. Обновите главную страницу (F5)
2. Проверьте что в левом сайдбаре показывается:
   - "Пробный период"
   - "30/30" (или меньше если уже использовали)
3. Откройте консоль браузера (F12)
4. Введите промпт: "сделай кп"
5. Нажмите "Build"
6. **Проверьте логи в консоли:**
   ```
   👤 Current user initialized: { isInTrial: true, ... }
   🔍 Generation flow check: { isInTrial: true, isCreationRequest: true, ... }
   🎯 Trial user detected, incrementing generation counter: { ... }
   ✅ Trial generation counted. Remaining: 29/30
   ```
7. **Проверьте счетчик в сайдбаре** - должен показать 29/30
8. Подождите 1-2 секунды (идет обновление session)
9. Если не обновилось - обновите страницу (F5)

### Шаг 4: Проверка в БД
1. Снова откройте `http://localhost:3000/debug-trial`
2. Нажмите "Check Database User"
3. Проверьте что `trialGenerations` = 1

## 🚨 Если все еще не работает

### Проверка 1: Логи в консоли браузера
Откройте F12 → Console и найдите:
- ❌ Нет лога `👤 Current user initialized` → session не загружен
- ❌ `isInTrial: false` → проблема с `trialEndsAt` в БД
- ❌ `isCreationRequest: false` → intent recognition не распознал команду

### Проверка 2: Логи сервера
В терминале где запущен `npm run dev` должно быть:
```
✅ Trial generation incremented for user xxx: 1/30, осталось: 29
🔄 Token updated for user xxx: trialGenerations=1
```

### Проверка 3: Network tab
F12 → Network → найдите запрос к `/api/user/increment-trial-generation`:
- Статус должен быть 200
- Response должен содержать `{ success: true, trialGenerationsLeft: 29 }`

## 📞 Если ничего не помогло
1. Очистите cookies браузера
2. Выйдите и войдите заново
3. Откройте `/debug-trial` и пришлите скриншот
4. Откройте Console (F12) и пришлите логи

## ⚡ Быстрое решение (Temporary Fix)
Если срочно нужно протестировать:

1. Откройте консоль браузера (F12)
2. Вставьте:
```javascript
// Принудительно установить trial
fetch('/api/admin/fix-trial-users', { method: 'POST' })
  .then(() => location.href = '/login')
```
3. Войдите заново

---

**Создано:** 16 октября 2025  
**Статус:** 🔧 В процессе отладки

