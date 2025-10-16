'use client'

import { useState, useEffect } from 'react'
import { useStore, type DocType } from '@/lib/store'
import { FolderOpen, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProjectSelector() {
  const { 
    projects, 
    currentProjectId, 
    createProject, 
    deleteProject, 
    switchProject,
    renameProject 
  } = useStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectType, setNewProjectType] = useState<DocType>('proposal')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const currentProject = projects.find(p => p.id === currentProjectId)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return
    createProject(newProjectName, newProjectType)
    setNewProjectName('')
    setIsCreating(false)
    setIsOpen(false)
  }

  const handleRename = (id: string) => {
    if (!editingName.trim()) return
    renameProject(id, editingName)
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = (id: string) => {
    if (projects.length === 1) {
      alert('Нельзя удалить последний проект')
      return
    }
    if (confirm('Удалить проект?')) {
      deleteProject(id)
    }
  }

  const docTypeLabels: Record<DocType, string> = {
    proposal: 'КП',
    invoice: 'Счёт',
    email: 'Письмо',
    presentation: 'Презентация',
    logo: 'Логотип',
    'product-card': 'Карточка',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-md text-sm transition-colors"
        suppressHydrationWarning
      >
        <FolderOpen className="w-4 h-4" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-muted-foreground">Выбор проекта:</span>
          <span className="font-medium max-w-[150px] truncate" suppressHydrationWarning>
            {mounted ? (currentProject?.name || 'Проект') : 'Проект'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto" suppressHydrationWarning>
          {mounted ? `(${docTypeLabels[currentProject?.docType || 'proposal']})` : ''}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Проекты ({projects.length})</h3>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="p-1 hover:bg-accent rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isCreating && (
              <div className="p-3 border-b border-border bg-muted/30 space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Название проекта"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value as DocType)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                  >
                    <option value="proposal">КП</option>
                    <option value="invoice">Счёт</option>
                    <option value="email">Письмо</option>
                    <option value="presentation">Презентация</option>
                  </select>
                  <button
                    onClick={handleCreateProject}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
                  >
                    Создать
                  </button>
                </div>
              </div>
            )}

            <div className="p-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-2 rounded-md mb-1 transition-colors ${
                    project.id === currentProjectId
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingId === project.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(project.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(project.id)}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            switchProject(project.id)
                            setIsOpen(false)
                          }}
                          className="w-full text-left"
                        >
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{docTypeLabels[project.docType]}</span>
                            <span>•</span>
                            <span>{project.messagesByDocType?.[project.docType]?.length || 0} сообщ.</span>
                            <span>•</span>
                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                      )}
                    </div>
                    
                    {editingId !== project.id && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => {
                            setEditingId(project.id)
                            setEditingName(project.name)
                          }}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-1 hover:bg-accent rounded"
                          disabled={projects.length === 1}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

