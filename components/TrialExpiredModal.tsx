'use client'

import { X, Sparkles, Mail, Check } from 'lucide-react'
import Logo from './Logo'

interface TrialExpiredModalProps {
  isOpen: boolean
  onClose: () => void
  trialGenerations: number
  trialDays: number
}

export default function TrialExpiredModal({ 
  isOpen, 
  onClose, 
  trialGenerations,
  trialDays 
}: TrialExpiredModalProps) {
  if (!isOpen) return null

  const handleContact = () => {
    window.open('mailto:support@creatix.com?subject=Продление доступа к Creatix', '_blank')
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
              <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-full">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3">
            Пробный период завершен!
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6">
            Вы использовали все доступные генерации в пробном периоде
          </p>

          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Генераций выполнено:</span>
              <span className="text-2xl font-bold text-green-600">{trialGenerations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Дней использования:</span>
              <span className="text-2xl font-bold text-green-600">{trialDays}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <p className="font-semibold text-center text-foreground mb-3">Что дальше?</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Свяжитесь с нами для подключения платного тарифа</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Получите неограниченное количество генераций</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Доступ к расширенным функциям и приоритетной поддержке</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContact}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Связаться с нами
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-muted hover:bg-muted/80 text-foreground font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Закрыть
            </button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Мы свяжемся с вами в течение 24 часов
          </p>
        </div>
      </div>
    </div>
  )
}

