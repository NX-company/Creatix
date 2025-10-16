'use client'

import { useStore, type AppMode } from '@/lib/store'
import { MODE_CONFIG } from '@/lib/config/modes'
import { cn } from '@/lib/cn'
import { useSession } from 'next-auth/react'

export default function ModeSelector() {
  const { appMode, setAppMode } = useStore()
  const { data: session, update: updateSession } = useSession()

  const modes: AppMode[] = ['free', 'advanced', 'pro']
  
  const handleModeClick = async (mode: AppMode) => {
    // Для гостей просто меняем локальный state
    if (!session?.user) {
      setAppMode(mode)
      return
    }
    
    // Для аутентифицированных пользователей обновляем режим в базе данных
    try {
      const response = await fetch('/api/user/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: mode.toUpperCase() }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to switch mode:', data.error)
        return
      }

      console.log(`✅ Mode switched to ${mode} in database`)
      
      // Обновляем NextAuth session из базы данных
      await updateSession()
      
      // Обновляем локальный state
      setAppMode(mode)
      
      // Триггерим обновление счетчика генераций
      window.dispatchEvent(new CustomEvent('mode-switched', { detail: { mode } }))
    } catch (error) {
      console.error('Error switching mode:', error)
    }
  }

  return (
    <div className="p-2 border-t border-border">
      <p className="text-xs text-muted-foreground mb-1.5 px-2">Режим работы</p>
      <div className="space-y-1">
        {modes.map((mode) => {
          const config = MODE_CONFIG[mode]
          const isActive = appMode === mode
          const isProMode = mode === 'pro'

          return (
            <button
              key={mode}
              onClick={() => handleModeClick(mode)}
              disabled={isProMode}
              className={cn(
                'w-full flex items-center gap-2 rounded-md text-sm transition-all px-2.5 py-1.5 text-left',
                isProMode && 'hidden',
                !isProMode && isActive
                  ? mode === 'advanced'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-2 border-blue-400 ring-2 ring-blue-500/30'
                    : 'bg-primary text-primary-foreground shadow-lg border-2 border-primary/50 ring-2 ring-primary/30'
                  : !isProMode && 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
              )}
            >
              <span className="text-xl">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1.5">
                  {config.name}
                  {isActive && <span className="text-base">✓</span>}
                </div>
                <div className="text-xs opacity-90 truncate">{config.description}</div>
                {mode === 'advanced' && (
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Генерация изображений ИИ
                  </div>
                )}
              </div>
              {mode === 'advanced' && (
                <span className="text-xs opacity-80">+ AI 🎨</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

