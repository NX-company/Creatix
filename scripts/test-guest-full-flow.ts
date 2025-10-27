/**
 * ПОЛНЫЙ ТЕСТ ГОСТЕВОГО РЕЖИМА
 * Проверяет всю логику 4 генераций для гостя
 */

import { recognizeIntent } from '../lib/intentRecognition'

console.log('🧪 ПОЛНЫЙ ТЕСТ ГОСТЕВОГО РЕЖИМА\n')
console.log('=' .repeat(60))

// Тест 1: Распознавание интентов
console.log('\n1️⃣ ТЕСТ РАСПОЗНАВАНИЯ ИНТЕНТОВ:')
console.log('-'.repeat(60))

const testMessages = [
  'сделай кп',
  'сдлеай кп',  // с опечаткой
  'создай коммерческое предложение',
  'сгенерируй презентацию',
  'нарисуй логотип',
  'покажи счет',
]

testMessages.forEach(msg => {
  const intent = recognizeIntent(msg, 'proposal')
  const isCreation = intent.action === 'create'
  const status = isCreation ? '✅ CREATE' : '❌ ' + intent.action.toUpperCase()
  console.log(`${status.padEnd(15)} | "${msg}"`)
})

// Тест 2: Логика счетчика
console.log('\n2️⃣ ТЕСТ ЛОГИКИ СЧЕТЧИКА:')
console.log('-'.repeat(60))

interface GuestState {
  used: number
  limit: number
  firstAdvancedUsed: boolean
  mode: 'advanced' | 'free'
}

const guestState: GuestState = {
  used: 0,
  limit: 4,
  firstAdvancedUsed: false,
  mode: 'advanced'
}

function simulateGeneration(num: number, message: string, docType: string = 'proposal') {
  console.log(`\n--- Генерация #${num} ---`)
  console.log(`Сообщение: "${message}"`)
  console.log(`Тип документа: ${docType}`)

  const intent = recognizeIntent(message, docType)
  const isCreationRequest = intent.action === 'create'

  console.log(`Intent: ${intent.action}`)
  console.log(`isCreationRequest: ${isCreationRequest}`)
  console.log(`Текущий режим: ${guestState.mode.toUpperCase()}`)
  console.log(`Счетчик ДО: ${guestState.used}/${guestState.limit}`)

  if (!isCreationRequest) {
    console.log(`⚠️  ПРОБЛЕМА: Запрос не распознан как создание документа!`)
    console.log(`   Счетчик НЕ увеличится, но генерация выполнится`)
  }

  // Симуляция логики из ChatPanel
  if (guestState.used >= guestState.limit) {
    console.log(`❌ БЛОКИРОВКА: Лимит исчерпан (${guestState.used}/${guestState.limit})`)
    return false
  }

  // Генерация выполнена
  console.log(`✅ Генерация выполнена`)

  // После генерации - увеличиваем счетчик только если это создание
  if (isCreationRequest) {
    if (!guestState.firstAdvancedUsed && guestState.mode === 'advanced') {
      // Первая ADVANCED генерация
      guestState.firstAdvancedUsed = true
      guestState.mode = 'free'
      guestState.used++
      console.log(`🎁 Первая ADVANCED генерация использована`)
      console.log(`🔄 Переключение на FREE режим`)
    } else {
      // Обычная FREE генерация
      guestState.used++
    }
    console.log(`Счетчик ПОСЛЕ: ${guestState.used}/${guestState.limit}`)
    console.log(`Осталось: ${guestState.limit - guestState.used} генераций`)
  } else {
    console.log(`⚠️  Счетчик НЕ увеличен (не распознано как создание)`)
  }

  return true
}

// Симуляция 4 генераций
console.log('\n3️⃣ СИМУЛЯЦИЯ 4 ГЕНЕРАЦИЙ:')
console.log('='.repeat(60))

simulateGeneration(1, 'сделай кп', 'proposal')
simulateGeneration(2, 'сделай кп', 'proposal')
simulateGeneration(3, 'создай презентацию', 'presentation')
simulateGeneration(4, 'сгенерируй логотип', 'logo')
simulateGeneration(5, 'нарисуй еще один', 'logo') // Должна блокироваться

// Итоги
console.log('\n' + '='.repeat(60))
console.log('📊 ИТОГОВАЯ СТАТИСТИКА:')
console.log('-'.repeat(60))
console.log(`Использовано генераций: ${guestState.used}/${guestState.limit}`)
console.log(`Режим: ${guestState.mode.toUpperCase()}`)
console.log(`Первая ADVANCED использована: ${guestState.firstAdvancedUsed ? 'Да' : 'Нет'}`)

console.log('\n4️⃣ ТЕСТ С ОПЕЧАТКАМИ:')
console.log('-'.repeat(60))

// Сброс состояния
guestState.used = 0
guestState.firstAdvancedUsed = false
guestState.mode = 'advanced'

console.log('Тестируем запросы с опечатками...\n')
simulateGeneration(1, 'сдлеай кп', 'proposal')  // С опечаткой
simulateGeneration(2, 'сделай кп', 'proposal')
simulateGeneration(3, 'сделай кп', 'proposal')
simulateGeneration(4, 'сделай кп', 'proposal')

console.log('\n' + '='.repeat(60))
console.log('✅ ТЕСТ ЗАВЕРШЕН')
console.log('='.repeat(60))