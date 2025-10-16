import type { AppMode, DocType } from '../store'

export const MODE_CONFIG = {
  free: {
    name: 'Бесплатный',
    icon: '🆓',
    description: 'Базовая генерация документов',
    features: {
      uploadImages: true,
      parseWebsite: false,
      uploadVideo: false,
      aiImageGeneration: false,
    },
    models: {
      text: {
        provider: 'openrouter',
        model: 'google/gemini-2.5-flash-lite',
        temperature: 0.7,
      },
    },
  },
  advanced: {
    name: 'Продвинутый',
    icon: '⚡',
    description: 'Генерация изображений',
    features: {
      uploadImages: true,
      parseWebsite: true,
      uploadVideo: false,
      aiImageGeneration: true,
    },
    models: {
      text: {
        provider: 'openrouter',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.7,
        multimodal: true,
      },
      image: {
        provider: 'replicate',
        model: 'black-forest-labs/flux-schnell',
        width: 1024,
        height: 1024,
      },
    },
  },
  pro: {
    name: 'PRO',
    icon: '💎',
    description: 'HD качество + видео',
    features: {
      uploadImages: true,
      parseWebsite: true,
      uploadVideo: true,
      aiImageGeneration: true,
      multimodalAnalysis: true,
    },
    models: {
      text: {
        provider: 'openrouter',
        model: 'openai/gpt-4o',
        temperature: 0.7,
        multimodal: true,
      },
      contentAnalyzer: {
        provider: 'openrouter',
        model: 'openai/gpt-4o',
      },
      htmlComposer: {
        provider: 'openrouter',
        model: 'openai/gpt-4o',
      },
      image: {
        provider: 'openai',
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'hd',
      },
    },
  },
} as const

export const IMAGE_SLOTS_CONFIG: Record<DocType, number> = {
  proposal: 3,
  invoice: 3,
  email: 2,
  presentation: 5,
  logo: 3,
  'product-card': 3,
  'commercial-proposal': 3,
  'business-card': 1,
  'youtube-thumbnail': 1,
  'vk-post': 1,
  'telegram-post': 1,
  'wildberries-card': 3,
  'ozon-card': 3,
  'yandex-market-card': 3,
  'avito-card': 3,
  'brand-book': 5,
  'icon-set': 10,
  'ui-kit': 5,
  'email-template': 2,
  'newsletter': 2,
  'custom-design': 3,
}

export const IMAGE_GENERATION_PROMPTS: Record<DocType, string[]> = {
  proposal: [
    'modern professional company logo, minimal design, clean background',
    'professional business product photography, clean white background, modern style',
    'business team collaboration illustration, modern flat design, professional',
  ],
  invoice: [
    'professional company logo, minimal design, corporate identity',
    'professional product photography, clean background, high quality',
    'business product image, professional lighting, clean white background'
  ],
  email: [
    'professional company logo, minimal design',
    'business email header image, professional style, modern design',
  ],
  presentation: [
    'modern minimal company logo design, clean geometric shapes, professional, flat design, simple, memorable, vector style, white background',
    'abstract geometric pattern background, modern professional style, gradient mesh, soft colors, minimalist, business presentation, high quality, subtle texture',
    'modern flat design icons set, business symbols, minimalist 3D style, professional, clean background, soft shadows, colorful accents, isometric view',
    'abstract flowing shapes, gradient colors, modern design element, smooth curves, professional, transparent background, decorative accent',
    'dotted pattern background, modern tech style, subtle grid, clean minimal design, light colors, professional presentation backdrop',
  ],
  logo: [
    'modern minimal company logo design, professional',
    'creative brand logo, clean design, memorable',
    'elegant business logo, sophisticated style',
  ],
  'product-card': [
    'professional product photography, clean background, high quality, marketplace style',
    'product detail shot, professional lighting, clean white background',
    'product in use, lifestyle photography, natural lighting'
  ],
  'commercial-proposal': [],
  'business-card': [],
  'youtube-thumbnail': [],
  'vk-post': [],
  'telegram-post': [],
  'wildberries-card': [],
  'ozon-card': [],
  'yandex-market-card': [],
  'avito-card': [],
  'brand-book': [],
  'icon-set': [],
  'ui-kit': [],
  'email-template': [],
  'newsletter': [],
  'custom-design': [],
}

