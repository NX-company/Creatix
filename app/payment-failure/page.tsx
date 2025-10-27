'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { XCircle, RefreshCw, Home } from 'lucide-react'

export const dynamic = 'force-dynamic'

function PaymentFailureContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentType = searchParams.get('type')

  const getMessage = () => {
    if (paymentType === 'subscription') {
      return 'К сожалению, оплата подписки не прошла.'
    } else if (paymentType === 'bonus_pack') {
      return 'К сожалению, оплата бонусного пакета не прошла.'
    } else if (paymentType === 'package') {
      return 'К сожалению, оплата пакета ADVANCED не прошла.'
    }
    return 'К сожалению, оплата не прошла.'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Иконка ошибки */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Оплата не прошла
        </h1>

        {/* Сообщение */}
        <p className="text-lg text-gray-700 mb-6">
          {getMessage()}
        </p>

        {/* Причины */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Возможные причины:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Недостаточно средств на карте</li>
            <li>Неверные данные карты</li>
            <li>Платёж отклонён банком</li>
            <li>Превышено время ожидания</li>
          </ul>
        </div>

        {/* Кнопки */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Вернуться на главную
          </button>
        </div>

        {/* Поддержка */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Если проблема повторяется, свяжитесь с{' '}
            <a
              href="mailto:support@creatix.ru"
              className="text-blue-600 hover:underline"
            >
              поддержкой
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <PaymentFailureContent />
    </Suspense>
  )
}
