export interface UserIntent {
  action: 'create' | 'edit' | 'delete' | 'query'
  docType?: string
  quantity?: number
  subject?: string
  details?: string
}

export function recognizeIntent(message: string, currentDocType?: string): UserIntent {
  const lower = message.toLowerCase()
  
  const createWithQuantity = extractCreationWithQuantity(lower)
  if (createWithQuantity) {
    return createWithQuantity
  }
  
  if (isCreationCommand(lower)) {
    return {
      action: 'create',
      docType: currentDocType,
      subject: extractSubject(lower)
    }
  }
  
  if (isEditCommand(lower)) {
    return {
      action: 'edit',
      subject: extractSubject(lower),
      details: extractEditDetails(lower)
    }
  }
  
  if (isDeletionCommand(lower)) {
    return {
      action: 'delete',
      subject: extractSubject(lower)
    }
  }
  
  return {
    action: 'query',
    details: message
  }
}

function extractCreationWithQuantity(message: string): UserIntent | null {
  const patterns = [
    /(сделай|создай|сгенери|нарисуй|покажи)\s+(\d+)\s+(лого|изображ|картин|вариант|фото|дизайн)/i,
    /(\d+)\s+(лого|изображ|картин|вариант|фото|дизайн)/i,
    /(один|одну|одно|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)\s+(лого|изображ|картин|вариант|фото|дизайн)/i,
  ]
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      let quantity: number
      if (match[2] && /^\d+$/.test(match[2])) {
        quantity = parseInt(match[2])
      } else if (match[1] && /^\d+$/.test(match[1])) {
        quantity = parseInt(match[1])
      } else {
        quantity = textToNumber(match[1] || match[2])
      }
      
      const subjectMatch = match[3] || match[2] || match[1]
      const subject = normalizeSubject(subjectMatch)
      
      return {
        action: 'create',
        quantity,
        subject,
        details: message
      }
    }
  }
  
  return null
}

function isCreationCommand(message: string): boolean {
  const creationVerbs = [
    'создай', 'сделай', 'сгенери', 'нарисуй', 
    'покажи', 'построй', 'составь', 'напиши'
  ]
  
  const creationObjects = [
    'кп', 'коммерческое', 'предложение', 
    'счёт', 'счет', 'инвойс',
    'письмо', 'email', 'рассылку',
    'презентацию', 'слайды',
    'логотип', 'лого',
    'карточку', 'товар',
    'документ', 'файл'
  ]
  
  for (const verb of creationVerbs) {
    if (message.includes(verb)) {
      if (creationObjects.some(obj => message.includes(obj))) {
        return true
      }
      if (!hasEditContext(message)) {
        return true
      }
    }
  }
  
  return false
}

function isEditCommand(message: string): boolean {
  const editKeywords = [
    'измени', 'поменяй', 'замени',
    'увеличь', 'уменьши',
    'раскрась', 'покрась',
    'выдели',
    'жирным', 'курсивом', 'подчеркни',
    ' цвет', ' размер', ' шрифт',
    'отступ', 'тень',
    'сюда', 'туда', 'здесь'
  ]
  
  const editContexts = [
    /сделай\s+(это|её|его|их)\s+(больше|меньше|жирным|красным|синим)/i,
    /сделай\s+\w+\s+(жирным|красным|синим|больше|меньше)/i,
  ]
  
  if (editContexts.some(pattern => pattern.test(message))) {
    return true
  }
  
  return editKeywords.some(keyword => message.includes(keyword))
}

function hasEditContext(message: string): boolean {
  const editContextMarkers = [
    /сделай\s+(это|её|его|их|тут|там|здесь)/i,
    /(больше|меньше|жирным|красным|синим|зеленым|желтым)/i,
    /(цвет|размер|шрифт)/i,
  ]
  
  return editContextMarkers.some(pattern => pattern.test(message))
}

function isDeletionCommand(message: string): boolean {
  const deleteKeywords = ['убери', 'удали', 'очисти', 'сотри', 'выкинь']
  return deleteKeywords.some(keyword => message.includes(keyword))
}

function extractSubject(message: string): string {
  const subjects: Record<string, string> = {
    'кп': 'proposal',
    'коммерческое': 'proposal',
    'предложение': 'proposal',
    'счёт': 'invoice',
    'счет': 'invoice',
    'инвойс': 'invoice',
    'письмо': 'email',
    'email': 'email',
    'рассылку': 'email',
    'презентацию': 'presentation',
    'слайды': 'presentation',
    'логотип': 'logo',
    'лого': 'logo',
    'карточку': 'product-card',
    'товар': 'product-card'
  }
  
  for (const [key, value] of Object.entries(subjects)) {
    if (message.includes(key)) {
      return value
    }
  }
  
  return ''
}

function extractEditDetails(message: string): string {
  const details = message
    .replace(/(измени|поменяй|замени|убери|удали|увеличь|уменьши)/gi, '')
    .trim()
  
  return details
}

function normalizeSubject(text: string): string {
  const lower = text.toLowerCase()
  
  if (/лого/i.test(lower)) return 'logo'
  if (/изображ|картин|фото/i.test(lower)) return 'image'
  if (/вариант|дизайн/i.test(lower)) return 'variant'
  
  return text
}

function textToNumber(text: string): number {
  const numbers: Record<string, number> = {
    'один': 1, 'одна': 1, 'одно': 1, 'одну': 1,
    'два': 2, 'две': 2,
    'три': 3, 'трёх': 3, 'трех': 3,
    'четыре': 4,
    'пять': 5,
    'шесть': 6,
    'семь': 7,
    'восемь': 8,
    'девять': 9,
    'десять': 10
  }
  
  return numbers[text.toLowerCase()] || 1
}

export function extractQuantity(message: string, defaultCount: number = 3): number {
  const intent = extractCreationWithQuantity(message.toLowerCase())
  if (intent && intent.quantity) {
    console.log(`📊 User requested ${intent.quantity} images (extracted from intent recognition)`)
    return intent.quantity
  }
  
  const digitPatterns = [
    /(\d+)\s*(изображ|картин|фото|вариант|лого|фотк)/i,
    /(сделай|создай|сгенери|нарисуй)\s+(\d+)/i,
  ]
  
  for (const pattern of digitPatterns) {
    const match = message.match(pattern)
    if (match) {
      const numStr = match[2] && /^\d+$/.test(match[2]) ? match[2] : match[1]
      const num = parseInt(numStr)
      if (num > 0 && num <= 10) {
        console.log(`📊 User requested ${num} images (extracted from digit pattern)`)
        return num
      }
    }
  }
  
  const textPattern = /(один|одну|одно|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)\s*(изображ|картин|фото|вариант|лого)/i
  const textMatch = message.match(textPattern)
  if (textMatch) {
    const num = textToNumber(textMatch[1])
    console.log(`📊 User requested ${num} images (extracted from text pattern)`)
    return num
  }
  
  console.log(`📊 Using default count: ${defaultCount}`)
  return defaultCount
}

