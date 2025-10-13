'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, FileEdit, Zap } from 'lucide-react'
import type { DocType } from '@/lib/store'

type InlinePlanningCardProps = {
  docType: DocType
  onSubmit: (selectedQuestions: string[], pageCount?: number, imageCount?: number, mode?: 'batch' | 'sequential') => void
  onSkip: () => void
}

const QUESTIONS_BY_DOCTYPE: Record<DocType, string[]> = {
  proposal: [
    'Номер и дата коммерческого предложения',
    'Название вашей компании и реквизиты',
    'Название компании клиента и контактное лицо',
    'Основная цель коммерческого предложения',
    'Целевая аудитория (отрасль, размер компании)',
    'Описание продукта/услуги',
    'Ключевые преимущества и УТП',
    'Конкретные цифры, кейсы или результаты',
    'Цены и условия (фиксированная цена, от-до, по запросу)',
    'Срок действия предложения',
    'Условия оплаты и доставки',
    'Гарантии и сертификаты',
    'Этапы работы или реализации',
    'Сроки выполнения работ',
    'Контактные данные для связи',
    'Логотип компании (приложите файл)',
    'Инфографика или диаграммы',
    'Стиль подачи (строгий/креативный/современный)',
    'Цветовая схема и фирменный стиль',
    'Дополнительные пожелания',
    'Количество AI изображений для генерации (1-6)'
  ],
  invoice: [
    'Номер счета (или сгенерировать автоматически)',
    'Дата выставления счета',
    'Реквизиты продавца (ООО, ИНН, КПП, адрес, банк)',
    'Реквизиты покупателя',
    'Список позиций товаров/услуг',
    'Количество и единицы измерения',
    'Цены за единицу',
    'Цены с НДС или без НДС',
    'Общая сумма к оплате',
    'Условия оплаты (срок, реквизиты)',
    'Назначение платежа',
    'Логотип компании (приложите файл)',
    'Контактное лицо (ФИО, должность)',
    'Телефон и email для связи',
    'Печать и подпись',
    'Дополнительные условия или примечания',
    'Количество AI изображений для документа (1-6)'
  ],
  email: [
    'Название компании/бренда',
    'Цель письма (продажа, информирование, приглашение)',
    'Получатели (клиенты, партнеры, подписчики)',
    'Тема письма или основная идея',
    'Что предлагаете или о чем рассказываете',
    'Призыв к действию (CTA)',
    'Акция, скидка или спецпредложение',
    'Дедлайн акции (если есть)',
    'Изображения или баннеры',
    'Инфографика',
    'Фон или оформление (рамка, градиент)',
    'Логотип (приложите или укажите цвета)',
    'Цветовая схема',
    'Тон общения (официальный / дружелюбный / свой)',
    'Ссылка для перехода',
    'Контактные данные',
    'Социальные сети',
    'Дополнительные пожелания',
    'Количество AI изображений для генерации (1-4)'
  ],
  presentation: [
    'Название компании или презентации',
    'Тема и основная цель презентации',
    'Целевая аудитория (инвесторы, клиенты, команда)',
    'Ключевые идеи и сообщения',
    'Структура презентации (разделы)',
    'Продукт или услуга (описание)',
    'Конкурентные преимущества',
    'Кейсы или примеры результатов',
    'Графики, диаграммы или данные',
    'Инфографика',
    'Фотографии команды или продукта',
    'Логотип компании (приложите)',
    'Цветовая схема и стиль',
    'Тон презентации (формальный / креативный)',
    'Призыв к действию',
    'Контактные данные',
    'Дополнительные пожелания',
    'Количество AI изображений для генерации (1-6)'
  ],
  logo: [
    'Название компании или бренда',
    'Сфера деятельности',
    'Ассоциации и эмоции от логотипа',
    'Целевая аудитория',
    'Предпочтения по цветам',
    'Стиль логотипа (минимализм, винтаж, современный, и т.д.)',
    'Форма логотипа (круг, квадрат, свободная)',
    'Символы или иконки (если нужны)',
    'Текст в логотипе (название, слоган)',
    'Шрифт (строгий, игривый, рукописный)',
    'Где будет использоваться (веб, печать, соцсети, упаковка)',
    'Конкуренты или референсы для вдохновения',
    'Что НЕ должно быть в логотипе',
    'Дополнительные пожелания',
    'Количество вариантов логотипа (1-10)'
  ],
  'product-card': [
    'Название продукта или услуги',
    'Категория товара',
    'Целевая аудитория покупателей',
    'Описание продукта (краткое и полное)',
    'Ключевые характеристики',
    'Преимущества перед конкурентами',
    'Цена (фиксированная, диапазон, по запросу)',
    'Наличие на складе',
    'Условия доставки',
    'Варианты оплаты',
    'Гарантия и возврат',
    'Фотографии продукта',
    'Видео-обзор (если есть)',
    'Отзывы клиентов',
    'Рейтинг или оценка',
    'Стиль карточки (минималистичный / яркий / премиум)',
    'Цветовая схема',
    'Призыв к действию (купить, заказать, узнать больше)',
    'Дополнительные пожелания',
    'Количество AI изображений товара (1-4)'
  ]
}

const PAGE_LIMITS: Record<DocType, { min: number; max: number } | null> = {
  proposal: { min: 1, max: 5 },
  invoice: null,
  email: { min: 1, max: 2 },
  presentation: { min: 1, max: 10 },
  logo: null,
  'product-card': null
}

const IMAGE_LIMITS: Record<DocType, { min: number; max: number; label: string } | null> = {
  proposal: { min: 1, max: 6, label: 'Количество AI изображений' },
  invoice: { min: 1, max: 6, label: 'Количество AI изображений' },
  email: { min: 1, max: 4, label: 'Количество AI изображений' },
  presentation: { min: 1, max: 6, label: 'Количество AI изображений' },
  logo: { min: 1, max: 10, label: 'Количество вариантов логотипа' },
  'product-card': { min: 1, max: 4, label: 'Количество AI изображений товара' }
}

export default function InlinePlanningCard({ docType, onSubmit, onSkip }: InlinePlanningCardProps) {
  const questions = QUESTIONS_BY_DOCTYPE[docType] || []
  const pageLimit = PAGE_LIMITS[docType]
  const imageLimit = IMAGE_LIMITS[docType]
  
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())
  const [pageCount, setPageCount] = useState<number>(pageLimit?.min || 1)
  const [imageCount, setImageCount] = useState<number>(imageLimit?.min || 3)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const toggleQuestion = (index: number) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedQuestions(new Set(questions.map((_, i) => i)))
  }

  const deselectAll = () => {
    setSelectedQuestions(new Set())
  }

  const handleSubmit = (mode: 'batch' | 'sequential') => {
    const selected = Array.from(selectedQuestions)
      .sort((a, b) => a - b)
      .map(i => questions[i])
    
    setIsSubmitted(true)
    onSubmit(selected, pageLimit ? pageCount : undefined, imageLimit ? imageCount : undefined, mode)
  }

  const handleSkip = () => {
    setIsSubmitted(true)
    onSkip()
  }

  if (isSubmitted) {
    return (
      <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Планирование настроено</span>
        </div>
      </div>
    )
  }

  const displayCount = isExpanded ? questions.length : 6
  const hasMore = questions.length > 6

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5 shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-bold text-blue-900 dark:text-blue-300 mb-1">
          📋 Выберите вопросы для детального планирования
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Отметьте важные для вас пункты или пропустите для свободного планирования
        </p>
      </div>

      {/* Page Count Selector */}
      {pageLimit && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
          <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            📄 Количество страниц: <span className="font-bold">{pageCount}</span>
          </label>
          <input
            type="range"
            min={pageLimit.min}
            max={pageLimit.max}
            value={pageCount}
            onChange={(e) => setPageCount(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-blue-600 dark:text-blue-500 mt-1">
            <span>{pageLimit.min}</span>
            <span>{pageLimit.max}</span>
          </div>
        </div>
      )}

      {/* Image Count Selector */}
      {imageLimit && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <label className="flex items-center gap-2 text-sm font-medium text-purple-900 dark:text-purple-300 mb-3">
            <FileEdit className="w-4 h-4" />
            {imageLimit.label}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={imageLimit.min}
              max={imageLimit.max}
              value={imageCount}
              onChange={(e) => setImageCount(Number(e.target.value))}
              className="flex-1 h-2 bg-purple-200 dark:bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-900 border-2 border-purple-500 dark:border-purple-400 rounded-lg shadow-sm">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{imageCount}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400 mt-2">
            <span>{imageLimit.min} мин.</span>
            <span>{imageLimit.max} макс.</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-blue-700 dark:text-blue-400">
          Выбрано: <span className="font-bold">{selectedQuestions.size}</span> из {questions.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            Все
          </button>
          <button
            onClick={deselectAll}
            className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Снять
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2">
        {questions.slice(0, displayCount).map((question, index) => (
          <button
            key={index}
            onClick={() => toggleQuestion(index)}
            className={`
              w-full flex items-start gap-2 p-2 rounded-lg border transition-all text-left text-sm
              ${selectedQuestions.has(index)
                ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
              }
            `}
          >
            <div className={`
              w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
              ${selectedQuestions.has(index)
                ? 'bg-white border-white'
                : 'border-blue-300 dark:border-blue-700'
              }
            `}>
              {selectedQuestions.has(index) && <Check className="w-3 h-3 text-blue-500" />}
            </div>
            <span className="flex-1">{question}</span>
          </button>
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-4 px-3 py-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all flex items-center justify-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Свернуть
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать все {questions.length} вопросов
            </>
          )}
        </button>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {selectedQuestions.size > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSubmit('batch')}
              className="flex flex-col items-center gap-1 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
            >
              <FileEdit className="w-5 h-5" />
              <span className="text-xs font-medium">Ответить сразу</span>
            </button>
            
            <button
              onClick={() => handleSubmit('sequential')}
              className="flex flex-col items-center gap-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Zap className="w-5 h-5" />
              <span className="text-xs font-medium">По очереди</span>
            </button>
          </div>
        )}
        
        <button
          onClick={handleSkip}
          className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
        >
          {selectedQuestions.size > 0 ? 'Или пропустить детальное планирование' : 'Пропустить и использовать свободное планирование'}
        </button>
      </div>
    </div>
  )
}


