'use client'

import { useState, useEffect } from 'react'
import { useStore, DocType } from '@/lib/store'
import { Palette, Check } from 'lucide-react'

type StylePreset = {
  id: string
  name: string
  description: string
  primaryColor: string
  secondaryColor: string
  font: string
  spacing: string
  preview: string
}

const STYLE_PRESETS: Record<DocType, StylePreset[]> = {
  proposal: [
    {
      id: 'proposal-modern',
      name: 'Современный',
      description: 'Чистый минималистичный дизайн с голубыми акцентами',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      font: 'Inter',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    },
    {
      id: 'proposal-corporate',
      name: 'Корпоративный',
      description: 'Классический деловой стиль в темно-синих тонах',
      primaryColor: '#1e40af',
      secondaryColor: '#4338ca',
      font: 'Roboto',
      spacing: 'spacious',
      preview: 'linear-gradient(135deg, #1e40af 0%, #4338ca 100%)',
    },
    {
      id: 'proposal-creative',
      name: 'Креативный',
      description: 'Яркий и запоминающийся стиль для смелых предложений',
      primaryColor: '#ec4899',
      secondaryColor: '#f59e0b',
      font: 'Montserrat',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
    },
    {
      id: 'proposal-eco',
      name: 'Эко',
      description: 'Природные зеленые тона для эко-проектов',
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      font: 'Lato',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  ],
  invoice: [
    {
      id: 'invoice-classic',
      name: 'Классический',
      description: 'Строгий черно-серый стиль для официальных счетов',
      primaryColor: '#1e293b',
      secondaryColor: '#64748b',
      font: 'Roboto',
      spacing: 'compact',
      preview: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
    },
    {
      id: 'invoice-modern',
      name: 'Современный',
      description: 'Чистый структурированный стиль в голубых тонах',
      primaryColor: '#0ea5e9',
      secondaryColor: '#06b6d4',
      font: 'Inter',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    },
    {
      id: 'invoice-elegant',
      name: 'Элегантный',
      description: 'Изысканный фиолетовый стиль для премиум-услуг',
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      font: 'Lato',
      spacing: 'spacious',
      preview: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    },
    {
      id: 'invoice-professional',
      name: 'Профессиональный',
      description: 'Деловой темно-синий стиль',
      primaryColor: '#1e3a8a',
      secondaryColor: '#3730a3',
      font: 'Roboto',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
    },
  ],
  email: [
    {
      id: 'email-minimal',
      name: 'Минимальный',
      description: 'Простой легкий стиль для повседневных писем',
      primaryColor: '#3b82f6',
      secondaryColor: '#60a5fa',
      font: 'Open Sans',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    },
    {
      id: 'email-newsletter',
      name: 'Рассылка',
      description: 'Яркий стиль для маркетинговых рассылок',
      primaryColor: '#ef4444',
      secondaryColor: '#f97316',
      font: 'Montserrat',
      spacing: 'spacious',
      preview: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    },
    {
      id: 'email-formal',
      name: 'Официальный',
      description: 'Деловой стиль для корпоративных писем',
      primaryColor: '#1e40af',
      secondaryColor: '#3730a3',
      font: 'Roboto',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
    },
    {
      id: 'email-friendly',
      name: 'Дружелюбный',
      description: 'Теплый стиль для личной переписки',
      primaryColor: '#f59e0b',
      secondaryColor: '#eab308',
      font: 'Lato',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
    },
  ],
  presentation: [
    {
      id: 'presentation-bold',
      name: 'Смелый',
      description: 'Яркие красные цвета для эффектных презентаций',
      primaryColor: '#dc2626',
      secondaryColor: '#ea580c',
      font: 'Montserrat',
      spacing: 'spacious',
      preview: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    },
    {
      id: 'presentation-tech',
      name: 'Технологичный',
      description: 'Современный tech-стиль в бирюзовых тонах',
      primaryColor: '#0891b2',
      secondaryColor: '#0284c7',
      font: 'Inter',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)',
    },
    {
      id: 'presentation-elegant',
      name: 'Элегантный',
      description: 'Утонченный фиолетовый стиль',
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      font: 'Lato',
      spacing: 'spacious',
      preview: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    },
    {
      id: 'presentation-business',
      name: 'Бизнес',
      description: 'Классический деловой стиль',
      primaryColor: '#1e40af',
      secondaryColor: '#1e3a8a',
      font: 'Roboto',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
    },
  ],
  logo: [
    {
      id: 'logo-modern',
      name: 'Современный',
      description: 'Минималистичный дизайн для tech-брендов',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      font: 'Inter',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    },
    {
      id: 'logo-bold',
      name: 'Смелый',
      description: 'Яркий и запоминающийся стиль',
      primaryColor: '#ef4444',
      secondaryColor: '#f59e0b',
      font: 'Montserrat',
      spacing: 'compact',
      preview: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
    },
    {
      id: 'logo-professional',
      name: 'Профессиональный',
      description: 'Деловой стиль для корпораций',
      primaryColor: '#1e40af',
      secondaryColor: '#4338ca',
      font: 'Roboto',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #1e40af 0%, #4338ca 100%)',
    },
    {
      id: 'logo-creative',
      name: 'Креативный',
      description: 'Яркий стиль для творческих студий',
      primaryColor: '#ec4899',
      secondaryColor: '#8b5cf6',
      font: 'Montserrat',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    },
  ],
  'product-card': [
    {
      id: 'product-wildberries',
      name: 'Wildberries',
      description: 'Стиль для маркетплейса WB - минимализм на белом фоне',
      primaryColor: '#cb11ab',
      secondaryColor: '#f5f5f5',
      font: 'Inter',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #cb11ab 0%, #f5f5f5 100%)',
    },
    {
      id: 'product-ozon',
      name: 'Ozon',
      description: 'Стиль Ozon - синий акцент на светлом фоне',
      primaryColor: '#005bff',
      secondaryColor: '#ffffff',
      font: 'Roboto',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #005bff 0%, #ffffff 100%)',
    },
    {
      id: 'product-yandex',
      name: 'Яндекс.Маркет',
      description: 'Желто-черный стиль Яндекс.Маркета',
      primaryColor: '#ffcc00',
      secondaryColor: '#000000',
      font: 'Arial',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #ffcc00 0%, #000000 100%)',
    },
    {
      id: 'product-avito',
      name: 'Avito',
      description: 'Стиль Avito - зеленый акцент, чистый фон',
      primaryColor: '#00c853',
      secondaryColor: '#ffffff',
      font: 'Roboto',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #00c853 0%, #ffffff 100%)',
    },
    {
      id: 'product-premium',
      name: 'Премиум',
      description: 'Элегантный золотой стиль для дорогих товаров',
      primaryColor: '#d4af37',
      secondaryColor: '#1a1a1a',
      font: 'Lato',
      spacing: 'spacious',
      preview: 'linear-gradient(135deg, #d4af37 0%, #1a1a1a 100%)',
    },
    {
      id: 'product-eco',
      name: 'Эко',
      description: 'Зеленый стиль для эко-товаров',
      primaryColor: '#10b981',
      secondaryColor: '#ffffff',
      font: 'Inter',
      spacing: 'normal',
      preview: 'linear-gradient(135deg, #10b981 0%, #ffffff 100%)',
    },
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

export default function StyleEditor() {
  const { docType, styleConfig, updateStyleConfig, selectedStyleName, setSelectedStyleName } = useStore()
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const availableStyles = STYLE_PRESETS[docType] || []

  const applyPreset = (preset: StylePreset) => {
    setSelectedPresetId(preset.id)
    setSelectedStyleName(preset.name)
    updateStyleConfig({
      name: preset.name,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      font: preset.font,
      spacing: preset.spacing,
    })
  }

  useEffect(() => {
    const currentPreset = availableStyles.find(s => s.name === selectedStyleName)
    if (currentPreset) {
      setSelectedPresetId(currentPreset.id)
    } else {
      setSelectedPresetId(null)
    }
  }, [docType, availableStyles, selectedStyleName])

  const getDocTypeName = () => {
    switch (docType) {
      case 'proposal':
        return 'коммерческого предложения'
      case 'invoice':
        return 'счёта'
      case 'email':
        return 'письма'
      case 'presentation':
        return 'презентации'
      case 'logo':
        return 'логотипа'
      default:
        return 'документа'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Palette className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-base">Выбрать Стиль</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Выберите стиль для {getDocTypeName()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {availableStyles.map((preset) => (
        <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className={`relative w-full p-3 rounded-lg border-2 transition-all text-left group hover:shadow-md ${
              selectedPresetId === preset.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex gap-3">
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-md border-2 transition-all ${
                  selectedPresetId === preset.id
                    ? 'border-primary scale-105'
                    : 'border-border group-hover:border-primary/40'
                }`}
                style={{
                  background: preset.preview,
                }}
              >
                {selectedPresetId === preset.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{preset.name}</h4>
                  {selectedPresetId === preset.id && (
                    <span className="flex-shrink-0 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      Выбран
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {preset.description}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{preset.font}</span>
                  </span>
                  <span>•</span>
                  <span>
                    {preset.spacing === 'compact' && 'Компактно'}
                    {preset.spacing === 'normal' && 'Нормально'}
                    {preset.spacing === 'spacious' && 'Просторно'}
                  </span>
                </div>
              </div>
            </div>
        </button>
        ))}
      </div>

      {selectedStyleName && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              ✓ Выбран стиль: <span className="font-semibold text-primary">{selectedStyleName}</span>
            </p>
            <button
              onClick={() => {
                setSelectedPresetId(null)
                setSelectedStyleName(null)
              }}
              className="px-3 py-1 text-xs bg-muted hover:bg-accent text-foreground rounded-md transition-all shadow-sm hover:shadow-md"
            >
              Снять стиль
            </button>
          </div>
        </div>
      )}

      {!selectedStyleName && (
        <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            ℹ️ Стиль не выбран. Будет использован базовый дизайн.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Настроить вручную
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Основной цвет</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.primaryColor}
                onChange={(e) => updateStyleConfig({ primaryColor: e.target.value })}
                className="w-12 h-10 rounded border-2 border-border cursor-pointer"
              />
              <input
                type="text"
                value={styleConfig.primaryColor}
                onChange={(e) => updateStyleConfig({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Дополнительный цвет</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleConfig.secondaryColor}
                onChange={(e) => updateStyleConfig({ secondaryColor: e.target.value })}
                className="w-12 h-10 rounded border-2 border-border cursor-pointer"
              />
              <input
                type="text"
                value={styleConfig.secondaryColor}
                onChange={(e) => updateStyleConfig({ secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Шрифт</label>
            <select
              value={styleConfig.font}
              onChange={(e) => updateStyleConfig({ font: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded text-xs cursor-pointer"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lato">Lato</option>
            </select>
        </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Отступы</label>
            <select
              value={styleConfig.spacing}
              onChange={(e) => updateStyleConfig({ spacing: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded text-xs cursor-pointer"
            >
              <option value="compact">Компактно</option>
              <option value="normal">Нормально</option>
              <option value="spacious">Просторно</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

