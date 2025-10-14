'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Palette, Eye, FolderDown, Image } from 'lucide-react'
import { cn } from '@/lib/cn'
import PreviewFrame from './PreviewFrame'
import FilesList from './FilesList'
import StyleEditor from './StyleEditor'
import ImagesList from './ImagesList'

const tabs = [
  { id: 'preview', label: 'Предпросмотр', icon: Eye },
  { id: 'style', label: 'Выбрать Стиль', icon: Palette },
  { id: 'images', label: 'Изображения', icon: Image },
  { id: 'files', label: 'Файлы', icon: FolderDown },
]

export default function RightPanel() {
  const {
    activeTab,
    setActiveTab,
    generatedFiles,
    generatedImagesForExport,
  } = useStore()

  return (
    <div className="h-full flex-1 border-l border-border bg-background flex flex-col">
      <div className="border-b border-border flex overflow-x-auto bg-background">
        {tabs.map((t) => {
          const Icon = t.icon
          const fileCount = t.id === 'files' ? generatedFiles.length : t.id === 'images' ? generatedImagesForExport.length : 0
          
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap min-h-[44px] touch-manipulation',
                activeTab === t.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{t.label}</span>
              {fileCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {fileCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'preview' && (
          <div data-tour="preview" className="h-full flex flex-col">
            <PreviewFrame />
          </div>
        )}

        {activeTab === 'style' && (
          <div className="p-6 overflow-y-auto h-full">
            <StyleEditor />
          </div>
        )}

        {activeTab === 'images' && (
          <div className="overflow-y-auto h-full">
            <ImagesList />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-4 overflow-y-auto h-full">
            <FilesList />
          </div>
        )}
      </div>
    </div>
  )
}

