import { PROMPTS, type PromptConfig } from './prompts'
import { getDocTypePrompt } from './docTypePrompts'
import type { DocType } from './store'
import { fetchWithTimeout } from './fetchWithTimeout'
import { API_TIMEOUTS } from './constants'
import { getModernDesignPrompt } from './designPrompts'

function getStructureTemplate(docType: string): string {
  const templates: Record<string, string> = {
    proposal: `
1. HERO секция (padding: 80px 0):
   - H1 заголовок с ключевой выгодой (48px, жирный)
   - Подзаголовок (20px, line-height: 1.6)
   - CTA кнопка (padding: 20px 50px, primary color)
   
2. ПРОБЛЕМА секция (padding: 80px 0, background: rgba(secondary, 0.05)):
   - H2 "Знакомая ситуация?" (36px)
   - 2-3 абзаца с описанием боли (18px, margin-bottom: 20px)
   - Иконка warning (опционально)
   
3. РЕШЕНИЕ секция (padding: 80px 0):
   - H2 "Как мы решаем эту проблему" (36px, margin-bottom: 40px)
   - Grid 2×2 карточек (gap: 30px):
     * padding: 30px
     * border-radius: 12px
     * box-shadow: 0 4px 20px rgba(0,0,0,0.08)
     * H3 заголовок (24px)
     * Описание (16px)
     
4. ЧТО ВХОДИТ секция (padding: 80px 0):
   - H2 заголовок (36px)
   - Список с галочками (✓) или таблица
   - padding-left: 30px для списка
   
5. ЦЕНЫ секция (padding: 80px 0, background: linear-gradient):
   - H2 "Стоимость" (36px, white)
   - Таблица цен с границами
   - Итого: font-size: 24px, font-weight: 700
   
6. ПРЕИМУЩЕСТВА (padding: 80px 0):
   - H2 "Почему мы?" (36px)
   - Flex/Grid 3 колонки (gap: 30px)
   - Иконки + текст в карточках
   
7. КЕЙС (padding: 80px 0):
   - H2 "Кейс" (36px)
   - Карточка с результатами
   - Цифры крупно: font-size: 48px, color: primary
   
8. CTA финальный (padding: 80px 0, background: primary):
   - H2 белым цветом
   - Кнопка контрастная
   - Дедлайн/срочность
   
9. FOOTER (padding: 40px 0, background: #f8f8f8):
   - Контакты + юр.информация (14px)`,

    invoice: `
⚠️ ВАЖНО: Счет должен быть оптимизирован для ПЕЧАТИ на A4 (210×297mm)!

ОБЩИЕ ТРЕБОВАНИЯ:
- max-width: 800px (оптимально для A4)
- padding страницы: 30px (не 80px!)
- Компактная верстка, минимум пустого пространства
- Все в одну колонку для мобильных
- Шрифт: 14-16px для основного текста, 12px для мелкого

1. HEADER (padding: 20px 0, border-bottom: 2px solid primary):
   - Flex: logo слева (max-width: 120px) + правая часть (text-align: right)
   - Справа: 
     * "СЧЁТ НА ОПЛАТУ №[номер]" (font-size: 24px, font-weight: 700, color: primary)
     * Дата выставления (font-size: 14px, color: #666)
   
2. РЕКВИЗИТЫ (padding: 25px 0):
   - Два блока друг под другом (НЕ grid на две колонки!)
   - Каждый блок: border: 1px solid #ddd, padding: 15px, margin-bottom: 15px
   
   Блок "Поставщик (Исполнитель)":
   - H3: font-size: 14px, font-weight: 700, margin-bottom: 10px, color: primary
   - Список реквизитов: font-size: 13px, line-height: 1.6
   - Поля: Название компании, ИНН, КПП, Адрес, Телефон, Email
   
   Блок "Покупатель (Заказчик)":
   - Аналогичная структура
   
3. ТАБЛИЦА ПОЗИЦИЙ (margin: 25px 0):
   - table: width: 100%, border-collapse: collapse, font-size: 14px
   - thead: background: primary (не градиент!), color: white
   - Колонки: №, Наименование, Кол-во, Ед., Цена, Сумма
   - th: padding: 12px 10px, text-align: left, font-weight: 600
   - td: padding: 12px 10px, border: 1px solid #e0e0e0
   - Числа (кол-во, цена, сумма): text-align: right, font-family: monospace
   - Чередующиеся строки tbody tr:nth-child(even): background: #f9f9f9
   
4. ИТОГО (margin: 20px 0, padding: 15px, background: #f5f5f5, border: 1px solid #ddd):
   - Выравнивание справа (text-align: right)
   - Строки:
     * Сумма без НДС: font-size: 14px
     * НДС 20%: font-size: 14px
     * ИТОГО К ОПЛАТЕ: font-size: 18px, font-weight: 700, color: primary, margin-top: 8px, border-top: 2px solid primary, padding-top: 8px
   
5. УСЛОВИЯ ОПЛАТЫ (padding: 20px, border: 1px solid primary, margin: 25px 0):
   - H3 "Условия оплаты" (font-size: 16px, font-weight: 700, margin-bottom: 12px, color: primary)
   - Текст: font-size: 13px, line-height: 1.6
   - Банковские реквизиты списком
   - Срок оплаты
   
6. ПОДПИСИ (padding: 30px 0, border-top: 1px solid #ddd):
   - Grid 2 колонки (gap: 40px)
   - Каждая: 
     * Заголовок "Руководитель" / "Главный бухгалтер" (font-size: 12px, color: #666)
     * Линия для подписи: border-bottom: 1px solid #333, margin: 20px 0, min-width: 200px
     * "Печать М.П." в правом блоке
   
7. FOOTER (padding: 15px 0, border-top: 1px solid #eee):
   - Мелкий текст (font-size: 11px, color: #888, text-align: center)
   - "Документ составлен в электронной форме и действителен без печати и подписи"

⚠️ КРИТИЧНО для счета:
- НЕ используй padding: 80px 0 (слишком много!)
- НЕ используй box-shadow: 0 4px 20px (счет для печати!)
- НЕ используй border-radius: 12px (официальный документ!)
- Используй простые, четкие границы
- Все числа выравнивай справа
- Монохромная схема (primary цвет только для акцентов)
- Оптимизация для печати: @media print правила!`,

    logo: `
1. HEADER (padding: 40px 0, text-align: center):
   - H1 "Варианты логотипов для [Company]" (48px)
   - Подзаголовок с датой
   
2. ГАЛЕРЕЯ ЛОГОТИПОВ (padding: 60px 0):
   - Grid 2-3 колонки (gap: 40px)
   - Каждая карточка:
     * padding: 40px
     * border: 2px solid #e0e0e0
     * border-radius: 12px
     * box-shadow: 0 4px 20px rgba(0,0,0,0.08)
     * IMAGE_X: max-width: 300px, margin: 0 auto
     * H3 название стиля (22px, margin-top: 20px)
     * Описание: 14px, color: #888
     * Hover: box-shadow: 0 8px 30px rgba(0,0,0,0.15), transform: translateY(-5px)
   
3. DOWNLOAD секция (padding: 40px 0, text-align: center):
   - Кнопки "Скачать SVG", "Скачать PNG" под каждым
   - padding: 12px 30px, border-radius: 6px
   
4. FOOTER (padding: 30px 0):
   - Контакты дизайнера`,

    presentation: `
1. TITLE SLIDE (height: 100vh, display: flex, align-items: center):
   - Background: linear-gradient(primary → secondary)
   - H1 заголовок (64px, white, text-align: center)
   - Subtitle (24px, white)
   - IMAGE_0 как логотип (max-width: 200px)
   
2. СЛАЙДЫ КОНТЕНТА (padding: 80px 40px, min-height: 80vh):
   - Каждый слайд = отдельная <section>
   - H2 заголовок слайда (40px, color: primary)
   - Flex: текст слева (60%) + IMAGE_X справа (40%)
   - Чередуй: четные слайды - image слева
   - Списки: крупные маркеры, 20px шрифт
   
3. СТАТИСТИКА СЛАЙД (если есть цифры):
   - Grid 3 колонки
   - Цифры: 64px, font-weight: 700, color: primary
   - Описание под цифрой: 16px
   
4. ФИНАЛЬНЫЙ CTA СЛАЙД:
   - Background: primary
   - H2 призыв (48px, white)
   - Кнопка контакта (padding: 20px 50px)
   - Контакты крупно (24px)`,

    email: `
1. HEADER (padding: 30px, background: rgba(primary, 0.05)):
   - IMAGE_0 как логотип (max-width: 150px)
   - Название компании рядом (24px)
   
2. GREETING (padding: 40px 30px):
   - "Здравствуйте, [Name]!" (20px)
   - Вводный абзац (18px, line-height: 1.7)
   
3. ОСНОВНОЙ КОНТЕНТ (padding: 0 30px 40px):
   - Абзацы с отступами (margin-bottom: 25px)
   - IMAGE_1+ где упоминается продукт:
     * max-width: 100%
     * border-radius: 8px
     * margin: 30px 0
   - Списки преимуществ с иконками
   
4. CTA КНОПКА (padding: 40px 30px, text-align: center):
   - Крупная кнопка (padding: 18px 40px)
   - Background: primary
   - Hover эффект
   
5. FOOTER (padding: 30px, background: #f8f8f8, border-top: 3px solid primary):
   - Подпись (16px)
   - Контакты (14px)
   - Ссылка отписаться (12px, color: #888)`,

    'product-card': `
1. ГЛАВНОЕ ИЗОБРАЖЕНИЕ (margin-bottom: 40px):
   - IMAGE_0: width: 100%, max-width: 600px, margin: 0 auto
   - border-radius: 12px
   - box-shadow: 0 8px 30px rgba(0,0,0,0.12)
   
2. ЗАГОЛОВОК + ЦЕНА (padding: 40px 0):
   - H1 название товара (48px, margin-bottom: 15px)
   - Цена в блоке:
     * background: linear-gradient(135deg, primary, secondary)
     * color: white
     * font-size: 36px
     * font-weight: 700
     * padding: 20px 30px
     * border-radius: 12px
     * display: inline-block
   - Старая цена зачеркнута (если есть): 24px, opacity: 0.7
   
3. ОПИСАНИЕ (padding: 40px 0):
   - H2 "Описание" (32px, margin-bottom: 20px)
   - Абзацы (18px, line-height: 1.7, margin-bottom: 20px)
   
4. ХАРАКТЕРИСТИКИ (padding: 40px 0):
   - H2 "Характеристики" (32px)
   - Список с отступами (padding-left: 25px)
   - Каждый пункт: 18px, margin-bottom: 15px
   - Иконки галочек/звездочек
   
5. ПРЕИМУЩЕСТВА (padding: 40px 0):
   - H2 "Преимущества" (32px)
   - Grid 2 колонки (gap: 25px)
   - Карточки:
     * padding: 25px
     * border: 2px solid primary
     * border-radius: 12px
     * H3: 22px, color: primary
     
6. ГАЛЕРЕЯ ДОПОЛНИТЕЛЬНЫХ ФОТО (padding: 40px 0):
   - Grid 2 колонки (gap: 20px)
   - IMAGE_1, IMAGE_2, IMAGE_3...:
     * width: 100%
     * border-radius: 8px
     * box-shadow: 0 4px 15px rgba(0,0,0,0.1)
     
7. CTA секция (padding: 60px 0, background: rgba(primary, 0.05)):
   - H2 "Готовы заказать?" (36px)
   - Кнопка "Купить" (padding: 20px 60px, font-size: 20px)
   - Контакты под кнопкой`,

    'business-card': `
⚠️ ВАЖНО: Визитка должна быть в СТАНДАРТНОМ ФОРМАТЕ 90×50mm (850×500px для качественной печати)!

ОБЩИЕ ТРЕБОВАНИЯ:
- Размер контейнера: 850px × 500px (width × height)
- Две карточки (лицевая и обратная сторона) рядом друг с другом
- Каждая карточка: border: 2px solid #e0e0e0, border-radius: 8px
- Современный, минималистичный дизайн
- Максимум 2-3 цвета
- Шрифты: 1-2 семейства (основной + акцентный)
- Минимум текста: только самое важное!

СТРУКТУРА:

1. КОНТЕЙНЕР ОБЕИХ СТОРОН (display: flex, gap: 40px, justify-content: center):
   - Две карточки по 850×500px каждая
   - padding-контейнера: 60px

2. ЛИЦЕВАЯ СТОРОНА (850×500px, position: relative):
   - Background: чистый цвет или тонкий градиент (primary → lighten(primary, 10%))
   - padding: 50px
   - display: flex, flex-direction: column, justify-content: space-between
   
   ВЕРХНЯЯ ЧАСТЬ:
   - Логотип или инициалы (если IMAGE_0):
     * max-width: 120px
     * margin-bottom: 30px
   - ИЛИ текстовый логотип: font-size: 32px, font-weight: 700, letter-spacing: 2px
   
   ЦЕНТРАЛЬНАЯ ЧАСТЬ:
   - ФИО / Название компании:
     * font-size: 28px
     * font-weight: 700
     * margin-bottom: 10px
     * color: white (если темный фон) или primary
   - Должность:
     * font-size: 16px
     * font-weight: 400
     * opacity: 0.9
     * letter-spacing: 1px
     * text-transform: uppercase
   
   НИЖНЯЯ ЧАСТЬ:
   - Минимум инфо (например, только сайт или одна контактная линия)
   - font-size: 14px
   - opacity: 0.8

3. ОБРАТНАЯ СТОРОНА (850×500px):
   - Background: white или очень светлый оттенок
   - padding: 50px
   - display: flex, flex-direction: column, justify-content: center
   - border: 1px solid #e0e0e0 (легкая граница)
   
   БЛОК КОНТАКТОВ (выровнять по центру вертикально):
   - H3 "Контакты" (font-size: 18px, font-weight: 600, margin-bottom: 25px, color: primary)
   - Список контактов (font-size: 15px, line-height: 2):
     * Телефон: +7 (XXX) XXX-XX-XX
     * Email: email@company.com
     * Сайт: www.company.com
     * Адрес (опционально)
   - Каждая строка:
     * display: flex, align-items: center, gap: 12px
     * Иконка слева (width: 20px, height: 20px, color: primary)
     * Текст справа
   
   НИЖНИЙ БЛОК (опционально):
   - QR-код (если IMAGE_1):
     * max-width: 100px
     * margin-top: 30px
     * opacity: 0.8
   - Или дополнительная информация мелким шрифтом (12px, color: #888)

⚠️ КРИТИЧНО для визитки:
- НЕ перегружай информацией! Визитка - это не резюме
- Минимум 10pt шрифт (для печати)
- Не используй больше 3 цветов
- Много воздуха (white space) - это хорошо!
- Лицевая сторона = запоминающийся образ
- Обратная сторона = практичная информация
- Обе карточки должны гармонировать по стилю
- Если есть IMAGE_0 - это логотип для лицевой стороны
- Если есть IMAGE_1 - это QR-код для обратной стороны
- Используй тонкие линии-разделители при необходимости (border-top: 1px solid rgba(primary, 0.2))`
  }

  return templates[docType] || templates.proposal
}

export const generateContent = async (prompt: string, docType: string, model: string = "google/gemini-2.5-flash-lite"): Promise<string> => {
  try {
    const systemPrompt = getSystemPrompt(docType)
    
    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt + "\n\nВАЖНО: Возвращай ТОЛЬКО чистый JSON без текста до или после. Не добавляй объяснения." },
          { role: "user", content: prompt }
        ],
        model: model,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    let content = data.content || "Ошибка генерации контента"
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return content
  } catch (error) {
    console.error('API Error:', error)
    return `Ошибка API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
  }
}

export const generateContentWithImages = async (
  prompt: string,
  docType: string,
  images: Array<{ id: string; name: string; base64: string; type: string }> = [],
  model: string = "google/gemini-2.0-flash-001"
): Promise<string> => {
  try {
    const systemPrompt = getSystemPrompt(docType)
    
    if (images.length === 0) {
      return generateContent(prompt, docType, model)
    }

    console.log(`🔍 Multimodal generation with ${images.length} images using ${model}`)

    const content: any[] = [
      {
        type: "text",
        text: prompt
      }
    ]

    images.forEach((img, i) => {
      content.push({
        type: "image_url",
        image_url: {
          url: img.base64
        }
      })
    })

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt + "\n\nВАЖНО: Возвращай ТОЛЬКО чистый JSON без текста до или после. Не добавляй объяснения." },
          { role: "user", content: content }
        ],
        model: model,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    let result = data.content || "Ошибка генерации контента"
    
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    console.log(`✅ Multimodal generation complete`)
    
    return result
  } catch (error) {
    console.error('Multimodal API Error:', error)
    console.log('⚠️  Falling back to text-only generation')
    return generateContent(prompt, docType, model)
  }
}

export const generateHTML = async (
  content: string,
  docType: string,
  styleConfig: any,
  uploadedImages: Array<{ id: string; name: string; base64: string; type: string }> = [],
  model: string = "google/gemini-2.5-flash-lite"
): Promise<string> => {
  try {
    console.log(`🏗️  HTML Composer: Using model ${model}`)
    console.log(`   Images to include: ${uploadedImages.length}`)
    
    if (uploadedImages.length > 0) {
      uploadedImages.forEach((img, i) => {
        console.log(`      ${i}. ${img.name} (id: ${img.id})`)
      })
    }
    
    // НЕ отправляем base64 в промпт - только названия файлов
    const imagesInfo = uploadedImages.length > 0
      ? `\n\n📸 ЗАГРУЖЕННЫЕ ИЗОБРАЖЕНИЯ (${uploadedImages.length} шт):
${uploadedImages.map((img, i) => `${i + 1}. "${img.name}" → используй placeholder IMAGE_${i}`).join('\n')}

🎯 ПРАВИЛА РАЗМЕЩЕНИЯ ИЗОБРАЖЕНИЙ:

⚠️ КРИТИЧЕСКИ ВАЖНО: ИСПОЛЬЗУЙ ВСЕ ИЗОБРАЖЕНИЯ (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4, IMAGE_5... и так далее)!

Для КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ (proposal):
- IMAGE_0: ЛОГОТИП КОМПАНИИ в шапке документа (вверху справа или по центру, max-width: 180px)
- IMAGE_1+: Все остальные изображения размести в тексте: главная иллюстрация, примеры работ, портфолио, команда
- Распределяй изображения равномерно по разделам документа
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3...)

Для СЧЁТА (invoice):
- IMAGE_0: ЛОГОТИП КОМПАНИИ в верхней части счёта (справа в шапке, max-width: 150px)
- IMAGE_1+: ИЗОБРАЖЕНИЯ ТОВАРОВ/УСЛУГ - размести в таблице позиций рядом с соответствующими товарами (max-width: 80px, вертикальное выравнивание)
- Если товаров больше чем изображений - используй изображения по кругу или оставь некоторые строки без картинок
- Если изображений больше чем товаров - вставь все изображения в компактную галерею под таблицей
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для ПИСЬМА (email):
- IMAGE_0: Логотип в шапке письма (слева или по центру, max-width: 160px)
- IMAGE_1+: Все остальные изображения размести по тексту письма где упоминается продукт/услуга
- Распределяй изображения равномерно, чередуй с текстом
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3...)

Для ПРЕЗЕНТАЦИИ (presentation):
- IMAGE_0: На титульном слайде (как логотип или главное фото, max-width: 300px)
- IMAGE_1+: Распределить все остальные изображения по слайдам равномерно (на каждом слайде максимум 1 изображение)
- Создай столько слайдов, сколько нужно, чтобы использовать ВСЕ изображения
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для ЛОГОТИПА (logo):
- Используй ВСЕ загруженные изображения как варианты логотипа
- Покажи их в сетке (2-3 колонки) для сравнения
- Каждый вариант должен быть одинакового размера (max-width: 300px)
- Если вариантов много (5+) - сделай адаптивную сетку
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для КАРТОЧКИ ТОВАРА (product-card):
- IMAGE_0: Главное изображение товара (большое, max-width: 100%, центрирование)
- IMAGE_1+: Все остальные изображения в галерею под главным фото (max-width: 48% для каждого, сетка 2 колонки)
- Если изображений много - сделай прокручиваемую галерею
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения (IMAGE_0, IMAGE_1, IMAGE_2, IMAGE_3, IMAGE_4...)

Для ВИЗИТКИ (business-card):
- IMAGE_0: ЛОГОТИП на лицевой стороне визитки (max-width: 120px, в верхней части)
- IMAGE_1: QR-КОД на обратной стороне визитки (max-width: 100px, в нижней части обратной стороны)
- Если есть больше изображений - игнорируй их (визитка содержит максимум 2 изображения)
- Лицевая сторона: минималистичный дизайн с логотипом, ФИО и должностью
- Обратная сторона: контактная информация с иконками + QR-код внизу

📝 КАК ВСТАВЛЯТЬ:
<img src="IMAGE_0" alt="${uploadedImages[0]?.name || 'Изображение'}" style="max-width: 200px; height: auto;" />

⚠️ КРИТИЧЕСКИ ВАЖНО:
- НЕ ВСТАВЛЯЙ base64 данные изображений! Используй ТОЛЬКО текстовые плейсхолдеры IMAGE_0, IMAGE_1, IMAGE_2 и т.д.
- Плейсхолдер должен быть точно таким: <img src="IMAGE_0" ... /> без префикса data:image
- ОБЯЗАТЕЛЬНО используй ВСЕ загруженные изображения
- Размещай их логично по контексту документа
- Добавляй CSS стили для красивого отображения (border-radius, box-shadow, etc.)
- Для логотипов: max-width 150-200px, для иллюстраций: max-width 100%`
      : ''
    
    const modernDesign = getModernDesignPrompt(docType as any, styleConfig)
    
    const prompt = `
🎯 ЗАДАЧА: Создай ПОЛНЫЙ, ПРОФЕССИОНАЛЬНЫЙ HTML документ с идеальной типографикой, spacing и структурой.

📄 КОНТЕНТ (используй ТОЛЬКО его, не добавляй лишнего):
${content}

🎨 ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ СТИЛЯ:
Тип документа: ${docType}
Primary Color: ${styleConfig.primaryColor} (кнопки, заголовки, акценты, границы)
Secondary Color: ${styleConfig.secondaryColor} (градиенты, фоны)
Font: ${styleConfig.font}
${imagesInfo}

${modernDesign}

📐 СТРОГАЯ СИСТЕМА ОТСТУПОВ (ОБЯЗАТЕЛЬНО):

${docType === 'invoice' ? `
⚠️ СПЕЦИАЛЬНЫЕ ПРАВИЛА ДЛЯ СЧЁТА:
КОНТЕЙНЕРЫ:
- max-width: 800px; margin: 0 auto; padding: 30px (НЕ 80px!)

СЕКЦИИ:
- padding: 20-25px 0 (компактно для печати!)
- НЕ используй padding: 80px 0

КАРТОЧКИ/БЛОКИ:
- padding: 15px
- margin-bottom: 15px
- border: 1px solid #ddd (НЕ box-shadow!)
- border-radius: 0 (официальный документ!)

ТАБЛИЦЫ:
- padding ячеек: 12px 10px
- border: 1px solid #e0e0e0
- НЕ используй скругления!
` : docType === 'business-card' ? `
⚠️ СПЕЦИАЛЬНЫЕ ПРАВИЛА ДЛЯ ВИЗИТКИ:
КОНТЕЙНЕР:
- display: flex; justify-content: center; gap: 40px; padding: 60px
- background: #f5f5f5 (светлый фон вокруг карточек)

КАЖДАЯ КАРТОЧКА:
- width: 850px; height: 500px (ФИКСИРОВАННЫЙ размер!)
- border: 2px solid #e0e0e0
- border-radius: 8px
- box-shadow: 0 4px 15px rgba(0,0,0,0.1)

ЛИЦЕВАЯ СТОРОНА:
- padding: 50px
- display: flex; flex-direction: column; justify-content: space-between
- background: gradient или solid primary color

ОБРАТНАЯ СТОРОНА:
- padding: 50px
- display: flex; flex-direction: column; justify-content: center
- background: white
- border: 1px solid #e0e0e0
` : `
КОНТЕЙНЕРЫ:
- max-width: 1200px; margin: 0 auto; padding: 0 40px (desktop) / 0 20px (mobile)

СЕКЦИИ:
- padding: 80px 0 (между секциями на desktop)
- padding: 60px 20px (на mobile)
- background sections: padding: 60px 40px

КАРТОЧКИ/БЛОКИ:
- padding: 30px
- margin-bottom: 30px
- gap: 30px (для grid/flex)
- border-radius: 12px
- box-shadow: 0 4px 20px rgba(0,0,0,0.08)
`}

ТИПОГРАФИКА ОТСТУПЫ:
- H1: margin-bottom: 30px
- H2: margin-bottom: 25px
- H3: margin-bottom: 20px
- P: margin-bottom: 20px; line-height: 1.7
- Списки: margin-bottom: 15px между пунктами

КНОПКИ:
- padding: 16px 40px (обычные)
- padding: 20px 50px (CTA большие)
- margin-top: 30px
- border-radius: 8px
- font-weight: 600

🔤 ОБЯЗАТЕЛЬНАЯ ТИПОГРАФИКА:

${docType === 'invoice' ? `
⚠️ ТИПОГРАФИКА ДЛЯ СЧЁТА (оптимизирована для печати A4):
- H1 (номер счёта): font-size: 24px; font-weight: 700; color: primary
- H2: font-size: 18px; font-weight: 600; color: #1a1a1a
- H3: font-size: 14-16px; font-weight: 700; color: primary
- Body: font-size: 14px; font-weight: 400; line-height: 1.6; color: #333
- Small: font-size: 12px; color: #666
- Таблица: font-size: 14px
- Footer: font-size: 11px; color: #888

MOBILE (@media max-width: 768px):
- H1: 22px
- Body: 13px
- Таблица: 12px
` : docType === 'business-card' ? `
⚠️ ТИПОГРАФИКА ДЛЯ ВИЗИТКИ (оптимизирована для печати 90×50mm):

ЛИЦЕВАЯ СТОРОНА:
- ФИО/Название: font-size: 28px; font-weight: 700; letter-spacing: 0.5px
- Должность: font-size: 16px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase
- Логотип текстовый: font-size: 32px; font-weight: 700; letter-spacing: 2px
- Дополнительный текст: font-size: 14px; opacity: 0.8

ОБРАТНАЯ СТОРОНА:
- Заголовок "Контакты": font-size: 18px; font-weight: 600; color: primary
- Контактные данные: font-size: 15px; line-height: 2; color: #333
- Иконки: width: 20px; height: 20px; color: primary
- Мелкий текст: font-size: 12px; color: #888

⚠️ Минимальный размер шрифта: 10pt (14px) для читаемости при печати!
` : `
DESKTOP:
- H1: font-size: 48px; font-weight: 700; line-height: 1.2; color: #1a1a1a
- H2: font-size: 36px; font-weight: 600; line-height: 1.3; color: #1a1a1a
- H3: font-size: 28px; font-weight: 600; line-height: 1.4; color: #2a2a2a
- H4: font-size: 22px; font-weight: 600; line-height: 1.4
- Body: font-size: 18px; font-weight: 400; line-height: 1.7; color: #4a4a4a
- Small: font-size: 16px; color: #666666

MOBILE (@media max-width: 768px):
- H1: 40px
- H2: 30px
- H3: 24px
- Body: 16px
`}

📱 АДАПТИВНОСТЬ (ОБЯЗАТЕЛЬНО):

${docType === 'business-card' ? `
⚠️ ДЛЯ ВИЗИТКИ: НЕ ДЕЛАЙ АДАПТИВНОСТЬ!
- Визитка имеет фиксированный размер 850×500px
- НЕ используй @media queries для карточек
- На мобильных карточки могут уменьшаться пропорционально (transform: scale())
- Но внутренние размеры и шрифты остаются фиксированными
` : `
@media (max-width: 768px) {
  - Все шрифты ×0.85
  - padding секций ×0.75
  - Grid: 1 column
  - Flex: flex-direction: column
  - Кнопки: width: 100%; min-height: 48px
  - Изображения: width: 100%
}
`}

${docType === 'invoice' ? `
🖨️ ПРАВИЛА ДЛЯ ПЕЧАТИ (ОБЯЗАТЕЛЬНО для счёта):

@media print {
  @page {
    size: A4;
    margin: 15mm;
  }
  body {
    margin: 0;
    padding: 0;
  }
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
  header, footer {
    page-break-inside: avoid;
  }
  table {
    page-break-inside: avoid;
  }
  tr {
    page-break-inside: avoid;
  }
}
` : docType === 'business-card' ? `
🖨️ ПРАВИЛА ДЛЯ ПЕЧАТИ ВИЗИТКИ:

@media print {
  @page {
    size: 90mm 50mm;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
  }
  /* Печатать обе стороны отдельно */
  .business-card-front {
    page-break-after: always;
  }
}
` : ''}

🎨 ДИЗАЙН СИСТЕМА:

${docType === 'invoice' ? `
⚠️ ДЛЯ СЧЁТА (официальный документ):
BOX-SHADOW: НЕ ИСПОЛЬЗУЙ! (документ для печати)
BORDER-RADIUS: 0 (прямые углы!)
BORDERS: 1px solid #ddd или #e0e0e0 (четкие границы)
COLORS: Минимум цвета, primary только для акцентов
` : docType === 'business-card' ? `
⚠️ ДЛЯ ВИЗИТКИ (премиум дизайн):
BOX-SHADOW:
- Карточки: box-shadow: 0 4px 15px rgba(0,0,0,0.1) (мягкая тень)
- НЕ используй глубокие тени внутри карточки

BORDER-RADIUS:
- Карточки: 8px (мягкое скругление)
- Изображения (логотип): 4px или 0 (в зависимости от стиля)

ЦВЕТА:
- Максимум 2-3 цвета
- Лицевая сторона: primary цвет или градиент (но не яркий!)
- Обратная сторона: white или #fafafa
- Текст на темном: white или rgba(255,255,255,0.9)
- Акценты: primary цвет

BORDERS:
- Карточки: 2px solid #e0e0e0 (четкая граница)
- Разделители (если нужны): 1px solid rgba(primary, 0.2)
` : `
BOX-SHADOW:
- Карточки: box-shadow: 0 4px 20px rgba(0,0,0,0.08)
- Hover: box-shadow: 0 8px 30px rgba(0,0,0,0.12)
- Кнопки: box-shadow: 0 4px 12px rgba(primary, 0.25)

BORDER-RADIUS:
- Карточки/блоки: 12px
- Кнопки: 8px
- Изображения: 12px
- Малые элементы: 6px
`}

TRANSITIONS:
- Все интерактивные элементы: transition: all 0.3s ease

ЦВЕТА ТЕКСТА:
- Заголовки: #1a1a1a
- Основной текст: #4a4a4a
- Вторичный текст: #888888

ГРАДИЕНТЫ:
- Hero background: linear-gradient(135deg, ${styleConfig.primaryColor}, ${styleConfig.secondaryColor})
- Кнопки: linear-gradient(135deg, ${styleConfig.primaryColor}, lighten 10%)

🏗️ ОБЯЗАТЕЛЬНАЯ СТРУКТУРА для ${docType}:

${getStructureTemplate(docType)}

⚠️ КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
1. Полный HTML (<!DOCTYPE html> до </html>)
2. CSS в <style> в <head> + inline где нужно
3. Все отступы строго по системе выше
4. Все размеры шрифтов строго по типографике
5. Media queries для mobile обязательны
6. НИКОГДА не вставляй base64 - только IMAGE_0, IMAGE_1...
7. Используй ВСЕ указанные изображения
8. Цвета ТОЛЬКО из styleConfig
9. На русском языке
10. Проверь: отступы консистентны, типографика правильная, все изображения вставлены

СОЗДАЙ ДОКУМЕНТ С ИДЕАЛЬНЫМ SPACING И ТИПОГРАФИКОЙ!
`

    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: `Ты интеллектуальный эксперт по созданию HTML документов с глубоким пониманием контекста и дизайна.

🎯 ТВОЯ ЗАДАЧА:
- Понимать НАМЕРЕНИЯ пользователя и контекст документа
- Создавать ПОЛНЫЕ, валидные HTML документы с современным дизайном
- Использовать встроенные CSS стили (inline + <style>)
- Адаптивный дизайн для всех устройств

⚠️ КРИТИЧЕСКИ ВАЖНО ДЛЯ ИЗОБРАЖЕНИЙ:
- НИКОГДА не вставляй base64, data:image, или URL изображений
- Используй ТОЛЬКО текстовые плейсхолдеры: IMAGE_0, IMAGE_1, IMAGE_2 и т.д.
- Плейсхолдер должен быть ТОЧНО таким: <img src="IMAGE_0" alt="..." />
- НЕ ДОБАВЛЯЙ префикс data:image или любой другой префикс или слэш
- Просто IMAGE_0, IMAGE_1, IMAGE_2 в атрибуте src (без / в начале!)

ПРИМЕРЫ ПРАВИЛЬНЫХ ТЕГОВ:
✅ <img src="IMAGE_0" alt="Главное изображение" style="width: 100%;" />
✅ <img src="IMAGE_1" alt="Изображение 2" style="max-width: 300px;" />
✅ <img src="IMAGE_2" alt="Изображение 3" />

ПРИМЕРЫ НЕПРАВИЛЬНЫХ ТЕГОВ:
❌ <img src="/IMAGE_0" /> - НЕТ слэша в начале!
❌ <img src="./IMAGE_0" /> - НЕТ префикса!
❌ <img src="data:image/png;base64,..." />
❌ <img src="https://..." />
❌ <img src="" />
❌ НЕ используй пустые src

ОБЯЗАТЕЛЬНО ВСТАВЬ ВСЕ ПЛЕЙСХОЛДЕРЫ, КОТОРЫЕ УКАЗАНЫ В ПРОМПТЕ!

Ты создаешь документы, которые впечатляют!` },
          { role: "user", content: prompt }
        ],
        model: model,
        temperature: 0.7
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('HTML generation failed')
    }

    const data = await response.json()
    let html = data.content || "Ошибка генерации HTML"
    
    // Убираем markdown обертки
    html = html.replace(/```html\n?/gi, '')
    html = html.replace(/```\n?/g, '')
    
    // Убираем текст "html" в начале если он есть
    html = html.replace(/^html\s*/i, '')
    
    // Убираем пробелы и переносы в начале
    html = html.trim()
    
    // FALLBACK: Если Gemini не вставил IMAGE плейсхолдеры, вставляем их программно
    const expectedImageCount = uploadedImages.length
    if (expectedImageCount > 0) {
      // Проверяем, есть ли IMAGE_0, IMAGE_1 и т.д. в HTML
      const hasPlaceholders = /IMAGE_\d+/.test(html)
      
      if (!hasPlaceholders) {
        console.log(`⚠️  Gemini didn't insert IMAGE placeholders! Adding them manually...`)
        
        // Вставляем плейсхолдеры в HTML
        // Стратегия: ищем <body> и вставляем изображения после открывающего тега или в начало контента
        const bodyMatch = html.match(/<body[^>]*>/i)
        if (bodyMatch) {
          const insertIndex = bodyMatch.index! + bodyMatch[0].length
          
          // Создаем HTML для изображений в зависимости от типа документа
          let imageHTML = '<div style="margin: 20px 0; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">\n'
          for (let i = 0; i < expectedImageCount; i++) {
            imageHTML += `  <img src="IMAGE_${i}" alt="Image ${i + 1}" style="max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />\n`
          }
          imageHTML += '</div>\n'
          
          html = html.slice(0, insertIndex) + '\n' + imageHTML + html.slice(insertIndex)
          console.log(`✅ Manually inserted ${expectedImageCount} IMAGE placeholders`)
        }
      }
    }
    
    // ⚠️ ВАЖНО: НЕ заменяем placeholders здесь!
    // Вся логика замены IMAGE_X на base64 происходит в imageAgent.ts:replaceImagePlaceholders()
    // Там есть проверка всех вариантов placeholders и финальная очистка битых IMAGE_*
    
    return html
  } catch (error) {
    console.error('API Error:', error)
    return `<html><body><h1>Ошибка API: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}</h1></body></html>`
  }
}

const getSystemPrompt = (docType: string): string => {
  const config = PROMPTS[docType as DocType]
  const basePrompt = config?.system || "Ты помощник по созданию документов."
  
  // Добавляем специальный промпт для типа документа из docTypePrompts.ts
  const docTypeSpecificPrompt = getDocTypePrompt(docType as DocType)
  
  // Добавляем интеллектуальное понимание контекста
  const contextualPrompt = `${basePrompt}

🧠 INTELLIGENT CONTEXT UNDERSTANDING:

You are an AI that deeply understands user intent and context. Your task is to:

1. ANALYZE the user's request carefully:
   - What is the main subject/product/company/topic?
   - What style/tone does the user want? (professional, casual, playful, serious, etc.)
   - Are there specific requirements? (colors, structure, specific details, etc.)
   - What is the user's REAL intent behind their words?

2. EXTRACT all relevant information:
   - Company/brand names mentioned
   - Product names and details
   - Specific numbers, dates, prices
   - Context clues (industry, target audience, purpose)

3. GENERATE content that:
   - MATCHES the user's intent perfectly
   - Uses appropriate tone and style for the context
   - Includes all specific details mentioned
   - Is detailed but concise
   - Follows the document type structure

⚠️ CRITICAL RULES:
- If user mentions specific details (names, numbers, colors, etc.) → USE THEM
- If user specifies "одно изображение" or "1 изображение" → understand they want 1 image
- If user asks for specific style → apply that style
- ALWAYS output valid JSON format
- Extract company names, product names, prices from the request
- Be intelligent: understand context, not just keywords

RESPOND WITH UNDERSTANDING AND PRECISION.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 СПЕЦИФИКА ТИПА ДОКУМЕНТА:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${docTypeSpecificPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  
  return contextualPrompt
}

export const getPromptForAction = (
  docType: DocType,
  action: keyof PromptConfig
): string => {
  const config = PROMPTS[docType]
  return config?.[action] || ''
}
