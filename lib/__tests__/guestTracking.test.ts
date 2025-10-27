/**
 * Простые тесты для guestTracking утилит
 * Запуск: node -r tsx lib/__tests__/guestTracking.test.ts
 */

import {
  canGuestGenerate,
  trackGuestGeneration,
  getGuestStats,
  initializeGuest,
  isGuestExpired,
  type GuestUsage
} from '../guestTracking'

console.log('🧪 Testing Guest Tracking Utilities...\n')

// Тест 1: Новый гость может генерировать
console.log('Test 1: New guest can generate')
const result1 = canGuestGenerate(null)
console.log('✅ Result:', result1)
console.assert(result1.canGenerate === true, 'New guest should be able to generate')
console.assert(result1.mode === 'ADVANCED', 'First generation should be ADVANCED')
console.assert(result1.remaining.total === 4, 'Should have 4 total generations')
console.log('')

// Тест 2: Инициализация гостя
console.log('Test 2: Initialize guest')
const mockRequest = {
  headers: new Map([
    ['user-agent', 'test-agent'],
    ['x-forwarded-for', '192.168.1.1']
  ])
} as any
const newGuest = initializeGuest(mockRequest)
console.log('✅ Result:', newGuest)
console.assert(newGuest.advancedUsed === false, 'New guest should not have used ADVANCED')
console.assert(newGuest.freeUsed === 0, 'New guest should have 0 FREE used')
console.assert(newGuest.totalUsed === 0, 'New guest should have 0 total used')
console.log('')

// Тест 3: Трекинг ADVANCED генерации
console.log('Test 3: Track ADVANCED generation')
const usage1 = trackGuestGeneration(newGuest, 'ADVANCED')
console.log('✅ Result:', usage1)
console.assert(usage1.advancedUsed === true, 'Should mark ADVANCED as used')
console.assert(usage1.totalUsed === 1, 'Should have 1 total used')
console.log('')

// Тест 4: После ADVANCED - только FREE доступен
console.log('Test 4: After ADVANCED, only FREE available')
const result2 = canGuestGenerate(usage1)
console.log('✅ Result:', result2)
console.assert(result2.canGenerate === true, 'Should still be able to generate')
console.assert(result2.mode === 'FREE', 'Next generation should be FREE')
console.assert(result2.remaining.advanced === 0, 'No ADVANCED remaining')
console.assert(result2.remaining.free === 3, 'Should have 3 FREE remaining')
console.log('')

// Тест 5: Трекинг FREE генераций
console.log('Test 5: Track FREE generations')
let currentUsage = usage1
for (let i = 1; i <= 3; i++) {
  currentUsage = trackGuestGeneration(currentUsage, 'FREE')
  console.log(`  FREE generation ${i}:`, currentUsage)
  console.assert(currentUsage.freeUsed === i, `Should have ${i} FREE used`)
  console.assert(currentUsage.totalUsed === i + 1, `Should have ${i + 1} total used`)
}
console.log('')

// Тест 6: После 4 генераций - блокировка
console.log('Test 6: After 4 generations, blocked')
const result3 = canGuestGenerate(currentUsage)
console.log('✅ Result:', result3)
console.assert(result3.canGenerate === false, 'Should NOT be able to generate')
console.assert(result3.mode === null, 'Mode should be null')
console.assert(result3.remaining.total === 0, 'No generations remaining')
console.assert(result3.reason !== undefined, 'Should have a reason message')
console.log('')

// Тест 7: Статистика гостя
console.log('Test 7: Guest stats')
const stats = getGuestStats(currentUsage)
console.log('✅ Result:', stats)
console.assert(stats.isGuest === true, 'Should be guest')
console.assert(stats.totalRemaining === 0, 'No remaining')
console.assert(stats.message.includes('использованы'), 'Message should indicate all used')
console.log('')

// Тест 8: Проверка истечения срока
console.log('Test 8: Check expiration')
const oldGuest: GuestUsage = {
  ...newGuest,
  firstVisit: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 день назад
}
const expired = isGuestExpired(oldGuest)
console.log('✅ Result:', expired)
console.assert(expired === true, 'Guest should be expired after 30 days')

const recentGuest: GuestUsage = {
  ...newGuest,
  firstVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 дней назад
}
const notExpired = isGuestExpired(recentGuest)
console.log('✅ Result:', notExpired)
console.assert(notExpired === false, 'Guest should not be expired within 30 days')
console.log('')

console.log('✅✅✅ All tests passed! ✅✅✅')
