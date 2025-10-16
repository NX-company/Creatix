import { AppMode } from '@prisma/client'

export const GENERATION_LIMITS = {
  FREE: 30,
  ADVANCED: 100,
  PRO: 300,
  GUEST: 1,
} as const

export const SUBSCRIPTION_PRICES = {
  ADVANCED: 1000,
  PRO: 2500,
} as const

export const BONUS_PACK_PRICE = 300
export const BONUS_PACK_GENERATIONS = 30

export const IMAGES_PER_GENERATION = 10

export function getGenerationLimit(appMode: AppMode): number {
  return GENERATION_LIMITS[appMode] || GENERATION_LIMITS.FREE
}

export function calculateGenerationCost(imageCount: number): {
  generationsNeeded: number
  costInRubles: number
  imagesPerGeneration: number
} {
  const generationsNeeded = Math.ceil(imageCount / IMAGES_PER_GENERATION)
  const costPerGeneration = SUBSCRIPTION_PRICES.ADVANCED / GENERATION_LIMITS.ADVANCED
  const costInRubles = generationsNeeded * costPerGeneration
  
  return {
    generationsNeeded,
    costInRubles,
    imagesPerGeneration: Math.ceil(imageCount / generationsNeeded),
  }
}

export function canUserGenerate(
  monthlyGenerations: number,
  generationLimit: number,
  bonusGenerations: number,
  imageCount: number
): {
  canGenerate: boolean
  availableGenerations: number
  neededGenerations: number
  maxImagesWithCurrentGenerations: number
} {
  const available = (generationLimit - monthlyGenerations) + bonusGenerations
  const needed = Math.ceil(imageCount / IMAGES_PER_GENERATION)
  const maxImages = available * IMAGES_PER_GENERATION
  
  return {
    canGenerate: available >= needed,
    availableGenerations: available,
    neededGenerations: needed,
    maxImagesWithCurrentGenerations: maxImages,
  }
}

export function shouldResetGenerations(lastResetDate: Date | null): boolean {
  if (!lastResetDate) return true
  
  const now = new Date()
  const lastReset = new Date(lastResetDate)
  
  return (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  )
}

export function getNextResetDate(): Date {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

