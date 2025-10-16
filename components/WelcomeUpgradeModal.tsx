'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Sparkles, Zap, Loader2, X } from 'lucide-react'

interface WelcomeUpgradeModalProps {
  isOpen: boolean
  onClose?: () => void
}

export default function WelcomeUpgradeModal({ isOpen, onClose }: WelcomeUpgradeModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleRegisterFree = () => {
    console.log('🎯 FREE plan selected, redirecting to registration...')
    
    // Clear guest mode flags
    sessionStorage.removeItem('isGuestMode')
    sessionStorage.removeItem('first_generation_advanced')
    
    // Close modal if callback provided
    if (onClose) {
      onClose()
    }
    
    // Navigate to registration
    setTimeout(() => {
      window.location.href = '/register?plan=free'
    }, 100)
  }

  const handleUpgradeAdvanced = async () => {
    console.log('💎 ADVANCED plan selected, redirecting to registration...')
    setIsLoading(true)
    
    // Clear guest mode flags
    sessionStorage.removeItem('isGuestMode')
    sessionStorage.removeItem('first_generation_advanced')
    
    // Close modal if callback provided
    if (onClose) {
      onClose()
    }
    
    // Navigate to registration
    setTimeout(() => {
      window.location.href = '/register?plan=advanced'
    }, 100)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700 overflow-hidden relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition z-10"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        )}
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Ваш документ готов!</h2>
            <p className="text-gray-400">Вам понравилось качество? Выберите свой план:</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">FREE</h3>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>30 генераций/месяц</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Сохранение проектов</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>История документов</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400 line-through">
                  <span className="w-5 h-5 flex-shrink-0"></span>
                  <span>AI изображения</span>
                </li>
              </ul>

              <button
                onClick={handleRegisterFree}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition active:scale-95 touch-manipulation cursor-pointer"
                type="button"
              >
                Зарегистрироваться бесплатно
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border-2 border-blue-500 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                РЕКОМЕНДУЕМ
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">ADVANCED</h3>
                  <p className="text-sm text-blue-300">1000₽/месяц</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>100 генераций с AI изображениями</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>До 10 Flux Schnell на документ</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Парсинг сайтов</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Приоритетная обработка</span>
                </li>
              </ul>

              <button
                onClick={handleUpgradeAdvanced}
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 touch-manipulation cursor-pointer"
                type="button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    Купить за 1000₽/мес →
                  </>
                )}
              </button>

              <p className="text-xs text-center text-blue-200 mt-3">
                💡 Вы только что видели ADVANCED качество!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

