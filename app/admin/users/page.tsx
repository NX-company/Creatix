'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, UserPlus, Loader2, Ban, Check } from 'lucide-react'
import Logo from '@/components/Logo'

type User = {
  id: string
  username: string
  email: string
  role: string
  appMode: string
  isActive: boolean
  createdAt: string
  totalCost: number
  totalRevenue: number
  balance: number
  _count: {
    apiUsage: number
    projects: number
    transactions: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', username: '', password: '', appMode: 'FREE' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены? Это удалит пользователя и все его данные!')) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !isActive })
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setShowAddModal(false)
        setNewUser({ email: '', username: '', password: '', appMode: 'FREE' })
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to add user:', error)
    }
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
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div>
                <h1 className="text-3xl font-bold">Управление пользователями</h1>
                <p className="text-muted-foreground">Всего пользователей: {users.length}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <UserPlus className="w-4 h-4" />
            Добавить пользователя
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Пользователь</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Режим</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Проекты</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">API вызовы</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Затраты</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Баланс</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.appMode === 'PRO' ? 'bg-purple-500/10 text-purple-600' :
                        user.appMode === 'ADVANCED' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-gray-500/10 text-gray-600'
                      }`}>
                        {user.appMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user._count.projects}</td>
                    <td className="px-6 py-4 text-sm">{user._count.apiUsage}</td>
                    <td className="px-6 py-4 text-sm text-red-600">${user.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={user.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${user.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className="p-2 hover:bg-muted rounded transition"
                          title={user.isActive ? 'Заблокировать' : 'Разблокировать'}
                        >
                          {user.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-500/10 text-red-600 rounded transition"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Добавить пользователя</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Логин</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Пароль</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Режим</label>
                <select
                  value={newUser.appMode}
                  onChange={(e) => setNewUser({ ...newUser, appMode: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="FREE">FREE</option>
                  <option value="ADVANCED">ADVANCED</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


