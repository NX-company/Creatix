import type { PriceItem, DocType } from './store'

export interface ParsedProposalData {
  title: string
  description: string
  company: string
  priceItems: Array<{ name: string; quantity: number; price: number }>
  totalWithoutVAT: number
  vat: number
  total: number
  terms?: string
  guarantees?: string
}

export interface ParsedInvoiceData {
  invoiceNumber: string
  date: string
  description: string
  seller?: {
    name: string
    inn: string
    kpp?: string
    address: string
  }
  buyer?: {
    name: string
    inn: string
    address: string
  }
  items: Array<{ name: string; unit?: string; quantity: number; price: number }>
  totalWithoutVAT: number
  vat: number
  total: number
}

export interface ParsedEmailData {
  subject: string
  preheader?: string
  greeting: string
  content: string
  ctaText: string
  ctaUrl: string
  ps?: string
  footer?: string
}

export interface ParsedPresentationData {
  title: string
  subtitle?: string
  author?: string
  date?: string
  slides: Array<{ title: string; content: string }>
}

export type ParsedData = 
  | ParsedProposalData 
  | ParsedInvoiceData 
  | ParsedEmailData 
  | ParsedPresentationData

export function parseAIResponse(response: string, docType: DocType): ParsedData | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('No JSON found in response, attempting to parse entire response')
      return JSON.parse(response)
    }
    
    const jsonStr = jsonMatch[0]
    const parsed = JSON.parse(jsonStr)
    
    if (docType === 'proposal' && parsed.priceItems) {
      return parsed as ParsedProposalData
    } else if (docType === 'invoice' && parsed.items) {
      return parsed as ParsedInvoiceData
    } else if (docType === 'email' && parsed.subject) {
      return parsed as ParsedEmailData
    } else if (docType === 'presentation' && parsed.slides) {
      return parsed as ParsedPresentationData
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error)
    return null
  }
}

export function convertToPriceItems(
  items: Array<{ name: string; quantity: number; price: number }>
): PriceItem[] {
  const timestamp = Date.now()
  const randomSuffix = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`
  return items.map((item, index) => ({
    id: `item-${timestamp}-${randomSuffix}-${index}`,
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }))
}

export function calculateTotals(items: Array<{ quantity: number; price: number }>) {
  const totalWithoutVAT = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const vat = totalWithoutVAT * 0.2
  const total = totalWithoutVAT + vat
  
  return {
    totalWithoutVAT: Math.round(totalWithoutVAT * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}





