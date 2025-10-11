'use client'

import { useStore, type AppMode } from '@/lib/store'
import { MODE_CONFIG } from '@/lib/config/modes'
import { cn } from '@/lib/cn'

export default function ModeSelector() {
  const { appMode, setAppMode } = useStore()

  const modes: AppMode[] = ['free', 'advanced', 'pro']

  return (
    <div className="p-2 border-t border-border">
      <p className="text-xs text-muted-foreground mb-2 px-2">Режим работы</p>
      <div className="space-y-1">
        {modes.map((mode) => {
          const config = MODE_CONFIG[mode]
          const isActive = appMode === mode
          const isProMode = mode === 'pro'

          return (
            <button
              key={mode}
              onClick={() => setAppMode(mode)}
              disabled={false}
              className={cn(
                'w-full flex items-center gap-2 rounded-md text-sm transition-all px-3 py-2 text-left',
                isActive
                  ? mode === 'advanced'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : mode === 'pro'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
              )}
            >
              <span className="text-lg">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium flex items-center gap-1">
                  {config.name}
                </div>
                <div className="text-xs opacity-80 truncate">{config.description}</div>
                {mode === 'advanced' && (
                  <div className="text-[10px] opacity-70 mt-0.5">
                    Генерация изображений ИИ
                  </div>
                )}
                {mode === 'pro' && (
                  <div className="text-[10px] opacity-70 mt-0.5">
                    Лучшее качество
                  </div>
                )}
              </div>
              {mode === 'advanced' && (
                <span className="text-xs opacity-70">+ AI 🎨</span>
              )}
              {mode === 'pro' && (
                <span className="text-xs opacity-70">💎 HD</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

