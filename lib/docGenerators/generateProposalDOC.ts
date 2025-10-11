import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ImageRun } from 'docx'
import type { PriceItem, GeneratedFile } from '../store'
import { processImageForDocx } from '../docImageHelper'

export async function generateProposalDOCFile(
  htmlContent: string,
  data: {
    priceItems: PriceItem[]
    styleConfig: any
  },
  timestamp: string
): Promise<GeneratedFile> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const h1 = doc.querySelector('h1')
  const h2 = doc.querySelector('h2')
  const title = h1 ? h1.textContent?.trim() : (h2 ? h2.textContent?.trim() : 'Коммерческое предложение')
  
  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  const images = Array.from(doc.querySelectorAll('img'))
  console.log(`📷 Found ${images.length} images in Proposal HTML`)
  
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
      text: title || 'Коммерческое предложение',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  )
  
  children.push(
    new Paragraph({
      text: `${data.styleConfig?.company || 'Ваша компания'} | Дата: ${timestamp}`,
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
  
  if (data.priceItems && data.priceItems.length > 0) {
    children.push(
      new Paragraph({
        text: 'Прайс-лист',
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
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Наименование', alignment: AlignmentType.CENTER })],
            width: { size: 50, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Кол-во', alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Цена', alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Сумма', alignment: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE }
          })
        ]
      })
    ]
    
    data.priceItems.forEach((item, index) => {
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
    
    const totalSum = data.priceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '' })],
            columnSpan: 4
          }),
          new TableCell({
            children: [new Paragraph({ 
              children: [new TextRun({ text: `${totalSum.toLocaleString('ru-RU')} ₽`, bold: true })],
              alignment: AlignmentType.RIGHT 
            })]
          })
        ]
      })
    )
    
    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
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
    name: `КП_${timestamp}.docx`,
    type: 'doc',
    url,
    blob,
    createdAt: fileTimestamp
  }
}

