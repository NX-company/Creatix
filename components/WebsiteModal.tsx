'use client'

import { useState } from 'react'
import { X, Loader2, Globe } from 'lucide-react'

interface WebsiteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string) => void
  isLoading?: boolean
}

export default function WebsiteModal({ isOpen, onClose, onSubmit, isLoading }: WebsiteModalProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Введите URL сайта')
      return
    }

    // Проверка формата URL
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      
      if (!urlObj.protocol.startsWith('http')) {
        setError('URL должен начинаться с http:// или https://')
        return
      }
      
      setError('')
      onSubmit(urlObj.href)
    } catch {
      setError('Некорректный URL. Пример: https://example.com')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Парсинг сайта</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              URL сайта
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
              placeholder="https://example.com"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Что будет извлечено:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Заголовки (H1, H2, H3)</li>
              <li>Текстовый контент</li>
              <li>Изображения</li>
              <li>Ссылки и структура</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Парсинг...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Парсить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

