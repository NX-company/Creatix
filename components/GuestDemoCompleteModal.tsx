'use client'

import { useRouter } from 'next/navigation'
import { X, Sparkles, Check, ArrowRight } from 'lucide-react'

interface GuestDemoCompleteModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GuestDemoCompleteModal({ isOpen, onClose }: GuestDemoCompleteModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleRegister = () => {
    router.push('/register')
    onClose()
  }

  const handleLogin = () => {
    router.push('/login')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Хочешь больше возможностей? 🚀</h2>
          <p className="text-muted-foreground">
            Это была лишь демонстрация возможностей.
            Зарегистрируйтесь и получите полный доступ!
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
            <h3 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
              🎁 Бесплатный тариф включает:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>20 генераций документов в месяц</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Редактирование и сохранение документов</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Экспорт в различные форматы</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Сохранение проектов</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
            <h3 className="font-semibold mb-2 text-purple-600 flex items-center gap-2">
              ⚡ Продвинутый тариф:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>100 генераций на 30 дней</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>AI-генерация изображений (Flux 1.1 Pro)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Загрузка своих изображений</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Парсинг сайтов для контента</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRegister}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
          >
            Зарегистрироваться бесплатно
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleLogin}
            className="w-full px-6 py-2.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Уже есть аккаунт? Войти
          </button>
        </div>
      </div>
    </div>
  )
}