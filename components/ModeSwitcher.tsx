'use client'

import { FileEdit, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function ModeSwitcher() {
  const workMode = useStore((state) => state.workMode)
  const setWorkMode = useStore((state) => state.setWorkMode)

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border">
      <button
        onClick={() => setWorkMode('plan')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
          transition-all duration-200
          ${workMode === 'plan' 
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
            : 'text-muted-foreground hover:text-foreground hover:bg-background'
          }
        `}
        title="Режим планирования: обсудите детали перед генерацией"
      >
        <FileEdit className="w-4 h-4" />
        <span>Plan</span>
        {workMode === 'plan' && (
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        )}
      </button>
      
      <button
        onClick={() => setWorkMode('build')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
          transition-all duration-200
          ${workMode === 'build' 
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105' 
            : 'text-muted-foreground hover:text-foreground hover:bg-background'
          }
        `}
        title="Режим разработки: генерация по утвержденному плану"
      >
        <Zap className="w-4 h-4" />
        <span>Build</span>
        {workMode === 'build' && (
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        )}
      </button>
    </div>
  )
}


