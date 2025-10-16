import { 
  Presentation, 
  Briefcase, 
  Smartphone, 
  ShoppingCart, 
  Palette, 
  Mail,
  Sparkles,
  FileText,
  Receipt,
  CreditCard,
  Video,
  MessageSquare,
  Share2,
  Package,
  Box,
  Store,
  Megaphone,
  Image as ImageIcon,
  Book,
  Grid3x3,
  MailOpen,
  Send
} from 'lucide-react'
import type { DocCategory, DocType } from './store'

export type DocTypeConfig = {
  id: DocType
  label: string
  description: string
  icon: any
  dimensions?: string
  category: DocCategory
  complexity: 'simple' | 'medium' | 'complex'
}

export type CategoryConfig = {
  id: DocCategory
  name: string
  description: string
  icon: any
  color: string
  types: DocTypeConfig[]
}

export const DOC_CATEGORIES: CategoryConfig[] = [
  {
    id: 'presentation',
    name: '🎤 Презентации',
    description: 'Профессиональные презентации для любых целей',
    icon: Presentation,
    color: 'from-blue-500 to-indigo-600',
    types: [
      { 
        id: 'presentation', 
        label: 'Презентация компании', 
        description: 'Многостраничная презентация о вашей компании', 
        icon: Presentation, 
        category: 'presentation',
        complexity: 'medium'
      },
    ]
  },
  {
    id: 'branding',
    name: '🎨 Брендинг',
    description: 'Логотипы, фирменный стиль, UI элементы',
    icon: Palette,
    color: 'from-purple-500 to-violet-600',
    types: [
      { 
        id: 'logo', 
        label: 'Логотип', 
        description: 'Уникальный логотип', 
        icon: Sparkles, 
        category: 'branding',
        complexity: 'medium'
      },
      { 
        id: 'brand-book', 
        label: 'Брендбук', 
        description: 'Фирменный стиль', 
        icon: Book, 
        category: 'branding',
        complexity: 'complex'
      },
      { 
        id: 'icon-set', 
        label: 'Набор иконок', 
        description: 'Комплект иконок', 
        icon: Grid3x3, 
        category: 'branding',
        complexity: 'medium'
      },
    ]
  },
  {
    id: 'business',
    name: '💼 Для бизнеса',
    description: 'Деловые документы и коммерческие предложения',
    icon: Briefcase,
    color: 'from-emerald-500 to-teal-600',
    types: [
      { 
        id: 'commercial-proposal', 
        label: 'Коммерческое предложение', 
        description: 'Профессиональное КП с расчетами', 
        icon: FileText, 
        category: 'business',
        complexity: 'complex'
      },
      { 
        id: 'invoice', 
        label: 'Счёт на оплату', 
        description: 'Счет с реквизитами', 
        icon: Receipt, 
        category: 'business',
        complexity: 'medium'
      },
      { 
        id: 'business-card', 
        label: 'Визитка', 
        description: 'Дизайн визитной карточки', 
        icon: CreditCard, 
        category: 'business',
        complexity: 'simple'
      },
    ]
  },
  {
    id: 'social',
    name: '📱 Для соц. сетей',
    description: 'Контент для YouTube, VK, Telegram',
    icon: Smartphone,
    color: 'from-pink-500 to-rose-600',
    types: [
      { 
        id: 'youtube-thumbnail', 
        label: 'YouTube превью', 
        description: 'Обложка для видео 1280x720', 
        icon: Video, 
        dimensions: '1280x720', 
        category: 'social',
        complexity: 'simple'
      },
      { 
        id: 'vk-post', 
        label: 'VK пост', 
        description: 'Пост для ВКонтакте', 
        icon: MessageSquare, 
        category: 'social',
        complexity: 'simple'
      },
      { 
        id: 'telegram-post', 
        label: 'Telegram пост', 
        description: 'Пост для канала', 
        icon: Share2, 
        category: 'social',
        complexity: 'simple'
      },
    ]
  },
  {
    id: 'marketplace',
    name: '🛒 Для маркетплейсов',
    description: 'Карточки для WB, Ozon, Яндекс.Маркет, Avito',
    icon: ShoppingCart,
    color: 'from-orange-500 to-amber-600',
    types: [
      { 
        id: 'wildberries-card', 
        label: 'Wildberries', 
        description: 'Карточка товара 900x1200', 
        icon: Package, 
        dimensions: '900x1200', 
        category: 'marketplace',
        complexity: 'medium'
      },
      { 
        id: 'ozon-card', 
        label: 'Ozon', 
        description: 'Карточка товара 1000x1000', 
        icon: Box, 
        dimensions: '1000x1000', 
        category: 'marketplace',
        complexity: 'medium'
      },
      { 
        id: 'yandex-market-card', 
        label: 'Яндекс.Маркет', 
        description: 'Карточка товара', 
        icon: Store, 
        category: 'marketplace',
        complexity: 'medium'
      },
      { 
        id: 'avito-card', 
        label: 'Avito', 
        description: 'Объявление с фото', 
        icon: Megaphone, 
        category: 'marketplace',
        complexity: 'medium'
      },
    ]
  },
  {
    id: 'email',
    name: '📧 Email-маркетинг',
    description: 'Шаблоны писем и рассылки',
    icon: Mail,
    color: 'from-cyan-500 to-blue-600',
    types: [
      { 
        id: 'email-template', 
        label: 'Email шаблон', 
        description: 'Шаблон письма', 
        icon: MailOpen, 
        category: 'email',
        complexity: 'medium'
      },
      { 
        id: 'newsletter', 
        label: 'Рассылка', 
        description: 'Email рассылка', 
        icon: Send, 
        category: 'email',
        complexity: 'medium'
      },
    ]
  },
  {
    id: 'custom',
    name: '✨ Другое',
    description: 'Создайте что-то уникальное',
    icon: Sparkles,
    color: 'from-fuchsia-500 to-pink-600',
    types: [
      { 
        id: 'custom-design', 
        label: 'Кастомный дизайн', 
        description: 'Опишите что вам нужно', 
        icon: Sparkles, 
        category: 'custom',
        complexity: 'medium'
      },
    ]
  }
]

// Получить все типы документов одним списком
export const getAllDocTypes = (): DocTypeConfig[] => {
  return DOC_CATEGORIES.flatMap(category => category.types)
}

// Получить типы по категории
export const getDocTypesByCategory = (categoryId: DocCategory): DocTypeConfig[] => {
  const category = DOC_CATEGORIES.find(cat => cat.id === categoryId)
  return category?.types || []
}

// Получить конфиг типа документа
export const getDocTypeConfig = (docTypeId: DocType): DocTypeConfig | undefined => {
  return getAllDocTypes().find(type => type.id === docTypeId)
}

// Получить категорию по типу документа
export const getCategoryByDocType = (docTypeId: DocType): CategoryConfig | undefined => {
  return DOC_CATEGORIES.find(cat => 
    cat.types.some(type => type.id === docTypeId)
  )
}

// Миграция старых типов на новые
export const migrateOldDocType = (oldType: DocType): DocType => {
  const migrations: Record<string, DocType> = {
    'proposal': 'commercial-proposal',
    'email': 'email-template',
    'product-card': 'wildberries-card'
  }
  return migrations[oldType] || oldType
}

