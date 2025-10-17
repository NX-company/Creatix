'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import TypewriterEffect from '@/components/TypewriterEffect'
import AnimatedBackground from '@/components/AnimatedBackground'
import { useStore } from '@/lib/store'
import { Sparkles, FileText, Presentation, Mail, Image, ShoppingBag, Receipt, Loader2 } from 'lucide-react'
import type { DocType } from '@/lib/store'
import Logo from '@/components/Logo'
import SimpleLogo from '@/components/SimpleLogo'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const examples = [
  'Создай презентацию компании для инвесторов',
  'Сделай коммерческое предложение на услуги',
  'Сгенерируй логотип для технологического стартапа',
  'Создай YouTube превью для видео о AI',
  'Сделай карточку товара для Wildberries',
  'Создай визитку для дизайнера',
]

const tools: Array<{ type: DocType; icon: any; label: string; color: string }> = [
  { type: 'presentation', icon: Presentation, label: 'Презентация', color: 'from-purple-400 to-pink-400' },
  { type: 'commercial-proposal', icon: FileText, label: 'КП', color: 'from-blue-400 to-cyan-400' },
  { type: 'youtube-thumbnail', icon: Image, label: 'YouTube', color: 'from-red-400 to-rose-400' },
  { type: 'wildberries-card', icon: ShoppingBag, label: 'WB', color: 'from-purple-500 to-fuchsia-400' },
  { type: 'logo', icon: Sparkles, label: 'Логотип', color: 'from-orange-400 to-amber-400' },
  { type: 'email-template', icon: Mail, label: 'Email', color: 'from-cyan-400 to-blue-400' },
]

export default function WelcomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedTool, setSelectedTool] = useState<DocType | null>(null)
  const [showTools, setShowTools] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [legalMenuOpen, setLegalMenuOpen] = useState(false)
  const legalMenuRef = useRef<HTMLDivElement>(null)

  const setDocType = useStore(state => state.setDocType)
  const setWorkMode = useStore(state => state.setWorkMode)
  const createProject = useStore(state => state.createProject)
  const setIsGuestMode = useStore(state => state.setIsGuestMode)

  // Close legal menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (legalMenuRef.current && !legalMenuRef.current.contains(event.target as Node)) {
        setLegalMenuOpen(false)
      }
    }

    if (legalMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [legalMenuOpen])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    try {
      setIsGenerating(true)
      
      // Добавляем сообщение пользователя
      const userMessage: Message = { role: 'user', content: prompt }
      setMessages(prev => [...prev, userMessage])
      
      // Анализируем intent через AI
      const response = await fetch('/api/analyze-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze intent')
      }
      
      const analysis = await response.json()
      const docType: DocType = selectedTool || analysis.docType || 'proposal'
      
      console.log('✅ Analysis complete:', { docType, analysis })
      
      // Показываем ответ AI
      const docTypeLabels: Record<string, string> = {
        'presentation': 'презентацию',
        'commercial-proposal': 'коммерческое предложение',
        'invoice': 'счет',
        'business-card': 'визитку',
        'youtube-thumbnail': 'YouTube превью',
        'vk-post': 'VK пост',
        'telegram-post': 'Telegram пост',
        'wildberries-card': 'карточку для Wildberries',
        'ozon-card': 'карточку для Ozon',
        'yandex-market-card': 'карточку для Яндекс.Маркет',
        'avito-card': 'объявление для Avito',
        'infographic': 'инфографику',
        'logo': 'логотип',
        'brand-book': 'брендбук',
        'icon-set': 'набор иконок',
        'ui-kit': 'UI Kit',
        'email-template': 'email шаблон',
        'newsletter': 'email рассылку',
        'custom-design': 'кастомный дизайн',
        'proposal': 'коммерческое предложение',
        'email': 'письмо',
        'product-card': 'карточку товара'
      }
      
      const aiMessage: Message = {
        role: 'assistant',
        content: `Отлично! Создаю ${docTypeLabels[docType] || 'дизайн'}... ✨`
      }
      setMessages(prev => [...prev, aiMessage])
      
      // Небольшая задержка для показа сообщения
      await new Promise(resolve => setTimeout(resolve, 800))
      
      console.log('🚀 Setting up project...')
      
      // Устанавливаем гостевой режим
      setIsGuestMode(true)
      
      // Устанавливаем тип документа и режим
      setDocType(docType)
      setWorkMode('build')
      
      // Создаем проект
      createProject('Новый проект', docType)
      
      // Сохраняем данные для автогенерации
      sessionStorage.setItem('welcome_prompt', prompt)
      sessionStorage.setItem('welcome_doc_type', docType)
      sessionStorage.setItem('welcome_first_time', 'true')
      sessionStorage.setItem('show_onboarding_tour', 'true')
      sessionStorage.setItem('auto_generate', 'true')
      sessionStorage.setItem('isGuestMode', 'true')
      sessionStorage.setItem('workMode', 'build')
      sessionStorage.setItem('first_generation_advanced', 'true') // First gen uses ADVANCED as demo
      
      console.log('🎯 Redirecting to main page...')
      
      // Set cookie to mark user as visited
      document.cookie = 'has_visited=true; path=/; max-age=31536000'
      
      // Переходим на главную страницу с флагом гостя (hard redirect)
      window.location.href = '/?guest=true'
      
    } catch (error) {
      console.error('Error generating:', error)
      setIsGenerating(false)
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Произошла ошибка. Попробуйте еще раз или выберите тип документа вручную.'
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleToolSelect = (type: DocType) => {
    setSelectedTool(type)
    setShowTools(false)
  }

  const handleLogout = async () => {
    try {
      sessionStorage.clear()
      localStorage.clear()
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-orange-400/20 backdrop-blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4 bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <Logo size="md" />
            </div>
            {session ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    {(session.user?.name || session.user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium text-sm">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 sm:px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/20"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button 
                onClick={() => router.push('/login')}
                className="px-4 sm:px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/20"
              >
                Войти
              </button>
            )}
          </div>
        </div>
        
        {/* Main Card */}
        <div className="w-full max-w-3xl mt-20 sm:mt-24">
          {/* Logo + Title */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
              <Logo size="xl" />
            </div>
            <p className="text-xl sm:text-2xl text-white/90 font-light px-4">
              Создавайте современные дизайны для любых задач
            </p>
            <p className="text-sm sm:text-base text-white/70 mt-2 px-4">
              Презентации • Бизнес • Соц. сети • Маркетплейсы • Брендинг • Email
            </p>
          </div>
          
          {/* Typewriter Example */}
          {messages.length === 0 && (
            <div className="mb-8">
              <div className="mx-auto max-w-xl px-8 py-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-white/90 text-lg text-center">
                <TypewriterEffect texts={examples} speed={60} deleteSpeed={40} pauseTime={2500} />
              </div>
            </div>
          )}
          
          {/* Mini Chat */}
          {messages.length > 0 && (
            <div className="mb-6 mx-auto max-w-xl">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 max-h-60 overflow-y-auto space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-xl max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Container */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-2 sm:p-3 border border-white/20 shadow-2xl mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-1 px-4 sm:px-6 py-4 sm:py-5 bg-white text-gray-900 rounded-2xl text-base sm:text-lg focus:ring-4 focus:ring-purple-500/50 focus:outline-none transition-all placeholder-gray-400"
                placeholder="Опишите что хотите создать..."
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">{messages.length > 0 ? 'Анализирую...' : 'Создаю...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Создать</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Tools Selection */}
          <div className="text-center px-4">
            <button 
              onClick={() => setShowTools(!showTools)}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full text-white border border-white/20 hover:bg-white/20 transition-all min-h-[44px] touch-manipulation"
            >
              <span className="text-sm sm:text-base">
                {selectedTool ? tools.find(t => t.type === selectedTool)?.label : '🛠️ Выбрать инструмент'}
              </span>
              <span className="text-xs">▼</span>
            </button>
            
            {showTools && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.type}
                      onClick={() => handleToolSelect(tool.type)}
                      className={`p-3 sm:p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all group min-h-[100px] touch-manipulation ${
                        selectedTool === tool.type ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="text-white text-xs sm:text-sm font-medium">{tool.label}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with Legal Menu */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3">
          <div className="relative" ref={legalMenuRef}>
            <button
              onClick={() => setLegalMenuOpen(!legalMenuOpen)}
              className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white text-xs hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
            >
              <span>⚖️</span>
              <span>Юридическая информация</span>
              <span className={`transition-transform ${legalMenuOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {legalMenuOpen && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="p-2 space-y-1">
                  <a
                    href="/legal/offer"
                    target="_blank"
                    className="block px-4 py-3 text-white hover:bg-purple-600/30 rounded-lg transition-all text-sm"
                  >
                    📄 Договор оферты
                  </a>
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    className="block px-4 py-3 text-white hover:bg-purple-600/30 rounded-lg transition-all text-sm"
                  >
                    🔒 Политика конфиденциальности
                  </a>
                </div>
                <div className="border-t border-white/10 p-3 bg-slate-800/50">
                  <p className="text-xs text-white/60 mb-2">Контакты для связи:</p>
                  <a 
                    href="mailto:useneurox@gmail.com"
                    className="text-xs text-blue-400 hover:text-blue-300 block"
                  >
                    useneurox@gmail.com
                  </a>
                  <p className="text-xs text-white/50 mt-2">
                    ИП Иванова Е.Э.<br/>
                    ИНН: 505398520600
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-white/60 text-sm">
            Создано с ❤️ для вашего успеха
          </div>
        </div>
      </div>
      
      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}

