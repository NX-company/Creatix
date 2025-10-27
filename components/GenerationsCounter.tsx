'use client'

import { useStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface SubscriptionStatus {
  subscriptionStatus: string
  appMode: string
  advancedGenerationsTotal: number
  advancedGenerationsRemaining: number
  inpaintOperationsCount: number
  freeGenerationsRemaining: number
}

export default function GenerationsCounter() {
  const { appMode, isGuestMode } = useStore()
  const { data: session } = useSession()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch if user is authenticated and not a guest
    if (isGuestMode || !session) {
      setLoading(false)
      return
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/user/subscription-status')
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [isGuestMode, session])

  // Conditional rendering AFTER all hooks
  if (isGuestMode || !session) return null
  if (loading || !status) return null

  const isAdvanced = appMode === 'advanced'
  const remaining = isAdvanced
    ? status.advancedGenerationsRemaining
    : status.freeGenerationsRemaining
  const total = isAdvanced ? status.advancedGenerationsTotal : 20
  const percentage = total > 0 ? (remaining / total) * 100 : 0

  // Color based on remaining generations
  const getColor = () => {
    const threshold = total * 0.5
    if (remaining > threshold) return 'text-green-500'
    if (remaining >= threshold * 0.25) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getBgColor = () => {
    const threshold = total * 0.5
    if (remaining > threshold) return 'bg-green-500/20'
    if (remaining >= threshold * 0.25) return 'bg-yellow-500/20'
    return 'bg-red-500/20'
  }

  return (
    <div className="p-3 border-t border-border bg-background">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">
            {isAdvanced ? 'Генерации ADVANCED' : 'Бесплатные генерации'}
          </span>
          <span className={`font-bold ${getColor()}`}>
            {remaining}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getBgColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Inpaint operations counter for ADVANCED users */}
        {isAdvanced && status.inpaintOperationsCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Редактирования</span>
            <span className="font-medium text-blue-500">
              {status.inpaintOperationsCount}/5
            </span>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          {isAdvanced ? (
            <>С изображениями и всеми функциями</>
          ) : remaining > 0 ? (
            <>Изображения доступны в ADVANCED режиме</>
          ) : (
            <>Для продолжения оформите подписку</>
          )}
        </p>
      </div>
    </div>
  )
}
