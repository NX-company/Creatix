const GUEST_GENERATIONS_KEY = 'creatix_guest_generations'
const GUEST_LIMIT = 1

export interface GuestGenerationsData {
  used: number
  limit: number
  remaining: number
}

export function getGuestGenerations(): GuestGenerationsData {
  if (typeof window === 'undefined') {
    return { used: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT }
  }

  try {
    const stored = localStorage.getItem(GUEST_GENERATIONS_KEY)
    const used = stored ? parseInt(stored, 10) : 0
    
    return {
      used: isNaN(used) ? 0 : used,
      limit: GUEST_LIMIT,
      remaining: Math.max(0, GUEST_LIMIT - (isNaN(used) ? 0 : used))
    }
  } catch (error) {
    console.error('Error reading guest generations:', error)
    return { used: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT }
  }
}

export function incrementGuestGenerations(): GuestGenerationsData {
  if (typeof window === 'undefined') {
    return { used: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT }
  }

  try {
    const current = getGuestGenerations()
    const newUsed = Math.min(current.used + 1, GUEST_LIMIT)
    
    localStorage.setItem(GUEST_GENERATIONS_KEY, newUsed.toString())
    
    return {
      used: newUsed,
      limit: GUEST_LIMIT,
      remaining: Math.max(0, GUEST_LIMIT - newUsed)
    }
  } catch (error) {
    console.error('Error incrementing guest generations:', error)
    return getGuestGenerations()
  }
}

export function hasRemainingGenerations(): boolean {
  const data = getGuestGenerations()
  return data.remaining > 0
}

export function resetGuestGenerations(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(GUEST_GENERATIONS_KEY)
    console.log('✅ Guest generations counter reset')
  } catch (error) {
    console.error('Error resetting guest generations:', error)
  }
}

export function getGuestGenerationsMessage(): string {
  const data = getGuestGenerations()
  
  if (data.remaining === 0) {
    return 'Бесплатные генерации закончились'
  }
  
  if (data.remaining === 1) {
    return '⚡ Осталась 1 генерация'
  }
  
  return `✨ Осталось ${data.remaining} генерации`
}

