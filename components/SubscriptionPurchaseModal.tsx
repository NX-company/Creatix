'use client'

import { useState } from 'react'
import { X, Check, Sparkles, CreditCard, Loader2 } from 'lucide-react'

interface SubscriptionPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SubscriptionPurchaseModal({ isOpen, onClose }: SubscriptionPurchaseModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePurchase = async () => {
    // Проверка чекбокса
    if (!acceptedTerms) {
      setError('⚠️ Необходимо принять условия договора оферты')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // Вызов API создания платежа
      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'subscription',
          targetMode: 'ADVANCED'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка создания платежа')
      }

      const data = await response.json()

      // Редирект на страницу оплаты Точка Банка
      if (data.paymentLink) {
        window.location.href = data.paymentLink
      } else {
        throw new Error('Не получен paymentLink от сервера')
      }
    } catch (err: any) {
      console.error('Payment creation error:', err)
      setError(err.message || '❌ Ошибка при создании платежа. Попробуйте снова.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-background border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">💎 Купить режим ADVANCED</h2>
          <p className="text-muted-foreground">
            Получите полный доступ ко всем возможностям на 30 дней
          </p>
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20 mb-4">
          <h3 className="font-semibold mb-3 text-purple-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            100 генераций документов на 30 дней
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span><strong>AI-генерация качественных изображений</strong> (Flux 1.1 Pro)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span><strong>Загрузка своих изображений</strong> в документы</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span><strong>Инпейнтинг</strong> — редактор изображений с AI</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span><strong>Парсинг сайтов</strong> для автоматического сбора контента</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span><strong>Приоритетная поддержка</strong></span>
            </li>
          </ul>
        </div>

        {/* Pricing details */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border mb-4">
          <h4 className="font-semibold mb-2 text-sm">Ценообразование генераций:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Генерация с 1-5 AI-изображениями = 1 генерация</li>
            <li>• Генерация с 6-10 AI-изображениями = 2 генерации</li>
            <li>• Инпейнтинг: каждые 5 операций = 1 генерация</li>
          </ul>
        </div>

        {/* Price */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20 mb-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Стоимость:</p>
          <p className="text-3xl font-bold text-green-600">10₽</p>
          <p className="text-xs text-muted-foreground mt-1">на 30 календарных дней</p>
        </div>

        {/* Terms checkbox */}
        <div className="mb-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={isLoading}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50 cursor-pointer"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Я принимаю условия{' '}
              <a
                href="/legal/offer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 hover:text-purple-600 underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                договора публичной оферты
              </a>
            </span>
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Создаем платеж...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Оплатить 10₽
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full px-6 py-2.5 text-muted-foreground hover:text-foreground transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            После оплаты вы будете перенаправлены обратно в приложение.
            <br />
            Подписка активируется автоматически.
          </p>
        </div>
      </div>
    </div>
  )
}
