import { fetchWithTimeout } from './fetchWithTimeout'
import { API_TIMEOUTS } from './constants'

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
- "вставь/добавь фото/картинку/изображение [объекта]" → замени элемент на: <img src="IMAGE_PLACEHOLDER" alt="описание объекта" style="max-width: 100%; height: auto; border-radius: 8px;" />
- "сделай/измени [свойство]" → измени соответствующий CSS или атрибут
- "сюда/туда/здесь" = этот выделенный элемент
- Извлеки ОБЪЕКТ из инструкции (например "огурец", "кролик", "дом") для alt текста

⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ ИЗОБРАЖЕНИЙ:
- Используй ТОЛЬКО плейсхолдер: IMAGE_PLACEHOLDER
- НЕ используй base64, data:image, http://, https://
- НЕ используй https://via.placeholder.com или другие URL
- Просто IMAGE_PLACEHOLDER в src (без префиксов, без слэшей)

ПРИМЕРЫ:
✅ "вставь сюда огурец" → <img src="IMAGE_PLACEHOLDER" alt="fresh cucumber" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
✅ "добавь фото кролика" → <img src="IMAGE_PLACEHOLDER" alt="cute rabbit" style="..." />
✅ "сделай красным" → измени style="color: red"

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
  const lowerMessage = message.toLowerCase()
  
  // Если это команда создания документа - НЕ редактирование
  const creationKeywords = [
    'создай кп',
    'создай коммерческое',
    'создай счёт',
    'создай счет',
    'создай письмо',
    'создай презентацию',
    'создай логотип',
    'создай карточку',
    'сделай кп',
    'сделай коммерческое',
    'сделай счёт',
    'сделай счет',
    'сделай письмо',
    'сделай презентацию',
    'сделай логотип',
    'сделай карточку',
    'сгенерируй',
    'напиши кп',
    'напиши письмо',
  ]
  
  // Проверяем создание документов ПЕРВЫМ
  if (creationKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return false
  }
  
  // Команды редактирования (только если не создание)
  const editKeywords = [
    'измени',
    'поменяй',
    'замени',
    'добавь',
    'вставь',
    'помести',
    'впиши',
    'внеси',
    'убери',
    'удали',
    'увеличь',
    'уменьши',
    'раскрась',
    'покрась',
    'выдели',
    'сделай жирным',
    'сделай больше',
    'сделай меньше',
    'сделай красным',
    'сделай синим',
    'сделай сюда',
    'жирным',
    'курсивом',
    'подчеркни',
    ' цвет',
    ' размер',
    ' шрифт',
    'отступ',
    'тень',
    'сюда',
    'туда',
    'здесь',
  ]
  
  // Проверяем также на упоминание изображений (с любым окончанием)
  if (lowerMessage.match(/фот[оук]/i) || 
      lowerMessage.match(/изображени/i) || 
      lowerMessage.match(/картинк/i) ||
      lowerMessage.match(/рисун/i)) {
    return true
  }
  
  return editKeywords.some(keyword => lowerMessage.includes(keyword))
}

