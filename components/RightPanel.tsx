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
    <div className="h-full flex-1 border-l border-border bg-gradient-to-br from-muted/30 via-background to-muted/20 flex flex-col shadow-2xl">
      <div className="border-b border-border flex overflow-x-auto bg-gradient-to-r from-background via-muted/10 to-background backdrop-blur-sm shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon
          const fileCount = t.id === 'files' ? generatedFiles.length : t.id === 'images' ? generatedImagesForExport.length : 0
          
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-3 transition-all whitespace-nowrap relative group',
                activeTab === t.id
                  ? 'border-primary text-primary bg-gradient-to-b from-primary/10 to-primary/5 shadow-md scale-105'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-gradient-to-b hover:from-accent/60 hover:to-accent/30 hover:scale-102 hover:shadow-sm'
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", activeTab === t.id ? "scale-110" : "group-hover:scale-110")} />
              <span className="font-semibold">{t.label}</span>
              {fileCount > 0 && (
                <span className="ml-2 px-2.5 py-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-full shadow-md animate-pulse">
                  {fileCount}
                </span>
              )}
              {activeTab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
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

