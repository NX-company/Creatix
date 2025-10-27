'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LogOut, User, LogIn } from 'lucide-react'
import { useStore, type DocType } from '@/lib/store'
import { cn } from '@/lib/cn'
import ModeSelector from './ModeSelector'
import Logo from './Logo'
import GenerationsCounter from './GenerationsCounter'
import { DOC_CATEGORIES, migrateOldDocType } from '@/lib/docTypesConfig'

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void
  onPurchaseClick?: () => void
}

export default function Sidebar({ onCollapseChange, onPurchaseClick }: SidebarProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const {
    docType,
    setDocType,
    isGuestMode,
    clearMessages,
    appMode
  } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('presentation')

  const currentUser = isGuestMode ? {
    username: 'Гость',
    role: 'GUEST'
  } : session?.user ? {
    username: session.user.name || session.user.email || 'Пользователь',
    role: session.user.role || 'USER'
  } : null

  const handleDocTypeChange = (newType: DocType) => {
    if (docType === newType) return

    // Очищаем сообщения и создаем новый проект при смене типа документа
    clearMessages()

    const migratedType = migrateOldDocType(newType)
    setDocType(migratedType)

    console.log(`📄 Document type changed to: ${migratedType}`)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapseChange?.(newState)
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

  // Auto-expand category when docType changes (e.g., from welcome page)
  useEffect(() => {
    // Find which category contains the current docType
    const categoryWithDocType = DOC_CATEGORIES.find(category =>
      category.types.some(type => type.id === docType)
    )

    if (categoryWithDocType && expandedCategory !== categoryWithDocType.id) {
      console.log(`📂 Auto-expanding category: ${categoryWithDocType.name} for docType: ${docType}`)
      setExpandedCategory(categoryWithDocType.id)
    }
  }, [docType])

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
          onClick={toggleCollapse}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md transition-all",
            "bg-gradient-to-r from-purple-600/80 to-blue-600/80",
            "hover:from-purple-600 hover:to-blue-600",
            "text-white shadow-sm hover:shadow-md",
            "active:scale-95",
            isCollapsed ? "p-1.5" : "px-2 py-1.5"
          )}
          title={isCollapsed ? "Развернуть панель" : "Свернуть панель"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Свернуть</span>
            </>
          )}
        </button>
      </div>
      
      <div className={cn("p-1.5 sm:p-2 flex-1 overflow-y-auto", isCollapsed && "px-1")}>
        {!isCollapsed && (
          <p className="text-base text-muted-foreground mb-2 px-2 font-medium">Что создаем?</p>
        )}
        <div className="space-y-1.5">
          {DOC_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon
            const isExpanded = expandedCategory === category.id
            
            return (
              <div key={category.id}>
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md transition-all touch-manipulation min-h-[44px]',
                    isCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5 justify-between',
                    isExpanded ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-accent/50 font-medium'
                  )}
                  title={isCollapsed ? category.name : undefined}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate text-base">{category.name}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    isExpanded ? <ChevronUp className="w-4 h-4 pointer-events-none" /> : <ChevronDown className="w-4 h-4 pointer-events-none" />
                  )}
                </button>

                {/* Doc Types */}
                {isExpanded && !isCollapsed && (
                  <div className="ml-5 mt-1 space-y-0.5">
                    {category.types.map((type) => {
                      const TypeIcon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleDocTypeChange(type.id)}
                          className={cn(
                            'w-full flex items-center gap-2 rounded-md text-base transition-all touch-manipulation min-h-[40px] px-3 py-2',
                            docType === type.id
                              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                              : 'hover:bg-accent hover:text-accent-foreground font-medium'
                          )}
                        >
                          <TypeIcon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="truncate">{type.label}</div>
                            {type.dimensions && (
                              <div className="text-[10px] opacity-75 mt-0.5">{type.dimensions}</div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {!isCollapsed && (
        <div data-tour="app-mode">
          <ModeSelector />
        </div>
      )}

      {/* Generations Counter for FREE users */}
      {!isCollapsed && <GenerationsCounter />}

      {/* Purchase Subscription Button */}
      {!isCollapsed && !isGuestMode && session?.user && onPurchaseClick && appMode !== 'advanced' && (
        <div className="px-3 pb-3">
          <button
            onClick={onPurchaseClick}
            className="w-full flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:-translate-y-0.5 hover:from-purple-700 hover:to-pink-700 active:scale-95 px-3 py-2.5"
          >
            <span>💎 Купить подписку ADVANCED</span>
          </button>
          <p className="text-[9px] text-muted-foreground text-center mt-1">
            100 генераций на 30 дней — 10₽
          </p>
        </div>
      )}

      {/* User info and logout/login button */}
      <div className={cn(
        "border-t border-border bg-background",
        isCollapsed ? "p-1" : "p-1.5"
      )}>
        {!isCollapsed && currentUser && (
          <div className="flex items-center gap-1.5 mb-1.5 px-1.5 py-0.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{currentUser.username}</p>
              <p className="text-[9px] text-muted-foreground">
                {currentUser.role === 'ADMIN' ? 'Администратор' : 
                 currentUser.role === 'GUEST' ? 'Тестовый режим' : 'Пользователь'}
              </p>
            </div>
          </div>
        )}

        {isGuestMode ? (
          <button
            onClick={() => router.push('/login')}
            title={isCollapsed ? "Войти" : undefined}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg text-sm font-bold transition-all",
              "bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600",
              "text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50",
              "hover:-translate-y-0.5 hover:from-purple-700 hover:to-blue-700",
              "active:scale-95",
              isCollapsed ? "justify-center p-2" : "px-3 py-2.5"
            )}
          >
            <LogIn className={cn("flex-shrink-0", isCollapsed ? "w-4 h-4" : "w-4 h-4")} />
            {!isCollapsed && <span className="text-sm">Войти</span>}
          </button>
        ) : (
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Выйти" : undefined}
            className={cn(
              "w-full flex items-center gap-1.5 rounded-md text-xs transition-all bg-red-500/10 text-red-600 hover:bg-red-500/20",
              isCollapsed ? "justify-center p-1.5" : "px-2.5 py-2"
            )}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>Выйти</span>}
          </button>
        )}
      </div>

    </div>
  )
}

