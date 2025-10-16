'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LogOut, User, LogIn, Package, Sparkles, Zap } from 'lucide-react'
import { useStore, type DocType } from '@/lib/store'
import { cn } from '@/lib/cn'
import ModeSelector from './ModeSelector'
import Logo from './Logo'
import { DOC_CATEGORIES, migrateOldDocType } from '@/lib/docTypesConfig'
import BuyGenerationsModal from './BuyGenerationsModal'
import UpgradeModal from './UpgradeModal'

interface GenerationsInfo {
  appMode: string
  monthlyGenerations: number
  generationLimit: number
  bonusGenerations: number
  availableGenerations: number
  nextResetDate: string
  freeMonthlyGenerations?: number
  advancedMonthlyGenerations?: number
  subscriptionEndsAt?: Date | null
}

export default function Sidebar() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const { 
    docType, 
    setDocType, 
    isGuestMode,
    guestGenerationsUsed,
    guestGenerationsLimit,
    getRemainingGenerations,
    appMode
  } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('presentation')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [generationsInfo, setGenerationsInfo] = useState<GenerationsInfo | null>(null)
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false)

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
    const migratedType = migrateOldDocType(newType)
    setDocType(migratedType)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const fetchGenerationsInfo = async () => {
    // Don't fetch for guests or trial users
    if (isGuestMode || !session?.user || currentUser?.isInTrial) return
    
    setIsLoadingGenerations(true)
    try {
      const response = await fetch('/api/user/generations')
      if (response.ok) {
        const data = await response.json()
        setGenerationsInfo(data)
      } else {
        console.error('Failed to fetch generations info:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch generations info:', error)
    } finally {
      setIsLoadingGenerations(false)
    }
  }

  useEffect(() => {
    fetchGenerationsInfo()
  }, [session, isGuestMode, currentUser?.isInTrial])
  
  // Listen for generation consumption events
  useEffect(() => {
    const handleGenerationConsumed = () => {
      console.log('🔄 Generation consumed event received, refreshing counter...')
      fetchGenerationsInfo()
    }
    
    const handleTrialGenerationConsumed = async (event: any) => {
      console.log('🔄 Trial generation consumed event received, refreshing session...')
      
      // Update NextAuth session to reflect new trial data
      try {
        await updateSession()
        console.log('✅ Session updated successfully')
      } catch (error) {
        console.error('Failed to update session:', error)
        // Fallback: reload page if session update fails
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }
    
    const handleModeSwitched = () => {
      console.log('🔄 Mode switched, refreshing counter...')
      fetchGenerationsInfo()
    }
    
    window.addEventListener('generationConsumed', handleGenerationConsumed)
    window.addEventListener('trialGenerationConsumed', handleTrialGenerationConsumed)
    window.addEventListener('mode-switched', handleModeSwitched)
    
    return () => {
      window.removeEventListener('generationConsumed', handleGenerationConsumed)
      window.removeEventListener('trialGenerationConsumed', handleTrialGenerationConsumed)
      window.removeEventListener('mode-switched', handleModeSwitched)
    }
  }, [session, isGuestMode, currentUser?.isInTrial])

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

  const handleBuySuccess = () => {
    fetchGenerationsInfo()
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
      
      <div className={cn("p-2 flex-1 overflow-y-auto", isCollapsed && "px-1")}>
        {!isCollapsed && (
          <p className="text-sm text-muted-foreground mb-2 px-2 font-medium">Что создаем?</p>
        )}
        <div className="space-y-1.5" data-tour="doc-types">
          {DOC_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon
            const isExpanded = expandedCategory === category.id
            
            return (
              <div key={category.id}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md transition-all touch-manipulation min-h-[48px]',
                    isCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5 justify-between',
                    isExpanded ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-accent/50 font-medium'
                  )}
                  title={isCollapsed ? category.name : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate text-sm">{category.name}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Doc Types */}
                {isExpanded && !isCollapsed && (
                  <div className="ml-7 mt-1.5 space-y-1">
                    {category.types.map((type) => {
                      const TypeIcon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleDocTypeChange(type.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 rounded-md text-sm transition-all touch-manipulation min-h-[44px] px-3 py-2',
                            docType === type.id
                              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                              : 'hover:bg-accent hover:text-accent-foreground font-medium'
                          )}
                        >
                          <TypeIcon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="truncate">{type.label}</div>
                            {type.dimensions && (
                              <div className="text-[11px] opacity-75 mt-0.5">{type.dimensions}</div>
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
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${((currentUser.trialGenerationsLeft || 0) / 30) * 100}%` }}
              />
            </div>
            
            {/* Кнопка апгрейда для пробного периода */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 mb-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Улучшить до Продвинутый</span>
            </button>
            
            {(currentUser.trialGenerationsLeft || 0) === 0 && (
              <p className="text-xs text-orange-600 text-center font-medium">
                🔥 Пробный период закончился!
              </p>
            )}
            {(currentUser.trialGenerationsLeft || 0) <= 10 && (currentUser.trialGenerationsLeft || 0) > 0 && (
              <p className="text-xs text-orange-600 text-center font-medium">
                🔥 Осталось мало генераций!
              </p>
            )}
            {(currentUser.trialGenerationsLeft || 0) > 10 && (
              <p className="text-xs text-green-600 text-center">
                Осталось {currentUser.trialGenerationsLeft} генераций!
              </p>
            )}
          </div>
        )}

        {/* Generations counter for registered users (non-trial) */}
        {!isCollapsed && !isGuestMode && session?.user && !currentUser?.isInTrial && generationsInfo && (
          <div className="mb-3 p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-1 rounded">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground">Генерации</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(generationsInfo.nextResetDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-blue-600">
                {(() => {
                  const currentMode = appMode.toLowerCase()
                  const limit = currentMode === 'free' ? 30 : currentMode === 'advanced' ? 100 : 300
                  const used = currentMode === 'free' 
                    ? (generationsInfo.freeMonthlyGenerations || 0)
                    : currentMode === 'advanced'
                      ? (generationsInfo.advancedMonthlyGenerations || 0)
                      : (generationsInfo.monthlyGenerations || 0)
                  // Бонусы работают ТОЛЬКО для платных режимов (ADVANCED/PRO), НЕ для FREE
                  const bonus = currentMode === 'free' ? 0 : (generationsInfo.bonusGenerations || 0)
                  return Math.max(0, limit - used + bonus)
                })()}
              </span>
              <span className="text-xs text-muted-foreground">
                / {appMode.toLowerCase() === 'free' ? 30 : appMode.toLowerCase() === 'advanced' ? 100 : 300}
                {appMode.toLowerCase() !== 'free' && generationsInfo.bonusGenerations > 0 && (
                  <span className="text-green-500 ml-1">+{generationsInfo.bonusGenerations}</span>
                )}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 rounded-full"
                style={{ 
                  width: `${(() => {
                    const currentMode = appMode.toLowerCase()
                    const limit = currentMode === 'free' ? 30 : currentMode === 'advanced' ? 100 : 300
                    const used = currentMode === 'free' 
                      ? (generationsInfo.freeMonthlyGenerations || 0)
                      : currentMode === 'advanced'
                        ? (generationsInfo.advancedMonthlyGenerations || 0)
                        : (generationsInfo.monthlyGenerations || 0)
                    // Бонусы только для платных режимов
                    const bonus = currentMode === 'free' ? 0 : (generationsInfo.bonusGenerations || 0)
                    const available = Math.max(0, limit - used + bonus)
                    return Math.min(100, (available / limit) * 100)
                  })()}%` 
                }}
              />
            </div>
            
            {/* Кнопки действий */}
            <div className="space-y-2">
              {appMode.toLowerCase() === 'free' && (() => {
                // Проверяем, есть ли активная подписка
                const hasPaidSubscription = generationsInfo.subscriptionEndsAt && 
                  new Date(generationsInfo.subscriptionEndsAt) > new Date()
                
                // Кнопка "Улучшить" только для НЕоплаченных пользователей
                if (!hasPaidSubscription) {
                  return (
                    <>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Улучшить до Продвинутый</span>
                      </button>
                      {(() => {
                        const used = generationsInfo.freeMonthlyGenerations || 0
                        const available = Math.max(0, 30 - used)
                        return available <= 5 && (
                          <p className="text-[10px] text-center text-orange-600 font-medium">
                            🔥 Осталось мало генераций!
                          </p>
                        )
                      })()}
                    </>
                  )
                }
                
                // Для оплаченных пользователей - просто показываем сообщение
                return (
                  <p className="text-[10px] text-center text-muted-foreground">
                    Вы можете переключиться на ⚡ Продвинутый режим
                  </p>
                )
              })()}
              
              {(appMode.toLowerCase() === 'advanced' || appMode.toLowerCase() === 'pro') && (
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <Package className="w-3 h-3" />
                  <span>Купить +30 за 300₽</span>
                </button>
              )}
            </div>
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

      {/* Buy Generations Modal */}
      {generationsInfo && (
        <BuyGenerationsModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          currentGenerations={(() => {
            const currentMode = appMode.toLowerCase()
            const limit = currentMode === 'free' ? 30 : currentMode === 'advanced' ? 100 : 300
            const used = currentMode === 'free' 
              ? (generationsInfo.freeMonthlyGenerations || 0)
              : currentMode === 'advanced'
                ? (generationsInfo.advancedMonthlyGenerations || 0)
                : (generationsInfo.monthlyGenerations || 0)
            // Бонусы только для платных режимов
            const bonus = currentMode === 'free' ? 0 : (generationsInfo.bonusGenerations || 0)
            return Math.max(0, limit - used + bonus)
          })()}
          onSuccess={handleBuySuccess}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentMode={generationsInfo?.appMode || 'FREE'}
      />
    </div>
  )
}

