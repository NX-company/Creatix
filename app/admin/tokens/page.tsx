'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  RefreshCw
} from 'lucide-react'

interface UsageByProvider {
  provider: string
  model: string
  _sum: {
    tokensUsed: number | null
    cost: number | null
  }
  _count: {
    id: number
  }
}

interface RecentActivity {
  createdAt: string
  tokensUsed: number
  cost: number
  provider: string
  model: string
}

interface UserTokenStats {
  id: string
  email: string
  name: string | null
  role: string
  appMode: string
  totalTokensUsed: number
  totalApiCost: number
  createdAt: string
  _count: {
    apiUsage: number
  }
  usageByProvider: UsageByProvider[]
  recentActivity: RecentActivity[]
}

interface TokenStatsResponse {
  users: UserTokenStats[]
  totals: {
    totalTokensUsed: number
    totalApiCost: number
  }
}

export default function AdminTokensPage() {
  const router = useRouter()
  const [stats, setStats] = useState<TokenStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/token-stats')
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch token stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка статистики...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Статистика токенов и API</h1>
            <p className="text-slate-400">Детальный расход токенов каждого пользователя</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              ← Назад
            </button>
          </div>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 rounded-xl p-6 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-8 h-8 text-blue-400" />
                  <h3 className="text-slate-300 text-sm">Всего токенов</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {formatNumber(stats.totals.totalTokensUsed)}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <h3 className="text-slate-300 text-sm">Общая стоимость</h3>
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {formatCost(stats.totals.totalApiCost)}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <h3 className="text-slate-300 text-sm">Активных пользователей</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400">
                  {stats.users.filter(u => u._count.apiUsage > 0).length}
                </p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Режим
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Токены
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Стоимость
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Запросов
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Детали
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {stats.users.map((user) => (
                      <>
                        <tr key={user.id} className="hover:bg-slate-700/50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-white">{user.email}</div>
                              {user.name && <div className="text-sm text-slate-400">{user.name}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.appMode === 'ADVANCED' ? 'bg-purple-500/20 text-purple-300' :
                              user.appMode === 'PRO' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {user.appMode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-blue-300">
                            {formatNumber(user.totalTokensUsed)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-green-300">
                            {formatCost(user.totalApiCost)}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-300">
                            {user._count.apiUsage}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleUserExpand(user.id)}
                              className="p-2 hover:bg-slate-600 rounded-lg transition"
                              disabled={user._count.apiUsage === 0}
                            >
                              {expandedUsers.has(user.id) ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                        </tr>
                        
                        {expandedUsers.has(user.id) && (
                          <tr key={`${user.id}-details`}>
                            <td colSpan={6} className="px-6 py-4 bg-slate-900/50">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                    📈 По провайдерам и моделям:
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {user.usageByProvider.map((usage, idx) => (
                                      <div key={idx} className="bg-slate-800 rounded-lg p-3">
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <div className="font-medium text-white text-sm">
                                              {usage.provider} / {usage.model}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                              {usage._count.id} запросов
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-mono text-blue-300 text-sm">
                                              {formatNumber(usage._sum.tokensUsed || 0)} токенов
                                            </div>
                                            <div className="font-mono text-green-300 text-xs">
                                              {formatCost(usage._sum.cost || 0)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {user.recentActivity.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                      🕐 Последние запросы (7 дней):
                                    </h4>
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                      {user.recentActivity.map((activity, idx) => (
                                        <div key={idx} className="bg-slate-800 rounded p-2 text-xs">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <span className="text-slate-400">{formatDate(activity.createdAt)}</span>
                                              <span className="mx-2 text-slate-600">•</span>
                                              <span className="text-blue-300">{activity.provider}</span>
                                              <span className="mx-2 text-slate-600">•</span>
                                              <span className="text-slate-300">{activity.model}</span>
                                            </div>
                                            <div className="flex gap-3">
                                              <span className="font-mono text-blue-300">
                                                {formatNumber(activity.tokensUsed)} tok
                                              </span>
                                              <span className="font-mono text-green-300">
                                                {formatCost(activity.cost)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

