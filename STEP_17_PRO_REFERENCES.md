# ШАГ 17: Анализ всех упоминаний PRO в коде

## 📊 Статистика
- **Всего файлов с упоминанием PRO:** 14
- **Категории использования:**
  - Комментарии и сообщения UI: 8 файлов
  - Логика кода: 6 файлов
  - Уже исправлено (deprecated): 1 файл

---

## 📋 Полный список файлов и необходимые действия

### ✅ 1. `lib/generationLimits.ts`
**Статус:** УЖЕ ИСПРАВЛЕНО в ШАГе 3
**Строка 37:** `PRO: ... // @deprecated PRO = ADVANCED теперь`
**Действие:** Нет (оставлен для обратной совместимости)

---

### 🔧 2. `app/api/user/upgrade-mode/route.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строки 53-55:**
```typescript
const cost = targetMode === 'ADVANCED'
  ? SUBSCRIPTION_PRICES.ADVANCED
  : SUBSCRIPTION_PRICES.PRO  // ← Удалить эту ветку
```
**Действие:** Удалить логику PRO режима, оставить только ADVANCED

---

### 💬 3. `lib/welcomeMessages.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 43:**
```typescript
pro: '\n\n💎 Режим: PRO (максимальное качество, DALL-E 3 HD изображения)'
```
**Действие:** Удалить ключ `pro` из объекта

---

### 💬 4. `components/FileUploader.tsx`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строки 169, 174:** Сообщения о PRO режиме для видео
**Действие:** Заменить "PRO" на "ADVANCED"

---

### 💬 5. `components/ChatPanel.tsx`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строки 665, 675, 754-756:** Упоминания PRO в логике и сообщениях
**Действие:**
- Заменить упоминания "PRO" на "ADVANCED" в тексте
- Изменить `appMode === 'pro'` на `appMode === 'advanced'`

---

### 🎨 6. `app/admin/users/page.tsx`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 349:**
```typescript
<option value="ADVANCED">PRO</option>  // ← Дублирует ADVANCED
```
**Действие:** Удалить эту option (дубликат ADVANCED)

---

### 💬 7. `components/Sidebar.tsx`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 105:** Комментарий
```typescript
// Для платных режимов (ADVANCED/PRO) всегда загружаем детальную информацию
```
**Действие:** Заменить на "Для платного режима ADVANCED"

---

### 💰 8. `components/BuyGenerationsModal.tsx`
**Статус:** ТРЕБУЕТ УДАЛЕНИЯ (весь файл)
**Строка 193:** "Доступно только для подписчиков ADVANCED и PRO"
**Действие:** Файл будет удален в ШАГе 15

---

### 💬 9. `app/api/payments/create-payment/route.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 90:**
```typescript
{ error: 'Bonus packs are only available for ADVANCED and PRO users' }
```
**Действие:** Изменить на "ADVANCED users" (но весь блок бонусов будет удален в ШАГе 11)

---

### 🧪 10. `lib/testing/scenarios.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 218:**
```typescript
name: 'Переключение режимов (Free/Advanced/PRO)',
```
**Действие:** Удалить "/PRO" из названия

---

### 🧪 11. `lib/testing/comprehensive-scenarios.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 738:**
```typescript
name: 'Переключение режимов (Free/Advanced/PRO)',
```
**Действие:** Удалить "/PRO" из названия

---

### 🤖 12. `lib/aiEditor.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строки 109-110:**
```typescript
const aiModel = (mode === 'advanced' || mode === 'pro')  // ← Убрать || mode === 'pro'
  ? 'openai/gpt-4o'  // Умная модель для Advanced и PRO
```
**Действие:** Удалить проверку `|| mode === 'pro'`

---

### 🤖 13. `lib/agents/contentAnalyzer.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ
**Строка 134:** Комментарий
```typescript
// PRO режим: используем OpenRouter GPT-4o
```
**Действие:** Изменить на "ADVANCED режим"

---

### 🤖 14. `lib/agents/orchestrator.ts`
**Статус:** ТРЕБУЕТ ИЗМЕНЕНИЯ (МНОГО УПОМИНАНИЙ)
**Строки:** 103-104, 213-214, 243, 252, 254, 263, 270, 294, 300-303, 310
**Действие:** Глобальная замена:
- `mode === 'pro'` → `mode === 'advanced'`
- `'PRO режим'` → `'ADVANCED режим'`
- `'PRO изображения'` → `'ADVANCED изображения'`
- `'PRO документ'` → `'ADVANCED документ'`

---

## 🎯 План действий

### Категория 1: Простые замены текста (низкий риск)
- `lib/welcomeMessages.ts` - удалить ключ `pro`
- `components/Sidebar.tsx` - исправить комментарий
- `lib/testing/scenarios.ts` - удалить "/PRO"
- `lib/testing/comprehensive-scenarios.ts` - удалить "/PRO"
- `lib/agents/contentAnalyzer.ts` - комментарий

### Категория 2: Изменения логики (средний риск)
- `app/api/user/upgrade-mode/route.ts` - удалить ветку PRO
- `app/admin/users/page.tsx` - удалить option
- `lib/aiEditor.ts` - убрать проверку mode === 'pro'

### Категория 3: Комплексные изменения (высокий риск)
- `components/ChatPanel.tsx` - множество упоминаний
- `components/FileUploader.tsx` - сообщения
- `lib/agents/orchestrator.ts` - МНОГО упоминаний по всему файлу

### Категория 4: Будут удалены в других шагах
- `components/BuyGenerationsModal.tsx` - ШАГ 15
- `app/api/payments/create-payment/route.ts` - ШАГ 11

---

## ✅ Рекомендация

**Выполнять по категориям:**
1. Сначала Категория 1 (безопасно)
2. Потом Категория 2 (осторожно)
3. Затем Категория 3 (тщательно тестировать)
4. Категория 4 - пропустить (будет сделано в других шагах)

**Общий подход:**
- Глобальная замена `mode === 'pro'` → `mode === 'advanced'`
- Глобальная замена текстов "PRO" → "ADVANCED"
- Удаление опций/веток кода для PRO

---

## 🧪 Тестирование после изменений

После каждой категории проверять:
```bash
npx tsc --noEmit  # TypeScript компиляция
```

После всех изменений протестировать:
- Создание документа в ADVANCED режиме
- Переключение режимов
- Загрузка файлов
- Admin панель
