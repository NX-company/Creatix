# 🔧 Исправление: Счетчик генераций не уменьшается при переключении режима

## 🐛 Проблема

Когда платный пользователь переключался из ADVANCED режима в FREE режим и создавал документ, счетчик генераций оставался на 30/30 и не уменьшался.

**Причина:**
- `ModeSelector` менял только локальный state (`Zustand`), но НЕ обновлял `user.appMode` в базе данных
- API `/api/user/consume-generation` читал `user.appMode` из базы данных и получал старое значение (например, `ADVANCED`)
- Поэтому счетчик обновлялся в `advancedMonthlyGenerations`, а не в `freeMonthlyGenerations`

---

## ✅ Решение

### 1. Создан новый API endpoint: `/api/user/switch-mode`

**Файл:** `app/api/user/switch-mode/route.ts`

Этот endpoint:
- Принимает `mode` (FREE, ADVANCED, PRO)
- Проверяет права пользователя (платные пользователи могут переключаться, бесплатные - только FREE)
- Обновляет `user.appMode` в базе данных
- Возвращает успешный результат

### 2. Обновлен компонент `ModeSelector`

**Файл:** `components/ModeSelector.tsx`

Теперь при переключении режима:
1. Вызывается API `/api/user/switch-mode` → обновляет БД
2. Вызывается `updateSession()` → обновляет NextAuth session из БД
3. Обновляется локальный state `setAppMode(mode)`
4. Триггерится событие `mode-switched` → обновляет счетчик в Sidebar

---

## 🔄 Как это работает теперь

```
Пользователь нажимает "FREE" в ModeSelector
         ↓
API /api/user/switch-mode
  → UPDATE users SET appMode = 'FREE' WHERE id = ...
         ↓
updateSession()
  → NextAuth обновляет session из БД
         ↓
setAppMode('free')
  → Zustand обновляет локальный state
         ↓
Event 'mode-switched'
  → Sidebar обновляет счетчик генераций
         ↓
Пользователь создает документ
         ↓
API /api/user/consume-generation
  → Читает user.appMode = 'FREE' из БД
  → UPDATE users SET freeMonthlyGenerations = freeMonthlyGenerations + 1
         ↓
Счетчик уменьшается: 29/30 ✅
```

---

## 🧪 Тестирование

1. **Войдите как платный пользователь** (с активной подпиской ADVANCED)
2. **Переключитесь в FREE режим** через ModeSelector
3. **Создайте документ** (КП, презентацию, резюме)
4. **Проверьте счетчик** в левой панели:
   - Должно быть `29/30` (для FREE режима)
   - Бонусные генерации НЕ должны отображаться в FREE режиме
5. **Переключитесь в ADVANCED режим**
6. **Создайте документ**
7. **Проверьте счетчик**:
   - Должно быть `99/100` (или меньше, если уже использовали)
   - Бонусные генерации должны отображаться (если есть)

---

## 📋 Связанные файлы

- `app/api/user/switch-mode/route.ts` — новый API endpoint
- `components/ModeSelector.tsx` — обновлен для вызова API
- `app/api/user/consume-generation/route.ts` — уже был готов к работе с разными режимами
- `app/api/user/generations/route.ts` — уже был готов к работе с разными счетчиками

---

## ✅ Результат

Теперь счетчики генераций работают независимо для каждого режима:
- **FREE режим** → `freeMonthlyGenerations` (лимит: 30/месяц)
- **ADVANCED режим** → `advancedMonthlyGenerations` (лимит: 100/месяц + бонусы)
- **PRO режим** → `monthlyGenerations` (лимит: 300/месяц + бонусы)

Платные пользователи могут свободно переключаться между режимами, и каждый режим имеет свой независимый счетчик.

