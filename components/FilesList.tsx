'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Download, Trash2, FileText, Archive, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import JSZip from 'jszip'
import GenerationLimitModal from './GenerationLimitModal'

const fileTypeIcons: Record<string, string> = {
  pdf: '📄',
  excel: '📊',
  html: '📧',
}

export default function FilesList() {
  const { 
    generatedFiles, 
    removeGeneratedFile, 
    addMessage,
    isGuestMode,
    getRemainingGenerations
  } = useStore()
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)

  const handleDownload = (url: string, name: string) => {
    if (isGuestMode) {
      console.log('🚫 Guest users cannot download files')
      setShowLimitModal(true)
      return
    }
    
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
  }

  const handleDownloadAll = async () => {
    if (generatedFiles.length === 0) return
    
    if (isGuestMode) {
      console.log('🚫 Guest users cannot download files')
      setShowLimitModal(true)
      return
    }

    setDownloadingAll(true)
    
    try {
      const zip = new JSZip()
      
      for (const file of generatedFiles) {
        if (file.blob) {
          zip.file(file.name, file.blob)
        } else {
          console.warn(`File ${file.name} has no blob, skipping`)
        }
      }

      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      })
      
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `NX_Studio_${Date.now()}.zip`
      link.click()
      URL.revokeObjectURL(url)
      
      addMessage({
        role: 'assistant',
        content: `✅ Архив с ${generatedFiles.length} файлами скачан`
      })
    } catch (error) {
      console.error('Error creating ZIP:', error)
      addMessage({
        role: 'assistant',
        content: `❌ Ошибка создания архива: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setDownloadingAll(false)
    }
  }

  if (generatedFiles.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-10">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Нет файлов</p>
        <p className="text-xs mt-2">Файлы появятся после генерации контента</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Guest warning */}
      {isGuestMode && generatedFiles.length > 0 && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-xs font-semibold text-orange-600 mb-1">⚠️ Гостевой режим</p>
          <p className="text-xs text-orange-600">Зарегистрируйтесь, чтобы скачивать файлы</p>
        </div>
      )}
      
      {/* Кнопка скачать всё */}
      <button
        onClick={handleDownloadAll}
        disabled={downloadingAll || isGuestMode}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50"
      >
        {downloadingAll ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Создание архива...
          </>
        ) : (
          <>
            <Archive className="w-5 h-5" />
            Скачать всё (ZIP)
            <span className="px-2 py-0.5 bg-primary-foreground/20 rounded-full text-xs">
              {generatedFiles.length}
            </span>
          </>
        )}
      </button>

      {/* Список файлов */}
      <div className="space-y-3">
        {generatedFiles.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 sm:p-4 bg-muted rounded-lg flex items-center justify-between gap-2 sm:gap-3 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span className="text-xl sm:text-2xl">{fileTypeIcons[file.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {file.type.toUpperCase()} • {new Date(file.createdAt).toLocaleTimeString('ru-RU')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => handleDownload(file.url, file.name)}
                disabled={isGuestMode}
                className={`p-2 sm:p-2.5 rounded-md transition-opacity touch-manipulation ${
                  isGuestMode
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
                title={isGuestMode ? 'Зарегистрируйтесь для скачивания' : 'Скачать'}
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => removeGeneratedFile(file.id)}
                className="p-2 sm:p-2.5 rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity touch-manipulation"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Generation Limit Modal */}
      <GenerationLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        remaining={getRemainingGenerations()}
      />
    </div>
  )
}





