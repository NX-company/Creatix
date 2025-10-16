'use client'

import { useStore } from '@/lib/store'
import { Download, Loader2, Edit3, RotateCcw, Check, Target, X, Maximize2, Move } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { generateDocumentFiles } from '@/lib/documentGenerator'
import { DOC_TYPE_LABELS, DOC_TYPE_FILE_TYPES } from '@/lib/constants'
// import NanoBananaEditor from './NanoBananaEditor' // Disabled

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
  const [isDragMode, setIsDragMode] = useState(false)
  const [originalHtml, setOriginalHtml] = useState('')
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  // const [editingImage, setEditingImage] = useState<{ url: string; placeholder: string } | null>(null) // Disabled
  const [zoomLevel, setZoomLevel] = useState(100)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Генерация уникального CSS селектора для элемента
  const getElementSelector = (element: HTMLElement): string => {
    // 1. Приоритет: ID
    if (element.id) return `#${element.id}`
    
    const tag = element.tagName.toLowerCase()
    
    // 2. Класс + nth-child для точности
    const classes = element.className ? `.${element.className.split(' ').filter(c => c).join('.')}` : ''
    
    // 3. Получаем путь от родителя для уникальности
    const parent = element.parentElement
    if (!parent) return tag + classes
    
    const siblings = Array.from(parent.children)
    const index = siblings.indexOf(element)
    
    // 4. Родительский контекст для уникальности
    let parentSelector = ''
    if (parent.id) {
      parentSelector = `#${parent.id} > `
    } else if (parent.className) {
      const parentClasses = parent.className.split(' ').filter(c => c).join('.')
      parentSelector = `.${parentClasses} > `
    }
    
    // 5. Финальный селектор: родитель > элемент.класс:nth-child(N)
    return `${parentSelector}${tag}${classes}:nth-child(${index + 1})`
  }

  // Обработчики для режима выделения
  const handleMouseOver = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (target && target !== document.body && target.tagName !== 'HTML') {
      target.style.outline = '2px solid #f59e0b'
      target.style.cursor = 'pointer'
    }
  }, [])

  const handleMouseOut = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (target) {
      target.style.outline = ''
      target.style.cursor = ''
    }
  }, [])

  const handleElementClick = useCallback((e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    
    const target = e.target as HTMLElement
    if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
      const selector = getElementSelector(target)
      const textContent = target.innerText || target.textContent || ''
      const truncatedText = textContent.length > 200 
        ? textContent.substring(0, 200) + '...' 
        : textContent
      
      // Собираем расширенный контекст для точного редактирования
      const parent = target.parentElement
      const parentContext = parent ? `<${parent.tagName.toLowerCase()}${parent.className ? ` class="${parent.className}"` : ''}${parent.id ? ` id="${parent.id}"` : ''}>` : ''
      
      setSelectedElement({
        selector,
        innerHTML: target.innerHTML,
        outerHTML: target.outerHTML,
        textContent: truncatedText,
        parentSelector: parent ? getElementSelector(parent) : undefined,
        parentContext: parentContext
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
      
      // Очень яркая и заметная обводка
      target.style.outline = '6px solid #10b981'
      target.style.outlineOffset = '2px'
      target.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'
      target.style.cursor = 'pointer'
      target.style.position = 'relative'
      target.style.boxShadow = '0 0 0 2px #10b981, 0 0 20px rgba(16, 185, 129, 0.5)'
      target.style.animation = 'pulse-border 2s ease-in-out infinite'
      
      // Добавляем стили для пульсации
      if (iframe?.contentDocument && !iframe.contentDocument.getElementById('pulse-animation-style')) {
        const style = iframe.contentDocument.createElement('style')
        style.id = 'pulse-animation-style'
        style.textContent = `
          @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 2px #10b981, 0 0 20px rgba(16, 185, 129, 0.5); }
            50% { box-shadow: 0 0 0 2px #10b981, 0 0 30px rgba(16, 185, 129, 0.8); }
          }
        `
        iframe.contentDocument.head.appendChild(style)
      }
      
      // Отправляем красивое сообщение в чат
      addMessage({
        role: 'assistant',
        content: `✅ Область зафиксирована для редактирования

📍 Элемент: \`${selector}\`

📝 Содержимое:
"${truncatedText}"

🎯 AI будет редактировать ТОЛЬКО эту область! Примеры команд:
• "Вставь сюда изображение кота и текст про него"
• "Добавь фото продукта"
• "Вставь описание товара"
• "Сделай красным"
• "Увеличь размер шрифта"
• "Замени текст на..."

💡 Обводка останется после редактирования - можете менять много раз!`
      })
    }
  }, [setSelectedElement, addMessage])

  // Восстановление обводки выбранного элемента после обновления HTML
  useEffect(() => {
    if (!selectedElement || !selectedElement.selector) return
    
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) return
    
    const iframeDoc = iframe.contentDocument
    
    // Небольшая задержка для корректной загрузки
    const timer = setTimeout(() => {
      try {
        const element = iframeDoc.querySelector(selectedElement.selector)
        if (element) {
          const htmlEl = element as HTMLElement
          // Очень яркая и заметная обводка
          htmlEl.style.outline = '6px solid #10b981'
          htmlEl.style.outlineOffset = '2px'
          htmlEl.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'
          htmlEl.style.cursor = 'pointer'
          htmlEl.style.position = 'relative'
          htmlEl.style.boxShadow = '0 0 0 2px #10b981, 0 0 20px rgba(16, 185, 129, 0.5)'
          htmlEl.style.animation = 'pulse-border 2s ease-in-out infinite'
          
          // Добавляем стили для пульсации если их еще нет
          if (!iframeDoc.getElementById('pulse-animation-style')) {
            const style = iframeDoc.createElement('style')
            style.id = 'pulse-animation-style'
            style.textContent = `
              @keyframes pulse-border {
                0%, 100% { box-shadow: 0 0 0 2px #10b981, 0 0 20px rgba(16, 185, 129, 0.5); }
                50% { box-shadow: 0 0 0 2px #10b981, 0 0 30px rgba(16, 185, 129, 0.8); }
              }
            `
            iframeDoc.head.appendChild(style)
          }
          
          console.log('✅ Restored VISIBLE outline for:', selectedElement.selector)
        }
      } catch (e) {
        console.warn('Failed to restore outline:', e)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [htmlPreview, selectedElement])

  // Автоматическое включение режима выбора области
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const isSelectModeActive = selectedElement !== null && !selectedElement.selector

    if (isSelectModeActive) {
      // Включаем режим выбора
      const timer = setTimeout(() => {
        const doc = iframe.contentDocument
        if (!doc) return

        doc.body.addEventListener('mouseover', handleMouseOver)
        doc.body.addEventListener('mouseout', handleMouseOut)
        doc.body.addEventListener('click', handleElementClick)

        console.log('🎯 Режим выбора области активирован')
      }, 100)

      return () => {
        clearTimeout(timer)
        const doc = iframe.contentDocument
        if (doc) {
          doc.body.removeEventListener('mouseover', handleMouseOver)
          doc.body.removeEventListener('mouseout', handleMouseOut)
          doc.body.removeEventListener('click', handleElementClick)
          console.log('🔴 Режим выбора области деактивирован')
        }
      }
    }
  }, [selectedElement, handleMouseOver, handleMouseOut, handleElementClick])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleIframeLoad = () => {
      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) return

      // Заменяем битые IMAGE_ плейсхолдеры на placeholder изображение
      const brokenImages = iframeDoc.querySelectorAll('img')
      brokenImages.forEach(img => {
        const src = img.getAttribute('src')
        if (src && /^[./]*IMAGE_\d+$/.test(src)) {
          console.warn(`⚠️ Found broken image placeholder: ${src}, replacing with placeholder`)
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EИзображение не загружено%3C/text%3E%3C/svg%3E'
          img.style.maxWidth = '300px'
          img.style.height = 'auto'
        }
      })

      // Nano Banana editing disabled
      // const allImages = iframeDoc.querySelectorAll('img')
      // ...

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

  // Переключить режим выделения элементов
  const enableSelectMode = () => {
    const newMode = !isSelectMode
    setIsSelectMode(newMode)
    
    if (!newMode) {
      // Выключаем режим
      const iframe = iframeRef.current
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.body.removeEventListener('mouseover', handleMouseOver)
        iframe.contentDocument.body.removeEventListener('mouseout', handleMouseOut)
        iframe.contentDocument.body.removeEventListener('click', handleElementClick)
      }
      
      addMessage({
        role: 'assistant',
        content: '🔴 Режим выбора области выключен'
      })
      return
    }
    
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
          content: `🎯 Режим выбора области включен!

👆 Кликните на любой элемент в предпросмотре
🔒 Область зафиксируется с зеленой обводкой
✏️ Пишите команды - AI будет править только эту область
♾️ Обводка не пропадет - можете редактировать много раз!`
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

  // Профессиональный Drag and Drop с auto-scroll
  const toggleDragMode = () => {
    const newDragMode = !isDragMode
    setIsDragMode(newDragMode)
    
    const iframe = iframeRef.current
    if (!iframe) return
    
    const iframeDoc = iframe.contentDocument
    if (!iframeDoc) return

    if (newDragMode) {
      // Добавляем стили
      let styleElement = iframeDoc.getElementById('drag-drop-styles')
      if (!styleElement) {
        styleElement = iframeDoc.createElement('style')
        styleElement.id = 'drag-drop-styles'
        styleElement.textContent = `
          [draggable="true"] {
            cursor: grab !important;
            position: relative !important;
          }
          [draggable="true"]:active {
            cursor: grabbing !important;
          }
          [draggable="true"].dragging {
            opacity: 0.4 !important;
            cursor: grabbing !important;
          }
          .drag-placeholder {
            height: 60px;
            margin: 8px 0;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border: 3px dashed #ffffff;
            border-radius: 12px;
            opacity: 0.5;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            animation: pulse 1s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
          .drop-zone-indicator {
            position: absolute;
            left: 0;
            right: 0;
            height: 4px;
            background: #10b981;
            box-shadow: 0 0 12px #10b981;
            z-index: 9999;
            animation: glow 0.5s infinite;
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 12px #10b981; }
            50% { box-shadow: 0 0 24px #10b981; }
          }
        `
        iframeDoc.head.appendChild(styleElement)
      }

      // Инжектируем полноценный drag & drop скрипт в iframe
      let dragScript = iframeDoc.getElementById('drag-drop-script')
      if (!dragScript) {
        dragScript = iframeDoc.createElement('script')
        dragScript.id = 'drag-drop-script'
        dragScript.textContent = `
          (function() {
            let draggedElement = null;
            let placeholder = null;
            let dropIndicator = null;
            let autoScrollInterval = null;
            
            // Auto-scroll функция
            function autoScroll(e) {
              const scrollZone = 100; // 100px зона у края
              const scrollSpeed = 15;
              const rect = document.body.getBoundingClientRect();
              
              // Вертикальный скролл
              if (e.clientY < scrollZone) {
                window.scrollBy(0, -scrollSpeed);
              } else if (e.clientY > window.innerHeight - scrollZone) {
                window.scrollBy(0, scrollSpeed);
              }
              
              // Горизонтальный скролл
              if (e.clientX < scrollZone) {
                window.scrollBy(-scrollSpeed, 0);
              } else if (e.clientX > window.innerWidth - scrollZone) {
                window.scrollBy(scrollSpeed, 0);
              }
            }
            
            window.initDragMode = function() {
              const elements = document.querySelectorAll('img, section, article, div[style*="padding"]');
              const draggableElements = [];
              
              elements.forEach((el) => {
                if (el.tagName === 'BODY' || el.tagName === 'HTML') return;
                if (el.classList.contains('drag-placeholder') || el.classList.contains('drop-zone-indicator')) return;
                
                const rect = el.getBoundingClientRect();
                if (rect.height < 30 || rect.width < 30) return;
                if (!el.textContent?.trim() && !el.querySelector('img')) return;
                
                draggableElements.push(el);
              });
              
              draggableElements.forEach((element) => {
                element.setAttribute('draggable', 'true');
                element.style.outline = '2px dashed #3b82f6';
                element.style.transition = 'all 0.3s ease';
                
                element.addEventListener('dragstart', (e) => {
                  draggedElement = element;
                  element.classList.add('dragging');
                  
                  placeholder = document.createElement('div');
                  placeholder.className = 'drag-placeholder';
                  placeholder.textContent = '↓ Переместить сюда ↓';
                  placeholder.style.height = element.offsetHeight + 'px';
                  
                  e.dataTransfer.effectAllowed = 'move';
                  
                  setTimeout(() => {
                    if (element.parentNode) {
                      element.parentNode.insertBefore(placeholder, element);
                    }
                  }, 0);
                  
                  // Запускаем auto-scroll
                  autoScrollInterval = setInterval(() => {
                    const lastEvent = window._lastDragEvent;
                    if (lastEvent) autoScroll(lastEvent);
                  }, 50);
                });
                
                element.addEventListener('drag', (e) => {
                  window._lastDragEvent = e; // Сохраняем для auto-scroll
                });
                
                element.addEventListener('dragover', (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  window._lastDragEvent = e;
                  
                  if (element === draggedElement || element === placeholder) return;
                  
                  const rect = element.getBoundingClientRect();
                  const midpoint = rect.top + rect.height / 2;
                  const isTopHalf = e.clientY < midpoint;
                  
                  if (!dropIndicator) {
                    dropIndicator = document.createElement('div');
                    dropIndicator.className = 'drop-zone-indicator';
                  }
                  
                  dropIndicator.style.top = isTopHalf ? '-2px' : 'auto';
                  dropIndicator.style.bottom = isTopHalf ? 'auto' : '-2px';
                  
                  if (!element.contains(dropIndicator)) {
                    element.style.position = 'relative';
                    element.appendChild(dropIndicator);
                  }
                  
                  if (placeholder && draggedElement) {
                    const parent = element.parentElement;
                    if (parent && parent === draggedElement.parentElement) {
                      if (isTopHalf) {
                        parent.insertBefore(placeholder, element);
                      } else {
                        parent.insertBefore(placeholder, element.nextSibling);
                      }
                    }
                  }
                });
                
                element.addEventListener('dragleave', () => {
                  if (dropIndicator && element.contains(dropIndicator)) {
                    dropIndicator.remove();
                  }
                });
                
                element.addEventListener('drop', (e) => {
                  e.preventDefault();
                  
                  if (draggedElement && placeholder && draggedElement !== element) {
                    if (placeholder.parentNode) {
                      placeholder.parentNode.replaceChild(draggedElement, placeholder);
                    }
                    
                    // Отправляем событие для обновления HTML
                    window.parent.postMessage({ type: 'drag-drop-update' }, '*');
                  }
                  
                  if (dropIndicator) dropIndicator.remove();
                });
                
                element.addEventListener('dragend', () => {
                  if (draggedElement) draggedElement.classList.remove('dragging');
                  if (placeholder && placeholder.parentNode) placeholder.remove();
                  if (dropIndicator && dropIndicator.parentNode) dropIndicator.remove();
                  if (autoScrollInterval) clearInterval(autoScrollInterval);
                  
                  draggedElement = null;
                  placeholder = null;
                  dropIndicator = null;
                  autoScrollInterval = null;
                  delete window._lastDragEvent;
                });
              });
            };
            
            window.cleanupDragMode = function() {
              const elements = document.querySelectorAll('[draggable="true"]');
              elements.forEach((el) => {
                el.removeAttribute('draggable');
                el.style.outline = '';
                el.style.cursor = '';
                el.classList.remove('dragging');
              });
              
              document.querySelectorAll('.drag-placeholder, .drop-zone-indicator').forEach(el => el.remove());
            };
          })();
        `;
        iframeDoc.head.appendChild(dragScript)
      }
      
      // Вызываем функцию инициализации
      ;(iframeDoc.defaultView as any).initDragMode()
      
      // Слушаем сообщения от iframe
      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'drag-drop-update') {
          const newHtml = iframeDoc.documentElement.outerHTML
          setHtmlPreview(newHtml)
          addMessage({
            role: 'assistant',
            content: '✅ Элемент перемещен! Разметка сохранена.'
          })
        }
      }
      window.addEventListener('message', handleMessage)
      
      addMessage({
        role: 'assistant',
        content: '🖐️ Режим перемещения включен! Курсор изменится на "руку". Перетаскивайте элементы мышкой.'
      })
    } else {
      // Disable drag mode
      const styleElement = iframeDoc.getElementById('drag-drop-styles')
      if (styleElement) {
        styleElement.remove()
      }
      
      // Вызываем cleanup функцию из iframe
      const iframeWindow = iframeDoc.defaultView as any
      if (iframeWindow?.cleanupDragMode) {
        iframeWindow.cleanupDragMode()
      }
      
      // Удаляем event listener
      window.removeEventListener('message', (e: MessageEvent) => {
        if (e.data.type === 'drag-drop-update') {
          const newHtml = iframeDoc.documentElement.outerHTML
          setHtmlPreview(newHtml)
        }
      })
      
      addMessage({
        role: 'assistant',
        content: '✅ Режим перемещения выключен'
      })
    }
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

  const fileTypes = docTypeFileTypes[docType] || []
  const docLabel = docTypeLabels[docType] || 'Документ'

  return (
    <div className="flex h-full flex-col">
        <div className="p-1.5 sm:p-2 border-b border-border bg-background/80 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center gap-1.5 justify-between shadow-sm">
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-medium truncate">Превью: {docLabel}</span>
            {fileTypes.length > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {fileTypes.join(' + ')}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto overflow-x-auto">
            {/* Zoom Controls - Компактный */}
            <div className="flex items-center gap-0.5 backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-0.5 sm:p-1 border border-purple-300/30 shadow-sm">
              {[50, 75, 100, 125].map(zoom => (
                <button
                  key={zoom}
                  onClick={() => setZoomLevel(zoom)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-semibold transition-all min-w-[30px] sm:min-w-[34px] ${
                    zoomLevel === zoom 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-white/70'
                  }`}
                  title={`${zoom}%`}
                >
                  {zoom}%
                </button>
              ))}
            </div>
            
            {!isEditing && (
              <>
                {/* Кнопка редактирования - Компактная */}
                <button
                  onClick={enableEditMode}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm text-[10px] sm:text-xs font-medium min-h-[26px] sm:min-h-[30px]"
                  title="Редактировать"
                >
                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Редактор</span>
                </button>
                
                {/* Блок скачивания - Горизонтальный компактный */}
                <div className="flex items-center gap-0.5 sm:gap-1 backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-0.5 sm:p-1 border border-blue-300/30 shadow-sm">
                  {/* Форматы в ряд */}
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
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded transition-all ${
                          isSelected 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'bg-white/50 text-gray-600 hover:bg-white/80'
                        }`}
                        title={format}
                      >
                        {format}
                      </button>
                    )
                  })}
                  
                  {/* Кнопка скачивания компактная */}
                  <button
                    onClick={() => handleSaveToFiles(selectedFormats)}
                    disabled={saving}
                    className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all text-[9px] sm:text-[10px] font-bold min-h-[24px] sm:min-h-[28px]"
                    title={selectedFormats.length === 0 ? 'Скачать все' : `Скачать ${selectedFormats.length}`}
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">↓</span>
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
                {/* Кнопка отмены - Компактная */}
                <button
                  onClick={cancelChanges}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm text-[10px] sm:text-xs font-medium min-h-[26px] sm:min-h-[30px]"
                  title="Отменить"
                >
                  <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Отменить</span>
                </button>
                
                {/* Кнопка применения - Компактная */}
                <button
                  onClick={applyChanges}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm text-[10px] sm:text-xs font-medium min-h-[26px] sm:min-h-[30px]"
                  title="Применить"
                >
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Применить</span>
                  <span className="sm:hidden">✓</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Индикатор выбранной области */}
        {selectedElement && selectedElement.selector && !isEditing && (
          <div className="p-3 bg-green-50 border-b border-green-300">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600 animate-pulse" />
              <div>
                <span className="text-green-800 font-bold text-sm block">Область выбрана</span>
                <code className="bg-green-200 px-2 py-1 rounded text-xs font-mono text-green-900 inline-block mt-1">
                  {selectedElement.selector}
                </code>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-auto bg-gray-100">
          <div 
            className="min-h-full flex items-start justify-center p-4"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease'
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={htmlPreview}
              className="border-0 shadow-lg bg-white"
              style={{
                width: '100%',
                minHeight: '100vh',
                height: 'auto'
              }}
              title="Preview"
              sandbox="allow-scripts allow-popups allow-same-origin"
            />
          </div>
          
          {/* Floating button - compact */}
          <button
            onClick={openInNewWindow}
            className="fixed bottom-4 right-4 z-[99999] flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-lg transition-all text-[11px]"
            title="Открыть превью в отдельном окне"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">Открыть</span>
          </button>
        </div>

        {/* Nano Banana Editor Modal */}
        {/* Nano Banana Editor disabled
        {editingImage && (
          <NanoBananaEditor
            imageUrl={editingImage.url}
            imageName="image.png"
            onSave={(editedImageUrl) => {
              // Replace image in HTML
              const newHtml = htmlPreview.replace(
                new RegExp(editingImage.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                editedImageUrl
              )
              setHtmlPreview(newHtml)
              setEditingImage(null)
            }}
            onClose={() => setEditingImage(null)}
          />
        )}
        */}
    </div>
  )
}
