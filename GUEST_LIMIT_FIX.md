# 🔧 Исправление гостевого лимита и дублирования сообщений

## Проблемы
1. **Дублировались сообщения в чате** - каждое сообщение появлялось дважды
2. **Неправильный гостевой лимит** - было 3 генерации, должна быть 1

## ✅ Что исправлено

### 1. **Изменен гостевой лимит с 3 на 1**

**Файлы:**
- `lib/guestGenerations.ts` - `GUEST_LIMIT = 1`
- `lib/store.ts` - `guestGenerationsLimit: 1`

**Было:** Гость получал 3 бесплатные генерации  
**Стало:** Гость получает 1 бесплатную генерацию

### 2. **Исправлено дублирование сообщений**

**Файл:** `components/ChatPanel.tsx`

**Проблема:** 
При каждом progress callback из orchestrator добавлялось сообщение, но если orchestrator вызывался дважды (например в React StrictMode), сообщения дублировались.

**Решение:**

#### A. Set для отслеживания показанных сообщений:
```typescript
const shownProgressMessages = useRef<Set<string>>(new Set())

// В начале каждой генерации
shownProgressMessages.current.clear()

// В onProgress callback
onProgress: (message: string) => {
  // Use Set to track shown messages and prevent duplicates completely
  if (!shownProgressMessages.current.has(message)) {
    shownProgressMessages.current.add(message)
    addMessage({ role: 'assistant', content: message })
    console.log('✅ Progress:', message.substring(0, 60) + '...')
  } else {
    console.log('⏭️ Skipping duplicate progress:', message.substring(0, 60) + '...')
  }
}
```

#### B. Защита от двойного вызова auto-generation (useRef):
```typescript
const hasTriggeredAutoGen = useRef(false) // Сохраняется между ре-рендерами

useEffect(() => {
  const handleAutoGeneration = (event: Event) => {
    if (hasTriggeredAutoGen.current) {
      console.log('⏭️ Auto-generation already triggered, ignoring duplicate event')
      return
    }
    
    if (prompt && !isGeneratingRef.current && !loading && !hasTriggeredAutoGen.current) {
      hasTriggeredAutoGen.current = true
      // ... trigger generation
    }
  }
  // ...
}, [loading, triggerGeneration])
```

**Критично:** Использование `useRef` вместо локальной переменной! Локальная переменная создается заново при каждом ре-рендере, что не защищает от дублирования.

#### C. Ранняя установка флага в handleRun:
```typescript
const handleRun = async () => {
  if (!input.trim() || loading) return
  
  // Установка флага СРАЗУ после базовых проверок (предотвращает race condition)
  if (isGeneratingRef.current) {
    console.log('❌ handleRun blocked: generation already in progress')
    return
  }
  isGeneratingRef.current = true // ← Устанавливаем НЕМЕДЛЕННО!
  
  // Остальная логика...
}
```

**Критично:** Флаг устанавливается ДО асинхронных операций, иначе второй вызов может проскочить проверку.

**Результат:** 
- Set гарантирует что одно и то же сообщение никогда не добавится дважды
- useRef для hasTriggeredAutoGen блокирует повторный вызов auto-generation между ре-рендерами
- Ранняя установка isGeneratingRef предотвращает race condition в async функции
- Сообщения появляются только один раз даже при двойном рендере в StrictMode

### 3. **Обновлена логика подсчета генераций для гостя**

**Файл:** `components/ChatPanel.tsx`

**Было:**
- Первая генерация (из welcome): НЕ считалась, только показывалась модалка
- Гость мог сделать еще генерации

**Стало:**
- Первая генерация (из welcome): СЧИТАЕТСЯ как использованная (1/1)
- После генерации показывается модалка регистрации
- Гость больше не может генерировать (0/1)

**Логика:**
```typescript
if (wasFirstGeneration) {
  // Remove flag and switch to FREE mode
  sessionStorage.removeItem('first_generation_advanced')
  useStore.setState({ appMode: 'free' })
  
  // Increment guest counter for first demo generation (counts as used)
  incrementGuestGenerations()
  
  console.log('✅ First generation used (1/1). Limit reached.')
  
  // Show welcome upgrade modal after 1.5 seconds
  setTimeout(() => {
    setShowWelcomeUpgradeModal(true)
  }, 1500)
}
```

### 4. **Обновлены сообщения**

**Было:**
```
⚡ У вас осталась 1 бесплатная генерация
⚡ Это была ваша последняя бесплатная генерация
```

**Стало:**
```
⚡ Это была ваша бесплатная генерация! Зарегистрируйтесь, чтобы получить 30 генераций в месяц.
```

## 🎯 User Flow теперь:

### Сценарий: Первый визит гостя

1. Пользователь открывает `/welcome`
2. Вводит промпт и нажимает "Создать"
3. **Счетчик в сайдбаре:** `1/1` (показывается после перехода на главную)
4. Создается документ
5. **В консоли:** `✅ First generation used (1/1). Limit reached.`
6. **Счетчик обновляется:** `0/1`
7. Через 1.5 секунды показывается модалка:
   - Выбор плана: FREE или ADVANCED
   - Кнопки: "Зарегистрироваться бесплатно" или "Купить за 1000₽/мес"
8. После выбора плана - переход на `/register?plan=...`

### Сценарий: Попытка второй генерации

1. Гость уже использовал 1 генерацию
2. Счетчик: `0/1`
3. Пытается создать еще документ
4. Показывается сообщение: `🚫 Бесплатные генерации закончились!`
5. Предлагается регистрация
6. Модалка `GenerationLimitModal`

## 📊 Счетчик в Sidebar

**Было:** `3/3` → `2/3` → `1/3` → `0/3`  
**Стало:** `1/1` → `0/1`

Визуальный индикатор:
```
🎭 Тестовый режим
⚡ Бесплатные генерации

0/1           осталось
[======|          ] прогресс-бар (0%)

Зарегистрируйтесь, чтобы продолжить!
```

## 🔍 Debug логи

### При первой генерации:
```
🎁 First ADVANCED generation complete! Switching to FREE mode
✅ First generation used (1/1). Limit reached.
```

### При попытке второй генерации:
```
🚫 Guest limit reached: 0 remaining
```

### При дублировании сообщения:
```
📋 Progress message already in chat, skipping duplicate: Планирую AI изображения для документа...
```

## ✅ Результат

1. ✅ Гостевой лимит: **1 генерация** вместо 3
2. ✅ Сообщения в чате **не дублируются**
3. ✅ После первой генерации **сразу показывается модалка** регистрации
4. ✅ Счетчик правильно показывает **1/1 → 0/1**
5. ✅ Улучшен UX - понятно что нужно зарегистрироваться

---

**Дата:** 16 октября 2025  
**Статус:** ✅ Исправлено и протестировано

