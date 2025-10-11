'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Palette, Eye, FolderDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import PreviewFrame from './PreviewFrame'
import FilesList from './FilesList'
import StyleEditor from './StyleEditor'

const tabs = [
  { id: 'preview', label: 'Предпросмотр', icon: Eye },
  { id: 'style', label: 'Выбрать Стиль', icon: Palette },
  { id: 'files', label: 'Файлы', icon: FolderDown },
]

export default function RightPanel() {
  const {
    activeTab,
    setActiveTab,
    generatedFiles,
  } = useStore()

  return (
    <div className="flex-1 border-l border-border bg-gradient-to-br from-muted/20 to-background flex flex-col shadow-xl">
      <div className="border-b border-border flex overflow-x-auto bg-background/50 backdrop-blur-sm">
        {tabs.map((t) => {
          const Icon = t.icon
          const fileCount = t.id === 'files' ? generatedFiles.length : 0
          
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all whitespace-nowrap relative',
                activeTab === t.id
                  ? 'border-primary text-primary bg-primary/5 shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {fileCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full shadow-sm">
                  {fileCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'preview' && (
          <div data-tour="preview">
            <PreviewFrame />
          </div>
        )}

        {activeTab === 'style' && <StyleEditor />}

        {activeTab === 'files' && <FilesList />}
      </div>
    </div>
  )
}

