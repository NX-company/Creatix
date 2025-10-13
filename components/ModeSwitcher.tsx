'use client'

import { FileEdit, Zap, X } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function ModeSwitcher() {
  const workMode = useStore((state) => state.workMode)
  const setWorkMode = useStore((state) => state.setWorkMode)
  const uploadedImages = useStore((state) => state.uploadedImages)
  const removeUploadedImage = useStore((state) => state.removeUploadedImage)

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border border-border">
      {/* Кнопки Plan/Build */}
      <div className="flex items-center gap-1">
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

      {/* Загруженные изображения */}
      {uploadedImages.length > 0 && (
        <>
          {/* Разделитель */}
          <div className="w-px h-8 bg-border" />
          
          {/* Превьюшки */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[300px]">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="relative group flex-shrink-0"
                title={img.name}
              >
                {/* Превью изображения */}
                <div className="w-8 h-8 rounded border-2 border-primary/30 overflow-hidden bg-background shadow-sm">
                  <img
                    src={img.base64}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Кнопка удаления */}
                <button
                  onClick={() => removeUploadedImage(img.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 hover:scale-110"
                  title={`Удалить ${img.name}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


