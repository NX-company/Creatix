/**
 * ===================================================================
 * NEW PRICING SYSTEM - Packages Seed
 * ===================================================================
 *
 * Заполнение таблицы packages начальными данными
 *
 * Запуск: npx prisma db seed
 * или: npx tsx prisma/seeds/packages.seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PACKAGES_DATA = [
  {
    code: 'GUEST_3',
    name: 'Гость',
    credits_total: 3,
    allow_images: false,
    price_rub: 0,
    duration_days: 30,
  },
  {
    code: 'FREE_TRIAL_30',
    name: 'Free Trial',
    credits_total: 30,
    allow_images: false,
    price_rub: 0,
    duration_days: 30,
  },
  {
    code: 'ADVANCED_100',
    name: 'Advanced Plan',
    credits_total: 100,
    allow_images: true,
    price_rub: 1000,
    duration_days: 30,
  },
]

async function seedPackages() {
  console.log('🌱 Seeding packages...')

  for (const pkgData of PACKAGES_DATA) {
    const existing = await (prisma as any).packages.findUnique({
      where: { code: pkgData.code }
    })

    if (existing) {
      // Обновляем существующий пакет
      await (prisma as any).packages.update({
        where: { code: pkgData.code },
        data: pkgData
      })
      console.log(`✅ Updated package: ${pkgData.code}`)
    } else {
      // Создаём новый пакет
      await (prisma as any).packages.create({
        data: pkgData
      })
      console.log(`✅ Created package: ${pkgData.code}`)
    }
  }

  console.log('🌱 Packages seeding completed!')
}

async function main() {
  try {
    await seedPackages()
  } catch (error) {
    console.error('❌ Error seeding packages:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск если вызван напрямую
if (require.main === module) {
  main()
}

export { seedPackages }
