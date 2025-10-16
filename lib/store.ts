import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { debounce } from './debounce'
import { STORAGE_KEYS, STORAGE_VERSION, DEBOUNCE_DELAYS } from './constants'
import { saveHTMLPreview, getHTMLPreview, deleteHTMLPreview } from './storage/indexedDB'
import { getWelcomeMessage } from './welcomeMessages'
import type { GeneratedImage } from './agents/imageAgent'

// Категория документа
export type DocCategory = 'presentation' | 'business' | 'social' | 'marketplace' | 'branding' | 'email' | 'custom'

// Типы документов
export type DocType = 
  // Презентации
  | 'presentation'
  // Бизнес
  | 'commercial-proposal'
  | 'invoice'
  | 'business-card'
  // Соц сети
  | 'youtube-thumbnail'
  | 'vk-post'
  | 'telegram-post'
  // Маркетплейсы
  | 'wildberries-card'
  | 'ozon-card'
  | 'yandex-market-card'
  | 'avito-card'
  // Брендинг
  | 'logo'
  | 'brand-book'
  | 'icon-set'
  | 'ui-kit'
  // Email
  | 'email-template'
  | 'newsletter'
  // Кастомное
  | 'custom-design'
  
  // Старые типы для обратной совместимости
  | 'proposal'  // -> commercial-proposal
  | 'email'     // -> email-template
  | 'product-card' // -> wildberries-card

export type AppMode = 'free' | 'advanced' | 'pro'

export type WorkMode = 'plan' | 'build'

export type PlanningData = {
  theme: string
  targetAudience: string
  goals: string[]
  keyMessages: string[]
  visualPreferences: string
  additionalNotes: string
  isComplete: boolean
  selectedQuestions: string[]
  pageCount?: number
  imageCount?: number
  currentQuestionIndex: number
  answerMode: 'batch' | 'sequential' | null
  collectedAnswers: Record<string, string>
}

export type Step = 'import' | 'layout' | 'edits' | 'validation' | 'export'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  type?: 'text' | 'interactive-planning'
  interactiveData?: {
    completed: boolean
  }
}

export type PriceItem = {
  id: string
  name: string
  quantity: number
  price: number
}

export type Section = {
  id: string
  name: string
  enabled: boolean
  order: number
}

export type Pattern = {
  id: string
  name: string
  description: string
}

export type GeneratedFile = {
  id: string
  name: string
  type: 'pdf' | 'excel' | 'html' | 'doc' | 'svg' | 'png'
  url: string
  blob?: Blob
  createdAt: number
}

export type UploadedImage = {
  id: string
  name: string
  base64: string
  type: string
  actionType?: 'use-as-is' | 'generate-similar' | 'use-as-reference'
}

export type Project = {
  id: string
  name: string
  docType: DocType
  createdAt: number
  updatedAt: number
  
  // NEW: Раздельные истории по типам
  messagesByDocType: Record<DocType, Message[]>
  // NEW: Раздельное планирование по типам
  planningDataByDocType: Record<DocType, PlanningData>
  
  // Deprecated (для миграции старых проектов)
  messages?: Message[]
  planningData?: PlanningData
  
  htmlPreview: string
  htmlPreviews?: Record<DocType, string>
  currentStep: Step
  styleConfig: {
    name?: string
    primaryColor: string
    secondaryColor: string
    font: string
    logoUrl: string
    spacing: string
  }
  selectedStyleName: string | null
  sections: Section[]
  priceItems: PriceItem[]
  generatedFiles: GeneratedFile[]
  workMode: WorkMode
  generatedImagesForExport: GeneratedImage[]
}

type Store = {
  projects: Project[]
  currentProjectId: string
  
  createProject: (name: string, docType: DocType) => void
  deleteProject: (id: string) => void
  switchProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  saveCurrentProject: () => void
  getCurrentProject: () => Project | undefined
  
  docType: DocType
  setDocType: (type: DocType) => void
  
  currentStep: Step
  setCurrentStep: (step: Step) => void
  
  messages: Message[]
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  
  htmlPreview: string
  htmlPreviews: Record<DocType, string>
  setHtmlPreview: (html: string) => void
  loadHTMLFromIndexedDB: () => Promise<void>
  
  styleConfig: {
    name?: string
    primaryColor: string
    secondaryColor: string
    font: string
    logoUrl: string
    spacing: string
  }
  updateStyle: (key: string, value: string) => void
  updateStyleConfig: (config: Partial<typeof defaultStyleConfig>) => void
  
  selectedStyleName: string | null
  setSelectedStyleName: (name: string | null) => void
  
  sections: Section[]
  toggleSection: (id: string) => void
  reorderSections: (sections: Section[]) => void
  
  priceItems: PriceItem[]
  updatePriceItem: (id: string, item: Partial<PriceItem>) => void
  addPriceItem: () => void
  removePriceItem: (id: string) => void
  setPriceItems: (items: PriceItem[]) => void
  clearPriceItems: () => void
  
  patterns: Pattern[]
  
  generatedFiles: GeneratedFile[]
  addGeneratedFile: (file: GeneratedFile) => void
  removeGeneratedFile: (id: string) => void
  clearGeneratedFiles: () => void
  
  uploadedImages: UploadedImage[]
  addUploadedImage: (image: UploadedImage) => void
  removeUploadedImage: (id: string) => void
  clearUploadedImages: () => void
  
  generatedImagesForExport: GeneratedImage[]
  setGeneratedImagesForExport: (images: GeneratedImage[]) => void
  clearGeneratedImagesForExport: () => void
  
  selectedElement: {
    selector: string
    innerHTML: string
    outerHTML?: string
    textContent: string
    parentSelector?: string
    parentContext?: string
  } | null
  setSelectedElement: (element: { selector: string; innerHTML: string; outerHTML?: string; textContent: string; parentSelector?: string; parentContext?: string } | null) => void
  
  lastGeneratedContent: string
  setLastGeneratedContent: (content: string) => void
  
  lastGeneratedImages: Array<{ slot: number; prompt: string }> 
  setLastGeneratedImages: (images: Array<{ slot: number; prompt: string }>) => void
  
  isGuestMode: boolean
  setIsGuestMode: (isGuest: boolean) => void
  
  guestGenerationsUsed: number
  guestGenerationsLimit: number
  incrementGuestGenerations: () => void
  resetGuestGenerations: () => void
  getRemainingGenerations: () => number
  hasRemainingGenerations: () => boolean
  
  parsedWebsiteData: {
    url: string
    title: string
    description: string
    headings: {
      h1: string[]
      h2: string[]
      h3: string[]
    }
    paragraphs: string[]
    images: string[]
    content: string
    actionType?: 'copy-design' | 'content-only' | 'style-only'
  } | null
  setParsedWebsiteData: (data: any) => void
  clearParsedWebsiteData: () => void
  
  activeTab: string
  setActiveTab: (tab: string) => void
  
  appMode: AppMode
  setAppMode: (mode: AppMode) => void
  isFeatureAvailable: (feature: string) => boolean
  
  workMode: WorkMode
  setWorkMode: (mode: WorkMode) => void
  
  planningData: PlanningData
  setPlanningData: (data: Partial<PlanningData>) => void
  resetPlanningData: () => void
}

// Вспомогательные функции для создания пустых данных по типам
const ALL_DOC_TYPES: DocType[] = [
  'proposal', 'invoice', 'email', 'presentation', 'logo', 'product-card',
  'commercial-proposal', 'business-card',
  'youtube-thumbnail', 'vk-post', 'telegram-post',
  'wildberries-card', 'ozon-card', 'yandex-market-card', 'avito-card',
  'brand-book', 'icon-set', 'ui-kit',
  'email-template', 'newsletter', 'custom-design'
]

const createEmptyMessagesByDocType = (): Record<DocType, Message[]> => {
  return ALL_DOC_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {} as Record<DocType, Message[]>)
}

const createEmptyPlanningData = (): PlanningData => ({
  theme: '',
  targetAudience: '',
  goals: [],
  keyMessages: [],
  visualPreferences: '',
  additionalNotes: '',
  isComplete: false,
  selectedQuestions: [],
  pageCount: undefined,
  imageCount: undefined,
  currentQuestionIndex: 0,
  answerMode: null,
  collectedAnswers: {},
})

const createEmptyPlanningDataByDocType = (): Record<DocType, PlanningData> => {
  return ALL_DOC_TYPES.reduce((acc, type) => ({ ...acc, [type]: createEmptyPlanningData() }), {} as Record<DocType, PlanningData>)
}

const createEmptyHTMLPreviews = (): Record<DocType, string> => {
  return ALL_DOC_TYPES.reduce((acc, type) => ({ ...acc, [type]: '' }), {} as Record<DocType, string>)
}

const defaultSections: Section[] = [
  { id: 's1', name: 'Шапка', enabled: true, order: 1 },
  { id: 's2', name: 'Введение', enabled: true, order: 2 },
  { id: 's3', name: 'Таблица цен', enabled: true, order: 3 },
  { id: 's4', name: 'Условия', enabled: true, order: 4 },
  { id: 's5', name: 'Подвал', enabled: true, order: 5 },
]

const defaultStyleConfig = {
  name: '',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  font: 'Inter',
  logoUrl: '',
  spacing: 'normal',
}

const createDefaultProject = (name: string, docType: DocType): Project => {
  const project: Project = {
    id: `project-${Date.now()}`,
    name,
    docType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    
    // NEW: Пустые истории для всех типов
    messagesByDocType: createEmptyMessagesByDocType(),
    // NEW: Пустое планирование для всех типов
    planningDataByDocType: createEmptyPlanningDataByDocType(),
    
    htmlPreview: '',
    htmlPreviews: createEmptyHTMLPreviews(),
    currentStep: 'import',
    styleConfig: { ...defaultStyleConfig },
    selectedStyleName: null,
    sections: [...defaultSections],
    priceItems: [],
    generatedFiles: [],
    workMode: 'plan',
    generatedImagesForExport: [],
  }
  return project
}

const INITIAL_PROJECT_ID = 'project-initial'

const debouncedSaveProject = debounce((saveFunc: () => void) => {
  saveFunc()
}, DEBOUNCE_DELAYS.SAVE_PROJECT)

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: INITIAL_PROJECT_ID,
      
      getCurrentProject: () => {
        const { projects, currentProjectId } = get()
        return projects.find(p => p.id === currentProjectId)
      },
      
      saveCurrentProject: () => {
        const state = get()
        const project = state.getCurrentProject()
        if (!project) return
        
        // Сохраняем текущие данные для текущего типа документа
        const currentDocType = state.docType
        const updatedMessagesByDocType = { ...project.messagesByDocType }
        updatedMessagesByDocType[currentDocType] = state.messages
        
        const updatedPlanningDataByDocType = { ...project.planningDataByDocType }
        updatedPlanningDataByDocType[currentDocType] = state.planningData
        
        set({
          projects: state.projects.map(p =>
            p.id === state.currentProjectId
              ? {
                  ...p,
                  updatedAt: Date.now(),
                  messagesByDocType: updatedMessagesByDocType,
                  planningDataByDocType: updatedPlanningDataByDocType,
                  currentStep: state.currentStep,
                  styleConfig: state.styleConfig,
                  selectedStyleName: state.selectedStyleName,
                  sections: state.sections,
                  priceItems: state.priceItems,
                  docType: state.docType,
                  generatedFiles: state.generatedFiles,
                  workMode: state.workMode,
                }
              : p
          ),
        })
      },
      
      createProject: (name, docType) => {
        get().saveCurrentProject()
        const newProject = createDefaultProject(name, docType)
        
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: newProject.id,
          docType: newProject.docType,
          messages: newProject.messages,
          htmlPreview: newProject.htmlPreview,
          htmlPreviews: newProject.htmlPreviews || createEmptyHTMLPreviews(),
          currentStep: newProject.currentStep,
          styleConfig: newProject.styleConfig,
          selectedStyleName: newProject.selectedStyleName,
          sections: newProject.sections,
          priceItems: newProject.priceItems,
          generatedFiles: newProject.generatedFiles,
          uploadedImages: [],
          workMode: newProject.workMode,
          planningData: newProject.planningData,
        }))
      },
      
      deleteProject: (id) => {
        const state = get()
        if (state.projects.length === 1) return
        
        const docTypes: DocType[] = ['proposal', 'invoice', 'email', 'presentation', 'logo', 'product-card']
        docTypes.forEach(docType => {
          const storageKey = `${id}-${docType}`
          deleteHTMLPreview(storageKey).catch(err => {
            console.error('Failed to delete HTML from IndexedDB:', err)
          })
        })
        
        const filtered = state.projects.filter(p => p.id !== id)
        const newCurrentId = state.currentProjectId === id 
          ? filtered[0].id
          : state.currentProjectId
        
        const newProject = filtered.find(p => p.id === newCurrentId)
        const newDocType = newProject?.docType || 'proposal'
        
        set({
          projects: filtered,
          currentProjectId: newCurrentId,
          docType: newDocType,
          messages: newProject?.messages || [],
          htmlPreview: '',
          htmlPreviews: createEmptyHTMLPreviews(),
          currentStep: newProject?.currentStep || 'import',
          styleConfig: newProject?.styleConfig || { ...defaultStyleConfig },
          selectedStyleName: newProject?.selectedStyleName || null,
          sections: newProject?.sections || [...defaultSections],
          priceItems: newProject?.priceItems || [],
          generatedFiles: newProject?.generatedFiles || [],
          uploadedImages: [],
        })
        
        get().loadHTMLFromIndexedDB()
      },
      
      switchProject: (id) => {
        get().saveCurrentProject()
        const project = get().projects.find(p => p.id === id)
        if (!project) return
        
        // Миграция: если старый проект, создаем новые поля
        if (!project.messagesByDocType) {
          project.messagesByDocType = createEmptyMessagesByDocType()
          project.messagesByDocType[project.docType] = project.messages || []
        }
        if (!project.planningDataByDocType) {
          project.planningDataByDocType = createEmptyPlanningDataByDocType()
          project.planningDataByDocType[project.docType] = project.planningData || createEmptyPlanningData()
        }
        
        // Загружаем данные для текущего типа документа проекта
        const currentDocType = project.docType
        const messagesForType = project.messagesByDocType[currentDocType] || []
        const planningDataForType = project.planningDataByDocType[currentDocType] || createEmptyPlanningData()
        
        console.log(`📋 Switched to project "${project.name}", docType: ${currentDocType}, messages: ${messagesForType.length}`)
        
        set({
          currentProjectId: id,
          docType: currentDocType,
          messages: messagesForType,
          planningData: planningDataForType,
          htmlPreview: '',
          htmlPreviews: createEmptyHTMLPreviews(),
          currentStep: project.currentStep,
          styleConfig: project.styleConfig,
          selectedStyleName: project.selectedStyleName,
          sections: project.sections,
          priceItems: project.priceItems,
          generatedFiles: project.generatedFiles,
          uploadedImages: [],
          workMode: project.workMode || 'plan',
        })
        
        get().loadHTMLFromIndexedDB()
      },
      
      renameProject: (id, name) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }))
      },
      
      docType: 'proposal',
      setDocType: (type) => {
        const state = get()
        const currentAppMode = state.appMode
        const currentProject = state.getCurrentProject()
        
        // Сохраняем текущие данные перед переключением
        get().saveCurrentProject()
        
        // Загружаем данные для нового типа из проекта
        const newMessages = currentProject?.messagesByDocType?.[type] || []
        const newPlanningData = currentProject?.planningDataByDocType?.[type] || createEmptyPlanningData()
        
        console.log(`📋 Switching to ${type}, loaded ${newMessages.length} messages, planningData:`, newPlanningData)
        
        set({ 
          docType: type,
          htmlPreview: '',
          messages: newMessages,
          planningData: newPlanningData,
          lastGeneratedContent: '',
          lastGeneratedImages: [],
          selectedElement: null,
          workMode: 'plan',
        })
        
        // Добавляем welcome message только если история пустая
        if (newMessages.length === 0) {
          get().addMessage({
            role: 'assistant',
            content: getWelcomeMessage(type, currentAppMode)
          })
        }
        
        get().loadHTMLFromIndexedDB()
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      currentStep: 'import',
      setCurrentStep: (step) => {
        set({ currentStep: step })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      messages: [],
      addMessage: (msg) => {
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          messages: [
            ...state.messages,
            { ...msg, id: `${timestamp}-${randomSuffix}`, timestamp },
          ],
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      clearMessages: () => {
        set({ messages: [] })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      htmlPreview: '',
      htmlPreviews: createEmptyHTMLPreviews(),
      setHtmlPreview: (html) => {
        const currentDocType = get().docType
        const currentProjectId = get().currentProjectId
        const storageKey = `${currentProjectId}-${currentDocType}`
        
        saveHTMLPreview(storageKey, html).catch(err => {
          console.error('Failed to save HTML to IndexedDB:', err)
        })
        
        set({ 
          htmlPreview: html,
          htmlPreviews: {
            ...get().htmlPreviews,
            [currentDocType]: html
          }
        })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      loadHTMLFromIndexedDB: async () => {
        const state = get()
        const storageKey = `${state.currentProjectId}-${state.docType}`
        
        try {
          const html = await getHTMLPreview(storageKey)
          if (html) {
            set({ 
              htmlPreview: html,
              htmlPreviews: {
                ...state.htmlPreviews,
                [state.docType]: html
              }
            })
          }
        } catch (error) {
          console.error('Failed to load HTML from IndexedDB:', error)
        }
      },
      
      styleConfig: { ...defaultStyleConfig },
      updateStyle: (key, value) => {
        set((state) => ({
          styleConfig: { ...state.styleConfig, [key]: value },
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      updateStyleConfig: (config) => {
        set((state) => ({
          styleConfig: { ...state.styleConfig, ...config },
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      selectedStyleName: null,
      setSelectedStyleName: (name) => {
        set({ selectedStyleName: name })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      sections: [...defaultSections],
      toggleSection: (id) => {
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      reorderSections: (sections) => {
        set({ sections })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      priceItems: [],
      updatePriceItem: (id, item) => {
        set((state) => ({
          priceItems: state.priceItems.map((p) =>
            p.id === id ? { ...p, ...item } : p
          ),
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      addPriceItem: () => {
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          priceItems: [
            ...state.priceItems,
            {
              id: `p${timestamp}-${randomSuffix}`,
              name: 'Новая позиция',
              quantity: 1,
              price: 0,
            },
          ],
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      removePriceItem: (id) => {
        set((state) => ({
          priceItems: state.priceItems.filter((p) => p.id !== id),
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      setPriceItems: (items) => {
        set({ priceItems: items })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      clearPriceItems: () => {
        set({ priceItems: [] })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      patterns: [
        { id: 'pt1', name: 'Современное предложение', description: 'Чистый и минимальный' },
        { id: 'pt2', name: 'Корпоративный счёт', description: 'Профессиональный стиль' },
        { id: 'pt3', name: 'Email шаблон', description: 'Адаптивный HTML' },
      ],
      
      generatedFiles: [],
      addGeneratedFile: (file) => {
        set((state) => ({
          generatedFiles: [...state.generatedFiles, file],
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      removeGeneratedFile: (id) => {
        set((state) => ({
          generatedFiles: state.generatedFiles.filter(f => f.id !== id),
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      clearGeneratedFiles: () => {
        set({ generatedFiles: [] })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      uploadedImages: [],
      addUploadedImage: (image) => {
        set((state) => ({
          uploadedImages: [...state.uploadedImages, image],
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      removeUploadedImage: (id) => {
        set((state) => ({
          uploadedImages: state.uploadedImages.filter(img => img.id !== id),
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      clearUploadedImages: () => {
        set({ uploadedImages: [] })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      generatedImagesForExport: [],
      setGeneratedImagesForExport: (images) => {
        set({ generatedImagesForExport: images })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      clearGeneratedImagesForExport: () => {
        set({ generatedImagesForExport: [] })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      
      selectedElement: null,
      setSelectedElement: (element) => set({ selectedElement: element }),
      
      lastGeneratedContent: '',
      setLastGeneratedContent: (content) => set({ lastGeneratedContent: content }),
      
      lastGeneratedImages: [],
      setLastGeneratedImages: (images) => set({ lastGeneratedImages: images }),
      
      isGuestMode: false,
      setIsGuestMode: (isGuest) => set({ isGuestMode: isGuest }),
      
      guestGenerationsUsed: 0,
      guestGenerationsLimit: 1,
      incrementGuestGenerations: () => {
        const { guestGenerationsUsed, guestGenerationsLimit } = get()
        const newUsed = Math.min(guestGenerationsUsed + 1, guestGenerationsLimit)
        set({ guestGenerationsUsed: newUsed })
        
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('creatix_guest_generations', newUsed.toString())
          } catch (error) {
            console.error('Error saving guest generations:', error)
          }
        }
      },
      resetGuestGenerations: () => {
        set({ guestGenerationsUsed: 0 })
        
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('creatix_guest_generations')
          } catch (error) {
            console.error('Error resetting guest generations:', error)
          }
        }
      },
      getRemainingGenerations: () => {
        const { guestGenerationsUsed, guestGenerationsLimit } = get()
        return Math.max(0, guestGenerationsLimit - guestGenerationsUsed)
      },
      hasRemainingGenerations: () => {
        const { guestGenerationsUsed, guestGenerationsLimit } = get()
        return guestGenerationsUsed < guestGenerationsLimit
      },
      
      parsedWebsiteData: null,
      setParsedWebsiteData: (data) => set({ parsedWebsiteData: data }),
      clearParsedWebsiteData: () => set({ parsedWebsiteData: null }),
      
      activeTab: 'preview',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      appMode: 'free',
      setAppMode: (mode) => set({ appMode: mode }),
      isFeatureAvailable: (feature) => {
        const { appMode } = get()
        const normalizedMode = (appMode?.toLowerCase() || 'free') as AppMode
        const FEATURE_ACCESS: Record<AppMode, Record<string, boolean>> = {
          free: {
            uploadImages: true,
            parseWebsite: false,
            uploadVideo: false,
            aiImageGeneration: false,
          },
          advanced: {
            uploadImages: true,
            parseWebsite: true,
            uploadVideo: false,
            aiImageGeneration: true,
          },
          pro: {
            uploadImages: true,
            parseWebsite: true,
            uploadVideo: true,
            aiImageGeneration: true,
            multimodalAnalysis: true,
          },
        }
        return FEATURE_ACCESS[normalizedMode]?.[feature] ?? false
      },
      
      workMode: 'plan',
      setWorkMode: (mode) => set({ workMode: mode }),
      
      planningData: createEmptyPlanningData(),
      setPlanningData: (data) => {
        set((state) => ({
          planningData: { ...state.planningData, ...data }
        }))
        debouncedSaveProject(() => get().saveCurrentProject())
      },
      resetPlanningData: () => {
        set({
          planningData: createEmptyPlanningData()
        })
        debouncedSaveProject(() => get().saveCurrentProject())
      },
    }),
    {
      name: STORAGE_KEYS.STUDIO,
      version: STORAGE_VERSION,
      partialize: (state) => {
        const { htmlPreview, htmlPreviews, ...rest } = state
        return rest
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          console.log('Migrating to version 3: removing uploadedImages from storage')
          if (persistedState && persistedState.projects) {
            persistedState.projects = persistedState.projects.map((p: any) => {
              const { uploadedImages, ...rest } = p
              return rest
            })
          }
          if (persistedState) {
            delete persistedState.uploadedImages
          }
        }
        
        if (version < 4) {
          console.log('Migrating to version 4: moving HTML to IndexedDB')
          if (persistedState && persistedState.projects) {
            persistedState.projects = persistedState.projects.map((p: any) => {
              const { htmlPreview, htmlPreviews, ...rest } = p
              return rest
            })
          }
          if (persistedState) {
            delete persistedState.htmlPreview
            delete persistedState.htmlPreviews
          }
        }
        
        if (version < 5) {
          console.log('Migrating to version 5: adding workMode and planningData')
          if (persistedState) {
            persistedState.workMode = 'plan'
            persistedState.planningData = {
              theme: '',
              targetAudience: '',
              goals: [],
              keyMessages: [],
              visualPreferences: '',
              additionalNotes: '',
              isComplete: false,
            }
            if (persistedState.projects) {
              persistedState.projects = persistedState.projects.map((p: any) => ({
                ...p,
                workMode: 'plan',
                planningData: {
                  theme: '',
                  targetAudience: '',
                  goals: [],
                  keyMessages: [],
                  visualPreferences: '',
                  additionalNotes: '',
                  isComplete: false,
                  selectedQuestions: [],
                  pageCount: undefined,
                  currentQuestionIndex: 0,
                  answerMode: null,
                  collectedAnswers: {},
                }
              }))
            }
          }
        }
        
        if (version < 6) {
          console.log('Migrating to version 6: messagesByDocType and planningDataByDocType')
          if (persistedState) {
            // Миграция messages в messagesByDocType
            if (!persistedState.messagesByDocType && persistedState.messages) {
              persistedState.messagesByDocType = createEmptyMessagesByDocType()
              persistedState.messagesByDocType[persistedState.docType || 'proposal'] = persistedState.messages
            }
            
            // Миграция planningData в planningDataByDocType
            if (!persistedState.planningDataByDocType && persistedState.planningData) {
              persistedState.planningDataByDocType = createEmptyPlanningDataByDocType()
              persistedState.planningDataByDocType[persistedState.docType || 'proposal'] = persistedState.planningData
            }
            
            // Миграция projects
            if (persistedState.projects) {
              persistedState.projects = persistedState.projects.map((p: any) => {
                const newProject = { ...p }
                
                // Миграция messages в messagesByDocType
                if (!newProject.messagesByDocType) {
                  newProject.messagesByDocType = createEmptyMessagesByDocType()
                  if (newProject.messages) {
                    newProject.messagesByDocType[newProject.docType || 'proposal'] = newProject.messages
                  }
                }
                
                // Миграция planningData в planningDataByDocType
                if (!newProject.planningDataByDocType) {
                  newProject.planningDataByDocType = createEmptyPlanningDataByDocType()
                  if (newProject.planningData) {
                    newProject.planningDataByDocType[newProject.docType || 'proposal'] = newProject.planningData
                  }
                }
                
                return newProject
              })
            }
          }
        }
        
        return persistedState as Store
      },
    }
  )
)
