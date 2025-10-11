export async function processImageForDocx(src: string): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    if (src.startsWith('data:image')) {
      const matches = src.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/)
      if (!matches) {
        console.warn('⚠️ Invalid base64 image format for DOC')
        return null
      }
      
      const base64Data = matches[2]
      // Декодируем base64 в Uint8Array для браузера
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      console.log(`✅ Processed base64 image for DOC, size: ${bytes.length} bytes`)
      return { buffer: bytes.buffer, width: 400, height: 300 }  // .buffer возвращает ArrayBuffer
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      const response = await fetch(src)
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch image for DOC (${response.status}): ${src.substring(0, 50)}...`)
        return null
      }
      
      const arrayBuffer = await response.arrayBuffer()
      
      console.log(`✅ Fetched image from URL for DOC, size: ${arrayBuffer.byteLength} bytes`)
      return { buffer: arrayBuffer, width: 400, height: 300 }  // ArrayBuffer напрямую
    } else {
      console.warn(`⚠️ Unsupported image source for DOC: ${src.substring(0, 50)}...`)
      return null
    }
  } catch (error) {
    console.warn(`⚠️ Error processing image for DOC: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}
