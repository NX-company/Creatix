'use client'

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'nx_studio_tour_completed'

export default function OnboardingTour() {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  
  useEffect(() => {
    // Check if this is first time from welcome page
    const forceShowTour = sessionStorage.getItem('show_onboarding_tour')
    if (forceShowTour) {
      sessionStorage.removeItem('show_onboarding_tour')
      localStorage.removeItem(TOUR_KEY) // Force show tour
    }
    
    const completed = localStorage.getItem(TOUR_KEY)
    if (completed) return

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Далее →',
      prevBtnText: '← Назад',
      doneBtnText: 'Готово! 🚀',
      progressText: '{{current}} из {{total}}',
      
      smoothScroll: true,
      animate: true,
      
      popoverClass: 'creatix-tour-popover',
      overlayOpacity: 0.5,
      stagePadding: 8,
      allowClose: true,
      disableActiveInteraction: false,
      
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, 'true')
        driverObj.destroy()
      },
      
      steps: [
        {
          popover: {
            title: '👋 Добро пожаловать в Creatix!',
            description: `
              <div class="space-y-3">
                <p class="text-base font-semibold text-purple-600 mb-2">🎨 Мы создаем ДИЗАЙНЫ документов с помощью AI</p>
                <p class="text-sm text-gray-700 mb-2">Не просто текст, а готовый красивый дизайн с версткой, изображениями и стилем:</p>
                <div class="text-sm space-y-1 mb-2 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
                  <div>✨ Коммерческие предложения</div>
                  <div>📄 Счета и договоры</div>
                  <div>📊 Презентации</div>
                  <div>✉️ Email-рассылки</div>
                  <div>🎨 Логотипы и бренды</div>
                  <div>🛍️ Карточки товаров</div>
                </div>
                <p class="text-sm font-medium text-green-600">→ Готовый дизайн за 30 секунд!</p>
                <p class="text-xs text-gray-500 mt-2">Экскурсия займет 1 минуту</p>
              </div>
            `,
          },
        },
        {
          popover: {
            title: '📄 Шаг 1: Выберите тип дизайна',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2 font-medium">В левом меню выберите что создать:</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>📄 КП</div>
                  <div>📊 Презентация</div>
                  <div>✉️ Письмо</div>
                  <div>🎨 Логотип</div>
                </div>
                <p class="text-xs text-purple-600 mt-2">💡 Каждый тип имеет свой стиль и структуру</p>
                <p class="text-xs text-gray-500 mt-2">Нажмите на категорию чтобы увидеть типы документов</p>
              </div>
            `,
          },
        },
        {
          element: '[data-tour="mode-switcher"]',
          popover: {
            title: '🎯 Шаг 2: Режим работы',
            description: `
              <div class="text-sm space-y-2">
                <div class="bg-blue-50 p-2 rounded">
                  <div class="font-semibold text-sm mb-1">📋 Plan - Планирование</div>
                  <p class="text-xs">AI задаст вопросы для идеального результата</p>
                </div>
                <div class="bg-green-50 p-2 rounded">
                  <div class="font-semibold text-sm mb-1">⚡ Build - Мгновенно</div>
                  <p class="text-xs">Создание дизайна за 30 секунд без вопросов</p>
                </div>
                <p class="text-xs text-purple-600 mt-2">💡 Новичкам рекомендуем Plan</p>
              </div>
            `,
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="chat-input"]',
          popover: {
            title: '💬 Шаг 3: Опишите что нужно',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2 font-medium">Просто напишите задачу:</p>
                <div class="space-y-1 bg-gray-50 p-2 rounded text-xs">
                  <div>📄 "КП для кафе с 3 фото блюд"</div>
                  <div>📊 "Презентация про огурцы на 5 слайдов"</div>
                  <div>🎨 "Логотип для строительной компании"</div>
                </div>
                <p class="text-xs text-green-600 mt-2">✨ AI сгенерирует готовый дизайн!</p>
                <p class="text-xs text-gray-400">⌨️ Enter - отправить | Shift+Enter - новая строка</p>
              </div>
            `,
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-tour="chat-input"]',
          popover: {
            title: '🎯 Шаг 4: Точечное редактирование',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2 font-medium">Кнопка с прицелом справа от отправки:</p>
                <div class="bg-orange-50 p-2 rounded space-y-2">
                  <div class="font-semibold text-sm">🎯 Как использовать:</div>
                  <ol class="text-xs space-y-1 ml-4 list-decimal">
                    <li>Нажмите кнопку с прицелом 🎯</li>
                    <li>Кликните на элемент в дизайне справа</li>
                    <li>Напишите что изменить именно в нем</li>
                  </ol>
                </div>
                <div class="text-xs bg-green-50 p-2 rounded">
                  <strong>Примеры:</strong>
                  <div class="mt-1 space-y-0.5">
                    <div>• "Измени заголовок"</div>
                    <div>• "Добавь картинку сюда"</div>
                    <div>• "Поменяй цвет на красный"</div>
                  </div>
                </div>
                <p class="text-xs text-purple-600 font-medium mt-2">💡 AI точно поймет КУДА вносить изменения!</p>
              </div>
            `,
            side: 'top',
            align: 'end',
          },
        },
        {
          element: '[data-tour="preview"]',
          popover: {
            title: '👁️ Шаг 5: Дизайн готов!',
            description: `
              <div class="text-sm space-y-2">
                <p class="mb-2 font-medium">Здесь ваш готовый дизайн:</p>
                <div class="bg-purple-50 p-2 rounded">
                  <div class="font-semibold text-sm mb-1">✏️ Редактируйте</div>
                  <p class="text-xs">"Измени заголовок", "Добавь раздел с ценами"</p>
                </div>
                <div class="bg-blue-50 p-2 rounded">
                  <div class="font-semibold text-sm mb-1">💾 Скачивайте</div>
                  <p class="text-xs">PDF, DOCX, PNG, HTML - любой формат</p>
                </div>
                <p class="text-xs text-green-600 mt-2">✨ AI помнит контекст разговора!</p>
              </div>
            `,
            side: 'left',
            align: 'center',
          },
        },
        {
          popover: {
            title: '🎉 Готово! Создавайте дизайны',
            description: `
              <div class="text-sm space-y-3">
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg space-y-2">
                  <div class="flex items-start gap-2">
                    <span class="text-lg">💡</span>
                    <div>
                      <strong class="text-sm">Детальнее = Лучше</strong>
                      <p class="text-xs text-gray-600">"КП для кафе с 3 фото блюд" ✅</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="text-lg">🎯</span>
                    <div>
                      <strong class="text-sm">Кнопка выделения области</strong>
                      <p class="text-xs text-gray-600">Для точного редактирования элементов</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="text-lg">📋</span>
                    <div>
                      <strong class="text-sm">Plan для новичков</strong>
                      <p class="text-xs text-gray-600">AI задаст нужные вопросы</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="text-lg">✨</span>
                    <div>
                      <strong class="text-sm">AI помнит контекст</strong>
                      <p class="text-xs text-gray-600">"Измени это", "Добавь туда"</p>
                    </div>
                  </div>
                </div>
                <p class="text-base font-bold text-center text-purple-600 mt-3">Создавайте красивые дизайны! 🚀</p>
                <p class="text-xs text-gray-500 text-center">Повторить тур можно в любой момент</p>
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
