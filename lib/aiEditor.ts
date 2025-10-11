import { fetchWithTimeout } from './fetchWithTimeout'
import { API_TIMEOUTS } from './constants'

export async function applyAIEdit(
  htmlContent: string,
  editInstruction: string,
  selectedElement?: { selector: string; innerHTML: string; textContent: string } | null
): Promise<string> {
  try {
    
    let contextInfo = ''
    if (selectedElement) {
      contextInfo = `
🎯 ВЫДЕЛЕННЫЙ ЭЛЕМЕНТ (редактируй ТОЛЬКО его!):
Селектор: ${selectedElement.selector}
Текущий текст: "${selectedElement.textContent}"

⚠️ ВАЖНО: Измени ТОЛЬКО этот элемент (${selectedElement.selector}), НЕ трогай остальную часть документа!
`
    }
    
    const prompt = `
Ты редактор HTML документов.${contextInfo}

ТЕКУЩИЙ HTML:
${htmlContent}

ИНСТРУКЦИЯ ПО ИЗМЕНЕНИЮ:
${editInstruction}

ЗАДАЧА:
Примени изменения к HTML${selectedElement ? ` (ТОЛЬКО к элементу ${selectedElement.selector})` : ''} согласно инструкции и верни ТОЛЬКО измененный HTML без объяснений.

ВАЖНО:
- Сохрани всю структуру документа
${selectedElement ? `- Измени ТОЛЬКО элемент ${selectedElement.selector}, остальное НЕ трогай` : '- Измени только то, что указано в инструкции'}
- Верни полный HTML документ
- НЕ добавляй markdown разметку (не используй \`\`\`html)
- Просто верни чистый HTML

ПРИМЕРЫ ИНСТРУКЦИЙ:
- "Сделай заголовок красным" → измени color${selectedElement ? ` элемента ${selectedElement.selector}` : ' заголовка'} на red
- "Измени текст в первом абзаце на..." → замени содержимое${selectedElement ? ` элемента ${selectedElement.selector}` : ' первого <p>'}
- "Увеличь размер шрифта" → увеличь font-size${selectedElement ? ` элемента ${selectedElement.selector}` : ''}
- "Добавь тень к тексту" → добавь text-shadow${selectedElement ? ` к элементу ${selectedElement.selector}` : ''}
`

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: "Ты эксперт по редактированию HTML. Применяй изменения точно по инструкции и возвращай только чистый HTML без markdown разметки." 
          },
          { role: "user", content: prompt }
        ],
        model: "google/gemini-2.5-flash-lite",
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('AI edit request failed')
    }

    const data = await response.json()
    let editedHtml = data.content || htmlContent
    
    // Убираем markdown разметку если AI всё же её добавил
    editedHtml = editedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
    
    return editedHtml
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
    'добавь к',
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
    'жирным',
    'курсивом',
    'подчеркни',
    ' цвет',
    ' размер',
    ' шрифт',
    'отступ',
    'тень',
  ]
  
  return editKeywords.some(keyword => lowerMessage.includes(keyword))
}

