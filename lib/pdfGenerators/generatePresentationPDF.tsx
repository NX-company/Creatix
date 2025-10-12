import type { GeneratedFile } from '../store'

export const generatePresentationPDFFile = async (
  htmlContent: string, 
  timestamp: string,
  inputData: any
): Promise<GeneratedFile> => {
  try {
    console.log('Generating Presentation PDF via Playwright API...')
    
    const slides = Array.isArray(inputData.slides) && inputData.slides.length > 0
      ? inputData.slides.map((slide: any) => ({
          title: String(slide.title || 'Слайд'),
          content: String(slide.content || '')
        }))
      : [
          { title: 'Введение', content: 'Основные тезисы' },
          { title: 'Преимущества', content: 'Ключевые преимущества' },
          { title: 'Выводы', content: 'Заключение' }
        ]
    
    // Создаем полный HTML для презентации (альбомная ориентация)
    const fullHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      padding: 40px; 
      background: #fff;
      color: #000;
      line-height: 1.6;
    }
    .header { 
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    .header h1 { 
      color: #3b82f6; 
      font-size: 42px; 
      margin-bottom: 10px;
      font-weight: bold;
    }
    .header p {
      color: #666;
      font-size: 18px;
    }
    .section { 
      margin-bottom: 30px; 
    }
    .section h2 { 
      color: #333; 
      border-left: 4px solid #8b5cf6; 
      padding-left: 12px; 
      margin-bottom: 15px;
      font-size: 24px;
    }
    .content {
      font-size: 16px;
      color: #333;
      line-height: 1.8;
    }
    .slides-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    .slide {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 30px;
      background: #f9fafb;
    }
    .slide h3 {
      color: #3b82f6;
      font-size: 28px;
      margin-bottom: 15px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
    }
    .slide p {
      font-size: 18px;
      line-height: 1.6;
      color: #374151;
    }
    .footer { 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 1px solid #ddd; 
      font-size: 14px; 
      color: #666; 
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${inputData.title || 'Презентация'}</h1>
    <p>${inputData.subtitle || 'Презентация проекта'} | ${timestamp}</p>
  </div>
  
  <div class="section">
    <div class="content">
      ${htmlContent}
    </div>
  </div>
  
  ${slides.length > 0 ? `
  <div class="section">
    <h2>Слайды презентации</h2>
    <div class="slides-container">
      ${slides.map((slide: any, index: number) => `
        <div class="slide">
          <h3>Слайд ${index + 1}: ${slide.title}</h3>
          <p>${slide.content}</p>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>${inputData.author || 'Creatix'} | Презентация | ${timestamp}</p>
  </div>
</body>
</html>
    `
    
    // Вызываем API с landscape ориентацией
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: fullHTML,
        docType: 'presentation',
        fileName: `Презентация_${timestamp}.pdf`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.details || 'PDF generation failed')
    }

    // Получаем blob
    const pdfBlob = await response.blob()
    const url = URL.createObjectURL(pdfBlob)
    
    console.log('Presentation PDF generated successfully')
    
    const fileTimestamp = Date.now()
    const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
    
    return {
      id: `file-${fileTimestamp}-${randomSuffix}-pdf`,
      name: `Презентация_${timestamp}.pdf`,
      type: 'pdf',
      url,
      blob: pdfBlob,
      createdAt: fileTimestamp,
    }
  } catch (error) {
    console.error('Presentation PDF generation error:', error)
    throw error
  }
}

