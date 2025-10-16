'use client'

import { ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { FILE_SIZE_LIMITS } from '@/lib/constants'
import ImageActionModal from './ImageActionModal'

const { IMAGE: MAX_IMAGE_SIZE, VIDEO: MAX_VIDEO_SIZE, FILE: MAX_FILE_SIZE } = FILE_SIZE_LIMITS

export default function FileUploader() {
  const [uploading, setUploading] = useState(false)
  const [imageActionModalOpen, setImageActionModalOpen] = useState(false)
  const [pendingImageData, setPendingImageData] = useState<{
    id: string
    name: string
    base64: string
    type: string
    fileSize: string
  } | null>(null)
  
  const { addMessage, addUploadedImage, appMode, isFeatureAvailable } = useStore()

  const handleImageAction = (action: 'use-as-is' | 'generate-similar' | 'use-as-reference') => {
    if (!pendingImageData) return
    
    addUploadedImage({
      ...pendingImageData,
      actionType: action
    })
    
    if (action === 'use-as-is') {
      addMessage({
        role: 'assistant',
        content: `✅ Изображение "${pendingImageData.name}" сохранено.\n\n💡 **Как использовать:**\n- Скажите "создай карточку товара" - вставлю изображение в документ\n- Выберите элемент в превью и скажите "вставь сюда фото" - заменю выбранный элемент\n- Укажите место: "добавь фото в заголовок" / "вставь в центр"`
      })
    } else if (action === 'generate-similar') {
      addMessage({
        role: 'assistant',
        content: `🎨 Изображение "${pendingImageData.name}" принято как референс для AI генерации.\n\n💡 AI создаст похожее изображение через Flux при создании документа. Скажите что создать!`
      })
    } else {
      addMessage({
        role: 'assistant',
        content: `👁️ Изображение "${pendingImageData.name}" будет использовано как референс стиля.\n\n💡 AI проанализирует цвета и композицию для вдохновения. Что создать?`
      })
    }
    
    setImageActionModalOpen(false)
    setPendingImageData(null)
    setUploading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    for (const file of Array.from(files)) {
      const fileType = file.type
      const fileName = file.name
      const fileSize = (file.size / 1024).toFixed(2)
      const fileSizeBytes = file.size
      
      if (fileType.startsWith('image/') && fileSizeBytes > MAX_IMAGE_SIZE) {
        addMessage({
          role: 'assistant',
          content: `❌ Изображение "${fileName}" слишком большое (${fileSize} KB). Максимальный размер: ${MAX_IMAGE_SIZE / 1024 / 1024} MB`
        })
        continue
      }
      
      if (fileType.startsWith('video/') && fileSizeBytes > MAX_VIDEO_SIZE) {
        addMessage({
          role: 'assistant',
          content: `❌ Видео "${fileName}" слишком большое (${fileSize} KB). Максимальный размер: ${MAX_VIDEO_SIZE / 1024 / 1024} MB`
        })
        continue
      }
      
      if (!fileType.startsWith('image/') && !fileType.startsWith('video/') && fileSizeBytes > MAX_FILE_SIZE) {
        addMessage({
          role: 'assistant',
          content: `❌ Файл "${fileName}" слишком большой (${fileSize} KB). Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024} MB`
        })
        continue
      }
      
      try {
        let content = ''
        let fileData = ''
        
        if (fileType.startsWith('image/')) {
          fileData = await fileToBase64(file)
          
          const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          
          addMessage({
            role: 'user',
            content: `📸 Загружено изображение: ${fileName} (${fileSize} KB)`
          })
          
          setPendingImageData({
            id: imageId,
            name: fileName,
            base64: fileData,
            type: fileType,
            fileSize: fileSize
          })
          setImageActionModalOpen(true)
          
          continue
          
        } else if (fileType.includes('pdf')) {
          addMessage({
            role: 'user',
            content: `📄 Загружен PDF: ${fileName} (${fileSize} KB)\n\nПроанализируй содержимое и создай документ на его основе.`
          })
          
          addMessage({
            role: 'assistant',
            content: `Принял PDF "${fileName}". К сожалению, я пока не могу напрямую читать PDF, но могу:\n- Создать похожий документ, если опишешь содержание\n- Сгенерировать новый документ по твоим требованиям\n\nЧто нужно сделать?`
          })
          
        } else if (fileType.includes('word') || fileType.includes('document')) {
          addMessage({
            role: 'user',
            content: `📝 Загружен документ: ${fileName} (${fileSize} KB)\n\nИспользуй как основу для нового документа.`
          })
          
          addMessage({
            role: 'assistant',
            content: `Принял документ "${fileName}". Могу создать:\n- Обновленную версию\n- Коммерческое предложение на основе\n- Презентацию из содержимого\n\nОпиши что нужно сделать.`
          })
          
        } else if (fileType.includes('sheet') || fileType.includes('excel')) {
          addMessage({
            role: 'user',
            content: `📊 Загружен Excel: ${fileName} (${fileSize} KB)\n\nИспользуй данные для создания документа.`
          })
          
          addMessage({
            role: 'assistant',
            content: `Принял Excel "${fileName}". Могу создать:\n- Коммерческое предложение с ценами из таблицы\n- Счёт на основе позиций\n- Презентацию с данными\n\nОпиши структуру файла или что нужно создать.`
          })
          
        } else if (fileType.startsWith('video/')) {
          const canAnalyzeVideo = appMode === 'pro'
          
          addMessage({
            role: 'user',
            content: `🎥 Загружено видео: ${fileName} (${fileSize} KB)\n\nИспользуй для анализа и создания документа.`
          })
          
          if (canAnalyzeVideo) {
            fileData = await fileToBase64(file)
            
            const videoId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            addUploadedImage({
              id: videoId,
              name: fileName,
              base64: fileData,
              type: fileType
            })
            
            addMessage({
              role: 'assistant',
              content: `💎 PRO: Принял видео "${fileName}". GPT-4o проанализирует видео и создаст документ на его основе.\n\nОпиши какой документ нужно создать из видео:\n- Презентация с ключевыми кадрами\n- Коммерческое предложение\n- Карточка товара\n- Описание продукта`
            })
          } else {
            addMessage({
              role: 'assistant',
              content: `⚠️  Анализ видео доступен только в PRO режиме!\n\n💎 Включите PRO режим для:\n- Автоматического анализа видео с GPT-4o\n- Извлечения ключевых кадров\n- Создания документов на основе видео\n\nСейчас могу создать документ, если опишете содержание видео вручную.`
            })
          }
          
        } else if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
          // Текстовый файл - читаем содержимое
          content = await file.text()
          addMessage({
            role: 'user',
            content: `📎 Загружен текстовый файл: ${fileName} (${fileSize} KB)\n\n${content.length > 1000 ? content.substring(0, 1000) + '...' : content}\n\nИспользуй это содержимое для создания документа.`
          })
          
          addMessage({
            role: 'assistant',
            content: `Принял текстовый файл "${fileName}". Могу создать:\n- Коммерческое предложение\n- Email на основе текста\n- Презентацию\n- Счёт\n\nЧто именно нужно создать?`
          })
          
        } else {
          addMessage({
            role: 'user',
            content: `📎 Загружен файл: ${fileName} (${fileSize} KB)`
          })
          
          addMessage({
            role: 'assistant',
            content: `Принял файл "${fileName}". Опиши что в нём и какой документ нужно создать.`
          })
        }
      } catch (error) {
        console.error('Error processing file:', error)
        addMessage({
          role: 'assistant',
          content: `❌ Ошибка при обработке файла "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
    
    setUploading(false)
    e.target.value = ''
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <>
      <label 
        className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-[44px] min-h-[44px] px-2 sm:px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all text-xs sm:text-sm font-semibold"
        title="Загрузить изображения или файлы"
      >
        <ImagePlus className={`w-4 h-4 sm:w-5 sm:h-5 ${uploading ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">{uploading ? 'Загрузка...' : 'Импорт'}</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,text/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
      
      <ImageActionModal
        isOpen={imageActionModalOpen}
        fileName={pendingImageData?.name || ''}
        onClose={() => {
          setImageActionModalOpen(false)
          setPendingImageData(null)
          setUploading(false)
        }}
        onAction={handleImageAction}
      />
    </>
  )
}

