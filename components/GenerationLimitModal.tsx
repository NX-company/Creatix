'use client'

import { useRouter } from 'next/navigation'
import { X, Zap, Check, Package, AlertCircle } from 'lucide-react'
import Logo from './Logo'
import { getNextResetDate } from '@/lib/generationLimits'

interface GenerationLimitModalProps {
  isOpen: boolean
  onClose: () => void
  remaining: number
  isAuthenticated?: boolean
  appMode?: string
  onBuyPack?: () => void
}

export default function GenerationLimitModal({ 
  isOpen, 
  onClose, 
  remaining,
  isAuthenticated = false,
  appMode = 'FREE',
  onBuyPack,
}: GenerationLimitModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleRegister = () => {
    router.push('/register')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  const handleUpgrade = () => {
    router.push('/register?plan=advanced')
  }

  const nextReset = getNextResetDate()
  const nextResetFormatted = nextReset.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })

  const isAdvancedUser = appMode === 'ADVANCED' || appMode === 'ADVANCED'

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-background via-background to-muted border border-border rounded-xl sm:rounded-2xl shadow-2xl max-w-[95vw] sm:max-w-md w-full mx-2 sm:mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-muted-foreground hover:text-foreground transition-colors z-10 min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-full">
                {remaining === 0 ? (
                  <AlertCircle className="w-8 h-8 text-white" />
                ) : (
                  <Zap className="w-8 h-8 text-white" fill="currentColor" />
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-2 sm:mb-3">
            {remaining === 0 ? 'Генерации закончились' : 'Почти закончились!'}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm lg:text-base text-center text-muted-foreground mb-4 sm:mb-6">
            {isAuthenticated ? (
              remaining === 0 ? (
                <>
                  У вас осталось 0 генераций этого месяца.
                  <br />
                  <span className="text-sm">Следующее пополнение: {nextResetFormatted}</span>
                </>
              ) : (
                `У вас осталось ${remaining} ${remaining === 1 ? 'генерация' : 'генераций'} до конца месяца.`
              )
            ) : (
              remaining === 0 
                ? 'Вы использовали бесплатную генерацию. Зарегистрируйтесь, чтобы продолжить!'
                : 'Зарегистрируйтесь, чтобы получить больше генераций!'
            )}
          </p>

          {/* Options for authenticated users */}
          {isAuthenticated ? (
            <>
              {/* Option 1: Buy Pack (for ADVANCED users) */}
              {isAdvancedUser && onBuyPack && remaining === 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">Купить дополнительные генерации</span>
                  </div>
                  <button
                    onClick={onBuyPack}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-2.5 lg:py-3 px-3 sm:px-4 lg:px-5 rounded-lg transition-all text-sm sm:text-base min-h-[40px] sm:min-h-[44px]"
                  >
                    Купить +30 за 300₽
                  </button>
                </div>
              )}

              {/* Option 2: Upgrade (for FREE users) */}
              {!isAdvancedUser && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">100 генераций с AI изображениями</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">До 10 Flux Schnell на документ</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Парсинг сайтов</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-2 sm:space-y-3">
                {!isAdvancedUser ? (
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 sm:py-3 lg:py-3.5 px-4 sm:px-5 lg:px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                  >
                    Перейти на ADVANCED за 1000₽/мес
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full bg-muted hover:bg-muted/80 text-foreground font-medium py-2.5 sm:py-3 lg:py-3.5 px-4 sm:px-5 lg:px-6 rounded-lg transition-all duration-200 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                  >
                    Посмотреть мои документы
                  </button>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Генерации обновятся {nextResetFormatted}
              </p>
            </>
          ) : (
            <>
              {/* Benefits for guests */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">30 бесплатных генераций/месяц</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Сохранение проектов</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">История документов</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleRegister}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 sm:py-3 lg:py-3.5 px-4 sm:px-5 lg:px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                >
                  Зарегистрироваться бесплатно
                </button>
                
                <button
                  onClick={handleLogin}
                  className="w-full bg-muted hover:bg-muted/80 text-foreground font-medium py-2.5 sm:py-3 lg:py-3.5 px-4 sm:px-5 lg:px-6 rounded-lg transition-all duration-200 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                >
                  Уже есть аккаунт? Войти
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Регистрация занимает менее 30 секунд
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

