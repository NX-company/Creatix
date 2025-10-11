import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx'
import type { PriceItem, GeneratedFile } from '../store'
import { processImageForDocx } from '../docImageHelper'

export async function generateInvoiceDOCFile(
  htmlContent: string,
  data: {
    invoiceNumber?: string
    items?: PriceItem[]
    totalWithoutVAT?: number
    vat?: number
    total?: number
    styleConfig?: any
  },
  timestamp: string
): Promise<GeneratedFile> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const h1 = doc.querySelector('h1')
  const h2 = doc.querySelector('h2')
  const title = h1 ? h1.textContent?.trim() : (h2 ? h2.textContent?.trim() : 'СЧЁТ НА ОПЛАТУ')
  
  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  const images = Array.from(doc.querySelectorAll('img'))
  console.log(`📷 Found ${images.length} images in Invoice HTML`)
  
  const children: (Paragraph | Table)[] = []
  
  for (const img of images) {
    const src = img.getAttribute('src')
    if (src) {
      try {
        const processedImage = await processImageForDocx(src)
        if (processedImage) {
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: processedImage.buffer,
                  transformation: {
                    width: processedImage.width,
                    height: processedImage.height,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            })
          )
          console.log(`✅ Image added to DOC`)
        } else {
          console.warn(`⚠️ Skipping image in DOC: ${src.substring(0, 50)}...`)
        }
      } catch (error) {
        console.warn(`⚠️ Error processing image for DOC, skipping: ${error}`)
      }
    }
  }
  
  children.push(
    new Paragraph({
      text: title || 'СЧЁТ НА ОПЛАТУ',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  )
  
  children.push(
    new Paragraph({
      text: `Номер: ${data.invoiceNumber || 'INV-001'} | Дата: ${timestamp}`,
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
  
  const items = data.items || []
  
  if (items.length > 0) {
    children.push(
      new Paragraph({
        text: 'Позиции счёта',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      })
    )
    
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [new Paragraph({ text: '№', alignment: AlignmentType.CENTER })],
            width: { size: 8, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Наименование', alignment: AlignmentType.CENTER })],
            width: { size: 40, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Ед.изм.', alignment: AlignmentType.CENTER })],
            width: { size: 12, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Кол-во', alignment: AlignmentType.CENTER })],
            width: { size: 12, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Цена', alignment: AlignmentType.CENTER })],
            width: { size: 14, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Сумма', alignment: AlignmentType.CENTER })],
            width: { size: 14, type: WidthType.PERCENTAGE }
          })
        ]
      })
    ]
    
    items.forEach((item, index) => {
      const total = item.quantity * item.price
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })]
            }),
            new TableCell({
              children: [new Paragraph({ text: item.name })]
            }),
            new TableCell({
              children: [new Paragraph({ text: 'шт.', alignment: AlignmentType.CENTER })]
            }),
            new TableCell({
              children: [new Paragraph({ text: String(item.quantity), alignment: AlignmentType.CENTER })]
            }),
            new TableCell({
              children: [new Paragraph({ text: `${item.price.toLocaleString('ru-RU')} ₽`, alignment: AlignmentType.RIGHT })]
            }),
            new TableCell({
              children: [new Paragraph({ text: `${total.toLocaleString('ru-RU')} ₽`, alignment: AlignmentType.RIGHT })]
            })
          ]
        })
      )
    })
    
    const totalWithoutVAT = data.totalWithoutVAT || items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const vat = data.vat || (totalWithoutVAT * 0.2)
    const total = data.total || (totalWithoutVAT + vat)
    
    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
    )
    
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Итого без НДС: ${Math.round(totalWithoutVAT).toLocaleString('ru-RU')} ₽`, bold: true })],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200, after: 100 }
      })
    )
    
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `НДС (20%): ${Math.round(vat).toLocaleString('ru-RU')} ₽` })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 }
      })
    )
    
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Всего к оплате: ${Math.round(total).toLocaleString('ru-RU')} ₽`, bold: true, size: 28 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 }
      })
    )
  }
  
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
    name: `Счёт_${data.invoiceNumber || `INV-${Date.now()}`}.docx`,
    type: 'doc',
    url,
    blob,
    createdAt: fileTimestamp
  }
}

