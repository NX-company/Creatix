'use client'

import { useStore } from '@/lib/store'
import { Download, X } from 'lucide-react'
import { useState } from 'react'
import GenerationLimitModal from './GenerationLimitModal'

export default function ImagesList() {
  const generatedImagesForExport = useStore((state) => state.generatedImagesForExport)
  const isGuestMode = useStore((state) => state.isGuestMode)
  const getRemainingGenerations = useStore((state) => state.getRemainingGenerations)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)

  const downloadImage = async (image: any, format: 'png' | 'jpg' | 'webp') => {
    if (isGuestMode) {
      console.log('🚫 Guest users cannot download images')
      setShowLimitModal(true)
      return
    }
    
    setDownloadingId(`${image.slot}-${format}`)
    
    try {
      const canvas = document.createElement('canvas')
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = image.dataUrl
      })
      
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      
      ctx.drawImage(img, 0, 0)
      
      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      const quality = format === 'jpg' ? 0.95 : undefined
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Failed to create blob')
          }
          
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `image-${image.slot + 1}.${format}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          setDownloadingId(null)
        },
        mimeType,
        quality
      )
    } catch (error) {
      console.error('Failed to download image:', error)
      alert('Ошибка при скачивании изображения')
      setDownloadingId(null)
    }
  }

  if (generatedImagesForExport.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">🖼️</div>
        <p className="text-sm text-muted-foreground">
          Изображения появятся здесь после генерации документа
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Сгенерированные изображения ({generatedImagesForExport.length})</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Скачайте любое изображение в нужном формате
        </p>
      </div>
      
      {/* Guest warning */}
      {isGuestMode && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-xs font-semibold text-orange-600 mb-1">⚠️ Гостевой режим</p>
          <p className="text-xs text-orange-600">Зарегистрируйтесь, чтобы скачивать изображения</p>
        </div>
      )}
      
      <div className="space-y-3">
        {generatedImagesForExport.map((image, index) => (
          <div
            key={`generated-image-${index}-${image.slot}`}
            className="border border-border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {/* Превью */}
            <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden bg-background border border-border">
              <img
                src={image.dataUrl}
                alt={`Изображение ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Информация */}
            <div className="mb-2">
              <p className="text-xs font-medium text-foreground mb-1">
                Изображение {index + 1}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {image.prompt}
              </p>
            </div>
            
            {/* Кнопки скачивания */}
            <div className="flex gap-1.5">
              <button
                onClick={() => downloadImage(image, 'png')}
                disabled={downloadingId === `${image.slot}-png` || isGuestMode}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-opacity ${
                  isGuestMode
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50'
                }`}
                title={isGuestMode ? 'Зарегистрируйтесь для скачивания' : 'Скачать как PNG'}
              >
                <Download className="w-3 h-3" />
                {downloadingId === `${image.slot}-png` ? '...' : 'PNG'}
              </button>
              
              <button
                onClick={() => downloadImage(image, 'jpg')}
                disabled={downloadingId === `${image.slot}-jpg` || isGuestMode}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-opacity ${
                  isGuestMode
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50'
                }`}
                title={isGuestMode ? 'Зарегистрируйтесь для скачивания' : 'Скачать как JPG'}
              >
                <Download className="w-3 h-3" />
                {downloadingId === `${image.slot}-jpg` ? '...' : 'JPG'}
              </button>
              
              <button
                onClick={() => downloadImage(image, 'webp')}
                disabled={downloadingId === `${image.slot}-webp` || isGuestMode}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-opacity ${
                  isGuestMode
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50'
                }`}
                title={isGuestMode ? 'Зарегистрируйтесь для скачивания' : 'Скачать как WebP'}
              >
                <Download className="w-3 h-3" />
                {downloadingId === `${image.slot}-webp` ? '...' : 'WebP'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Generation Limit Modal */}
      <GenerationLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        remaining={getRemainingGenerations()}
      />
    </div>
  )
}

