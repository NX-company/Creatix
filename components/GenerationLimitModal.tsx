'use client'

import { useRouter } from 'next/navigation'
import { X, Zap, Check } from 'lucide-react'
import Logo from './Logo'

interface GenerationLimitModalProps {
  isOpen: boolean
  onClose: () => void
  remaining: number
}

export default function GenerationLimitModal({ isOpen, onClose, remaining }: GenerationLimitModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleRegister = () => {
    router.push('/register')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-background via-background to-muted border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-full">
                <Zap className="w-8 h-8 text-white" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3">
            {remaining === 0 ? 'Бесплатные генерации закончились' : 'Почти закончились!'}
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6">
            {remaining === 0 
              ? 'Вы использовали все 3 бесплатные генерации. Зарегистрируйтесь, чтобы продолжить создавать документы!'
              : `У вас осталась ${remaining === 1 ? '1 бесплатная генерация' : `${remaining} бесплатные генерации`}. Зарегистрируйтесь, чтобы получить больше!`
            }
          </p>

          {/* Benefits */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Неограниченные генерации документов</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Сохранение всех проектов в облаке</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Продвинутые режимы генерации</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Приоритетная поддержка</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Зарегистрироваться бесплатно
            </button>
            
            <button
              onClick={handleLogin}
              className="w-full bg-muted hover:bg-muted/80 text-foreground font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Регистрация занимает менее 30 секунд
          </p>
        </div>
      </div>
    </div>
  )
}

