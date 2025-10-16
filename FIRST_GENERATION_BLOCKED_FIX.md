# Исправление блокировки первой показательной генерации

## 🐛 Проблема
Когда гость заходит через `/welcome` и вводит промпт, первая ADVANCED показательная генерация **блокируется** проверкой лимита:

```
🚫 Local guest limit reached
```

Вместо того чтобы создать документ, гостю сразу показывается модальное окно с предложением регистрации.

## 🔍 Причина

### Логика до исправления:
```typescript
// Guest limit check
if (isGuestMode && isCreationRequest) {
  // ❌ Проверка лимита выполняется ВСЕГДА для гостя
  if (!hasRemainingGenerations()) {
    console.log('🚫 Local guest limit reached')
    setShowLimitModal(true)
    return // Блокирует генерацию!
  }
}
```

### Почему это неправильно?

1. **Первая генерация должна быть показательной** - гость должен увидеть возможности системы
2. **Флаг `first_generation_advanced`** устанавливается в `app/page.tsx`:
   ```typescript
   if (isFirstTime && isGuestMode) {
     sessionStorage.setItem('first_generation_advanced', 'true')
     useStore.setState({ appMode: 'advanced' })
   }
   ```
3. Но проверка лимита **игнорировала этот флаг** и блокировала генерацию

## ✅ Решение

Добавлена проверка флага `first_generation_advanced` **ПЕРЕД** проверкой лимита:

```typescript
// Guest limit check
if (isGuestMode && isCreationRequest) {
  // ✅ Проверяем, первая ли это показательная генерация
  const wasFirstGeneration = sessionStorage.getItem('first_generation_advanced') === 'true'
  
  if (!wasFirstGeneration) {
    // Не первая генерация - проверяем лимит
    const fingerprint = getBrowserFingerprint()
    
    // Backend check
    const checkResponse = await fetch('/api/check-generation-limit', ...)
    if (!checkData.allowed) {
      console.log(`🚫 Backend limit reached: ${checkData.reason}`)
      setShowLimitModal(true)
      return
    }
    
    // Local check
    if (!hasRemainingGenerations()) {
      console.log('🚫 Local guest limit reached')
      setShowLimitModal(true)
      return
    }
  } else {
    // ✅ Первая генерация - пропускаем проверку лимита
    console.log('🎁 First ADVANCED demo generation - skipping limit check')
  }
}
```

## 📊 Последовательность работы

### 1. Гость заходит на `/welcome`
```
URL: /welcome?isFirstTime=true
```

### 2. В `app/page.tsx` устанавливается флаг:
```typescript
sessionStorage.setItem('first_generation_advanced', 'true')
appMode: 'advanced'
```

### 3. Гость вводит промпт и нажимает "Создать"
```
Событие: trigger-auto-generation
```

### 4. В `ChatPanel.tsx` проверяется лимит:
```typescript
// ✅ wasFirstGeneration === 'true'
console.log('🎁 First ADVANCED demo generation - skipping limit check')
// Проверка лимита ПРОПУСКАЕТСЯ
```

### 5. Генерация запускается:
```
🚀 Начинаю создание документа в продвинутом режиме
🎨 Применяю стиль...
🖼️ Создаю 3 изображения...
✨ Документ создан успешно!
```

### 6. После генерации флаг удаляется:
```typescript
sessionStorage.removeItem('first_generation_advanced')
appMode: 'free'
incrementGuestGenerations() // Счетчик: 1/1 → 0/1
```

### 7. Показывается модальное окно:
```
WelcomeUpgradeModal:
- Зарегистрироваться бесплатно (30 генераций)
- Купить расширенный режим (100 генераций)
```

## 🧪 Как проверить

### 1. Очистите кэш:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### 2. Откройте `/welcome`

### 3. Введите промпт и нажмите "Создать"

### 4. В консоли должно быть:
```
🎁 First generation - using ADVANCED mode as demo
🎯 Auto-generation event received!
🚀 Auto-generating from welcome page...
🔵 handleRun called
🎁 First ADVANCED demo generation - skipping limit check  ← ЭТО КЛЮЧЕВОЕ!
✅ handleRun proceeding with generation
🎨 Starting document creation...
```

### 5. Генерация должна пройти успешно:
```
🚀 Начинаю создание документа в продвинутом режиме
📝 Пишу текст документа...
🖼️ Создаю 3 изображения...
✨ Документ создан успешно!
```

### 6. После генерации:
- Счетчик: `0/1`
- Модальное окно с предложением регистрации

## ❌ Если НЕ работает

Если видите `🚫 Local guest limit reached` сразу, проверьте:

1. **Флаг установлен?**
   ```javascript
   console.log(sessionStorage.getItem('first_generation_advanced'))
   // Должно быть: "true"
   ```

2. **URL правильный?**
   ```
   http://localhost:3000/welcome?isFirstTime=true
   ```

3. **Очистили ли кэш перед тестом?**

## 🔧 Измененные файлы

- `components/ChatPanel.tsx`:
  - Добавлена проверка флага `first_generation_advanced` перед проверкой лимита
  - Логика проверки лимита теперь выполняется только для не-первых генераций
  - Добавлен лог `🎁 First ADVANCED demo generation - skipping limit check`

## 📝 Связанные файлы

- `app/page.tsx` - устанавливает флаг `first_generation_advanced`
- `lib/guestGenerations.ts` - управление счетчиком гостевых генераций
- `components/WelcomeUpgradeModal.tsx` - модальное окно после первой генерации

## ✅ Статус
✅ **ИСПРАВЛЕНО**

## 📅 Дата
16 октября 2025

