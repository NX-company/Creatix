'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, DollarSign, Settings, BarChart3, LogOut, Loader2 } from 'lucide-react'

type Stats = {
  totalUsers: number
  activeUsers: number
  totalCosts: number
  totalRevenue: number
  balance: number
  totalProjects: number
}

export default function AdminPage() {
  const router = useRouter()
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Админ-панель Creatix</h1>
            <p className="text-muted-foreground">Управление системой и пользователями</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Пользователей</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600">Активных: {stats.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Затраты</p>
                  <p className="text-2xl font-bold">${stats.totalCosts.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">API costs</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Баланс</p>
                  <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${stats.balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Доход - Затраты</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Проектов</p>
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                  <p className="text-xs text-muted-foreground">Всего создано</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <Users className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Пользователи</h3>
            <p className="text-blue-100 text-sm">Управление пользователями, удаление, добавление</p>
          </Link>

          <Link
            href="/admin/stats"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <BarChart3 className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Статистика</h3>
            <p className="text-purple-100 text-sm">Затраты, доходы, аналитика по API</p>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            <Settings className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Настройки</h3>
            <p className="text-green-100 text-sm">Управление режимами Free/Advanced/PRO</p>
          </Link>
        </div>
      </div>
    </div>
  )
}


