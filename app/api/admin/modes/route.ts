import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth'
import { verifyAdminFromNextAuth } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  let admin = await verifyAdmin(req)
  if (!admin) {
    admin = await verifyAdminFromNextAuth()
  }
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let settings = await prisma.modeSettings.findFirst()

    if (!settings) {
      settings = await prisma.modeSettings.create({
        data: {
          freeEnabled: true,
          advancedEnabled: true,
          proEnabled: true
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get mode settings error:', error)
    return NextResponse.json({ error: 'Ошибка получения настроек' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  let admin = await verifyAdmin(req)
  if (!admin) {
    admin = await verifyAdminFromNextAuth()
  }
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { freeEnabled, advancedEnabled, proEnabled } = await req.json()

    let settings = await prisma.modeSettings.findFirst()

    if (!settings) {
      settings = await prisma.modeSettings.create({
        data: {
          freeEnabled: freeEnabled ?? true,
          advancedEnabled: advancedEnabled ?? true,
          proEnabled: proEnabled ?? true
        }
      })
    } else {
      settings = await prisma.modeSettings.update({
        where: { id: settings.id },
        data: {
          ...(freeEnabled !== undefined && { freeEnabled }),
          ...(advancedEnabled !== undefined && { advancedEnabled }),
          ...(proEnabled !== undefined && { proEnabled })
        }
      })
    }

    return NextResponse.json({ settings, message: 'Настройки обновлены' })
  } catch (error) {
    console.error('Update mode settings error:', error)
    return NextResponse.json({ error: 'Ошибка обновления настроек' }, { status: 500 })
  }
}


