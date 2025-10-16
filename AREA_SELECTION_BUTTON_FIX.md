# Area Selection Button - Bug Fix

## Проблема
После редизайна кнопки выбора области пользователь не мог выбрать элемент в превью. Ошибки в консоли:
```
Failed to restore outline: SyntaxError: Failed to execute 'querySelector' on 'Document': The provided selector is empty.
```

## Причина
1. **Отсутствие проверки на пустой selector**: Когда кнопка активировала режим выбора (`selectedElement = { selector: '', ... }`), код пытался выполнить `querySelector('')`, что вызывало ошибку.
2. **Отсутствие логики подключения обработчиков**: После удаления `isSelectMode` state и функции `enableSelectMode()`, не было автоматического подключения event listeners к iframe для обработки кликов.
3. **Неправильный порядок определений**: Функции `handleMouseOver`, `handleMouseOut`, `handleElementClick` использовались в `useEffect` до их объявления.

## Решение

### 1. Проверка на пустой selector (components/PreviewFrame.tsx:38)
```typescript
useEffect(() => {
  if (!selectedElement || !selectedElement.selector) return
  // ... rest of code
}, [htmlPreview, selectedElement])
```

### 2. Автоматическое включение режима выбора (components/PreviewFrame.tsx:189-219)
Добавлен новый `useEffect`, который:
- Определяет активность режима: `selectedElement !== null && !selectedElement.selector`
- Автоматически подключает event listeners к iframe:
  - `mouseover` → подсветка элемента оранжевым
  - `mouseout` → снятие подсветки
  - `click` → фиксация выбранного элемента
- Автоматически отключает listeners при деактивации режима

```typescript
useEffect(() => {
  const iframe = iframeRef.current
  if (!iframe) return

  const isSelectModeActive = selectedElement !== null && !selectedElement.selector

  if (isSelectModeActive) {
    const timer = setTimeout(() => {
      const doc = iframe.contentDocument
      if (!doc) return

      doc.body.addEventListener('mouseover', handleMouseOver)
      doc.body.addEventListener('mouseout', handleMouseOut)
      doc.body.addEventListener('click', handleElementClick)
    }, 100)

    return () => {
      clearTimeout(timer)
      const doc = iframe.contentDocument
      if (doc) {
        doc.body.removeEventListener('mouseover', handleMouseOver)
        doc.body.removeEventListener('mouseout', handleMouseOut)
        doc.body.removeEventListener('click', handleElementClick)
      }
    }
  }
}, [selectedElement, handleMouseOver, handleMouseOut, handleElementClick])
```

### 3. Оптимизация с useCallback (components/PreviewFrame.tsx:51-140)
Обернули обработчики в `useCallback` для стабильных ссылок:
```typescript
const handleMouseOver = useCallback((e: Event) => { ... }, [])
const handleMouseOut = useCallback((e: Event) => { ... }, [])
const handleElementClick = useCallback((e: Event) => { ... }, [setSelectedElement, addMessage])
```

### 4. Правильный порядок определений
Переместили функции `getElementSelector`, `handleMouseOver`, `handleMouseOut`, `handleElementClick` **перед** `useEffect`, который их использует (строки 36-140).

### 5. Удаление дубликатов
Удалили дублирующиеся определения функций, которые остались после рефакторинга.

## Результат
✅ Кнопка выбора области работает корректно:
- **Серая** → режим выключен
- **Оранжевая с пульсацией** → режим активен, ожидает выбора элемента
- **Зеленая** → область выбрана и зафиксирована

✅ При клике на кнопку автоматически подключаются обработчики событий к iframe
✅ Пользователь может кликнуть на любой элемент в превью
✅ Выбранный элемент подсвечивается зеленой пульсирующей рамкой
✅ AI редактирует только выбранную область

## Файлы изменены
- `components/PreviewFrame.tsx` - добавлена проверка selector, автоматическое управление event listeners, оптимизация с useCallback
- `AREA_SELECTION_BUTTON_FIX.md` - документация исправлений

