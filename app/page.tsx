'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import ChatPanel from '@/components/ChatPanel'
import RightPanel from '@/components/RightPanel'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import OnboardingTour from '@/components/OnboardingTour'
import { useStore } from '@/lib/store'
import { STORAGE_KEYS, MAX_RELOAD_ATTEMPTS, STORAGE_VERSION } from '@/lib/constants'
import { getWelcomeMessage } from '@/lib/welcomeMessages'
import { Menu, X } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const projects = useStore((state) => state.projects)
  const createProject = useStore((state) => state.createProject)
  const loadHTMLFromIndexedDB = useStore((state) => state.loadHTMLFromIndexedDB)
  const messages = useStore((state) => state.messages)
  const addMessage = useStore((state) => state.addMessage)
  const docType = useStore((state) => state.docType)
  const setDocType = useStore((state) => state.setDocType)
  const appMode = useStore((state) => state.appMode)
  const setIsGuestMode = useStore((state) => state.setIsGuestMode)
  const setWorkMode = useStore((state) => state.setWorkMode)
  const guestGenerationsUsed = useStore((state) => state.guestGenerationsUsed)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Restore guest generation counter from localStorage
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('creatix_guest_generations')
      if (stored) {
        const used = parseInt(stored, 10)
        if (!isNaN(used) && used !== guestGenerationsUsed) {
          useStore.setState({ guestGenerationsUsed: used })
          console.log(`📊 Restored guest generations: ${used}/3`)
        }
      }
    } catch (error) {
      console.error('Error restoring guest generations:', error)
    }
  }, [mounted])

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
    
    if (welcomePrompt && isFirstTime) {
      // Clear session storage
      sessionStorage.removeItem('welcome_prompt')
      sessionStorage.removeItem('welcome_doc_type')
      sessionStorage.removeItem('welcome_first_time')
      sessionStorage.removeItem('auto_generate')
      
      // Set document type if provided
      if (welcomeDocType) {
        setDocType(welcomeDocType as any)
      }
      
      // Add user message
      addMessage({
        role: 'user',
        content: welcomePrompt
      })
      
      // Trigger auto-generation
      if (autoGenerate === 'true') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('trigger-auto-generation', {
            detail: { prompt: welcomePrompt }
          }))
        }, 500)
      }
      
      return
    }
    
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: getWelcomeMessage(docType, appMode)
      })
    }
  }, [mounted, messages.length, addMessage, docType, appMode, projects.length, setDocType])

  if (!mounted) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar - Hidden on mobile, overlay on tablet */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 transition-transform duration-300 h-full`}>
          <Sidebar />
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={30} minSize={20} maxSize={50}>
              <ChatPanel />
            </Panel>
            <PanelResizeHandle className="w-2 bg-gradient-to-b from-border via-primary/40 to-border hover:from-primary hover:via-primary hover:to-primary transition-all cursor-col-resize shadow-lg hover:w-3" />
            <Panel defaultSize={70} minSize={50}>
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
    </ErrorBoundary>
  )
}


