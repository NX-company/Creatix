'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'nx_studio_tour_completed'

export default function OnboardingTour() {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY)
    if (completed) return

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Далее →',
      prevBtnText: '← Назад',
      doneBtnText: 'Готово',
      progressText: '{{current}} из {{total}}',
      
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, 'true')
        driverObj.destroy()
      },
      
      steps: [
        {
          popover: {
            title: '👋 Добро пожаловать в Creatix!',
            description: `
              <div class="space-y-2">
                <p class="text-sm mb-2">Мы создали AI-ассистента для генерации документов:</p>
                <div class="text-sm space-y-1 mb-2">
                  <div>✨ Коммерческие предложения</div>
                  <div>📄 Счета</div>
                  <div>✉️ Письма</div>
                  <div>📊 Презентации</div>
                  <div>🎨 Логотипы</div>
                  <div>🛍️ Карточки товаров</div>
                </div>
                <p class="text-xs text-gray-500 mt-2">Хотите быструю экскурсию? (займет 60 секунд)</p>
              </div>
            `,
          },
        },
        {
          element: '[data-tour="doc-types"]',
          popover: {
            title: '📄 Выберите тип документа',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2">Здесь вы выбираете, что хотите создать:</p>
                <ul class="space-y-1 mb-2">
                  <li>• <strong>Коммерческое предложение</strong> - для B2B продаж</li>
                  <li>• <strong>Счет</strong> - с автоматическими расчетами</li>
                  <li>• <strong>Письмо</strong> - email-рассылки</li>
                  <li>• <strong>Презентация</strong> - для встреч и питчей</li>
                  <li>• <strong>Логотип</strong> - несколько вариантов дизайна</li>
                  <li>• <strong>Карточка товара</strong> - для маркетплейсов</li>
                </ul>
                <p class="text-xs text-gray-500">💡 Каждый тип имеет свой промпт и структуру</p>
              </div>
            `,
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="mode-switcher"]',
          popover: {
            title: '🎯 Два режима работы',
            description: `
              <div class="text-sm space-y-2">
                <div>
                  <div class="font-semibold mb-1">📋 Plan (Планирование):</div>
                  <ul class="ml-4 text-xs space-y-0.5">
                    <li>• Детальное обсуждение с AI</li>
                    <li>• AI задает уточняющие вопросы</li>
                    <li>• Выбор конкретных параметров</li>
                    <li>• Лучший результат для сложных задач</li>
                  </ul>
                </div>
                <div>
                  <div class="font-semibold mb-1">⚡ Build (Быстрая генерация):</div>
                  <ul class="ml-4 text-xs space-y-0.5">
                    <li>• Мгновенное создание</li>
                    <li>• Без лишних вопросов</li>
                    <li>• Можно редактировать после</li>
                    <li>• Для типовых документов</li>
                  </ul>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 Новичкам рекомендуем начать с Plan</p>
              </div>
            `,
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="app-mode"]',
          popover: {
            title: '⚡ Выберите уровень качества',
            description: `
              <div class="text-sm space-y-2">
                <div>
                  <div class="font-semibold mb-1">🆓 Бесплатный:</div>
                  <ul class="ml-4 text-xs">
                    <li>• Базовая генерация текста</li>
                    <li>• Без AI изображений</li>
                  </ul>
                </div>
                <div>
                  <div class="font-semibold mb-1">🚀 Продвинутый (рекомендуем):</div>
                  <ul class="ml-4 text-xs">
                    <li>• Генерация AI изображений</li>
                    <li>• Анализ загруженных фото</li>
                    <li>• Парсинг сайтов</li>
                  </ul>
                </div>
                <div>
                  <div class="font-semibold mb-1">💎 PRO:</div>
                  <ul class="ml-4 text-xs">
                    <li>• Максимальное качество</li>
                    <li>• HD изображения</li>
                    <li>• Анализ видео</li>
                  </ul>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 Попробуйте Продвинутый режим!</p>
              </div>
            `,
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="chat-input"]',
          popover: {
            title: '💬 Просто опишите что нужно',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2">Примеры команд:</p>
                <div class="space-y-1 mb-2 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                  <div>📄 "Создай КП для кафе 'Бодрое Утро'"</div>
                  <div>📊 "Сделай презентацию про огурцы"</div>
                  <div>🎨 "Создай 5 вариантов логотипа"</div>
                  <div>📄 "Счет с 5 изображениями клубники"</div>
                  <div>✉️ "Письмо о новой акции со скидкой 20%"</div>
                </div>
                <p class="text-xs text-gray-500 mb-1">💡 Укажите количество изображений!</p>
                <p class="text-xs text-gray-400">⌨️ Enter - отправить, Shift+Enter - новая строка</p>
              </div>
            `,
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="file-upload"]',
          popover: {
            title: '📤 Загружайте свои файлы',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2">Что можно загрузить:</p>
                <div>
                  <div class="font-semibold mb-1">🖼️ Изображения:</div>
                  <ul class="ml-4 text-xs">
                    <li>• Логотипы компании</li>
                    <li>• Фото товаров</li>
                    <li>• Референсы для дизайна</li>
                    <li>• AI проанализирует и использует</li>
                  </ul>
                </div>
                <div>
                  <div class="font-semibold mb-1">🎥 Видео (только PRO):</div>
                  <ul class="ml-4 text-xs">
                    <li>• Обзоры продуктов</li>
                    <li>• AI извлечет ключевые моменты</li>
                  </ul>
                </div>
                <p class="text-xs text-gray-500 mt-2">📋 Форматы: JPG, PNG, GIF, WebP, MP4</p>
              </div>
            `,
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '[data-tour="website-parse"]',
          popover: {
            title: '🌐 Парсинг сайтов',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2">Вставьте ссылку на любой сайт:</p>
                <div class="space-y-1 mb-2">
                  <div>🏢 <strong>Сайт компании клиента</strong></div>
                  <div class="text-xs ml-4">→ AI извлечет название, описание, услуги</div>
                  <div>🛍️ <strong>Страница товара</strong></div>
                  <div class="text-xs ml-4">→ AI заполнит карточку автоматически</div>
                  <div>💼 <strong>Страница "О компании"</strong></div>
                  <div class="text-xs ml-4">→ AI узнает о бизнесе клиента</div>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 Доступно с Продвинутого режима!</p>
              </div>
            `,
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '[data-tour="preview"]',
          popover: {
            title: '👁️ Предпросмотр результата',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2">Здесь отображается ваш документ:</p>
                <div>
                  <div class="font-semibold mb-1">✏️ Редактирование:</div>
                  <ul class="ml-4 text-xs">
                    <li>• "Измени заголовок"</li>
                    <li>• "Добавь раздел с ценами"</li>
                    <li>• "Поменяй цвет на синий"</li>
                    <li>• AI помнит контекст!</li>
                  </ul>
                </div>
                <div>
                  <div class="font-semibold mb-1">💾 Сохранение:</div>
                  <ul class="ml-4 text-xs">
                    <li>• Выберите формат (PDF, DOCX, PNG)</li>
                    <li>• Или сохраните все в ZIP</li>
                  </ul>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 Редактируйте сколько угодно!</p>
              </div>
            `,
            side: 'left',
            align: 'center',
          },
        },
        {
          popover: {
            title: '🎉 Готово! Теперь вы знаете основы',
            description: `
              <div class="text-sm space-y-2">
                <div>
                  <strong>1️⃣ Чем детальнее промпт - тем лучше результат</strong>
                  <div class="text-xs text-gray-600 ml-4 mt-1">
                    <div>"Создай КП" ❌</div>
                    <div>"Создай КП для кафе с меню завтраков, 3 фото блюд" ✅</div>
                  </div>
                </div>
                <div>
                  <strong>2️⃣ Используйте Plan для первого документа</strong>
                  <div class="text-xs text-gray-600 ml-4">AI задаст правильные вопросы</div>
                </div>
                <div>
                  <strong>3️⃣ Загружайте логотип компании</strong>
                  <div class="text-xs text-gray-600 ml-4">Он автоматически вставится в документ</div>
                </div>
                <div>
                  <strong>4️⃣ AI помнит контекст разговора</strong>
                  <div class="text-xs text-gray-600 ml-4">"Измени это", "Добавь туда" - поймет!</div>
                </div>
                <div>
                  <strong>5️⃣ Укажите количество изображений</strong>
                  <div class="text-xs text-gray-600 ml-4">"с 5 картинками", "7 вариантов лого"</div>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 Если застряли - нажмите "🎓 Показать тур заново"</p>
                <p class="text-base font-semibold text-center mt-3">Удачи в создании документов! 🚀</p>
              </div>
            `,
          },
        },
      ],
    })

    driverRef.current = driverObj
    
    const timer = setTimeout(() => {
      driverObj.drive()
    }, 1500)

    return () => {
      clearTimeout(timer)
      if (driverRef.current) {
        driverRef.current.destroy()
      }
    }
  }, [])

  return null
}
