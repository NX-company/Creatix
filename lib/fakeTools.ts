import { generateContent, generateHTML, getPromptForAction } from './api'
import type { DocType } from './store'

export const fakeImport = async (source: string, docType: DocType = 'proposal'): Promise<string> => {
  try {
    const specificPrompt = getPromptForAction(docType, 'contentGeneration')
    const prompt = specificPrompt 
      ? `${specificPrompt}\n\nИмпортируй и структурируй данные из источника: ${source}`
      : `Создай контент для импорта из источника: ${source}`
    
    const content = await generateContent(prompt, docType)
    return `Данные импортированы из ${source}:\n\n${content}`
  } catch (error) {
    return `Данные импортированы из ${source} (fallback)`
  }
}

export const fakePropose = async (docType: DocType = 'proposal'): Promise<string[]> => {
  try {
    const specificPrompt = getPromptForAction(docType, 'layoutSuggestions')
    const prompt = specificPrompt || `Предложи 3 варианта макетов для документа типа ${docType}`
    
    const content = await generateContent(prompt, docType)
    const lines = content.split('\n').filter(line => line.trim())
    
    return lines.slice(0, 3).length > 0 
      ? lines.slice(0, 3) 
      : ['Макет А: Современный', 'Макет Б: Классический', 'Макет В: Минималистичный']
  } catch (error) {
    return ['Макет А: Современный', 'Макет Б: Классический', 'Макет В: Минималистичный']
  }
}

export const fakeRender = async (docType: DocType = 'proposal', styleConfig: any = {}): Promise<string> => {
  try {
    const contentPrompt = getPromptForAction(docType, 'contentGeneration')
    const htmlPrompt = getPromptForAction(docType, 'htmlGeneration')
    
    const contentQuery = contentPrompt 
      ? `${contentPrompt}\n\nСоздай контент с учётом стиля: ${JSON.stringify(styleConfig)}`
      : `Создай контент для ${docType}`
    
    const content = await generateContent(contentQuery, docType)
    
    const htmlQuery = htmlPrompt
      ? `${htmlPrompt}\n\nКонтент: ${content}\n\nСтиль: ${JSON.stringify(styleConfig)}`
      : content
    
    const html = await generateHTML(htmlQuery, docType, styleConfig)
    return html
  } catch (error) {
    // Fallback HTML
    await new Promise((r) => setTimeout(r, 800))
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Inter, sans-serif; margin: 40px; background: #fff; color: #000; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #3b82f6; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-left: 4px solid #8b5cf6; padding-left: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Коммерческое предложение</h1>
        <p>Название компании | Дата: 2025-10-09</p>
      </div>
      <div class="section">
        <h2>Введение</h2>
        <p>Это образец коммерческого предложения, созданный агентом NX Studio. Замените этот текст своим контентом.</p>
      </div>
      <div class="section">
        <h2>Таблица цен</h2>
        <table>
          <thead>
            <tr><th>Услуга</th><th>Кол-во</th><th>Цена</th><th>Итого</th></tr>
          </thead>
          <tbody>
            <tr><td>Услуга А</td><td>10</td><td>$100</td><td>$1,000</td></tr>
            <tr><td>Услуга Б</td><td>5</td><td>$250</td><td>$1,250</td></tr>
            <tr><td colspan="3" style="text-align:right; font-weight:600;">Итого:</td><td style="font-weight:600;">$2,250</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <h2>Условия</h2>
        <p>Условия оплаты: 30 дней. Все цены в USD.</p>
      </div>
      <div class="footer">
        <p>NX Studio | contact@nxstudio.com | +1 234 567 890</p>
      </div>
    </body>
    </html>
    `
  }
}

export const fakeExport = async (format: string): Promise<string> => {
  await new Promise((r) => setTimeout(r, 600))
  return `data:text/${format};base64,SGVsbG8gV29ybGQ=`
}

export const fakeSave = async (name: string): Promise<string> => {
  await new Promise((r) => setTimeout(r, 500))
  return `Сохранено как "${name}"`
}

