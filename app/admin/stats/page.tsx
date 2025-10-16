'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, DollarSign, Activity, Users, TrendingUp } from 'lucide-react'
import Logo from '@/components/Logo'

type ProviderStat = {
  provider: string
  _sum: { tokensUsed: number | null; cost: number | null }
  _count: { id: number }
}

type ModelStat = {
  model: string
  _sum: { tokensUsed: number | null; cost: number | null }
  _count: { id: number }
}

type TopUser = {
  userId: string
  email: string
  name: string
  tokensUsed: number
  cost: number
}

type RecentUsage = {
  id: string
  userEmail: string
  userName: string | null
  provider: string
  model: string
  endpoint: string
  tokensUsed: number
  cost: number
  createdAt: Date
}

type Stats = {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  totalCosts: number
  totalTokens: number
  totalRevenue: number
  balance: number
  providerStats: ProviderStat[]
  modelStats: ModelStat[]
  topUsers: TopUser[]
  recentUsage: RecentUsage[]
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load statistics</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-card rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold">Статистика и Аналитика</h1>
              <p className="text-muted-foreground">API токены и затраты</p>
            </div>
          </div>
        </div>

        {/* Сводная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Токенов использовано</p>
                <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Затраты на API</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalCosts.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Проектов создано</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных пользователей</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">из {stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика по провайдерам */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📊 Статистика по провайдерам</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Провайдер</th>
                  <th className="text-right py-3 px-4">Запросов</th>
                  <th className="text-right py-3 px-4">Токенов</th>
                  <th className="text-right py-3 px-4">Затраты</th>
                </tr>
              </thead>
              <tbody>
                {stats.providerStats.map((stat) => (
                  <tr key={stat.provider} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{stat.provider}</td>
                    <td className="text-right py-3 px-4">{stat._count.id}</td>
                    <td className="text-right py-3 px-4">{(stat._sum.tokensUsed || 0).toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-red-600">${(stat._sum.cost || 0).toFixed(4)}</td>
                  </tr>
                ))}
                {stats.providerStats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Нет данных об использовании API
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Статистика по моделям */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🤖 Топ-10 моделей по затратам</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Модель</th>
                  <th className="text-right py-3 px-4">Запросов</th>
                  <th className="text-right py-3 px-4">Токенов</th>
                  <th className="text-right py-3 px-4">Затраты</th>
                </tr>
              </thead>
              <tbody>
                {stats.modelStats.map((stat) => (
                  <tr key={stat.model} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium text-sm">{stat.model}</td>
                    <td className="text-right py-3 px-4">{stat._count.id}</td>
                    <td className="text-right py-3 px-4">{(stat._sum.tokensUsed || 0).toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-red-600">${(stat._sum.cost || 0).toFixed(4)}</td>
                  </tr>
                ))}
                {stats.modelStats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Нет данных об использовании моделей
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Топ пользователей по затратам */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">👥 Топ-10 пользователей по затратам</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Имя</th>
                  <th className="text-right py-3 px-4">Токенов</th>
                  <th className="text-right py-3 px-4">Затраты</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user) => (
                  <tr key={user.userId} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4">{user.name || '-'}</td>
                    <td className="text-right py-3 px-4">{user.tokensUsed.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-red-600">${user.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {stats.topUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Нет данных о пользователях
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Последние 100 запросов за 7 дней */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">📈 Последние 100 API запросов (за 7 дней)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2">Дата</th>
                  <th className="text-left py-3 px-2">Пользователь</th>
                  <th className="text-left py-3 px-2">Провайдер</th>
                  <th className="text-left py-3 px-2">Модель</th>
                  <th className="text-right py-3 px-2">Токены</th>
                  <th className="text-right py-3 px-2">Затраты</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsage.map((usage) => (
                  <tr key={usage.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2 px-2 text-xs">
                      {new Date(usage.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-2 text-xs">{usage.userEmail}</td>
                    <td className="py-2 px-2">{usage.provider}</td>
                    <td className="py-2 px-2 text-xs">{usage.model}</td>
                    <td className="text-right py-2 px-2">{usage.tokensUsed.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 text-red-600">${usage.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {stats.recentUsage.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Нет данных за последние 7 дней
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

