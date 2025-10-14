'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Undo, Redo, Download, Eraser, Square, Edit3, Sparkles } from 'lucide-react'

interface NanoBananaEditorProps {
  imageUrl: string
  imageName?: string
  onSave: (editedImageUrl: string) => void
  onClose: () => void
}

type SelectionMode = 'brush' | 'rect' | 'none'

export default function NanoBananaEditor({ imageUrl, imageName, onSave, onClose }: NanoBananaEditorProps) {
  const [prompt, setPrompt] = useState('')
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('brush')
  const [isDrawing, setIsDrawing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<string>(imageUrl)
  const [hasSelection, setHasSelection] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current
        const container = containerRef.current
        
        // Set canvas size to match container
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      if (imageRef) {
        imageRef.current = img
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectionMode === 'none') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDrawing(true)
    setHasSelection(true)
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    if (selectionMode === 'brush') {
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else if (selectionMode === 'rect') {
      setRectStart({ x, y })
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectionMode === 'none') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    if (selectionMode === 'brush') {
      ctx.lineWidth = 20
      ctx.lineCap = 'round'
      ctx.strokeStyle = 'rgba(255, 87, 34, 0.6)'
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (selectionMode === 'rect' && rectStart) {
      // Clear and redraw rectangle
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(255, 87, 34, 0.8)'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        rectStart.x,
        rectStart.y,
        x - rectStart.x,
        y - rectStart.y
      )
      ctx.setLineDash([])
    }
  }

  const finishDrawing = () => {
    setIsDrawing(false)
    setRectStart(null)
  }

  const clearSelection = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSelection(false)
  }

  const applyNanaBananaEdit = async () => {
    if (!prompt.trim()) {
      alert('Введите команду для редактирования')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Get selection mask if any
      let selectionMask = null
      if (hasSelection && canvasRef.current) {
        selectionMask = canvasRef.current.toDataURL('image/png')
      }
      
      const response = await fetch('/api/nano-banana-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: previewImage,
          prompt: prompt,
          selectionMask: selectionMask,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to edit image')
      }

      const data = await response.json()
      
      if (data.editedImageUrl) {
        setPreviewImage(data.editedImageUrl)
        
        // Add to history
        if (!history.includes(prompt)) {
          setHistory([prompt, ...history].slice(0, 10))
        }
        
        // Clear selection after successful edit
        clearSelection()
        
        console.log('✅ Image edited successfully')
      } else {
        throw new Error('No edited image returned')
      }
      
    } catch (error) {
      console.error('Nano Banana edit error:', error)
      alert('Ошибка редактирования. Попробуйте другую команду.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = () => {
    onSave(previewImage)
  }

  const quickPrompts = [
    { icon: '🌅', text: 'Измени фон на пляж' },
    { icon: '🌌', text: 'Измени фон на космос' },
    { icon: '✂️', text: 'Удали фон' },
    { icon: '☀️', text: 'Добавь солнечный свет' },
    { icon: '🎨', text: 'Сделай в винтажном стиле' },
    { icon: '🌆', text: 'Поменяй день на ночь' },
    { icon: '🎭', text: 'Сделай более драматичным' },
    { icon: '💎', text: 'Улучши качество и детали' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-yellow-50">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🍌 Nano Banana AI Editor
            </h2>
            <p className="text-sm text-muted-foreground">Редактирование как в Photoshop - выделите область и скажите что изменить</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all shadow-md"
            >
              <X className="w-4 h-4" />
              Отменить
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-96 border-r bg-muted/30 overflow-y-auto p-4 space-y-4">
            {/* Selection Tools */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Инструменты выделения
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectionMode('brush')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectionMode === 'brush'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-border bg-background hover:border-orange-300'
                  }`}
                >
                  <Edit3 className="w-5 h-5" />
                  <span className="text-xs">Кисть</span>
                </button>
                
                <button
                  onClick={() => setSelectionMode('rect')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectionMode === 'rect'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-border bg-background hover:border-orange-300'
                  }`}
                >
                  <Square className="w-5 h-5" />
                  <span className="text-xs">Область</span>
                </button>
                
                <button
                  onClick={clearSelection}
                  disabled={!hasSelection}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-border bg-background hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Eraser className="w-5 h-5" />
                  <span className="text-xs">Очистить</span>
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                💡 {selectionMode === 'brush' && 'Нарисуйте область для редактирования'}
                {selectionMode === 'rect' && 'Выделите прямоугольную область'}
                {selectionMode === 'none' && 'Выберите инструмент выделения'}
              </p>
            </div>

            {/* AI Command Input */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Команда AI
              </h3>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Например: 'измени фон на космос с планетами' или 'добавь солнечный свет справа'"
                className="w-full px-3 py-2 border rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    applyNanaBananaEdit()
                  }
                }}
              />
              
              <button
                onClick={applyNanaBananaEdit}
                disabled={isProcessing || !prompt.trim()}
                className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Обработка AI...
                  </>
                ) : (
                  <>
                    🍌 Применить (Ctrl+Enter)
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompts */}
            <div>
              <h3 className="font-semibold mb-3">Быстрые команды</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((template) => (
                  <button
                    key={template.text}
                    onClick={() => setPrompt(template.text)}
                    className="px-3 py-2 text-sm rounded-lg border hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                  >
                    <span className="mr-1">{template.icon}</span>
                    {template.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Command History */}
            {history.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">История команд</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {history.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(cmd)}
                      className="w-full text-left px-3 py-2 text-sm bg-background rounded hover:bg-muted transition-all border"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-900 mb-1">💡 Как использовать:</p>
              <ol className="text-blue-800 space-y-1 text-xs">
                <li>1. Выделите область (опционально)</li>
                <li>2. Введите команду на русском</li>
                <li>3. Нажмите &quot;Применить&quot; или Ctrl+Enter</li>
                <li>4. Дождитесь результата (~5-10 сек)</li>
              </ol>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden">
            <div 
              ref={containerRef}
              className="relative max-w-full max-h-full"
              style={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                ref={imageRef}
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                style={{ display: 'block' }}
              />
              
              {/* Selection Canvas Overlay */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={finishDrawing}
                onMouseLeave={finishDrawing}
                className="absolute top-0 left-0"
                style={{
                  cursor: selectionMode === 'brush' ? 'crosshair' : selectionMode === 'rect' ? 'crosshair' : 'default',
                  width: '100%',
                  height: '100%',
                }}
              />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-lg font-semibold">🍌 Nano Banana работает...</div>
                    <div className="text-sm mt-2">Применяем ваши изменения</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

