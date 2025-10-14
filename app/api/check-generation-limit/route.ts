import { NextRequest, NextResponse } from 'next/server'

const GUEST_LIMIT = 3
const BLOCK_DURATION = 24 * 60 * 60 * 1000

const ipGenerationMap = new Map<string, { count: number; timestamp: number }>()
const fingerprintMap = new Map<string, { count: number; timestamp: number }>()

function cleanupOldEntries() {
  const now = Date.now()
  
  for (const [key, value] of ipGenerationMap.entries()) {
    if (now - value.timestamp > BLOCK_DURATION) {
      ipGenerationMap.delete(key)
    }
  }
  
  for (const [key, value] of fingerprintMap.entries()) {
    if (now - value.timestamp > BLOCK_DURATION) {
      fingerprintMap.delete(key)
    }
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json()
    const ip = getClientIP(request)
    
    cleanupOldEntries()
    
    const ipData = ipGenerationMap.get(ip)
    if (ipData && ipData.count >= GUEST_LIMIT) {
      const timeLeft = BLOCK_DURATION - (Date.now() - ipData.timestamp)
      const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000))
      
      return NextResponse.json({
        allowed: false,
        reason: 'ip_limit',
        message: `Лимит достигнут для вашего IP. Попробуйте через ${hoursLeft} ч.`,
        timeLeft
      }, { status: 429 })
    }
    
    if (fingerprint) {
      const fpData = fingerprintMap.get(fingerprint)
      if (fpData && fpData.count >= GUEST_LIMIT) {
        const timeLeft = BLOCK_DURATION - (Date.now() - fpData.timestamp)
        const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000))
        
        return NextResponse.json({
          allowed: false,
          reason: 'fingerprint_limit',
          message: `Лимит достигнут для этого браузера. Попробуйте через ${hoursLeft} ч.`,
          timeLeft
        }, { status: 429 })
      }
    }
    
    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error('Check limit error:', error)
    return NextResponse.json({ allowed: true })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { fingerprint } = await request.json()
    const ip = getClientIP(request)
    
    const ipData = ipGenerationMap.get(ip) || { count: 0, timestamp: Date.now() }
    ipData.count += 1
    ipGenerationMap.set(ip, ipData)
    
    if (fingerprint) {
      const fpData = fingerprintMap.get(fingerprint) || { count: 0, timestamp: Date.now() }
      fpData.count += 1
      fingerprintMap.set(fingerprint, fpData)
    }
    
    console.log(`✅ Generation counted: IP=${ip}, FP=${fingerprint}, Count=${ipData.count}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Increment limit error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

