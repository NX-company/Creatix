'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface FreeGenerationsLimitModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FreeGenerationsLimitModal({ isOpen, onClose }: FreeGenerationsLimitModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleUpgrade = () => {
    router.push('/payment-success?mode=select')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">😔</div>
          <h2 className="text-2xl font-bold mb-2">Бесплатные генерации исчерпаны</h2>
          <p className="text-muted-foreground">
            Вы использовали все 20 бесплатных генераций
          </p>
        </div>

        {/* Features comparison */}
        <div className="space-y-4 mb-6">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-green-500">✓</span> ADVANCED режим
            </h3>
            <ul className="text-sm space-y-1 text-muted-foreground ml-6">
              <li>• Неограниченные генерации</li>
              <li>• AI-генерация изображений (Flux 1.1 Pro)</li>
              <li>• Загрузка своих фото</li>
              <li>• Парсинг сайтов</li>
              <li>• Приоритетная поддержка</li>
            </ul>
          </div>

          <div className="bg-muted/10 rounded-lg p-4 border border-dashed border-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-muted-foreground">○</span> FREE режим (текущий)
            </h3>
            <ul className="text-sm space-y-1 text-muted-foreground ml-6">
              <li>• 20 генераций (исчерпано)</li>
              <li>• Только текст, без изображений</li>
              <li>• Редактирование документов</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          >
            Оформить подписку
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
