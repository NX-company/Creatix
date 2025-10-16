'use client'

import { useStore } from '@/lib/store'
import { Eye, FolderDown, Image } from 'lucide-react'
import { cn } from '@/lib/cn'
import PreviewFrame from './PreviewFrame'
import FilesList from './FilesList'
import ImagesList from './ImagesList'

const tabs = [
  { id: 'preview', label: 'Предпросмотр', icon: Eye },
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
      <div className="border-b border-border flex items-center justify-between bg-background">
        <div className="flex overflow-x-auto">
          {tabs.map((t) => {
          const Icon = t.icon
          const fileCount = t.id === 'files' ? generatedFiles.length : t.id === 'images' ? generatedImagesForExport.length : 0
          
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-medium border-b-2 transition-all whitespace-nowrap min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] touch-manipulation',
                activeTab === t.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline font-medium">{t.label}</span>
              <span className="sm:hidden font-medium">{t.label.substring(0, 4)}</span>
              {fileCount > 0 && (
                <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold rounded-full">
                  {fileCount}
                </span>
              )}
            </button>
          )
        })}
        </div>
        
        {/* Кнопка "Обучение" */}
        <button
          onClick={() => {
            localStorage.removeItem('nx_studio_tour_completed')
            window.location.reload()
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 mr-2 text-xs font-semibold transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:shadow-lg hover:shadow-purple-500/50 hover:from-purple-700 hover:to-blue-700 hover:-translate-y-0.5 active:scale-95 flex-shrink-0"
          title="Пройти обучение заново"
        >
          <span className="text-sm">🎓</span>
          <span className="hidden sm:inline">Обучение</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'preview' && (
          <div data-tour="preview" className="h-full flex flex-col">
            <PreviewFrame />
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

