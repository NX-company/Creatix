'use client'

import { useState } from 'react'
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
  'Напиши продающее письмо для клиентов',
  'Создай карточку товара для маркетплейса',
]

const tools: Array<{ type: DocType; icon: any; label: string; color: string }> = [
  { type: 'proposal', icon: FileText, label: 'КП', color: 'from-blue-400 to-cyan-400' },
  { type: 'presentation', icon: Presentation, label: 'Презентация', color: 'from-purple-400 to-pink-400' },
  { type: 'email', icon: Mail, label: 'Письмо', color: 'from-green-400 to-emerald-400' },
  { type: 'logo', icon: Image, label: 'Логотип', color: 'from-orange-400 to-red-400' },
  { type: 'product-card', icon: ShoppingBag, label: 'Карточка', color: 'from-yellow-400 to-orange-400' },
  { type: 'invoice', icon: Receipt, label: 'Счет', color: 'from-indigo-400 to-purple-400' },
]

export default function WelcomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedTool, setSelectedTool] = useState<DocType | null>(null)
  const [showTools, setShowTools] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const setDocType = useStore(state => state.setDocType)
  const setWorkMode = useStore(state => state.setWorkMode)
  const createProject = useStore(state => state.createProject)
  const setIsGuestMode = useStore(state => state.setIsGuestMode)

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
      const aiMessage: Message = {
        role: 'assistant',
        content: `Отлично! Создаю ${docType === 'proposal' ? 'коммерческое предложение' : 
          docType === 'invoice' ? 'счет' :
          docType === 'email' ? 'письмо' :
          docType === 'presentation' ? 'презентацию' :
          docType === 'logo' ? 'логотип' :
          'карточку товара'}... ✨`
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
      sessionStorage.setItem('workMode', 'build') // Persist guest mode
      
      console.log('🎯 Redirecting to main page...')
      
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-orange-400/20 backdrop-blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        
        {/* Header */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center">
            <Logo size="md" />
          </div>
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-white/90 font-medium">
                {session.user?.name || session.user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white font-medium hover:bg-white/20 transition-all border border-white/20"
              >
                Выйти →
              </button>
            </div>
          ) : (
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white font-medium hover:bg-white/20 transition-all border border-white/20"
            >
              Войти →
            </button>
          )}
        </div>
        
        {/* Main Card */}
        <div className="w-full max-w-3xl">
          {/* Logo + Title */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-6">
              <Logo size="xl" />
            </div>
            <p className="text-2xl text-white/90 font-light">
              Создавайте профессиональные документы за минуты
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
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-3 border border-white/20 shadow-2xl mb-6">
            <div className="flex gap-3">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-1 px-6 py-5 bg-white text-gray-900 rounded-2xl text-lg focus:ring-4 focus:ring-purple-500/50 focus:outline-none transition-all placeholder-gray-400"
                placeholder="Опишите что хотите создать..."
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="px-8 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {messages.length > 0 ? 'Анализирую...' : 'Создаю...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Создать
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Tools Selection */}
          <div className="text-center">
            <button 
              onClick={() => setShowTools(!showTools)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <span className="text-lg">
                {selectedTool ? tools.find(t => t.type === selectedTool)?.label : '🛠️ Выбрать инструмент'}
              </span>
              <span className="text-xs">▼</span>
            </button>
            
            {showTools && (
              <div className="mt-4 grid grid-cols-3 gap-3 max-w-xl mx-auto">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.type}
                      onClick={() => handleToolSelect(tool.type)}
                      className={`p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all group ${
                        selectedTool === tool.type ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-white text-sm font-medium">{tool.label}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-6 text-white/60 text-sm">
          Создано с ❤️ для вашего успеха
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

