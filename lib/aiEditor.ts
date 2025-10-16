import { fetchWithTimeout } from './fetchWithTimeout'
import { API_TIMEOUTS } from './constants'
import { recognizeIntent } from './intentRecognition'

export async function applyAIEdit(
  htmlContent: string,
  editInstruction: string,
  selectedElement?: { selector: string; innerHTML: string; outerHTML?: string; textContent: string; parentSelector?: string; parentContext?: string } | null,
  mode: 'free' | 'advanced' | 'pro' = 'free'
): Promise<{ html: string; isContextual: boolean; selector?: string }> {
  try {
    
    // 🎯 КОНТЕКСТНОЕ РЕДАКТИРОВАНИЕ для больших документов или выделенных элементов
    let contextForAI = htmlContent
    let isContextualEdit = false
    let elementContext = ''
    
    if (selectedElement) {
      // ВСЕГДА используем контекстное редактирование если элемент выделен
      console.log(`🎯 Contextual edit: editing only ${selectedElement.selector}`)
      
      // Используем outerHTML для полного контекста элемента
      const elementHTML = selectedElement.outerHTML || selectedElement.innerHTML || selectedElement.textContent || '<div></div>'
      console.log(`📦 Full HTML size: ${htmlContent.length} chars, element: ${elementHTML.length} chars`)
      
      // Добавляем контекст родителя для точности
      if (selectedElement.parentContext && selectedElement.parentSelector) {
        elementContext = `\n🏠 РОДИТЕЛЬСКИЙ КОНТЕКСТ:\nЭлемент находится внутри: ${selectedElement.parentContext}\nСелектор родителя: ${selectedElement.parentSelector}\n`
      }
      
      contextForAI = elementHTML
      isContextualEdit = true
    }
    
    const prompt = `
Ты интеллектуальный редактор HTML элементов с глубоким пониманием контекста.

${isContextualEdit ? `
🎯 КОНТЕКСТНОЕ РЕДАКТИРОВАНИЕ:
Ты видишь ТОЛЬКО выделенный пользователем элемент (${selectedElement?.selector}).
Твоя задача: отредактировать ТОЛЬКО этот элемент согласно инструкции.
${elementContext}
` : ''}

ТЕКУЩИЙ ${isContextualEdit ? 'ЭЛЕМЕНТ' : 'HTML'}:
${contextForAI}

ИНСТРУКЦИЯ ПОЛЬЗОВАТЕЛЯ:
"${editInstruction}"

🧠 ПОНИМАНИЕ ИНСТРУКЦИИ:
- "вставь/добавь [изображение/фото] и текст" → создай div с изображением И текстом/описанием
- "вставь/добавь фото/картинку/изображение [объекта]" → вставь img с IMAGE_PLACEHOLDER
- "вставь/добавь текст/описание [про что-то]" → вставь параграф с текстом
- "сюда/туда/здесь/в эту область/тут" = ЗАМЕНИ СОДЕРЖИМОЕ ЭТОГО выделенного элемента
- "сделай/измени [свойство]" → измени соответствующий CSS или атрибут

🎨 ЦВЕТА И СТИЛИ (КРИТИЧЕСКИ ВАЖНО - НЕ ПУТАЙ!):
- "цвет [цвета]" / "цвет текста [цвета]" / "текст [цвета]" → ТОЛЬКО style="color: [цвет]"
- "фон [цвета]" / "фон на [цвет]" / "цвет фона [цвета]" / "background [цвета]" / "бэкграунд [цвета]" → ТОЛЬКО style="background-color: [цвет]" или style="background: [цвет]"
- "поменяй цвет на красный" = style="color: red" (ТЕКСТ красный, НЕ фон!)
- "поменяй фон на красный" = style="background-color: red" (ФОН красный, НЕ текст!)
- "красный цвет" = color: red (цвет ТЕКСТА)
- "красный фон" = background-color: red (цвет ФОНА)
- Если слово "ФОН" упомянуто → изменяй ТОЛЬКО background, НЕ color!
- Если слово "ТЕКСТ" или просто "ЦВЕТ" → изменяй ТОЛЬКО color, НЕ background!

- Извлеки ОБЪЕКТ/ТЕМУ из инструкции для alt текста и контента

⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ КОНТЕКСТНОГО РЕДАКТИРОВАНИЯ:
- ЗАМЕНИ ВЕСЬ ЭЛЕМЕНТ полностью, включая его открывающий и закрывающий теги
- Сохрани тип элемента (div, section, etc.) или измени на подходящий
- Удали старое содержимое и вставь новое ВНУТРЬ элемента
- НЕ добавляй элемент рядом - ЗАМЕНИ его содержимое!

⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ ИЗОБРАЖЕНИЙ:
- Используй ТОЛЬКО плейсхолдер: IMAGE_PLACEHOLDER
- НЕ используй base64, data:image, http://, https://
- НЕ используй https://via.placeholder.com или другие URL
- Просто IMAGE_PLACEHOLDER в src (без префиксов, без слэшей)

ПРИМЕРЫ КОМАНД:
✅ "вставь сюда изображение огурца и текст про него" → 
   <div style="display: flex; gap: 16px; align-items: center;">
     <img src="IMAGE_PLACEHOLDER" alt="fresh cucumber" style="max-width: 200px; height: auto; border-radius: 8px;" />
     <p>Свежий хрустящий огурец, идеально подходит для салатов</p>
   </div>

✅ "добавь сюда фото кролика" → 
   <img src="IMAGE_PLACEHOLDER" alt="cute rabbit" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />

✅ "вставь описание продукта" → 
   <p style="font-size: 16px; line-height: 1.6;">Описание продукта с основными характеристиками</p>

✅ "сделай текст красным" / "поменяй цвет на красный" / "красный цвет" → измени style="color: red" (ТЕКСТ красный)
✅ "сделай фон красным" / "поменяй фон на красный" / "красный фон" / "красный background" → измени style="background-color: red" (ФОН красный)
✅ "цвет синий" → style="color: blue" (цвет ТЕКСТА синий)
✅ "фон синий" → style="background-color: blue" (цвет ФОНА синий)

${isContextualEdit 
  ? `ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО полностью отредактированный элемент с открывающим и закрывающим тегами.
Пример: <div style="...">НОВОЕ СОДЕРЖИМОЕ С IMAGE_PLACEHOLDER</div>
БЕЗ обертки html/body, БЕЗ объяснений, БЕЗ markdown.`
  : 'Верни полный HTML документ.'
}`

    // Выбираем модель в зависимости от режима
    const aiModel = (mode === 'advanced' || mode === 'pro') 
      ? 'openai/gpt-4o'  // Умная модель для Advanced и PRO
      : 'google/gemini-2.5-flash-lite'  // Быстрая модель для FREE

    console.log(`🤖 AI Editor using model: ${aiModel} (contextual: ${isContextualEdit}, mode: ${mode})`)

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: `Ты эксперт по ${isContextualEdit ? 'контекстному редактированию HTML элементов' : 'редактированию HTML документов'}. Ты понимаешь намерения пользователя и применяешь изменения точно. Возвращай только чистый HTML без markdown разметки и объяснений.` 
          },
          { role: "user", content: prompt }
        ],
        model: aiModel,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('AI edit request failed')
    }

    const data = await response.json()
    let editedHtml = data.content || contextForAI
    
    // Убираем markdown разметку если AI всё же её добавил
    editedHtml = editedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
    
    console.log(`✅ AI returned ${editedHtml.length} chars${isContextualEdit ? ' (element only)' : ' (full HTML)'}`)
    
    return {
      html: editedHtml,
      isContextual: isContextualEdit,
      selector: selectedElement?.selector
    }
  } catch (error) {
    console.error('AI Edit Error:', error)
    throw new Error(`Ошибка AI редактирования: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  }
}

// Проверяет, является ли сообщение командой редактирования
export function isEditCommand(message: string): boolean {
  const intent = recognizeIntent(message)
  return intent.action === 'edit'
}

