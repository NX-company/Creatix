'use client'

import { useStore } from '@/lib/store'
import { Download, Loader2, Edit3, RotateCcw, Check, Target, X, Maximize2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { generateDocumentFiles } from '@/lib/documentGenerator'
import { DOC_TYPE_LABELS, DOC_TYPE_FILE_TYPES } from '@/lib/constants'
import StyleEditor from './StyleEditor'

const docTypeLabels = DOC_TYPE_LABELS
const docTypeFileTypes = DOC_TYPE_FILE_TYPES

export default function PreviewFrame() {
  const { 
    htmlPreview, 
    docType, 
    styleConfig, 
    priceItems, 
    addGeneratedFile, 
    addMessage, 
    setActiveTab,
    setHtmlPreview,
    selectedElement,
    setSelectedElement
  } = useStore()
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [originalHtml, setOriginalHtml] = useState('')
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleIframeLoad = () => {
      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) return

      const links = iframeDoc.querySelectorAll('a')
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault()
          const href = link.getAttribute('href')
          if (href && href.startsWith('http')) {
            // Открываем внешние ссылки в новой вкладке
            window.open(href, '_blank')
          }
        })
      })

      // Блокируем отправку форм
      const forms = iframeDoc.querySelectorAll('form')
      forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault()
          addMessage({
            role: 'assistant',
            content: '⚠️ Отправка форм отключена в режиме превью'
          })
        })
      })

      // Блокируем переход по всем ссылкам внутри iframe
      iframeDoc.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const link = target.closest('a')
        if (link) {
          e.preventDefault()
          const href = link.getAttribute('href')
          if (href && href.startsWith('http')) {
            window.open(href, '_blank')
          }
        }
      })
    }

    iframe.addEventListener('load', handleIframeLoad)
    
    return () => {
      iframe.removeEventListener('load', handleIframeLoad)
    }
  }, [htmlPreview, addMessage])

  // Генерация уникального CSS селектора для элемента
  const getElementSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`
    
    const tag = element.tagName.toLowerCase()
    const parent = element.parentElement
    
    if (!parent) return tag
    
    const siblings = Array.from(parent.children)
    const index = siblings.indexOf(element)
    
    return `${tag}:nth-child(${index + 1})`
  }

  // Обработчики для режима выделения
  const handleMouseOver = (e: Event) => {
    const target = e.target as HTMLElement
    if (target && target !== document.body && target.tagName !== 'HTML') {
      target.style.outline = '2px solid #f59e0b'
      target.style.cursor = 'pointer'
    }
  }

  const handleMouseOut = (e: Event) => {
    const target = e.target as HTMLElement
    if (target) {
      target.style.outline = ''
      target.style.cursor = ''
    }
  }

  const handleElementClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    
    const target = e.target as HTMLElement
    if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
      const selector = getElementSelector(target)
      const textContent = target.innerText || target.textContent || ''
      const truncatedText = textContent.length > 200 
        ? textContent.substring(0, 200) + '...' 
        : textContent
      
      setSelectedElement({
        selector,
        innerHTML: target.innerHTML,
        textContent: truncatedText
      })
      
      const iframe = iframeRef.current
      if (iframe && iframe.contentDocument) {
        const allElements = iframe.contentDocument.querySelectorAll('*')
        allElements.forEach(el => {
          const htmlEl = el as HTMLElement
          htmlEl.style.outline = ''
          htmlEl.style.backgroundColor = ''
          htmlEl.style.cursor = ''
        })
      }
      
      target.style.outline = '3px solid #10b981'
      target.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'
      target.style.cursor = 'default'
      
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.body.removeEventListener('mouseover', handleMouseOver)
        iframe.contentDocument.body.removeEventListener('mouseout', handleMouseOut)
        iframe.contentDocument.body.removeEventListener('click', handleElementClick)
      }
      
      setIsSelectMode(false)
      
      // Отправляем красивое сообщение в чат
      addMessage({
        role: 'assistant',
        content: `✅ Выбрана область для редактирования

📍 Элемент: \`${selector}\`

📝 Содержимое:
"${truncatedText}"

Теперь AI будет редактировать только этот элемент. Напишите команду, например:
• "Сделай красным"
• "Увеличь размер шрифта"
• "Замени текст на..."
• "Сделай жирным"`
      })
    }
  }

  // Включить режим выделения элементов
  const enableSelectMode = () => {
    setIsSelectMode(true)
    
    setTimeout(() => {
      const iframe = iframeRef.current
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument
        
        // Подсветка при наведении
        doc.body.addEventListener('mouseover', handleMouseOver)
        doc.body.addEventListener('mouseout', handleMouseOut)
        doc.body.addEventListener('click', handleElementClick)
        
        addMessage({
          role: 'assistant',
          content: '🎯 Режим выделения активирован! Наведите курсор на элемент и кликните для выбора.'
        })
      }
    }, 100)
  }

  // Снять выделение
  const clearSelection = () => {
    setSelectedElement(null)
    
    const iframe = iframeRef.current
    if (iframe && iframe.contentDocument) {
      const allElements = iframe.contentDocument.querySelectorAll('*')
      allElements.forEach(el => {
        const htmlEl = el as HTMLElement
        htmlEl.style.outline = ''
        htmlEl.style.backgroundColor = ''
      })
    }
    
    addMessage({
      role: 'assistant',
      content: '↩️ Выделение снято. Теперь AI будет редактировать весь документ.'
    })
  }

  // Включить режим редактирования
  const enableEditMode = () => {
    setOriginalHtml(htmlPreview)
    setIsEditing(true)
    
    setTimeout(() => {
      const iframe = iframeRef.current
      if (iframe && iframe.contentDocument) {
        const body = iframe.contentDocument.body
        if (body) {
          body.contentEditable = 'true'
          body.style.outline = '2px dashed #3b82f6'
        }
      }
    }, 100)
    
    addMessage({
      role: 'assistant',
      content: '✏️ Режим редактирования включен! Кликните на текст в превью чтобы изменить его.'
    })
  }

  // Применить изменения
  const applyChanges = () => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body
      if (body) {
        body.contentEditable = 'false'
        body.style.outline = 'none'
        const updatedHtml = iframe.contentDocument.documentElement.outerHTML
        setHtmlPreview(updatedHtml)
      }
    }
    setIsEditing(false)
    addMessage({
      role: 'assistant',
      content: '✅ Изменения применены!'
    })
  }

  // Отменить изменения
  const cancelChanges = () => {
    setHtmlPreview(originalHtml)
    setIsEditing(false)
    const iframe = iframeRef.current
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body
      if (body) {
        body.contentEditable = 'false'
        body.style.outline = 'none'
      }
    }
    addMessage({
      role: 'assistant',
      content: '↩️ Изменения отменены'
    })
  }

  // Открыть превью в новом окне
  const openInNewWindow = () => {
    if (!htmlPreview) {
      addMessage({
        role: 'assistant',
        content: '⚠️ Нет превью для отображения'
      })
      return
    }

    const newWindow = window.open('', '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes')
    
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ru">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Превью - ${docTypeLabels[docType]}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: system-ui, -apple-system, sans-serif;
              }
            </style>
          </head>
          <body>
            ${htmlPreview}
          </body>
        </html>
      `)
      newWindow.document.close()
      
      addMessage({
        role: 'assistant',
        content: '🪟 Превью открыто в новом окне'
      })
    } else {
      addMessage({
        role: 'assistant',
        content: '⚠️ Не удалось открыть окно. Проверьте что popup не заблокированы браузером.'
      })
    }
  }

  const handleSaveToFiles = async (formats: string[] = []) => {
    if (!htmlPreview) {
      addMessage({ 
        role: 'assistant', 
        content: '⚠️ Сначала создайте превью документа' 
      })
      return
    }

    if (saving) return

    setSaving(true)
    
    const docLabel = docTypeLabels[docType]
    const formatsToSave = formats.length > 0 ? formats : fileTypes
    
    addMessage({ 
      role: 'assistant', 
      content: `📁 Создаю ${formatsToSave.join(', ')} для "${docLabel}"...` 
    })

    try {
      const totalWithoutVAT = priceItems.reduce((sum, item) => 
        sum + item.quantity * item.price, 0
      )
      
      const data = {
        priceItems: priceItems,
        styleConfig: styleConfig,
        invoiceNumber: `INV-${Date.now()}`,
        items: priceItems,
        totalWithoutVAT: totalWithoutVAT,
        vat: totalWithoutVAT * 0.2,
        total: totalWithoutVAT * 1.2,
        company: 'Ваша компания'
      }
      
      const files = await generateDocumentFiles(docType, htmlPreview, data, formatsToSave)
      
      files.forEach(file => addGeneratedFile(file))
      
      const filesList = files.map(f => 
        `• ${f.type.toUpperCase()}: ${f.name}`
      ).join('\n')
      
      addMessage({ 
        role: 'assistant', 
        content: `✅ Сохранено!\n\n${filesList}\n\n📥 Перейдите на вкладку "Файлы".` 
      })
      
      setActiveTab('files')
      setSelectedFormats([])
    } catch (error) {
      addMessage({ 
        role: 'assistant', 
        content: `❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
      })
    } finally {
      setSaving(false)
    }
  }

  if (!htmlPreview) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
        <p>Превью появится после генерации</p>
        <p className="text-xs mt-2 opacity-60">
          Создайте документ через чат
        </p>
      </div>
    )
  }

  const fileTypes = docTypeFileTypes[docType]
  const docLabel = docTypeLabels[docType]

  return (
    <div className="flex h-full gap-3">
      {/* Левая панель: StyleEditor */}
      <div className="w-80 border-r border-border bg-gradient-to-b from-muted/30 to-background flex flex-col overflow-y-auto shadow-lg">
        <div className="p-3 border-b border-border bg-background/80 backdrop-blur-sm">
          <h3 className="font-semibold text-sm">Выбрать Стиль</h3>
        </div>
        <div className="p-3">
          <StyleEditor />
        </div>
      </div>

      {/* Правая панель: Превью */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Превью: {docLabel}</span>
            {fileTypes.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Сохранит: {fileTypes.join(' + ')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing && !isSelectMode && (
              <>
                <button
                  onClick={enableSelectMode}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Target className="w-4 h-4" />
                  Выбрать область
                </button>
                
                {selectedElement && (
                  <button
                    onClick={clearSelection}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    <X className="w-4 h-4" />
                    Снять выделение
                  </button>
                )}
                
                <button
                  onClick={enableEditMode}
                  className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Редактировать
                </button>
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1">
                    {fileTypes.map((format) => {
                      const isSelected = selectedFormats.length === 0 || selectedFormats.includes(format)
                      return (
                        <button
                          key={format}
                          onClick={() => {
                            if (selectedFormats.includes(format)) {
                              setSelectedFormats(selectedFormats.filter(f => f !== format))
                            } else {
                              setSelectedFormats([...selectedFormats, format])
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded-md transition-all ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {format}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => handleSaveToFiles(selectedFormats)}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {selectedFormats.length === 0 ? 'Сохранить всё' : `Сохранить (${selectedFormats.length})`}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
            
            {isSelectMode && (
              <div className="text-sm text-orange-600 font-medium">
                🎯 Выберите элемент в превью...
              </div>
            )}
            
            {isEditing && (
              <>
                <button
                  onClick={cancelChanges}
                  className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Отменить
                </button>
                <button
                  onClick={applyChanges}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Check className="w-4 h-4" />
                  Применить
                </button>
              </>
            )}
          </div>
        </div>

        {/* Индикатор выбранной области */}
        {selectedElement && !isEditing && (
          <div className="p-3 bg-green-50 border-b border-green-200 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium">🎯 Активное выделение:</span>
                <code className="bg-green-100 px-2 py-1 rounded text-xs">
                  {selectedElement.selector}
                </code>
              </div>
              <button
                onClick={clearSelection}
                className="text-green-600 hover:text-green-800 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-green-700 text-xs truncate">
              &ldquo;{selectedElement.textContent}&rdquo;
            </p>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={htmlPreview}
            className="w-full h-full border-0 shadow-inner"
            title="Preview"
            sandbox="allow-scripts allow-popups"
          />
          
          {/* Floating button */}
          <button
            onClick={openInNewWindow}
            className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-2xl hover:shadow-[0_20px_50px_rgba(59,130,246,0.6)] transition-all duration-200 hover:scale-110 border-2 border-blue-400/30"
            title="Открыть превью в отдельном окне"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <Maximize2 className="w-5 h-5" />
            <span className="font-medium">Открыть в окне</span>
          </button>
        </div>
      </div>
    </div>
  )
}
