'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useStore } from '@/lib/store'
import { signIn } from 'next-auth/react'
import Logo from '@/components/Logo'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  
  const setIsGuestMode = useStore((state) => state.setIsGuestMode)
  const resetGuestGenerations = useStore((state) => state.resetGuestGenerations)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('📋 Registration page loaded with plan:', plan)
  }, [plan])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка регистрации')
        setLoading(false)
        return
      }

      setSuccess(true)
      
      // Clear guest mode and reset generation counter on successful registration
      sessionStorage.removeItem('isGuestMode')
      setIsGuestMode(false)
      resetGuestGenerations()
      console.log('✅ Guest mode and generation counter reset after registration')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('Ошибка подключения к серверу')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-3">
              <Logo size="lg" />
            </div>
            <p className="text-muted-foreground">Создайте аккаунт</p>
            
            {plan === 'advanced' && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-500">ADVANCED план</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  100 генераций с AI изображениями за 1000₽/мес
                </p>
              </div>
            )}
            
            {plan === 'free' && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-500">FREE план</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  30 генераций/месяц бесплатно
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            disabled={loading || success}
            className="w-full bg-white text-gray-700 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Зарегистрироваться через Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">или через email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-600 px-4 py-3 rounded-lg text-sm space-y-2">
                <div className="font-semibold">✅ Регистрация успешна!</div>
                <div className="text-xs">
                  📧 Мы отправили письмо с подтверждением на ваш email.<br />
                  Проверьте почту и перейдите по ссылке для активации аккаунта.
                </div>
                <div className="text-xs text-green-600/70 mt-2">
                  Перенаправление на страницу входа...
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="your@email.com"
                required
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Логин
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Введите логин"
                required
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                  placeholder="Минимум 6 символов"
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  disabled={loading || success}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                  placeholder="Повторите пароль"
                  required
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  disabled={loading || success}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Регистрация...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold text-base">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

