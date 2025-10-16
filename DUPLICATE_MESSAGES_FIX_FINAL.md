# Исправление дублирования сообщений - ФИНАЛЬНОЕ РЕШЕНИЕ

## 🐛 Проблема
В гостевом режиме сообщения о генерации изображений дублировались в чате:
```
🎨 Рисую изображение 1/3: "A dynamic, modern office..."
🎨 Рисую изображение 2/3: "An infographic-style..."
🎨 Рисую изображение 1/3: "A modern, clean hero..."  ← ДУБЛИКАТ!
🎨 Рисую изображение 3/3: "Abstract digital..."
🎨 Рисую изображение 2/3: "An infographic-style..."  ← ДУБЛИКАТ!
```

## 🔍 Причина

### Первопричина: React StrictMode
React 18+ в режиме разработки **намеренно** вызывает компоненты и эффекты дважды для выявления побочных эффектов.

### Последовательность проблемы:

1. **Двойной вызов useEffect** (page.tsx):
   ```typescript
   useEffect(() => {
     // Вызывается ДВАЖДЫ в StrictMode
     window.dispatchEvent('trigger-auto-generation', { prompt })
   }, [])
   ```

2. **Двойное получение события** (ChatPanel.tsx):
   ```typescript
   useEffect(() => {
     window.addEventListener('trigger-auto-generation', handleAutoGeneration)
     // Слушатель регистрируется ДВАЖДЫ из-за ре-рендера
   }, [])
   ```

3. **Двойной вызов handleRun**:
   - Первый вызов: `isGeneratingRef.current = false` → начинает генерацию
   - Второй вызов (0.1ms позже): `isGeneratingRef.current` еще `false` → запускает вторую генерацию!

4. **Две параллельные генерации**:
   - Каждая создает свои 3 изображения
   - Всего 6 изображений
   - Сообщения перемешиваются в чате

## ✅ Решение

### 1. useRef вместо локальной переменной

**Было (НЕ работает):**
```typescript
useEffect(() => {
  let hasTriggered = false // Создается заново при каждом ре-рендере!
  
  const handleAutoGeneration = (event) => {
    if (hasTriggered) return
    hasTriggered = true
    // ...
  }
}, [])
```

**Стало (работает):**
```typescript
const hasTriggeredAutoGen = useRef(false) // Сохраняется между ре-рендерами

useEffect(() => {
  const handleAutoGeneration = (event) => {
    if (hasTriggeredAutoGen.current) return // Проверка работает!
    hasTriggeredAutoGen.current = true
    // ...
  }
}, [])
```

### 2. Ранняя установка флага в handleRun

**Было (race condition):**
```typescript
const handleRun = async () => {
  if (isGeneratingRef.current) return
  
  // Асинхронные проверки...
  await checkLimits()
  
  isGeneratingRef.current = true // ❌ Слишком поздно!
}
```

**Стало (безопасно):**
```typescript
const handleRun = async () => {
  if (loading || !input.trim()) return
  
  // Установка флага СРАЗУ после базовых проверок
  if (isGeneratingRef.current) return
  isGeneratingRef.current = true // ✅ Блокирует второй вызов!
  
  // Остальная логика...
}
```

### 3. Set для отслеживания сообщений

```typescript
const shownProgressMessages = useRef<Set<string>>(new Set())

const onProgress = (msg: string) => {
  if (shownProgressMessages.current.has(msg)) {
    console.log('⏭️ Skipping duplicate progress:', msg)
    return
  }
  shownProgressMessages.current.add(msg)
  // Добавляем сообщение в чат
}
```

## 📊 Результат

### До исправления:
- ❌ Две параллельные генерации
- ❌ 6 изображений вместо 3
- ❌ Дублированные сообщения в чате
- ❌ Непредсказуемый порядок сообщений

### После исправления:
- ✅ Одна генерация
- ✅ 3 изображения
- ✅ Каждое сообщение один раз
- ✅ Правильный порядок сообщений

## 🧪 Как проверить

1. Очистите кэш:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. Откройте `/welcome` и создайте документ

3. Следите за консолью (F12):
   ```
   ✅ Progress: 🎨 Рисую изображение 1/3...
   ✅ Progress: 🎨 Рисую изображение 2/3...
   ✅ Progress: 🎨 Рисую изображение 3/3...
   ```

   Если есть дубликаты, увидите:
   ```
   ⏭️ Skipping duplicate progress: 🎨 Рисую изображение...
   ```

## 🔧 Измененные файлы

- `components/ChatPanel.tsx`:
  - Добавлен `hasTriggeredAutoGen = useRef(false)`
  - Переработана логика блокировки в `handleRun`
  - Set для отслеживания прогресс-сообщений

## 📝 Техническое объяснение

### Почему useRef критичен здесь?

```typescript
// ❌ НЕПРАВИЛЬНО: Локальная переменная
useEffect(() => {
  let flag = false // Каждый ре-рендер создает НОВУЮ переменную
  // ...
}, [])

// ✅ ПРАВИЛЬНО: useRef
const flag = useRef(false) // Одна переменная на весь жизненный цикл компонента
useEffect(() => {
  if (flag.current) return
  flag.current = true
}, [])
```

### Почему race condition в async функциях?

```typescript
// ❌ Проблема:
const func = async () => {
  if (flag) return
  await asyncOperation() // Второй вызов начинается здесь!
  flag = true // Слишком поздно
}

// ✅ Решение:
const func = async () => {
  if (flag) return
  flag = true // Установили сразу
  await asyncOperation() // Теперь безопасно
}
```

## 🎯 Статус
✅ **ПОЛНОСТЬЮ ИСПРАВЛЕНО**

## 📅 Дата
16 октября 2025
