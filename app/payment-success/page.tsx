'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [countdown, setCountdown] = useState(5) // Увеличено до 5 секунд для комфортного чтения
  const [activationStatus, setActivationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [activationMessage, setActivationMessage] = useState('')
  const [pollingAttempts, setPollingAttempts] = useState(0)

  const paymentType = searchParams.get('type')
  const mode = searchParams.get('mode')

  // Логируем ВСЕ параметры URL чтобы понять что приходит от Точка Банка
  console.log('🔍 All URL params from Tochka Bank:', Object.fromEntries(searchParams.entries()))

  // Точка банк может передавать operationId в разных параметрах
  const operationId = searchParams.get('operationId') ||
                     searchParams.get('uuid') ||
                     searchParams.get('orderId') ||
                     searchParams.get('transactionId') ||
                     searchParams.get('payment_id') ||
                     searchParams.get('id')

  console.log('🆔 Extracted operationId:', operationId)

  // Автоматическая активация при загрузке страницы
  useEffect(() => {
    if (!operationId) {
      console.log('⚠️ No operationId found in URL parameters')
      setActivationStatus('error')
      setActivationMessage('Платёж обрабатывается. Генерации будут добавлены автоматически.')
      return
    }

    const activatePayment = async () => {
      try {
        console.log(`🔄 Activating payment with operationId: ${operationId}`)

        const response = await fetch('/api/payments/complete-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operationId }),
        })

        const data = await response.json()
        console.log('📥 Response from complete-payment:', data)

        if (response.ok && data.success) {
          console.log('✅ Payment activated successfully via client-side:', data)
          setActivationStatus('success')

          // Формируем понятное сообщение
          let message = ''
          if (paymentType === 'subscription') {
            const modeText = mode === 'ADVANCED' ? 'ADVANCED' : mode === 'PRO' ? 'PRO' : mode
            message = `Подписка ${modeText} успешно активирована!`
          } else if (paymentType === 'bonus_pack') {
            message = '+30 генераций добавлено на ваш аккаунт!'
          } else {
            message = data.message || 'Подписка успешно активирована!'
          }
          setActivationMessage(message)

          // Обновляем NextAuth сессию
          try {
            await updateSession()
            console.log('✅ Session updated')
          } catch (sessionError) {
            console.error('⚠️ Failed to update session:', sessionError)
          }
        } else {
          console.log('⏳ Client-side activation pending, starting polling...')
          // Не показываем ошибку сразу, запускаем polling
        }
      } catch (error) {
        console.error('⚠️ Client-side activation failed, will rely on webhook + polling:', error)
        // Не показываем ошибку, продолжаем polling
      }
    }

    activatePayment()
  }, [operationId, paymentType, mode, updateSession])

  // Polling: проверяем статус транзакции каждые 3 секунды
  useEffect(() => {
    if (!operationId) return
    if (activationStatus === 'success') return // Уже активировано
    if (pollingAttempts >= 10) { // Максимум 10 попыток (30 секунд)
      console.log('⏱️ Polling timeout reached')
      setActivationStatus('error')
      setActivationMessage('Платёж обрабатывается. Генерации будут добавлены автоматически в течение минуты.')
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        console.log(`🔍 Polling attempt ${pollingAttempts + 1}/10`)

        const response = await fetch(`/api/payments/check-status?operationId=${operationId}`)
        const data = await response.json()

        if (data.found && data.transaction.status === 'COMPLETED') {
          console.log('✅ Payment activated successfully via webhook!')
          setActivationStatus('success')

          // Формируем сообщение
          let message = ''
          if (paymentType === 'subscription') {
            const modeText = mode === 'ADVANCED' ? 'ADVANCED' : mode === 'PRO' ? 'PRO' : mode
            message = `Подписка ${modeText} успешно активирована!`
          } else if (paymentType === 'bonus_pack') {
            message = '+30 генераций добавлено на ваш аккаунт!'
          } else {
            message = 'Платёж успешно обработан!'
          }
          setActivationMessage(message)

          // Обновляем сессию
          try {
            await updateSession()
            console.log('✅ Session updated after polling')
          } catch (sessionError) {
            console.error('⚠️ Failed to update session:', sessionError)
          }

          clearInterval(pollInterval)
        } else {
          setPollingAttempts(prev => prev + 1)
        }
      } catch (error) {
        console.error('⚠️ Polling error:', error)
        setPollingAttempts(prev => prev + 1)
      }
    }, 3000) // Проверяем каждые 3 секунды

    return () => clearInterval(pollInterval)
  }, [operationId, activationStatus, pollingAttempts, paymentType, mode, updateSession])

  useEffect(() => {
    // Обратный отсчёт для автоматического редиректа (только после активации)
    if (activationStatus === 'pending') return

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
  }, [router, activationStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Иконка статуса */}
        <div className="mb-6 flex justify-center">
          {activationStatus === 'pending' && (
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          )}
          {activationStatus === 'success' && (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          )}
          {activationStatus === 'error' && (
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
          )}
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {activationStatus === 'pending' && 'Обработка платежа...'}
          {activationStatus === 'success' && 'Готово!'}
          {activationStatus === 'error' && 'Платёж получен'}
        </h1>

        {/* Сообщение */}
        <p className="text-lg text-gray-700 mb-6">
          {activationStatus === 'pending' && 'Пожалуйста, подождите...'}
          {activationStatus === 'success' && activationMessage}
          {activationStatus === 'error' && activationMessage}
        </p>

        {/* Детали активации */}
        {activationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            {paymentType === 'subscription' && (
              <>
                <p className="text-sm font-semibold text-green-700 mb-1">
                  Подписка активирована
                </p>
                <p className="text-sm text-gray-600">
                  Месячный лимит генераций сброшен. Можете начинать работу!
                </p>
              </>
            )}
            {paymentType === 'bonus_pack' && (
              <>
                <p className="text-sm font-semibold text-green-700 mb-1">
                  Бонусные генерации добавлены
                </p>
                <p className="text-sm text-gray-600">
                  +30 дополнительных генераций доступны для использования
                </p>
              </>
            )}
          </div>
        )}

        {/* Сообщение при ошибке/задержке */}
        {activationStatus === 'error' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              {activationMessage}
            </p>
          </div>
        )}

        {/* Обратный отсчёт (только когда не pending) */}
        {activationStatus !== 'pending' && countdown > 0 && (
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm">
              Переход на главную через {countdown} сек...
            </p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/')}
            disabled={activationStatus === 'pending'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {activationStatus === 'pending' ? 'Активация...' : 'Перейти к созданию документов'}
          </button>

          {/* Кнопка пропуска таймера */}
          {activationStatus === 'success' && countdown > 0 && (
            <button
              onClick={() => setCountdown(0)}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Пропустить ожидание
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
