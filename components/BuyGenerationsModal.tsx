'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Loader2, AlertCircle } from 'lucide-react'
import { BONUS_PACK_GENERATIONS, BONUS_PACK_PRICE } from '@/lib/generationLimits'

interface BuyGenerationsModalProps {
  isOpen: boolean
  onClose: () => void
  currentGenerations: number
  onSuccess?: () => void
}

export default function BuyGenerationsModal({
  isOpen,
  onClose,
  currentGenerations,
  onSuccess,
}: BuyGenerationsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToData, setAgreedToData] = useState(false)

  // Проверка для SSR
  if (!isOpen || typeof window === 'undefined') return null

  const handlePurchase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/buy-generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed')
      }

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Используем Portal для рендера модалки в document.body (вне Sidebar)
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-2xl font-bold text-white">Купить генерации</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Extra {BONUS_PACK_GENERATIONS}</h4>
                <p className="text-gray-400 text-sm">Дополнительные генерации</p>
              </div>
            </div>

            <ul className="space-y-2 text-gray-300 text-sm mb-4">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                +{BONUS_PACK_GENERATIONS} генераций с AI изображениями
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                До 10 Flux Schnell на документ
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Действуют до конца месяца подписки
              </li>
            </ul>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{BONUS_PACK_PRICE}₽</span>
              <span className="text-gray-400">~{Math.round(BONUS_PACK_PRICE / BONUS_PACK_GENERATIONS)}₽ за генерацию</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Текущий остаток:</span>
              <span className="text-white font-semibold">{currentGenerations} ген.</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">После покупки:</span>
              <span className="text-green-400 font-semibold">{currentGenerations + BONUS_PACK_GENERATIONS} ген.</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Договор оферты */}
          <div className="mb-4 space-y-3 border-t border-gray-700 pt-4">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-gray-300 group-hover:text-white">
                Я принимаю условия{' '}
                <a 
                  href="/legal/offer" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  договора оферты
                </a>
              </span>
            </label>
            
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToData}
                onChange={(e) => setAgreedToData(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-gray-300 group-hover:text-white">
                Я даю согласие на обработку данных
              </span>
            </label>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isLoading || !agreedToTerms || !agreedToData}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Обработка...
              </>
            ) : (
              `Купить за ${BONUS_PACK_PRICE}₽`
            )}
          </button>

          {(!agreedToTerms || !agreedToData) && !isLoading && (
            <p className="text-xs text-center text-yellow-400 mt-2">
              ⚠️ Примите условия для продолжения
            </p>
          )}

          <p className="text-xs text-center text-gray-400 mt-3">
            Доступно только для подписчиков ADVANCED и PRO
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

