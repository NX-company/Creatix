/**
 * ===================================================================
 * Скрипт миграции существующих пользователей на новую систему тарификации
 * ===================================================================
 *
 * Запуск: npx tsx scripts/migrate-to-new-pricing.ts
 *
 * Что делает:
 * 1. Находит всех пользователей со старой системой
 * 2. Создаёт соответствующие пакеты в новой системе:
 *    - FREE → FREE_TRIAL_30 (с оставшимися генерациями)
 *    - ADVANCED → ADVANCED_100 (с сохранением subscriptionEndsAt)
 * 3. НЕ удаляет старые поля (для обратной совместимости)
 */

import { PrismaClient } from '@prisma/client'
import { PACKAGE_CODES } from '../pricing_new/config'

const prisma = new PrismaClient()

interface MigrationStats {
  totalUsers: number
  freeUsers: number
  advancedUsers: number
  migratedFree: number
  migratedAdvanced: number
  skipped: number
  errors: number
}

async function migrateUser(user: any, stats: MigrationStats): Promise<void> {
  const appMode = user.appMode?.toUpperCase()

  // Проверяем, есть ли уже пакеты у пользователя
  const existingPackages = await prisma.user_packages.findFirst({
    where: { user_id: user.id },
  })

  if (existingPackages) {
    console.log(`⏭️  User ${user.email} already has packages, skipping`)
    stats.skipped++
    return
  }

  try {
    if (appMode === 'FREE') {
      // FREE пользователь → FREE_TRIAL_30
      const usedGenerations = user.freeMonthlyGenerations || 0
      const creditsRemaining = Math.max(0, 30 - usedGenerations)

      // Определяем дату истечения (30 дней с даты последнего сброса или сейчас)
      const startsAt = user.lastResetDate || new Date()
      const endsAt = new Date(startsAt)
      endsAt.setDate(endsAt.getDate() + 30)

      await prisma.user_packages.create({
        data: {
          user_id: user.id,
          package_code: PACKAGE_CODES.FREE_TRIAL_30,
          credits_remaining: creditsRemaining,
          allow_images: false,
          starts_at: startsAt,
          ends_at: endsAt,
          source: 'admin', // Миграция
          status: 'active',
        },
      })

      console.log(`✅ Migrated FREE user ${user.email}: ${creditsRemaining}/30 credits`)
      stats.migratedFree++

    } else if (appMode === 'ADVANCED') {
      // ADVANCED пользователь → ADVANCED_100
      const usedSubscription = user.advancedMonthlyGenerations || 0
      const purchasedRemaining = user.purchasedGenerations || 0

      // Подписка: 80 - использовано
      const subscriptionRemaining = Math.max(0, 80 - usedSubscription)

      // Общее количество кредитов (переводим в новую систему)
      // В новой системе всё в одном пакете, но по 100 кредитов
      const totalRemaining = Math.min(100, subscriptionRemaining + Math.floor(purchasedRemaining))

      // Сохраняем дату истечения подписки
      const subscriptionEndsAt = user.subscriptionEndsAt
      if (!subscriptionEndsAt || subscriptionEndsAt < new Date()) {
        console.log(`⚠️  User ${user.email} has expired ADVANCED subscription, skipping`)
        stats.skipped++
        return
      }

      const startsAt = new Date()
      const endsAt = new Date(subscriptionEndsAt)

      await prisma.user_packages.create({
        data: {
          user_id: user.id,
          package_code: PACKAGE_CODES.ADVANCED_100,
          credits_remaining: totalRemaining,
          allow_images: true,
          starts_at: startsAt,
          ends_at: endsAt,
          source: 'admin', // Миграция
          status: 'active',
        },
      })

      console.log(`✅ Migrated ADVANCED user ${user.email}: ${totalRemaining}/100 credits (expires: ${endsAt.toLocaleDateString()})`)
      stats.migratedAdvanced++

    } else {
      console.log(`⏭️  User ${user.email} has unknown mode: ${appMode}, skipping`)
      stats.skipped++
    }

  } catch (error) {
    console.error(`❌ Error migrating user ${user.email}:`, error)
    stats.errors++
  }
}

async function main() {
  console.log('🚀 Starting migration to new pricing system...\n')

  const stats: MigrationStats = {
    totalUsers: 0,
    freeUsers: 0,
    advancedUsers: 0,
    migratedFree: 0,
    migratedAdvanced: 0,
    skipped: 0,
    errors: 0,
  }

  // Получаем всех пользователей
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      appMode: true,
      freeMonthlyGenerations: true,
      advancedMonthlyGenerations: true,
      purchasedGenerations: true,
      subscriptionEndsAt: true,
      lastResetDate: true,
    },
  })

  stats.totalUsers = users.length
  console.log(`📊 Found ${users.length} users\n`)

  // Подсчитываем пользователей по режимам
  stats.freeUsers = users.filter(u => u.appMode?.toUpperCase() === 'FREE').length
  stats.advancedUsers = users.filter(u => u.appMode?.toUpperCase() === 'ADVANCED').length

  console.log(`   FREE: ${stats.freeUsers}`)
  console.log(`   ADVANCED: ${stats.advancedUsers}`)
  console.log(`\n⏳ Starting migration...\n`)

  // Мигрируем пользователей по одному
  for (const user of users) {
    await migrateUser(user, stats)
  }

  // Выводим статистику
  console.log('\n✅ Migration completed!\n')
  console.log('📊 Statistics:')
  console.log(`   Total users: ${stats.totalUsers}`)
  console.log(`   Migrated FREE → FREE_TRIAL_30: ${stats.migratedFree}`)
  console.log(`   Migrated ADVANCED → ADVANCED_100: ${stats.migratedAdvanced}`)
  console.log(`   Skipped: ${stats.skipped}`)
  console.log(`   Errors: ${stats.errors}`)
  console.log(`\n✅ Old User fields were NOT deleted (backward compatibility)`)
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
