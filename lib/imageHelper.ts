import type ExcelJS from 'exceljs'

export interface ProcessedImage {
  buffer: Buffer
  extension: 'png' | 'jpeg' | 'gif'
  width?: number
  height?: number
}

export async function processImageFromSrc(src: string): Promise<ProcessedImage | null> {
  try {
    if (src.startsWith('data:image')) {
      // Base64 изображение
      const matches = src.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/)
      if (!matches) {
        console.warn('⚠️ Invalid base64 image format')
        return null
      }

      let extension: 'png' | 'jpeg' | 'gif' = matches[1] as 'png' | 'jpeg' | 'gif'
      // Нормализуем jpg к jpeg
      if (matches[1] === 'jpg') {
        extension = 'jpeg'
      }
      
      const base64Data = matches[2]
      // Используем Uint8Array для браузера вместо Buffer
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const buffer = Buffer.from(bytes)

      console.log(`✅ Processed base64 image (${extension}), size: ${buffer.length} bytes`)
      return { buffer, extension }
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      // URL изображение - скачиваем
      const response = await fetch(src)
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch image (${response.status}): ${src.substring(0, 50)}...`)
        return null
      }

      const contentType = response.headers.get('content-type')
      let extension: 'png' | 'jpeg' | 'gif' = 'png'

      if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
        extension = 'jpeg'
      } else if (contentType?.includes('png')) {
        extension = 'png'
      } else if (contentType?.includes('gif')) {
        extension = 'gif'
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))

      console.log(`✅ Fetched image from URL (${extension}), size: ${buffer.length} bytes`)
      return { buffer, extension }
    } else {
      console.warn(`⚠️ Unsupported image source: ${src.substring(0, 50)}...`)
      return null
    }
  } catch (error) {
    console.warn(`⚠️ Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

export async function addImagesToWorksheet(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  doc: Document,
  startRow: number
): Promise<number> {
  const images = Array.from(doc.querySelectorAll('img'))
  let currentRow = startRow

  if (images.length === 0) {
    console.log('No images found in HTML')
    return currentRow
  }

  console.log(`📸 Found ${images.length} images, processing...`)

  for (const img of images) {
    const src = img.getAttribute('src')
    if (!src) continue

    try {
      const processedImage = await processImageFromSrc(src)
      if (!processedImage) {
        console.warn(`⚠️ Skipping image, could not process: ${src.substring(0, 50)}...`)
        continue
      }

      const imageId = workbook.addImage({
        buffer: processedImage.buffer as any,
        extension: processedImage.extension,
      })

      // Вставляем изображение в Excel
      // tl = top-left, br = bottom-right (позиции в ячейках)
      worksheet.addImage(imageId, {
        tl: { col: 0, row: currentRow } as any,
        br: { col: 4, row: currentRow + 8 } as any, // Занимает 8 строк высоты
        editAs: 'oneCell' as any,
      })

      // Увеличиваем высоту строк для изображения
      for (let i = currentRow; i < currentRow + 8; i++) {
        worksheet.getRow(i + 1).height = 20
      }

      currentRow += 9 // 8 строк для картинки + 1 пустая строка
      console.log(`✅ Image inserted at row ${currentRow - 9}`)
    } catch (error) {
      console.warn(`⚠️ Error adding image to worksheet, skipping: ${error}`)
    }
  }

  return currentRow
}

