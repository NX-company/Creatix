'use client'

import { useState } from 'react'
import { X, Image, Wand2, Eye } from 'lucide-react'

interface ImageActionModalProps {
  isOpen: boolean
  fileName: string
  onClose: () => void
  onAction: (action: 'use-as-is' | 'generate-similar' | 'use-as-reference') => void
}

export default function ImageActionModal({ isOpen, fileName, onClose, onAction }: ImageActionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Что сделать с изображением?</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Загружено: <strong>{fileName}</strong>
          </p>

          <button
            onClick={() => onAction('use-as-is')}
            className="w-full p-4 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition text-left group"
          >
            <div className="flex items-start gap-3">
              <Image className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Вставить как есть</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Использовать загруженное изображение без изменений. Размер автоматически подстроится под макет.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onAction('generate-similar')}
            className="w-full p-4 bg-secondary border border-border rounded-lg hover:bg-accent transition text-left group"
          >
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Сгенерировать похожее (AI)</div>
                <div className="text-xs text-muted-foreground mt-1">
                  AI проанализирует изображение и создаст новое похожее через Flux. Подходит для создания вариаций.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onAction('use-as-reference')}
            className="w-full p-4 bg-secondary border border-border rounded-lg hover:bg-accent transition text-left group"
          >
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Использовать как референс</div>
                <div className="text-xs text-muted-foreground mt-1">
                  AI проанализирует стиль и цвета для вдохновения, но не вставит изображение напрямую.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

