'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
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
  const [mounted, setMounted] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const projects = useStore((state) => state.projects)
  const createProject = useStore((state) => state.createProject)
  const loadHTMLFromIndexedDB = useStore((state) => state.loadHTMLFromIndexedDB)
  const messages = useStore((state) => state.messages)
  const addMessage = useStore((state) => state.addMessage)
  const docType = useStore((state) => state.docType)
  const appMode = useStore((state) => state.appMode)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: getWelcomeMessage(docType, appMode)
      })
    }
  }, [mounted, messages.length, addMessage, docType, appMode, projects.length])

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
            <Panel defaultSize={25} minSize={15} maxSize={40}>
              <ChatPanel />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-gradient-to-b from-border via-primary/30 to-border hover:from-primary hover:via-primary hover:to-primary transition-all cursor-col-resize shadow-sm" />
            <Panel defaultSize={75} minSize={40}>
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


