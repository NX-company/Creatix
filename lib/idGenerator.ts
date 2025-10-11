// Генератор уникальных ID для файлов
let counter = 0

export function generateUniqueId(prefix: string = 'file'): string {
  const timestamp = Date.now()
  const random1 = Math.random().toString(36).substring(2, 15)
  const random2 = Math.random().toString(36).substring(2, 15)
  counter = (counter + 1) % 10000 // Счетчик с циклом
  
  return `${prefix}-${timestamp}-${random1}${random2}-${counter}`
}

export function generateFileId(type: string): string {
  return generateUniqueId(`file-${type}`)
}

