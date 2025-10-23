'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createPortal } from 'react-dom'
import { X, Zap, Sparkles, Check, Loader2, AlertCircle } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentMode?: string
}

export default function UpgradeModal({ isOpen, onClose, currentMode = 'FREE' }: UpgradeModalProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToData, setAgreedToData] = useState(false)

  // Проверка для SSR
  if (!isOpen || typeof window === 'undefined') return null

  const handleUpgrade = async (targetMode: 'ADVANCED' | 'ADVANCED') => {
    // Проверка согласия с условиями
    if (!agreedToTerms || !agreedToData) {
      setError('Необходимо согласиться с условиями оферты и обработкой персональных данных')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Создание платёжной ссылки
      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'subscription',
          targetMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      console.log('✅ Payment link created:', data.paymentUrl)

      // Закрыть модалку
      onClose()

      // Редирект на страницу оплаты Точка Банка
      window.location.href = data.paymentUrl

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания платежа')
    } finally {
      setIsLoading(false)
    }
  }

  // Используем Portal для рендера модалки в document.body (вне Sidebar)
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 99999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#111827',
          borderRadius: '1rem',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #374151'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gray-900">
          <h3 className="text-xl font-bold text-white">Улучшите свой тариф</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-gray-800 rounded-lg"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* FREE Plan */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">FREE</h4>
                  <p className="text-xs text-gray-400">Бесплатно</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xl font-bold text-white">0₽</div>
                <div className="text-xs text-gray-500">навсегда</div>
              </div>

              <ul className="space-y-1.5 mb-4">
                <li className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">30 генераций/месяц</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Базовая генерация</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Сохранение проектов</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400 line-through opacity-60">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">AI изображения</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400 line-through opacity-60">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Парсинг сайтов</span>
                </li>
              </ul>

              <button
                disabled
                className="w-full py-2.5 bg-gray-700 text-gray-400 rounded-lg font-semibold transition cursor-not-allowed"
              >
                Текущий тариф
              </button>
            </div>

            {/* ADVANCED Plan */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-5 border-2 border-blue-500 relative">
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                ПОПУЛЯРНЫЙ
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">ADVANCED</h4>
                  <p className="text-xs text-blue-300">Для бизнеса</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-2xl font-bold text-white mb-1">1000₽</div>
                <div className="text-xs text-blue-300">в месяц</div>
              </div>

              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">100 генераций с AI изображениями</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">До 10 Flux Schnell на документ</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Парсинг сайтов</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Приоритетная обработка</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Докупка +30 ген. за 300₽</span>
                </li>
              </ul>

              {/* Договор оферты */}
              <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
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
                      договора публичной оферты
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
                    Я даю согласие на обработку персональных данных согласно{' '}
                    <a 
                      href="/legal/privacy" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      политике конфиденциальности
                    </a>
                  </span>
                </label>
              </div>

              <button
                onClick={() => handleUpgrade('ADVANCED')}
                disabled={isLoading || !agreedToTerms || !agreedToData}
                className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  'Купить ADVANCED →'
                )}
              </button>

              {/* Подсказка если не согласились */}
              {(!agreedToTerms || !agreedToData) && !isLoading && (
                <p className="text-xs text-center text-yellow-400 mt-2">
                  ⚠️ Для продолжения примите условия договора и согласие на обработку данных
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              💡 Генерации обновляются 1-го числа каждого месяца
            </p>
            <p className="text-xs text-blue-400 mt-2">
              ✅ Подписка действует ровно 1 месяц с момента оплаты
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

