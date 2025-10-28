'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import ChatPanel from '@/components/ChatPanel'
import RightPanel from '@/components/RightPanel'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import OnboardingTour from '@/components/OnboardingTour'
import SubscriptionPurchaseModal from '@/components/SubscriptionPurchaseModal'
import { useStore } from '@/lib/store'
import { STORAGE_KEYS, MAX_RELOAD_ATTEMPTS, STORAGE_VERSION } from '@/lib/constants'
import { getWelcomeMessage } from '@/lib/welcomeMessages'
import { Menu, X } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const projects = useStore((state) => state.projects)
  const createProject = useStore((state) => state.createProject)
  const loadHTMLFromIndexedDB = useStore((state) => state.loadHTMLFromIndexedDB)
  const messages = useStore((state) => state.messages)
  const addMessage = useStore((state) => state.addMessage)
  const docType = useStore((state) => state.docType)
  const setDocType = useStore((state) => state.setDocType)
  const appMode = useStore((state) => state.appMode)
  const setAppMode = useStore((state) => state.setAppMode)
  const isGuestMode = useStore((state) => state.isGuestMode)
  const setIsGuestMode = useStore((state) => state.setIsGuestMode)
  const setWorkMode = useStore((state) => state.setWorkMode)
  const setFreeGenerations = useStore((state) => state.setFreeGenerations)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authentication and set guest mode
  useEffect(() => {
    if (!mounted || status === 'loading') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const guestParam = urlParams.get('guest')
    
    // If user is authenticated via NextAuth, disable guest mode
    if (session) {
      console.log('👤 User authenticated via NextAuth:', session.user?.email)
      setIsGuestMode(false)
      sessionStorage.removeItem('isGuestMode')
      return
    }
    
    // Otherwise check for guest mode
    if (guestParam === 'true') {
      console.log('🎭 Guest mode detected from URL')
      setIsGuestMode(true)
      sessionStorage.setItem('isGuestMode', 'true')
      
      // Restore workMode
      const storedWorkMode = sessionStorage.getItem('workMode')
      if (storedWorkMode === 'build' || storedWorkMode === 'plan') {
        console.log(`🔧 Restoring workMode: ${storedWorkMode}`)
        setWorkMode(storedWorkMode as 'plan' | 'build')
      }
    } else {
      // Restore from sessionStorage
      const storedGuestMode = sessionStorage.getItem('isGuestMode')
      if (storedGuestMode === 'true') {
        console.log('🎭 Restoring guest mode from sessionStorage')
        setIsGuestMode(true)
      }
    }
  }, [mounted, session, status, setIsGuestMode, setWorkMode])

  // Sync appMode with user session (but not in guest mode)
  useEffect(() => {
    if (!mounted || status === 'loading') return

    // Don't sync appMode if user is in guest mode
    if (isGuestMode) {
      if (appMode !== 'guest') {
        console.log('🎭 Setting appMode to guest')
        setAppMode('guest')
      }
      return
    }

    if (session?.user) {
      const userAppMode = ((session.user as any).appMode || 'free').toLowerCase()

      // Sync appMode from session
      if (appMode !== userAppMode) {
        console.log(`🔄 Syncing appMode from session: ${userAppMode}`)
        setAppMode(userAppMode)
      }
    }
  }, [mounted, session, status, setAppMode, appMode, isGuestMode])

  // Sync free generations data from backend
  useEffect(() => {
    if (!mounted || status === 'loading') return
    if (!session?.user) return

    const syncGenerations = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user?.freeGenerationsRemaining !== undefined) {
            setFreeGenerations(
              data.user.freeGenerationsRemaining || 0,
              data.user.freeGenerationsUsed || 0
            )
            console.log(`🎁 Synced free generations: ${data.user.freeGenerationsRemaining}/20`)
          }
        }
      } catch (error) {
        console.error('Failed to sync free generations:', error)
      }
    }

    syncGenerations()
  }, [mounted, session, status, setFreeGenerations])

  // Auto-check for pending payments (Level 3 protection)
  useEffect(() => {
    if (!mounted || status === 'loading') return
    if (!session?.user || isGuestMode) return

    const checkPendingPayment = async () => {
      try {
        const response = await fetch('/api/user/check-pending-payment', {
          method: 'POST',
        })

        if (response.ok) {
          const data = await response.json()

          if (data.activated) {
            console.log('✅ [Auto-check] Pending payment activated!', data.subscription)
            // Refresh session to update appMode
            window.location.reload()
          } else if (data.hasPendingPayment) {
            console.log('⏳ [Auto-check] Payment is still pending:', data.message)
          }
        }
      } catch (error) {
        console.error('[Auto-check] Failed to check pending payment:', error)
      }
    }

    // Check immediately on mount
    checkPendingPayment()

    // Then check every 30 seconds
    const intervalId = setInterval(checkPendingPayment, 30000)

    return () => clearInterval(intervalId)
  }, [mounted, session, status, isGuestMode])

  useEffect(() => {
    if (!mounted) return

    try {
      const reloadAttempts = sessionStorage.getItem(STORAGE_KEYS.RELOAD_ATTEMPTS)
      const attempts = reloadAttempts ? parseInt(reloadAttempts, 10) : 0
      
      if (attempts >= MAX_RELOAD_ATTEMPTS) {
        console.error('Too many reload attempts. Stopping migration.')
        sessionStorage.removeItem(STORAGE_KEYS.RELOAD_ATTEMPTS)
        localStorage.removeItem(STORAGE_KEYS.STUDIO)
        return
      }
      
      const stored = localStorage.getItem(STORAGE_KEYS.STUDIO)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!parsed.version || parsed.version < STORAGE_VERSION) {
          console.log(`Migrating storage to version ${STORAGE_VERSION}, clearing old data...`)
          sessionStorage.setItem(STORAGE_KEYS.RELOAD_ATTEMPTS, String(attempts + 1))
          localStorage.removeItem(STORAGE_KEYS.STUDIO)
          window.location.reload()
          return
        }
      }
      
      sessionStorage.removeItem(STORAGE_KEYS.RELOAD_ATTEMPTS)
    } catch (e) {
      console.error('Error checking storage:', e)
      localStorage.removeItem(STORAGE_KEYS.STUDIO)
      window.location.reload()
      return
    }

    if (projects.length === 0) {
      createProject('Новый проект', 'proposal')
    }
  }, [mounted, projects.length, createProject])
  
  useEffect(() => {
    if (!mounted) return
    
    loadHTMLFromIndexedDB()
  }, [mounted, loadHTMLFromIndexedDB])
  
  useEffect(() => {
    if (!mounted) return
    if (projects.length === 0) return
    
    // Check for welcome prompt from welcome page
    const welcomePrompt = sessionStorage.getItem('welcome_prompt')
    const welcomeDocType = sessionStorage.getItem('welcome_doc_type')
    const isFirstTime = sessionStorage.getItem('welcome_first_time')
    const autoGenerate = sessionStorage.getItem('auto_generate')
    
    console.log('📋 Checking welcome data:', {
      welcomePrompt,
      welcomeDocType,
      isFirstTime,
      autoGenerate,
      messagesLength: messages?.length || 0
    })
    
    if (welcomePrompt && isFirstTime) {
      console.log('✅ Welcome prompt found! Processing...')
      
      // Clear session storage
      sessionStorage.removeItem('welcome_prompt')
      sessionStorage.removeItem('welcome_doc_type')
      sessionStorage.removeItem('welcome_first_time')
      sessionStorage.removeItem('auto_generate')
      
      // Set document type if provided
      if (welcomeDocType) {
        console.log('📄 Setting doc type:', welcomeDocType)
        setDocType(welcomeDocType as any)
      }
      
      // Add user message
      console.log('💬 Adding user message:', welcomePrompt)
      addMessage({
        role: 'user',
        content: welcomePrompt
      })
      
      // Trigger auto-generation
      if (autoGenerate === 'true') {
        console.log('🚀 Triggering auto-generation in 800ms...')
        setTimeout(() => {
          console.log('📤 Dispatching trigger-auto-generation event')
          window.dispatchEvent(new CustomEvent('trigger-auto-generation', {
            detail: { prompt: welcomePrompt }
          }))
        }, 800)
      }
      
      return
    }
    
    if (messages && messages.length === 0) {
      console.log('💬 Adding default welcome message')
      addMessage({
        role: 'assistant',
        content: getWelcomeMessage(docType, appMode)
      })
    }
  }, [mounted, messages?.length, addMessage, docType, appMode, projects.length, setDocType])

  if (!mounted) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen max-w-[2560px] mx-auto overflow-hidden bg-background text-foreground">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg touch-manipulation min-h-[44px] min-w-[44px]"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar - Hidden on mobile, dynamic width on desktop */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 transition-all duration-300 h-full flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
          <Sidebar
            onCollapseChange={setSidebarCollapsed}
            onPurchaseClick={() => setShowPurchaseModal(true)}
          />
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} minSize={25} maxSize={55}>
              <ChatPanel />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary transition-colors cursor-col-resize" />
            <Panel defaultSize={60} minSize={45}>
              <RightPanel />
            </Panel>
          </PanelGroup>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex-1 flex flex-col">
          {/* Mobile View Tabs */}
          <div className="flex border-b border-border bg-background">
            <button
              onClick={() => setMobileView('chat')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileView === 'chat'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              💬 Чат
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileView === 'preview'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              👁️ Превью
            </button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            {mobileView === 'chat' ? <ChatPanel /> : <RightPanel />}
          </div>
        </div>
      </div>
      <OnboardingTour />
      <SubscriptionPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </ErrorBoundary>
  )
}


