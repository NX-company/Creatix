import { fetchWithTimeout } from './fetchWithTimeout'
import { API_TIMEOUTS } from './constants'
import { recognizeIntent } from './intentRecognition'

export async function applyAIEdit(
  htmlContent: string,
  editInstruction: string,
  selectedElement?: { selector: string; innerHTML: string; textContent: string } | null,
  mode: 'free' | 'advanced' | 'pro' = 'free'
): Promise<{ html: string; isContextual: boolean; selector?: string }> {
  try {
    
    // 🎯 КОНТЕКСТНОЕ РЕДАКТИРОВАНИЕ для больших документов или выделенных элементов
    let contextForAI = htmlContent
    let isContextualEdit = false
    
    if (selectedElement) {
      // ВСЕГДА используем контекстное редактирование если элемент выделен
      console.log(`🎯 Contextual edit: editing only ${selectedElement.selector}`)
      console.log(`📦 Full HTML size: ${htmlContent.length} chars, using element: ${(selectedElement.innerHTML || selectedElement.textContent || '').length} chars`)
      
      contextForAI = selectedElement.innerHTML || selectedElement.textContent || '<div></div>'
      isContextualEdit = true
    }
    
    const prompt = `
Ты интеллектуальный редактор HTML элементов с глубоким пониманием контекста.

${isContextualEdit ? `
🎯 КОНТЕКСТНОЕ РЕДАКТИРОВАНИЕ:
Ты видишь ТОЛЬКО выделенный пользователем элемент (${selectedElement?.selector}).
Твоя задача: отредактировать ТОЛЬКО этот элемент согласно инструкции.
` : ''}

ТЕКУЩИЙ ${isContextualEdit ? 'ЭЛЕМЕНТ' : 'HTML'}:
${contextForAI}

ИНСТРУКЦИЯ ПОЛЬЗОВАТЕЛЯ:
"${editInstruction}"

🧠 ПОНИМАНИЕ ИНСТРУКЦИИ:
- "вставь/добавь [изображение/фото] и текст" → создай div с изображением И текстом/описанием
- "вставь/добавь фото/картинку/изображение [объекта]" → вставь img с IMAGE_PLACEHOLDER
- "вставь/добавь текст/описание [про что-то]" → вставь параграф с текстом
- "сюда/туда/здесь/в эту область" = ЭТОТ выделенный элемент
- "сделай/измени [свойство]" → измени соответствующий CSS или атрибут
- Извлеки ОБЪЕКТ/ТЕМУ из инструкции для alt текста и контента

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

✅ "сделай текст красным" → измени style="color: red"

${isContextualEdit 
  ? 'Верни ТОЛЬКО измененный элемент (без обертки html/body, без объяснений).'
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

