'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

type ModeSettings = {
  id: string
  freeEnabled: boolean
  advancedEnabled: boolean
  proEnabled: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ModeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/modes')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/modes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeEnabled: settings.freeEnabled,
          advancedEnabled: settings.advancedEnabled,
          proEnabled: settings.proEnabled
        })
      })

      if (response.ok) {
        setMessage('✅ Настройки сохранены успешно!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('❌ Ошибка сохранения настроек')
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Link href="/admin" className="p-2 hover:bg-muted rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Управление режимами</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Включение/выключение режимов работы</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-500/10 text-green-600 border border-green-500' : 'bg-red-500/10 text-red-600 border border-red-500'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-sm p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-gray-500/10 to-transparent rounded-lg border border-gray-500/20">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span className="text-xl sm:text-2xl">💡</span> Бесплатный режим (FREE)
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Базовая генерация документов без дополнительных функций
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                • Без парсинга сайтов • Без загрузки файлов • Без AI изображений
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-start sm:self-center">
              <input
                type="checkbox"
                checked={settings?.freeEnabled}
                onChange={(e) => setSettings(prev => prev ? {...prev, freeEnabled: e.target.checked} : null)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span className="text-xl sm:text-2xl">⚡</span> Продвинутый режим (ADVANCED)
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Парсинг сайтов, загрузка файлов, больше изображений
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                • Парсинг сайтов • Загрузка файлов • AI изображения (базовые)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-start sm:self-center">
              <input
                type="checkbox"
                checked={settings?.advancedEnabled}
                onChange={(e) => setSettings(prev => prev ? {...prev, advancedEnabled: e.target.checked} : null)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span className="text-xl sm:text-2xl">💎</span> PRO режим
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Максимальное качество, Flux 1.1 Pro, GPT-4o, анализ видео
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                • Flux 1.1 Pro • GPT-4o • Анализ видео • Все функции
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-start sm:self-center">
              <input
                type="checkbox"
                checked={settings?.proEnabled}
                onChange={(e) => setSettings(prev => prev ? {...prev, proEnabled: e.target.checked} : null)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          <div className="pt-4 sm:pt-6 border-t border-border">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-500">
                ⚠️ <strong>Внимание:</strong> При выключении режима пользователи не смогут его выбрать. 
                Используйте для ограничения нагрузки во время бета-тестирования.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm sm:text-base bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  Сохранить настройки
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


