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

export default function Home() {
  const [mounted, setMounted] = useState(false)
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
        <Sidebar />
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
      <OnboardingTour />
    </ErrorBoundary>
  )
}


