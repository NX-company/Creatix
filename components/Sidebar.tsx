'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { FileText, Mail, Presentation, Receipt, Image, ChevronLeft, ChevronRight, ShoppingBag, LogOut, User, LogIn } from 'lucide-react'
import { useStore, type DocType } from '@/lib/store'
import { cn } from '@/lib/cn'
import ModeSelector from './ModeSelector'
import Logo from './Logo'

const docTypes: { type: DocType; icon: any; label: string }[] = [
  { type: 'proposal', icon: FileText, label: 'Коммерческое предложение' },
  { type: 'invoice', icon: Receipt, label: 'Счёт' },
  { type: 'email', icon: Mail, label: 'Письмо' },
  { type: 'presentation', icon: Presentation, label: 'Презентация компании' },
  { type: 'logo', icon: Image, label: 'Логотип' },
  { type: 'product-card', icon: ShoppingBag, label: 'Карточка товара' },
]

export default function Sidebar() {
  const router = useRouter()
  const { data: session } = useSession()
  const { 
    docType, 
    setDocType, 
    isGuestMode,
    guestGenerationsUsed,
    guestGenerationsLimit,
    getRemainingGenerations
  } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const currentUser = isGuestMode ? { 
    username: 'Гость', 
    role: 'GUEST' 
  } : session?.user ? {
    username: session.user.name || session.user.email || 'Пользователь',
    role: session.user.role || 'USER',
    isInTrial: session.user.trialEndsAt ? new Date(session.user.trialEndsAt) > new Date() : false,
    trialGenerations: session.user.trialGenerations || 0,
    trialGenerationsLeft: Math.max(0, 30 - (session.user.trialGenerations || 0)),
    trialDaysLeft: session.user.trialEndsAt ? Math.max(0, Math.ceil((new Date(session.user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
  } : null

  const handleDocTypeChange = (newType: DocType) => {
    if (docType === newType) return
    setDocType(newType)
  }

  const handleLogout = async () => {
    try {
      // Clear all storage
      sessionStorage.clear()
      localStorage.clear()
      
      // Sign out from NextAuth with redirect
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Logout failed:', error)
      // Fallback: force redirect even if signOut fails
      window.location.href = '/login'
    }
  }

  return (
    <div className={cn(
      "h-full w-full border-r border-border bg-background flex flex-col transition-all duration-300",
      isCollapsed && "w-16"
    )}>
      <div className={cn(
        "border-b border-border flex items-center bg-background",
        isCollapsed ? "p-1.5 justify-center" : "p-2 justify-between"
      )}>
        <div className="flex items-center flex-1 rounded px-1.5 py-0.5">
          <Logo size={isCollapsed ? "sm" : "md"} />
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-accent rounded transition-colors touch-manipulation min-h-[32px] min-w-[32px]"
          title={isCollapsed ? "Развернуть" : "Свернуть"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      
      <div className={cn("p-1.5 flex-1 overflow-y-auto", isCollapsed && "px-1")}>
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground mb-1.5 px-2">Тип документа</p>
        )}
        <div className="space-y-0.5" data-tour="doc-types">
          {docTypes.map((dt) => {
            const Icon = dt.icon
            return (
              <button
                key={dt.type}
                onClick={() => handleDocTypeChange(dt.type)}
                title={isCollapsed ? dt.label : undefined}
                className={cn(
                  'w-full flex items-center gap-2 rounded text-sm transition-all touch-manipulation min-h-[36px]',
                  isCollapsed ? 'justify-center p-1.5' : 'text-left px-2 py-1.5',
                  docType === dt.type
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate text-xs">{dt.label}</span>}
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
      
      {/* User info and logout/login button */}
      <div className={cn(
        "border-t border-border bg-background",
        isCollapsed ? "p-1.5" : "p-2"
      )}>
        {!isCollapsed && currentUser && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{currentUser.username}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser.role === 'ADMIN' ? 'Администратор' : 
                 currentUser.role === 'GUEST' ? 'Тестовый режим' : 'Пользователь'}
              </p>
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
        
        {/* Guest generation counter banner */}
        {!isCollapsed && isGuestMode && (
          <div className="mb-3 p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-500 p-1 rounded">
                <span className="text-white text-xs">⚡</span>
              </div>
              <span className="text-xs font-semibold text-foreground">Бесплатные генерации</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-orange-600">{getRemainingGenerations()}/{guestGenerationsLimit}</span>
              <span className="text-xs text-muted-foreground">осталось</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${(getRemainingGenerations() / guestGenerationsLimit) * 100}%` }}
              />
            </div>
            {getRemainingGenerations() === 0 && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Зарегистрируйтесь, чтобы продолжить!
              </p>
            )}
            {getRemainingGenerations() === 1 && (
              <p className="text-xs text-orange-600 mt-2">
                Последняя бесплатная генерация!
              </p>
            )}
          </div>
        )}
        
        {/* Trial banner for registered users */}
        {!isCollapsed && !isGuestMode && currentUser?.isInTrial && (
          <div className="mb-3 p-3 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-500 p-1 rounded">
                <span className="text-white text-xs">🎉</span>
              </div>
              <span className="text-xs font-semibold text-foreground">Пробный период</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-green-600">
                {currentUser.trialGenerationsLeft}/30
              </span>
              <span className="text-xs text-muted-foreground">
                {currentUser.trialDaysLeft} {currentUser.trialDaysLeft === 1 ? 'день' : 'дней'}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${((currentUser.trialGenerationsLeft || 0) / 30) * 100}%` }}
              />
            </div>
            {(currentUser.trialGenerationsLeft || 0) === 0 && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                Свяжитесь с нами для продолжения!
              </p>
            )}
            {(currentUser.trialGenerationsLeft || 0) <= 30 && (currentUser.trialGenerationsLeft || 0) > 0 && (
              <p className="text-xs text-green-600 mt-2">
                Осталось {currentUser.trialGenerationsLeft} генераций!
              </p>
            )}
          </div>
        )}
        
        {isGuestMode ? (
          <button
            onClick={() => router.push('/login')}
            title={isCollapsed ? "Войти" : undefined}
            className={cn(
              "w-full flex items-center gap-2 rounded-md text-sm transition-all bg-primary/10 text-primary hover:bg-primary/20",
              isCollapsed ? "justify-center p-2" : "px-3 py-2"
            )}
          >
            <LogIn className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Войти</span>}
          </button>
        ) : (
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
        )}
      </div>
    </div>
  )
}

