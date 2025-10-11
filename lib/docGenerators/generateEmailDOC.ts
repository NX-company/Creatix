import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx'
import type { GeneratedFile } from '../store'
import { processImageForDocx } from '../docImageHelper'

export async function generateEmailDOCFile(
  htmlContent: string,
  timestamp: string
): Promise<GeneratedFile> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const h1 = doc.querySelector('h1')
  const h2 = doc.querySelector('h2')
  const title = h1 ? h1.textContent?.trim() : (h2 ? h2.textContent?.trim() : 'Email')
  
  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  const images = Array.from(doc.querySelectorAll('img'))
  console.log(`📷 Found ${images.length} images in Email HTML`)
  
  const children: Paragraph[] = []
  
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
      text: title || 'Email',
      heading: HeadingLevel.HEADING_1,
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
    name: `Email_${timestamp}.docx`,
    type: 'doc',
    url,
    blob,
    createdAt: fileTimestamp
  }
}

