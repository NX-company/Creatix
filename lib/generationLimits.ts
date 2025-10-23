import { AppMode } from '@prisma/client'

export const GENERATION_LIMITS = {
  FREE: 10,
  ADVANCED: 80,
  PRO: 300,
  GUEST: 1,
} as const

// Тестовые цены для разработки (все по 10₽)
const TEST_PRICES = {
  ADVANCED: 10,
  PRO: 10,
  BONUS_PACK: 10,
}

// Реальные цены для продакшена
const PRODUCTION_PRICES = {
  ADVANCED: 1000,
  PRO: 1000, // Изменено с 2500 на 1000 по запросу
  BONUS_PACK: 300,
}

// Определяем режим работы (тестовый или продакшен)
const IS_TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true'

// Экспортируем актуальные цены
export const SUBSCRIPTION_PRICES = {
  ADVANCED: IS_TEST_MODE ? TEST_PRICES.ADVANCED : PRODUCTION_PRICES.ADVANCED,
  PRO: IS_TEST_MODE ? TEST_PRICES.PRO : PRODUCTION_PRICES.PRO,
} as const

export const BONUS_PACK_PRICE = IS_TEST_MODE ? TEST_PRICES.BONUS_PACK : PRODUCTION_PRICES.BONUS_PACK
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

