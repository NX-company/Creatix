import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx'
import type { GeneratedFile } from '../store'
import { processImageForDocx } from '../docImageHelper'

export async function generatePresentationDOCFile(
  htmlContent: string,
  timestamp: string
): Promise<GeneratedFile> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const h1 = doc.querySelector('h1')
  const h2 = doc.querySelector('h2')
  const title = h1 ? h1.textContent?.trim() : (h2 ? h2.textContent?.trim() : 'Презентация')
  
  const slides = Array.from(doc.querySelectorAll('.slide, section, [class*="slide"]'))
  const paragraphs = Array.from(doc.querySelectorAll('p, h2, h3'))
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 0)
  
  const images = Array.from(doc.querySelectorAll('img'))
  console.log(`📷 Found ${images.length} images in Presentation HTML`)
  
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
      text: title || 'Презентация',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  )
  
  if (slides.length > 0) {
    slides.forEach((slide, index) => {
      children.push(
        new Paragraph({
          text: `Слайд ${index + 1}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        })
      )
      
      const slideText = slide.textContent?.trim()
      if (slideText) {
        const lines = slideText.split('\n').filter(l => l.trim())
        lines.forEach(line => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line.trim() })],
              spacing: { after: 100 }
            })
          )
        })
      }
    })
  } else {
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
    name: `Презентация_${timestamp}.docx`,
    type: 'doc',
    url,
    blob,
    createdAt: fileTimestamp
  }
}

