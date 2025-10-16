import type { DocType, AppMode } from './store'
import { getDocTypeConfig, migrateOldDocType } from './docTypesConfig'

type WelcomeMessage = {
  greeting: string
  suggestions: string[]
}

// Универсальное welcome-сообщение для всех типов документов
function getUniversalWelcome(docType: DocType): WelcomeMessage {
  const config = getDocTypeConfig(docType)
  const label = config?.label || 'дизайн'
  
  return {
    greeting: `👋 Привет! Создаём ${label.toLowerCase()}?`,
    suggestions: [
      '💡 Опишите что нужно — я задам 2-4 уточняющих вопроса и создам дизайн',
      '📋 Режим Plan — умный диалог для детальной проработки',
      '🚀 Режим Build — быстрое создание без вопросов',
      '📸 Можно загрузить изображения для вдохновения',
      '🎨 Современный дизайн, не как в газете 90-х!'
    ]
  }
}

// Кастомные welcome-сообщения для особых типов
const CUSTOM_WELCOME_MESSAGES: Partial<Record<DocType, WelcomeMessage>> = {
  'custom-design': {
    greeting: '✨ Привет! Создадим что-то уникальное?',
    suggestions: [
      '💬 Опишите подробно что вам нужно',
      '📸 Загрузите референсы или примеры',
      '🎨 Укажите стиль, размеры, цвета',
      '💡 Режим Plan — проработаем детали вместе',
      '🚀 Даже самые необычные идеи — я реализую!'
    ]
  }
}

const MODE_INFO: Record<AppMode, string> = {
  free: '\n\n💡 Режим: Бесплатный (базовые возможности)',
  advanced: '\n\n💡 Режим: Продвинутый (парсинг сайтов, больше изображений)',
  pro: '\n\n💎 Режим: PRO (максимальное качество, DALL-E 3 HD изображения)'
}

export function getWelcomeMessage(docType: DocType, appMode: AppMode): string {
  // Мигрируем старые типы
  const actualDocType = migrateOldDocType(docType)
  
  // Сначала проверяем кастомные сообщения
  const message = CUSTOM_WELCOME_MESSAGES[actualDocType] || getUniversalWelcome(actualDocType)
  
  let welcome = `${message.greeting}\n\n`
  
  const availableSuggestions = message.suggestions.filter(suggestion => {
    if (appMode === 'free' && suggestion.includes('сайт')) {
      return false
    }
    return true
  })
  
  welcome += availableSuggestions.join('\n')
  welcome += MODE_INFO[appMode]
  
  return welcome
}


