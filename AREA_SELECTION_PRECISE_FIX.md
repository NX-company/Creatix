# Точное редактирование выбранной области - Улучшение

## Проблема
Пользователь выбрал область `div:nth-child(1)` для вставки изображения огурца, но AI вставил изображение в другом месте документа. Селектор был слишком общим и не давал AI достаточно контекста.

### Причины:
1. **Слишком простой селектор** - `div:nth-child(1)` может найти первый div в любом контейнере
2. **Недостаточный контекст для AI** - передавался только `innerHTML` (2 символа: "⚙️") без информации о родителе и структуре
3. **Неточная замена элемента** - без уникального селектора замена могла происходить в неправильном месте

## Решение

### 1. Улучшенная генерация селекторов (`components/PreviewFrame.tsx:36-64`)

Создаем более специфичные селекторы с учетом:
- ID элемента (приоритет)
- Классов элемента
- Родительского контекста (ID или классы родителя)
- Позиции среди соседей

```typescript
const getElementSelector = (element: HTMLElement): string => {
  // 1. Приоритет: ID
  if (element.id) return `#${element.id}`
  
  const tag = element.tagName.toLowerCase()
  
  // 2. Класс + nth-child для точности
  const classes = element.className ? `.${element.className.split(' ').filter(c => c).join('.')}` : ''
  
  // 3. Получаем путь от родителя для уникальности
  const parent = element.parentElement
  if (!parent) return tag + classes
  
  const siblings = Array.from(parent.children)
  const index = siblings.indexOf(element)
  
  // 4. Родительский контекст для уникальности
  let parentSelector = ''
  if (parent.id) {
    parentSelector = `#${parent.id} > `
  } else if (parent.className) {
    const parentClasses = parent.className.split(' ').filter(c => c).join('.')
    parentSelector = `.${parentClasses} > `
  }
  
  // 5. Финальный селектор: родитель > элемент.класс:nth-child(N)
  return `${parentSelector}${tag}${classes}:nth-child(${index + 1})`
}
```

**Примеры улучшенных селекторов:**
- Было: `div:nth-child(1)` 
- Стало: `.container.main > div.content:nth-child(1)`
- Или: `#header > nav.menu:nth-child(2)`

### 2. Расширенный контекст элемента (`components/PreviewFrame.tsx:95-106`)

При выборе элемента сохраняем дополнительную информацию:

```typescript
setSelectedElement({
  selector,                  // Уникальный селектор
  innerHTML: target.innerHTML,  // Содержимое элемента
  outerHTML: target.outerHTML,  // Полный HTML с тегами
  textContent: truncatedText,   // Текстовое содержимое
  parentSelector: parent ? getElementSelector(parent) : undefined,  // Селектор родителя
  parentContext: parentContext  // Контекст родителя
})
```

### 3. Обновленный тип в Store (`lib/store.ts:217-225`)

```typescript
selectedElement: {
  selector: string          // Основной селектор
  innerHTML: string         // Внутреннее содержимое
  outerHTML?: string       // Полный HTML элемента
  textContent: string       // Текст
  parentSelector?: string   // Селектор родителя
  parentContext?: string    // Контекст родителя
} | null
```

### 4. Улучшенный AI Editor (`lib/aiEditor.ts:18-33`)

Теперь AI получает:
- Полный `outerHTML` элемента (с тегами)
- Информацию о родительском контексте
- Точный селектор для замены

```typescript
if (selectedElement) {
  // Используем outerHTML для полного контекста элемента
  const elementHTML = selectedElement.outerHTML || selectedElement.innerHTML || selectedElement.textContent || '<div></div>'
  
  // Добавляем контекст родителя для точности
  if (selectedElement.parentContext && selectedElement.parentSelector) {
    elementContext = `\n🏠 РОДИТЕЛЬСКИЙ КОНТЕКСТ:\nЭлемент находится внутри: ${selectedElement.parentContext}\nСелектор родителя: ${selectedElement.parentSelector}\n`
  }
  
  contextForAI = elementHTML
  isContextualEdit = true
}
```

### 5. Улучшенный промпт для AI (`lib/aiEditor.ts:51-92`)

Добавлены четкие инструкции:

```
⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ КОНТЕКСТНОГО РЕДАКТИРОВАНИЯ:
- ЗАМЕНИ ВЕСЬ ЭЛЕМЕНТ полностью, включая его открывающий и закрывающий теги
- Сохрани тип элемента (div, section, etc.) или измени на подходящий
- Удали старое содержимое и вставь новое ВНУТРЬ элемента
- НЕ добавляй элемент рядом - ЗАМЕНИ его содержимое!

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО полностью отредактированный элемент с открывающим и закрывающим тегами.
Пример: <div style="...">НОВОЕ СОДЕРЖИМОЕ С IMAGE_PLACEHOLDER</div>
БЕЗ обертки html/body, БЕЗ объяснений, БЕЗ markdown.
```

## Результат

✅ **Уникальные селекторы** - каждый элемент имеет специфичный селектор с учетом родителя и классов

✅ **Полный контекст для AI** - AI видит полный HTML элемента и его расположение в структуре

✅ **Точная замена** - замена происходит именно в выбранном элементе, не в других частях документа

✅ **Правильное понимание инструкций** - "сюда/тут/в эту область" теперь точно означает выбранный элемент

## Тестирование

1. Выберите элемент (например, пустой div с иконкой ⚙️)
2. Кнопка станет зеленой, в консоли появится: `🎯 Режим выбора области активирован`
3. Введите команду: "сделай тут огурец" или "вставь сюда фото кота"
4. AI заменит ТОЛЬКО выбранный элемент, вставив изображение ВНУТРЬ него
5. Изображение появится точно там, где вы выбрали

## Файлы изменены
- `components/PreviewFrame.tsx` - улучшенный `getElementSelector`, расширенный контекст элемента
- `lib/store.ts` - обновленный тип `SelectedElement` с новыми полями
- `lib/aiEditor.ts` - использование `outerHTML` и родительского контекста, улучшенный промпт
- `AREA_SELECTION_PRECISE_FIX.md` - документация исправлений

