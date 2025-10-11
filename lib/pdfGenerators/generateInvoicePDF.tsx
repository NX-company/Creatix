import type { GeneratedFile } from '../store'

export const generateInvoicePDFFile = async (htmlContent: string, data: any, timestamp: string): Promise<GeneratedFile> => {
  try {
    console.log('Generating Invoice PDF via Playwright API...')
    
    const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.priceItems) ? data.priceItems : [])
    const validItems = items.length > 0 
      ? items.map((item: any) => ({
          name: String(item.name || 'Позиция'),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        }))
      : [
          { name: 'Услуга 1', quantity: 1, price: 10000 },
          { name: 'Услуга 2', quantity: 1, price: 5000 }
        ]
    
    const totalWithoutVAT = validItems.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0)
    const vat = totalWithoutVAT * 0.2
    const total = totalWithoutVAT + vat
    
    // Создаем полный HTML для счета
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
      border-bottom: 3px solid #dc2626;
      padding-bottom: 20px;
    }
    .header h1 { 
      color: #dc2626; 
      font-size: 36px; 
      margin-bottom: 10px;
      font-weight: bold;
    }
    .header p {
      color: #666;
      font-size: 16px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .company-info {
      flex: 1;
    }
    .invoice-details {
      flex: 1;
      text-align: right;
    }
    .section { 
      margin-bottom: 30px; 
    }
    .section h2 { 
      color: #333; 
      border-left: 4px solid #dc2626; 
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
    <h1>СЧЁТ НА ОПЛАТУ</h1>
    <p>Номер: ${data.invoiceNumber || `INV-${Date.now()}`} от ${timestamp}</p>
  </div>
  
  <div class="invoice-info">
    <div class="company-info">
      <h3>Поставщик:</h3>
      <p>${data.seller?.name || 'ООО Компания'}</p>
      <p>ИНН: ${data.seller?.inn || '1234567890'}</p>
      <p>Адрес: ${data.seller?.address || 'г. Город, ул. Улица, д. 1'}</p>
    </div>
    <div class="invoice-details">
      <h3>Покупатель:</h3>
      <p>${data.buyer?.name || 'ООО Клиент'}</p>
      <p>ИНН: ${data.buyer?.inn || '0987654321'}</p>
      <p>Адрес: ${data.buyer?.address || 'г. Город, ул. Другая, д. 2'}</p>
    </div>
  </div>
  
  <div class="section">
    <div class="content">
      ${htmlContent}
    </div>
  </div>
  
  ${validItems.length > 0 ? `
  <div class="section">
    <h2>Позиции:</h2>
    <table>
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Ед.изм.</th>
          <th>Кол-во</th>
          <th>Цена</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${validItems.map((item: any, index: number) => `
          <tr>
            <td>${item.name}</td>
            <td>шт</td>
            <td>${item.quantity}</td>
            <td>${item.price.toLocaleString('ru-RU')} ₽</td>
            <td>${(item.quantity * item.price).toLocaleString('ru-RU')} ₽</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">Итого без НДС:</td>
          <td>${(Math.round(totalWithoutVAT * 100) / 100).toLocaleString('ru-RU')} ₽</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">НДС (20%):</td>
          <td>${(Math.round(vat * 100) / 100).toLocaleString('ru-RU')} ₽</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">Всего к оплате:</td>
          <td>${(Math.round(total * 100) / 100).toLocaleString('ru-RU')} ₽</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Спасибо за сотрудничество! | ${data.company || 'NX Studio'} | ${timestamp}</p>
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
        docType: 'invoice',
        fileName: `Счёт_${data.invoiceNumber || `INV-${Date.now()}`}.pdf`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.details || 'PDF generation failed')
    }

    // Получаем blob
    const pdfBlob = await response.blob()
    const url = URL.createObjectURL(pdfBlob)
    
    console.log('Invoice PDF generated successfully')
    
    const fileTimestamp = Date.now()
    const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
    
    return {
      id: `file-${fileTimestamp}-${randomSuffix}-pdf`,
      name: `Счёт_${data.invoiceNumber || `INV-${Date.now()}`}.pdf`,
      type: 'pdf',
      url,
      blob: pdfBlob,
      createdAt: fileTimestamp,
    }
  } catch (error) {
    console.error('Invoice PDF generation error:', error)
    throw error
  }
}

