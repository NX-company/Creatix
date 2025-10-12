'use client'

import { X, Copy, FileText, Palette } from 'lucide-react'

interface WebsiteActionModalProps {
  isOpen: boolean
  websiteUrl: string
  onClose: () => void
  onAction: (action: 'copy-design' | 'content-only' | 'style-only') => void
}

export default function WebsiteActionModal({ isOpen, websiteUrl, onClose, onAction }: WebsiteActionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Что сделать с сайтом?</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Сайт: <strong className="break-all">{websiteUrl}</strong>
          </p>

          <button
            onClick={() => onAction('copy-design')}
            className="w-full p-4 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition text-left"
          >
            <div className="flex items-start gap-3">
              <Copy className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Максимально точная копия</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Повторить дизайн, структуру, цвета и контент максимально близко к оригиналу.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onAction('content-only')}
            className="w-full p-4 bg-secondary border border-border rounded-lg hover:bg-accent transition text-left"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Только контент + мой дизайн</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Взять текст, заголовки и изображения, но применить свой современный дизайн.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onAction('style-only')}
            className="w-full p-4 bg-secondary border border-border rounded-lg hover:bg-accent transition text-left"
          >
            <div className="flex items-start gap-3">
              <Palette className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Только стиль/цвета</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Извлечь цветовую схему и визуальный стиль, но использовать свой контент.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

