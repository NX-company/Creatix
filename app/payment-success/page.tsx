'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  const paymentType = searchParams.get('type')
  const mode = searchParams.get('mode')

  useEffect(() => {
    // Обратный отсчёт для автоматического редиректа
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const getMessage = () => {
    if (paymentType === 'subscription') {
      const modeText = mode === 'ADVANCED' ? 'ADVANCED' : mode === 'PRO' ? 'PRO' : 'подписку'
      return `Вы успешно оформили подписку на тариф ${modeText}!`
    } else if (paymentType === 'bonus_pack') {
      return 'Вы успешно приобрели бонусный пакет генераций (+30)!'
    }
    return 'Оплата прошла успешно!'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Иконка успеха */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Оплата прошла успешно!
        </h1>

        {/* Сообщение */}
        <p className="text-lg text-gray-700 mb-6">
          {getMessage()}
        </p>

        {/* Детали */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Ваша подписка активирована и готова к использованию.
          </p>
          {paymentType === 'subscription' && (
            <p className="text-sm text-gray-600">
              Месячный лимит генераций сброшен.
            </p>
          )}
          {paymentType === 'bonus_pack' && (
            <p className="text-sm text-gray-600">
              Дополнительные генерации добавлены на ваш аккаунт.
            </p>
          )}
        </div>

        {/* Обратный отсчёт */}
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm">
            Переход на главную через {countdown} сек...
          </p>
        </div>

        {/* Кнопка */}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Перейти к созданию документов
        </button>
      </div>
    </div>
  )
}
