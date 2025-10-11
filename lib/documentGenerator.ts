import ExcelJS from 'exceljs'
import { generateProposalPDFFile } from './pdfGenerators/generateProposalPDF'
import { generateInvoicePDFFile } from './pdfGenerators/generateInvoicePDF'
import { generatePresentationPDFFile } from './pdfGenerators/generatePresentationPDF'
import { generateProposalDOCFile } from './docGenerators/generateProposalDOC'
import { generateInvoiceDOCFile } from './docGenerators/generateInvoiceDOC'
import { generateEmailDOCFile } from './docGenerators/generateEmailDOC'
import { generatePresentationDOCFile } from './docGenerators/generatePresentationDOC'
import { addImagesToWorksheet } from './imageHelper'
import { generateFileId } from './idGenerator'
import { EXCEL_STYLES } from './constants'
import type { DocType, PriceItem, GeneratedFile } from './store'

export const generateDocumentFiles = async (
  docType: DocType,
  htmlContent: string,
  data: {
    priceItems: PriceItem[]
    styleConfig: any
    invoiceNumber?: string
    items?: PriceItem[]
    totalWithoutVAT?: number
    vat?: number
    total?: number
  },
  selectedFormats: string[] = []
): Promise<GeneratedFile[]> => {
  const files: GeneratedFile[] = []
  const timestamp = new Date().toLocaleDateString('ru-RU')
  
  const should = (format: string) => 
    selectedFormats.length === 0 || selectedFormats.includes(format)

  switch (docType) {
    case 'proposal':
      if (should('PDF')) files.push(await generateProposalPDF(htmlContent, timestamp, data))
      if (should('Excel')) files.push(await generateProposalExcel(htmlContent, data, timestamp))
      if (should('DOC')) files.push(await generateProposalDOCFile(htmlContent, data, timestamp))
      break

    case 'invoice':
      if (should('Excel')) files.push(await generateInvoiceExcel(htmlContent, data, timestamp))
      if (should('PDF')) files.push(await generateInvoicePDF(htmlContent, data, timestamp))
      if (should('DOC')) files.push(await generateInvoiceDOCFile(htmlContent, data, timestamp))
      break

    case 'email':
      if (should('HTML')) files.push(await generateEmailHTML(htmlContent, timestamp))
      if (should('DOC')) files.push(await generateEmailDOCFile(htmlContent, timestamp))
      break

    case 'presentation':
      if (should('PDF')) files.push(await generatePresentationPDF(htmlContent, timestamp, data))
      if (should('DOC')) files.push(await generatePresentationDOCFile(htmlContent, timestamp))
      break

    case 'logo':
      if (should('SVG')) files.push(await generateLogoSVG(htmlContent, timestamp))
      if (should('PNG')) files.push(await generateLogoPNG(htmlContent, timestamp))
      if (should('PDF')) files.push(await generateLogoPDF(htmlContent, timestamp, data))
      if (should('DOC')) files.push(await generateLogoDOC(htmlContent, timestamp))
      break

    case 'product-card':
      if (should('PNG (WB 3:4)')) files.push(await generateProductCardPNG_WB(htmlContent, timestamp))
      if (should('PNG (Универсал)')) files.push(await generateProductCardPNG_Universal(htmlContent, timestamp))
      if (should('PDF')) files.push(await generateProductCardPDF(htmlContent, timestamp, data))
      break

    default:
      break
  }

  return files
}

const generateProposalPDF = async (htmlContent: string, timestamp: string, data: any): Promise<GeneratedFile> => {
  return generateProposalPDFFile(htmlContent, timestamp, data)
}

const generateProposalHTML = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Коммерческое предложение</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      max-width: 100%;
      background: #fff;
    }
    @media (max-width: 600px) {
      body { padding: 10px; font-size: 14px; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
  
  const htmlBlob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(htmlBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-html`,
    name: `КП_${timestamp}.html`,
    type: 'html',
    url,
    blob: htmlBlob,
    createdAt: fileTimestamp,
  }
}

const generateProposalExcel = async (htmlContent: string, data: any, timestamp: string): Promise<GeneratedFile> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Коммерческое предложение')
  
  // Парсим HTML для извлечения контента
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  // Извлекаем заголовок из HTML
  const h1 = doc.querySelector('h1')
  const h2 = doc.querySelector('h2')
  const title = h1 ? h1.textContent?.trim() : (h2 ? h2.textContent?.trim() : 'Коммерческое предложение')
  
  // Извлекаем все параграфы (описание)
  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  // Вставляем изображения в начало документа
  let currentRow = await addImagesToWorksheet(workbook, worksheet, doc, 0)
  
  currentRow++
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = title || 'Коммерческое предложение'
  titleCell.font = { size: 18, bold: true, color: { argb: EXCEL_STYLES.COLORS.PRIMARY } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: EXCEL_STYLES.COLORS.PRIMARY_LIGHT }
  }
  worksheet.getRow(currentRow).height = EXCEL_STYLES.ROW_HEIGHT.TITLE
  
  currentRow++
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  const dateCell = worksheet.getCell(`A${currentRow}`)
  dateCell.value = `${data.company || 'Ваша компания'} | Дата: ${timestamp}`
  dateCell.font = { size: 12, color: { argb: EXCEL_STYLES.COLORS.MUTED } }
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getRow(currentRow).height = EXCEL_STYLES.ROW_HEIGHT.DATA
  
  // Добавляем текстовое содержимое из превью
  currentRow++
  if (paragraphs.length > 0) {
    paragraphs.forEach(text => {
      if (text) {
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
        const textCell = worksheet.getCell(`A${currentRow}`)
        textCell.value = text
        textCell.font = { size: 11 }
        textCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
        const estimatedHeight = Math.max(20, Math.ceil(text.length / 80) * 15)
        worksheet.getRow(currentRow).height = estimatedHeight
        currentRow++
      }
    })
  }
  
  // Пустая строка перед таблицей
  currentRow++
  
  // Извлекаем таблицу из HTML (если есть)
  const table = doc.querySelector('table')
  let tableData = data.priceItems || []
  
  if (table && table.rows.length > 1) {
    // Парсим таблицу из HTML
    tableData = []
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i]
      if (row.cells.length >= 3 && !row.classList.contains('total-row')) {
        const name = row.cells[0].textContent?.trim() || ''
        const quantity = parseFloat(row.cells[1].textContent?.replace(/[^\d.]/g, '') || '1')
        const price = parseFloat(row.cells[2].textContent?.replace(/[^\d.]/g, '') || '0')
        
        if (name) {
          tableData.push({ name, quantity, price })
        }
      }
    }
  }
  
  const headerRow = worksheet.addRow(['Наименование', 'Количество', 'Цена', 'Итого'])
  headerRow.font = { bold: true, color: { argb: EXCEL_STYLES.COLORS.WHITE }, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: EXCEL_STYLES.COLORS.PRIMARY }
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = EXCEL_STYLES.ROW_HEIGHT.HEADER
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: EXCEL_STYLES.COLORS.BORDER } },
      left: { style: 'thin', color: { argb: EXCEL_STYLES.COLORS.BORDER } },
      bottom: { style: 'thin', color: { argb: EXCEL_STYLES.COLORS.BORDER } },
      right: { style: 'thin', color: { argb: EXCEL_STYLES.COLORS.BORDER } }
    }
  })
  
  // Данные
  let totalAmount = 0
  if (data.priceItems && data.priceItems.length > 0) {
    data.priceItems.forEach((item: PriceItem, index: number) => {
      const itemTotal = item.quantity * item.price
      totalAmount += itemTotal
      
      const row = worksheet.addRow([
        item.name,
        item.quantity,
        item.price,
        itemTotal
      ])
      
      // Стили для строк данных
      row.font = { size: 11 }
      row.alignment = { vertical: 'middle' }
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' }
      }
      
      // Форматирование чисел
      row.getCell(2).alignment = { horizontal: 'center' }
      row.getCell(3).numFmt = '#,##0.00 ₽'
      row.getCell(4).numFmt = '#,##0.00 ₽'
      row.getCell(4).font = { bold: true, size: 11 }
      
      // Границы
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
      })
    })
  }
  
  // Пустая строка
  worksheet.addRow([])
  
  const totalRow = worksheet.addRow(['', '', 'Итого:', totalAmount])
  totalRow.font = { bold: true, size: 13 }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: EXCEL_STYLES.COLORS.PURPLE_LIGHT }
  }
  totalRow.alignment = { vertical: 'middle' }
  totalRow.getCell(3).alignment = { horizontal: 'right' }
  totalRow.getCell(4).numFmt = '#,##0.00 ₽'
  totalRow.getCell(4).font = { bold: true, size: 14, color: { argb: EXCEL_STYLES.COLORS.PURPLE } }
  totalRow.height = EXCEL_STYLES.ROW_HEIGHT.TOTAL
  
  // Границы итоговой строки
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber >= 3) {
      cell.border = {
        top: { style: 'double', color: { argb: 'FF8B5CF6' } },
        left: { style: 'thin', color: { argb: 'FF8B5CF6' } },
        bottom: { style: 'double', color: { argb: 'FF8B5CF6' } },
        right: { style: 'thin', color: { argb: 'FF8B5CF6' } }
      }
    }
  })
  
  worksheet.columns = [
    { width: EXCEL_STYLES.COLUMN_WIDTH.NAME },
    { width: EXCEL_STYLES.COLUMN_WIDTH.QUANTITY },
    { width: EXCEL_STYLES.COLUMN_WIDTH.PRICE },
    { width: EXCEL_STYLES.COLUMN_WIDTH.TOTAL }
  ]
  
  // Генерация файла
  const buffer = await workbook.xlsx.writeBuffer()
  const excelBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(excelBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-excel`,
    name: `КП_${timestamp}.xlsx`,
    type: 'excel',
    url,
    blob: excelBlob,
    createdAt: fileTimestamp,
  }
}

const generateInvoiceExcel = async (htmlContent: string, data: any, timestamp: string): Promise<GeneratedFile> => {
  console.log('=== INVOICE EXCEL DEBUG ===')
  console.log('data.items:', data.items)
  console.log('data.priceItems:', data.priceItems)
  console.log('htmlContent length:', htmlContent.length)
  
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Счёт на оплату')
  
  // Парсим HTML для извлечения контента
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  // Извлекаем заголовок из HTML
  const h1 = doc.querySelector('h1')
  const h2 = doc.querySelector('h2')
  const title = h1 ? h1.textContent?.trim() : (h2 ? h2.textContent?.trim() : 'СЧЁТ НА ОПЛАТУ')
  
  // Извлекаем все параграфы (описание) - простой метод как у предложений
  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  console.log('📝 Extracted paragraphs:', paragraphs.length)
  console.log('📝 Title extracted:', title)
  
  // Вставляем изображения в начало документа
  let currentRow = await addImagesToWorksheet(workbook, worksheet, doc, 0)
  
  // Заголовок
  currentRow++
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = title || 'СЧЁТ НА ОПЛАТУ'
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFDC2626' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF2F2' }
  }
  worksheet.getRow(currentRow).height = 40
  
  // Номер и дата
  currentRow++
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
  const infoCell = worksheet.getCell(`A${currentRow}`)
  infoCell.value = `Номер: ${data.invoiceNumber || 'INV-001'} | Дата: ${timestamp}`
  infoCell.font = { size: 12, bold: true }
  infoCell.alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getRow(currentRow).height = 25
  
  // Добавляем текстовое содержимое из превью
  currentRow++
  if (paragraphs.length > 0) {
    paragraphs.forEach(text => {
      if (text) {
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
        const textCell = worksheet.getCell(`A${currentRow}`)
        textCell.value = text
        textCell.font = { size: 11 }
        textCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
        const estimatedHeight = Math.max(20, Math.ceil(text.length / 80) * 15)
        worksheet.getRow(currentRow).height = estimatedHeight
        currentRow++
      }
    })
  }
  
  // Пустая строка
  currentRow++
  
  // Извлекаем таблицу из HTML (если есть) или используем data
  const table = doc.querySelector('table')
  
  // Приоритет: сначала data.items, потом data.priceItems
  let items = []
  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    items = data.items
    console.log('✅ Using data.items:', items.length, 'items')
  } else if (data.priceItems && Array.isArray(data.priceItems) && data.priceItems.length > 0) {
    items = data.priceItems
    console.log('✅ Using data.priceItems:', items.length, 'items')
  } else {
    console.log('⚠️ No items in data, will try HTML parsing')
  }
  
  if (table && table.rows.length > 1) {
    // Парсим таблицу из HTML для счёта
    const parsedItems = []
    
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i]
      
      // Пропускаем итоговые строки
      if (row.classList.contains('total-row')) continue
      
      // Минимум 4 колонки для счёта
      if (row.cells.length >= 4) {
        const nameCell = row.cells[0].textContent?.trim() || ''
        
        // Пропускаем строки с итогами по тексту
        if (nameCell.includes('Итого') || nameCell.includes('НДС') || nameCell.includes('к оплате')) {
          continue
        }
        
        // Определяем позиции колонок в зависимости от структуры таблицы
        let quantity, price
        
        if (row.cells.length >= 5) {
          // Формат: Наименование | Ед.изм. | Кол-во | Цена | Сумма
          quantity = parseFloat(row.cells[2].textContent?.replace(/[^\d.]/g, '') || '1')
          price = parseFloat(row.cells[3].textContent?.replace(/[^\d.]/g, '') || '0')
        } else {
          // Формат: Наименование | Кол-во | Цена | Сумма
          quantity = parseFloat(row.cells[1].textContent?.replace(/[^\d.]/g, '') || '1')
          price = parseFloat(row.cells[2].textContent?.replace(/[^\d.]/g, '') || '0')
        }
        
        if (nameCell && nameCell.length > 0) {
          parsedItems.push({ name: nameCell, quantity, price })
        }
      }
    }
    
    // Используем распарсенные данные только если они есть И items пустой
    if (parsedItems.length > 0 && items.length === 0) {
      items = parsedItems
      console.log('✅ Using parsed items from HTML table:', items.length, 'items')
    }
  }
  
  // ВАЖНО: используем fallback только если items действительно пустой
  if (!items || items.length === 0) {
    console.warn('⚠️ No items found! Using fallback data')
    items = [
      { name: 'Услуга 1', quantity: 1, price: 10000 },
      { name: 'Услуга 2', quantity: 1, price: 5000 }
    ]
  }
  
  console.log('📊 Final items for Excel:', items.length, 'items')
  
  // Шапка таблицы
  const headerRow = worksheet.addRow(['Наименование', 'Количество', 'Цена', 'Сумма'])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDC2626' }
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 30
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB91C1C' } },
      left: { style: 'thin', color: { argb: 'FFB91C1C' } },
      bottom: { style: 'thin', color: { argb: 'FFB91C1C' } },
      right: { style: 'thin', color: { argb: 'FFB91C1C' } }
    }
  })
  
  // Данные
  let subtotal = 0
  
  if (items.length > 0) {
    items.forEach((item: PriceItem, index: number) => {
      const itemTotal = item.quantity * item.price
      subtotal += itemTotal
      
      const row = worksheet.addRow([
        item.name,
        item.quantity,
        item.price,
        itemTotal
      ])
      
      // Стили для строк данных
      row.font = { size: 11 }
      row.alignment = { vertical: 'middle' }
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' }
      }
      
      // Форматирование
      row.getCell(2).alignment = { horizontal: 'center' }
      row.getCell(3).numFmt = '#,##0.00 ₽'
      row.getCell(4).numFmt = '#,##0.00 ₽'
      row.getCell(4).font = { bold: true, size: 11 }
      
      // Границы
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
      })
    })
  }
  
  // Пустая строка
  worksheet.addRow([])
  
  // Расчёты
  const totalWithoutVAT = data.totalWithoutVAT || subtotal
  const vat = data.vat || totalWithoutVAT * 0.2
  const total = data.total || totalWithoutVAT + vat
  
  // Сумма без НДС
  const subtotalRow = worksheet.addRow(['', '', 'Сумма без НДС:', totalWithoutVAT])
  subtotalRow.font = { bold: true, size: 12 }
  subtotalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  }
  subtotalRow.getCell(3).alignment = { horizontal: 'right' }
  subtotalRow.getCell(4).numFmt = '#,##0.00 ₽'
  subtotalRow.height = 28
  
  // НДС
  const vatRow = worksheet.addRow(['', '', 'НДС (20%):', vat])
  vatRow.font = { bold: true, size: 12 }
  vatRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' }
  }
  vatRow.getCell(3).alignment = { horizontal: 'right' }
  vatRow.getCell(4).numFmt = '#,##0.00 ₽'
  vatRow.height = 28
  
  // Итого к оплате
  const totalRow = worksheet.addRow(['', '', 'ИТОГО К ОПЛАТЕ:', total])
  totalRow.font = { bold: true, size: 14 }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFECACA' }
  }
  totalRow.getCell(3).alignment = { horizontal: 'right' }
  totalRow.getCell(4).numFmt = '#,##0.00 ₽'
  totalRow.getCell(4).font = { bold: true, size: 16, color: { argb: 'FFDC2626' } }
  totalRow.height = 35
  
  // Границы итоговых строк
  ;[subtotalRow, vatRow, totalRow].forEach(row => {
    row.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDC2626' } },
          left: { style: 'thin', color: { argb: 'FFDC2626' } },
          bottom: { style: 'thin', color: { argb: 'FFDC2626' } },
          right: { style: 'thin', color: { argb: 'FFDC2626' } }
        }
      }
    })
  })
  
  // Ширина колонок
  worksheet.columns = [
    { width: 50 },  // Наименование
    { width: 15 },  // Количество
    { width: 20 },  // Цена
    { width: 20 }   // Сумма
  ]
  
  // Генерация файла
  const buffer = await workbook.xlsx.writeBuffer()
  const excelBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(excelBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-excel`,
    name: `Счёт_${data.invoiceNumber || 'INV-001'}.xlsx`,
    type: 'excel',
    url,
    blob: excelBlob,
    createdAt: fileTimestamp,
  }
}

const generateInvoicePDF = async (htmlContent: string, data: any, timestamp: string): Promise<GeneratedFile> => {
  return generateInvoicePDFFile(htmlContent, data, timestamp)
}

const generateInvoiceHTML = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Счёт на оплату</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      max-width: 100%;
      background: #fff;
    }
    @media (max-width: 600px) {
      body { padding: 10px; font-size: 14px; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
  
  const htmlBlob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(htmlBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-html`,
    name: `Счёт_${timestamp}.html`,
    type: 'html',
    url,
    blob: htmlBlob,
    createdAt: fileTimestamp,
  }
}

const generateEmailHTML = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      background: #f5f5f5;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
  
  const htmlBlob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(htmlBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-html`,
    name: `Email_${timestamp}.html`,
    type: 'html',
    url,
    blob: htmlBlob,
    createdAt: fileTimestamp,
  }
}

const generatePresentationPDF = async (htmlContent: string, timestamp: string, data: any): Promise<GeneratedFile> => {
  return generatePresentationPDFFile(htmlContent, timestamp, data)
}

const generatePresentationHTML = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Презентация</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      max-width: 100%;
      background: #fff;
    }
    @media (max-width: 600px) {
      body { padding: 10px; font-size: 14px; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
  
  const htmlBlob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(htmlBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-html`,
    name: `Презентация_${timestamp}.html`,
    type: 'html',
    url,
    blob: htmlBlob,
    createdAt: fileTimestamp,
  }
}

const generateLogoSVG = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const svgElement = doc.querySelector('svg')
  const svgContent = svgElement ? svgElement.outerHTML : '<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" text-anchor="middle" font-size="20">Logo</text></svg>'
  
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-svg`,
    name: `Логотип_${timestamp}.svg`,
    type: 'svg',
    url,
    blob: svgBlob,
    createdAt: fileTimestamp,
  }
}

const generateLogoPNG = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const canvas = document.createElement('canvas')
  canvas.width = 2000
  canvas.height = 2000
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  ctx.fillStyle = 'transparent'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  const svgElement = doc.querySelector('svg')
  if (svgElement) {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(svgBlob)
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 2000, 2000)
        URL.revokeObjectURL(svgUrl)
        resolve()
      }
      img.src = svgUrl
    })
  }
  
  const pngBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
  
  const url = URL.createObjectURL(pngBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-png`,
    name: `Логотип_${timestamp}.png`,
    type: 'png',
    url,
    blob: pngBlob,
    createdAt: fileTimestamp,
  }
}

const generateLogoPDF = async (htmlContent: string, timestamp: string, data: any): Promise<GeneratedFile> => {
  const fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Логотип</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: Arial, sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
  
    const { fetchWithTimeout } = await import('./fetchWithTimeout')
    const { API_TIMEOUTS } = await import('./constants')
    
    const response = await fetchWithTimeout('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: fullHTML,
        docType: 'logo',
        fileName: `Логотип_${timestamp}.pdf`,
      }),
    }, API_TIMEOUTS.DEFAULT)
  
  if (!response.ok) {
    throw new Error('PDF generation failed')
  }
  
  const pdfBlob = await response.blob()
  const url = URL.createObjectURL(pdfBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-pdf`,
    name: `Логотип_${timestamp}.pdf`,
    type: 'pdf',
    url,
    blob: pdfBlob,
    createdAt: fileTimestamp,
  }
}

const generateLogoExcel = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Логотип')
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  worksheet.mergeCells('A1:E1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'Логотип'
  titleCell.font = { size: 20, bold: true }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getRow(1).height = 40
  
  const paragraphs = Array.from(doc.querySelectorAll('p, div'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  let currentRow = 2
  
  paragraphs.forEach(text => {
    if (text) {
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
      const textCell = worksheet.getCell(`A${currentRow}`)
      textCell.value = text
      textCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
      worksheet.getRow(currentRow).height = 25
      currentRow++
    }
  })
  
  worksheet.columns = [
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ]
  
  const buffer = await workbook.xlsx.writeBuffer()
  const excelBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(excelBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-excel`,
    name: `Логотип_${timestamp}.xlsx`,
    type: 'excel',
    url,
    blob: excelBlob,
    createdAt: fileTimestamp,
  }
}

const generateLogoDOC = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const paragraphs = Array.from(doc.querySelectorAll('p, div'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx')
  
  const children: any[] = []
  
  children.push(
    new Paragraph({
      text: 'Логотип',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  )
  
  paragraphs.forEach(text => {
    if (text) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text })],
          spacing: { after: 150 }
        })
      )
    }
  })
  
  const docx = new Document({
    sections: [{
      properties: {},
      children
    }]
  })
  
  const { Packer } = await import('docx')
  const blob = await Packer.toBlob(docx)
  const url = URL.createObjectURL(blob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-doc`,
    name: `Логотип_${timestamp}.docx`,
    type: 'doc',
    url,
    blob,
    createdAt: fileTimestamp
  }
}

// ============================================
// PRODUCT CARD GENERATORS
// ============================================

const generateProductCardPNG_WB = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  try {
    console.log('Generating WB PNG via Playwright API...')
    
    // Создаем полный HTML с размерами для WB (3:4)
    const fullHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      width: 2000px;
      height: 2667px;
      font-family: Arial, sans-serif; 
      background: #ffffff;
      overflow: hidden;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
    
    const { fetchWithTimeout } = await import('./fetchWithTimeout')
    const { API_TIMEOUTS } = await import('./constants')
    
    const response = await fetchWithTimeout('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: fullHTML,
        width: 2000,
        height: 2667,
        format: 'png',
        fileName: `Карточка_товара_WB_${timestamp}.png`,
      }),
    }, API_TIMEOUTS.IMAGE_GENERATION)
    
    if (!response.ok) {
      throw new Error('PNG generation failed')
    }
    
    const pngBlob = await response.blob()
    const url = URL.createObjectURL(pngBlob)
    
    const fileTimestamp = Date.now()
    const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Date.now()}`
    
    return {
      id: `file-${fileTimestamp}-${randomSuffix}-png`,
      name: `Карточка_товара_WB_${timestamp}.png`,
      type: 'png',
      url,
      blob: pngBlob,
      createdAt: fileTimestamp,
    }
  } catch (error) {
    console.error('Error generating WB PNG:', error)
    throw error
  }
}

const generateProductCardPNG_Universal = async (htmlContent: string, timestamp: string): Promise<GeneratedFile> => {
  try {
    console.log('Generating Universal PNG via Playwright API...')
    
    // Создаем полный HTML с размерами универсального формата (1:1)
    const fullHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      width: 2000px;
      height: 2000px;
      font-family: Arial, sans-serif; 
      background: #ffffff;
      overflow: hidden;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
    
    const { fetchWithTimeout } = await import('./fetchWithTimeout')
    const { API_TIMEOUTS } = await import('./constants')
    
    const response = await fetchWithTimeout('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: fullHTML,
        width: 2000,
        height: 2000,
        format: 'png',
        fileName: `Карточка_товара_Универсал_${timestamp}.png`,
      }),
    }, API_TIMEOUTS.IMAGE_GENERATION)
    
    if (!response.ok) {
      throw new Error('PNG generation failed')
    }
    
    const pngBlob = await response.blob()
    const url = URL.createObjectURL(pngBlob)
    
    const fileTimestamp = Date.now()
    const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Date.now()}`
    
    return {
      id: `file-${fileTimestamp}-${randomSuffix}-png`,
      name: `Карточка_товара_Универсал_${timestamp}.png`,
      type: 'png',
      url,
      blob: pngBlob,
      createdAt: fileTimestamp,
    }
  } catch (error) {
    console.error('Error generating Universal PNG:', error)
    throw error
  }
}

const generateProductCardPDF = async (htmlContent: string, timestamp: string, data: any): Promise<GeneratedFile> => {
  const jsPDF = (await import('jspdf')).default
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  // Извлекаем текстовый контент
  const title = doc.querySelector('h1, .product-title')?.textContent || 'Карточка товара'
  const priceElement = doc.querySelector('.price-current, .product-price')?.textContent || ''
  const features = Array.from(doc.querySelectorAll('.feature-item, .product-features li'))
    .map(el => el.textContent?.trim())
    .filter(Boolean)
  
  let yPosition = 20
  
  // Заголовок
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text(title, 105, yPosition, { align: 'center' })
  yPosition += 15
  
  // Цена
  if (priceElement) {
    pdf.setFontSize(32)
    pdf.setTextColor(227, 30, 36) // Красный цвет
    pdf.text(priceElement, 105, yPosition, { align: 'center' })
    yPosition += 20
  }
  
  // Преимущества
  if (features.length > 0) {
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Преимущества:', 20, yPosition)
    yPosition += 10
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    features.forEach(feature => {
      if (feature && yPosition < 280) {
        pdf.text(`✓ ${feature}`, 25, yPosition)
        yPosition += 8
      }
    })
  }
  
  // Футер
  pdf.setFontSize(10)
  pdf.setTextColor(150, 150, 150)
  pdf.text(`Создано: ${timestamp}`, 105, 285, { align: 'center' })
  
  const pdfBlob = pdf.output('blob')
  const url = URL.createObjectURL(pdfBlob)
  
  const fileTimestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  
  return {
    id: `file-${fileTimestamp}-${randomSuffix}-pdf`,
    name: `Карточка_товара_${timestamp}.pdf`,
    type: 'pdf',
    url,
    blob: pdfBlob,
    createdAt: fileTimestamp,
  }
}

