/**
 * Универсальный скрипт для проверки и исправления всей системы монетизации
 * Проверяет БД, API endpoints, активирует платежи, тестирует функциональность
 */

import { prisma } from '../lib/db'
import { GENERATION_LIMITS } from '../lib/generationLimits'

const TEST_USER_EMAIL = 'frctlai@gmail.com'

// Цвета для вывода
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`)
}

function success(message: string) {
  log('✅', message, colors.green)
}

function error(message: string) {
  log('❌', message, colors.red)
}

function warning(message: string) {
  log('⚠️', message, colors.yellow)
}

function info(message: string) {
  log('ℹ️', message, colors.blue)
}

function section(title: string) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(60)}${colors.reset}\n`)
}

async function checkGenerationLimits() {
  section('1. ПРОВЕРКА ЛИМИТОВ ГЕНЕРАЦИЙ')

  info('Текущие лимиты в конфиге:')
  console.log(`   FREE: ${GENERATION_LIMITS.FREE}`)
  console.log(`   ADVANCED: ${GENERATION_LIMITS.ADVANCED}`)

  if (GENERATION_LIMITS.FREE !== 10) {
    error(`FREE лимит должен быть 10, а не ${GENERATION_LIMITS.FREE}`)
    return false
  }
  if (GENERATION_LIMITS.ADVANCED !== 80) {
    error(`ADVANCED лимит должен быть 80, а не ${GENERATION_LIMITS.ADVANCED}`)
    return false
  }

  success('Лимиты генераций настроены правильно')
  return true
}

async function checkAndFixUser() {
  section('2. ПРОВЕРКА И ИСПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ')

  const user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
    select: {
      id: true,
      email: true,
      appMode: true,
      generationLimit: true,
      monthlyGenerations: true,
      freeMonthlyGenerations: true,
      advancedMonthlyGenerations: true,
      bonusGenerations: true,
      subscriptionEndsAt: true,
      lastResetDate: true,
    },
  })

  if (!user) {
    error(`Пользователь ${TEST_USER_EMAIL} не найден`)
    return false
  }

  info(`Пользователь найден: ${user.email}`)
  console.log(`   Режим: ${user.appMode}`)
  console.log(`   Лимит: ${user.generationLimit}`)
  console.log(`   Использовано (monthlyGenerations): ${user.monthlyGenerations}`)
  console.log(`   Использовано (freeMonthlyGenerations): ${user.freeMonthlyGenerations}`)
  console.log(`   Использовано (advancedMonthlyGenerations): ${user.advancedMonthlyGenerations}`)
  console.log(`   Бонус: ${user.bonusGenerations}`)
  console.log(`   Подписка до: ${user.subscriptionEndsAt || 'нет'}`)

  // Проверяем наличие PENDING транзакций
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      status: 'PENDING',
      type: 'SUBSCRIPTION',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (pendingTransactions.length > 0) {
    warning(`Найдено ${pendingTransactions.length} PENDING транзакций`)

    for (const tx of pendingTransactions) {
      const metadata = tx.metadata as any
      info(`   Транзакция: ${tx.id}`)
      console.log(`     Сумма: ${tx.amount}₽`)
      console.log(`     Создана: ${tx.createdAt}`)
      console.log(`     Target Mode: ${metadata.targetMode}`)

      // Активируем транзакцию
      const now = new Date()
      const subscriptionEnd = new Date()
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1)

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'COMPLETED',
            updatedAt: now,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            appMode: metadata.targetMode,
            subscriptionEndsAt: subscriptionEnd,
            generationLimit: GENERATION_LIMITS[metadata.targetMode as 'ADVANCED'],
            monthlyGenerations: 0,
            freeMonthlyGenerations: 0,
            advancedMonthlyGenerations: 0,
            lastResetDate: now,
          },
        }),
      ])

      success(`   ✓ Транзакция активирована: ${metadata.targetMode} режим`)
    }
  } else {
    info('PENDING транзакций не найдено')

    // Проверяем, нужно ли исправить режим пользователя
    if (user.appMode === 'FREE' && user.generationLimit !== 10) {
      warning('Пользователь в FREE режиме, но лимит не 10. Исправляю...')
      await prisma.user.update({
        where: { id: user.id },
        data: {
          generationLimit: 10,
          monthlyGenerations: Math.min(user.monthlyGenerations || 0, 10),
        },
      })
      success('Лимит исправлен на 10 для FREE режима')
    }
  }

  // Проверяем финальное состояние
  const updatedUser = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
  })

  console.log('\n📊 Финальное состояние пользователя:')
  console.log(`   Режим: ${updatedUser?.appMode}`)
  console.log(`   Лимит: ${updatedUser?.generationLimit}`)
  console.log(`   Использовано: ${updatedUser?.monthlyGenerations}`)
  console.log(`   Подписка до: ${updatedUser?.subscriptionEndsAt?.toLocaleString('ru-RU') || 'нет'}`)

  const expectedLimit = updatedUser?.appMode === 'FREE' ? 10 : 80
  if (updatedUser?.generationLimit !== expectedLimit) {
    error(`Лимит ${updatedUser?.generationLimit} не соответствует режиму ${updatedUser?.appMode} (должен быть ${expectedLimit})`)
    return false
  }

  success('Пользователь настроен правильно')
  return true
}

async function testAPIs() {
  section('3. ТЕСТИРОВАНИЕ API ENDPOINTS')

  info('Проверка доступности API...')

  const endpoints = [
    '/api/user/generations',
    '/api/user/consume-generation',
    '/api/user/switch-mode',
    '/api/payments/activate-latest',
    '/api/payments/create-payment',
  ]

  for (const endpoint of endpoints) {
    try {
      const exists = await checkEndpointExists(endpoint)
      if (exists) {
        success(`   ✓ ${endpoint}`)
      } else {
        error(`   ✗ ${endpoint} - не найден`)
      }
    } catch (err) {
      error(`   ✗ ${endpoint} - ошибка проверки`)
    }
  }

  return true
}

async function checkEndpointExists(path: string): Promise<boolean> {
  const fs = require('fs')
  const pathModule = require('path')

  // Преобразуем путь API в путь файловой системы
  const apiPath = path.replace('/api/', '')
  const filePath = pathModule.join(process.cwd(), 'app', 'api', apiPath, 'route.ts')

  return fs.existsSync(filePath)
}

async function displaySummary() {
  section('4. ИТОГОВАЯ СВОДКА')

  const user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
  })

  if (!user) {
    error('Пользователь не найден')
    return
  }

  const available = (user.generationLimit || 0) - (user.monthlyGenerations || 0) + (user.bonusGenerations || 0)

  console.log(`${colors.cyan}┌${'─'.repeat(58)}┐`)
  console.log(`│  Пользователь: ${user.email.padEnd(39)} │`)
  console.log(`├${'─'.repeat(58)}┤`)
  console.log(`│  Режим: ${user.appMode?.padEnd(48)} │`)
  console.log(`│  Лимит генераций в месяц: ${String(user.generationLimit).padEnd(27)} │`)
  console.log(`│  Использовано: ${String(user.monthlyGenerations).padEnd(42)} │`)
  console.log(`│  Доступно: ${String(available).padEnd(46)} │`)
  console.log(`│  Бонусов: ${String(user.bonusGenerations || 0).padEnd(47)} │`)
  console.log(`│  Подписка до: ${(user.subscriptionEndsAt?.toLocaleDateString('ru-RU') || 'нет').padEnd(41)} │`)
  console.log(`└${'─'.repeat(58)}┘${colors.reset}`)

  if (user.appMode === 'FREE' && user.generationLimit === 10) {
    success('\n✅ FREE режим настроен правильно (10 генераций/месяц)')
  } else if (user.appMode === 'ADVANCED' && user.generationLimit === 80) {
    success('\n✅ ADVANCED режим настроен правильно (80 генераций/месяц)')
  } else {
    error('\n❌ Режим настроен неправильно!')
  }
}

async function main() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔧 УНИВЕРСАЛЬНЫЙ СКРИПТ ПРОВЕРКИ И ИСПРАВЛЕНИЯ        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`)

  try {
    await checkGenerationLimits()
    await checkAndFixUser()
    await testAPIs()
    await displaySummary()

    success('\n🎉 Все проверки завершены!')
  } catch (err) {
    error('\n💥 Критическая ошибка:')
    console.error(err)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Ошибка:', error)
    process.exit(1)
  })
