export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  FILE: 25 * 1024 * 1024,
} as const

export const STORAGE_KEYS = {
  STUDIO: 'nx-studio-storage',
  RELOAD_ATTEMPTS: 'nx-studio-reload-attempts',
} as const

export const DEBOUNCE_DELAYS = {
  SAVE_PROJECT: 500,
  INPUT: 300,
} as const

export const MAX_RELOAD_ATTEMPTS = 3

export const STORAGE_VERSION = 5

export const API_TIMEOUTS = {
  DEFAULT: 60000,
  PARSE_WEBSITE: 90000,
  IMAGE_GENERATION: 120000,
} as const

export const DOC_TYPE_LABELS: Record<string, string> = {
  proposal: 'Коммерческое предложение',
  invoice: 'Счёт',
  email: 'Письмо',
  presentation: 'Презентация компании',
  logo: 'Логотип',
  'product-card': 'Карточка товара',
} as const

export const DOC_TYPE_FILE_TYPES: Record<string, string[]> = {
  proposal: ['PDF', 'Excel', 'DOC'],
  invoice: ['Excel', 'PDF', 'DOC'],
  email: ['HTML', 'DOC'],
  presentation: ['PDF', 'DOC'],
  logo: ['SVG', 'PNG', 'PDF', 'DOC'],
  'product-card': ['PNG (WB 3:4)', 'PNG (Универсал)', 'PDF'],
} as const

export const EXCEL_STYLES = {
  ROW_HEIGHT: {
    TITLE: 35,
    HEADER: 30,
    DATA: 25,
    TOTAL: 35,
  },
  COLUMN_WIDTH: {
    NAME: 50,
    QUANTITY: 15,
    PRICE: 18,
    TOTAL: 18,
  },
  COLORS: {
    PRIMARY: 'FF3B82F6',
    PRIMARY_LIGHT: 'FFF0F9FF',
    BORDER: 'FF2563EB',
    MUTED: 'FF6B7280',
    WHITE: 'FFFFFFFF',
    GRAY_BG: 'FFF9FAFB',
    BORDER_GRAY: 'FFE5E7EB',
    PURPLE: 'FF7C3AED',
    PURPLE_LIGHT: 'FFDBEAFE',
  },
} as const

