'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Mail, Presentation, Receipt, Sparkles, ChevronLeft, ChevronRight, ShoppingBag, LogOut, User } from 'lucide-react'
import { useStore, type DocType } from '@/lib/store'
import { cn } from '@/lib/cn'
import ModeSelector from './ModeSelector'

const docTypes: { type: DocType; icon: any; label: string }[] = [
  { type: 'proposal', icon: FileText, label: 'Коммерческое предложение' },
  { type: 'invoice', icon: Receipt, label: 'Счёт' },
  { type: 'email', icon: Mail, label: 'Письмо' },
  { type: 'presentation', icon: Presentation, label: 'Презентация компании' },
  { type: 'logo', icon: Sparkles, label: 'Логотип' },
  { type: 'product-card', icon: ShoppingBag, label: 'Карточка товара' },
]

export default function Sidebar() {
  const router = useRouter()
  const { docType, setDocType } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.user)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    
    fetchUser()
  }, [])

  const handleDocTypeChange = (newType: DocType) => {
    if (docType === newType) return
    setDocType(newType)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className={cn(
      "border-r border-border bg-gradient-to-b from-muted/40 to-muted/20 flex flex-col transition-all duration-300 shadow-lg",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "border-b border-border flex items-center bg-background/50 backdrop-blur-sm",
        isCollapsed ? "p-2 justify-center" : "p-3 justify-between"
      )}>
        {!isCollapsed && (
          <div>
            <h1 className="text-base font-bold">NX Studio</h1>
            <p className="text-xs text-muted-foreground">Документы</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-accent rounded transition-colors"
          title={isCollapsed ? "Развернуть" : "Свернуть"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      
      <div className={cn("p-2 flex-1", isCollapsed && "px-1")}>
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground mb-2 px-2">Тип документа</p>
        )}
        <div className="space-y-1" data-tour="doc-types">
          {docTypes.map((dt) => {
            const Icon = dt.icon
            return (
              <button
                key={dt.type}
                onClick={() => handleDocTypeChange(dt.type)}
                title={isCollapsed ? dt.label : undefined}
                className={cn(
                  'w-full flex items-center gap-2 rounded-md text-sm transition-all',
                  isCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2',
                  docType === dt.type
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{dt.label}</span>}
              </button>
            )
          })}
        </div>
      </div>
      
      {!isCollapsed && (
        <div data-tour="app-mode">
          <ModeSelector />
        </div>
      )}
      
      {/* User info and logout button */}
      <div className={cn(
        "border-t border-border bg-background/50 backdrop-blur-sm",
        isCollapsed ? "p-2" : "p-3"
      )}>
        {!isCollapsed && currentUser && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{currentUser.username}</p>
              <p className="text-xs text-muted-foreground">{currentUser.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</p>
            </div>
          </div>
        )}
        
        {!isCollapsed && (
          <button
            onClick={() => {
              localStorage.removeItem('nx_studio_tour_completed')
              window.location.reload()
            }}
            className="w-full flex items-center gap-2 rounded-md text-xs transition-all text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-3 py-1.5 mb-2"
          >
            <span>🎓</span>
            <span>Показать тур заново</span>
          </button>
        )}
        
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Выйти" : undefined}
          className={cn(
            "w-full flex items-center gap-2 rounded-md text-sm transition-all bg-red-500/10 text-red-600 hover:bg-red-500/20",
            isCollapsed ? "justify-center p-2" : "px-3 py-2"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Выйти</span>}
        </button>
      </div>
    </div>
  )
}

