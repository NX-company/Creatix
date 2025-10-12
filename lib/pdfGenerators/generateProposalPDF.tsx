import type { GeneratedFile } from '../store'

export const generateProposalPDFFile = async (
  htmlContent: string, 
  timestamp: string,
  inputData: any
): Promise<GeneratedFile> => {
  try {
    console.log('Generating PDF via Playwright API...')
    
    // Создаем полный HTML с embedded стилями
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
      border-bottom: 3px solid #3b82f6; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .header h1 { 
      color: #3b82f6; 
      font-size: 32px; 
      margin-bottom: 10px; 
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .section { 
      margin-bottom: 30px; 
    }
    .section h2 { 
      color: #333; 
      border-left: 4px solid #8b5cf6; 
      padding-left: 12px; 
      margin-bottom: 15px;
      font-size: 20px;
    }
    .content {
      font-size: 14px;
      color: #333;
      line-height: 1.8;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15px; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
      font-size: 13px;
    }
    th { 
      background: #f3f4f6; 
      font-weight: 600; 
      color: #333;
    }
    .total-row { 
      font-weight: bold; 
      background: #f9fafb; 
    }
    .footer { 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 1px solid #ddd; 
      font-size: 12px; 
      color: #666; 
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Коммерческое предложение</h1>
    <p>${inputData.company || 'Ваша компания'} | ${timestamp}</p>
  </div>
  
  <div class="section">
    <div class="content">
      ${htmlContent}
    </div>
  </div>
  
  ${inputData.priceItems && inputData.priceItems.length > 0 ? `
  <div class="section">
    <h2>Таблица цен</h2>
    <table>
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Кол-во</th>
          <th>Цена</th>
          <th>Итого</th>
        </tr>
      </thead>
      <tbody>
        ${inputData.priceItems.map((item: any) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toLocaleString('ru-RU')} ₽</td>
            <td>${(item.quantity * item.price).toLocaleString('ru-RU')} ₽</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Итого:</td>
          <td>${inputData.priceItems.reduce((sum: number, item: any) => 
            sum + item.quantity * item.price, 0).toLocaleString('ru-RU')} ₽</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>${inputData.company || 'Creatix'} | Коммерческое предложение | ${timestamp}</p>
  </div>
</body>
</html>
    `
    
    // Вызываем API
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: fullHTML,
        docType: 'proposal',
        fileName: `КП_${timestamp}.pdf`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.details || 'PDF generation failed')
    }

    // Получаем blob
    const pdfBlob = await response.blob()
    const url = URL.createObjectURL(pdfBlob)
    
    console.log('PDF generated successfully')
    
    const fileTimestamp = Date.now()
    const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
    
    return {
      id: `file-${fileTimestamp}-${randomSuffix}-pdf`,
      name: `КП_${timestamp}.pdf`,
      type: 'pdf',
      url,
      blob: pdfBlob,
      createdAt: fileTimestamp,
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}

