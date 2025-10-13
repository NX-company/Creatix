# 🤖 AI Testing Agent

Автоматический тестировщик с интеграцией GPT-4o Vision для анализа UI и поиска багов.

## Возможности

### 🔍 Что тестирует:

1. **Аутентификация**
   - Вход в систему
   - Проверка редиректов

2. **Создание документов**
   - Коммерческое предложение
   - Счёт
   - Письмо
   - Презентация
   - Логотип
   - Карточка товара

3. **Редактирование**
   - Изменение текста
   - Добавление изображений
   - Изменение стилей

4. **Экспорт файлов**
   - HTML
   - PDF
   - DOC

5. **UI функции**
   - Переключение режимов (Free/Advanced/PRO)
   - Загрузка изображений
   - Парсинг сайтов

6. **Детекция ошибок**
   - Console errors
   - Broken UI
   - Missing elements

### 🧠 AI Анализ (GPT-4o Vision)

Для каждого теста делается скриншот, который анализируется GPT-4o Vision:
- Поиск визуальных багов
- Оценка качества UI (1-10)
- Рекомендации по улучшению
- Определение серьезности проблем (critical/high/medium/low)

## Использование

### 1. Откройте админ-панель

```
http://localhost:3000/admin
```

или на Vercel:

```
https://your-app.vercel.app/admin
```

### 2. Кликните на карточку "AI Testing Agent"

### 3. Настройте тестирование

- **Выберите тесты:** можно выбрать все или только нужные категории
- **AI анализ:** включите/выключите GPT-4o Vision анализ
- **Нажмите "🚀 Запустить тесты"**

### 4. Дождитесь результатов

Время выполнения:
- Без AI: ~1-3 минуты
- С AI: ~5-10 минут (зависит от количества тестов)

### 5. Изучите отчёт

Отчёт покажет:
- ✅ Количество пройденных тестов
- ❌ Количество провалившихся
- ⏱️ Общее время выполнения
- 🐛 Список найденных багов с деталями
- 📸 Скриншоты для каждого теста

## Примеры результатов

### Успешный тест:

```
✅ Создание коммерческого предложения
   Duration: 12,453ms
   Details: Документ создан успешно
   AI Analysis:
     Severity: none
     UI Quality: 9/10
     Issues: []
```

### Провал с багом:

```
❌ Редактирование документа
   Duration: 5,234ms
   Error: Element not found
   AI Analysis:
     Severity: critical
     UI Quality: 3/10
     Issues:
       - Error message "401 Unauthorized" visible
       - Edit mode triggered instead of creation
       - Broken image placeholder (404)
     Suggestions:
       - Fix isCreationRequest logic in ChatPanel.tsx
       - Add "сделай" to command detection
```

## Архитектура

```
lib/testing/
  scenarios.ts      - Тестовые сценарии
  analyzer.ts       - AI анализ с GPT-4o

app/api/admin/test-agent/
  route.ts          - API endpoint для запуска тестов

app/admin/test-agent/
  page.tsx          - UI интерфейс
```

## Добавление новых тестов

### 1. Откройте `lib/testing/scenarios.ts`

### 2. Добавьте новый сценарий:

```typescript
{
  id: 'my-new-test',
  name: 'Название теста',
  category: 'Категория',
  severity: 'high',
  run: async (page, baseUrl) => {
    const start = Date.now()
    try {
      // Ваша логика теста
      await page.goto(baseUrl)
      await page.click('button.my-button')
      await page.waitForTimeout(2000)
      
      const screenshot = await page.screenshot({ encoding: 'base64' })
      
      return {
        passed: true,
        screenshot: `data:image/png;base64,${screenshot}`,
        duration: Date.now() - start,
        details: 'Тест прошёл успешно'
      }
    } catch (error) {
      const screenshot = await page.screenshot({ encoding: 'base64' })
      return {
        passed: false,
        screenshot: `data:image/png;base64,${screenshot}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start
      }
    }
  }
}
```

## Стоимость

### Без AI анализа:
- **0$** - бесплатно, используется только Playwright

### С AI анализом:
- **~$0.01** за скриншот (GPT-4o Vision)
- **~$0.50-1.00** за полный прогон всех тестов (50+ скриншотов)

## Локальный запуск

```bash
# Установить зависимости (уже сделано)
npm install

# Запустить dev сервер
npm run dev

# Открыть
http://localhost:3000/admin/test-agent
```

## Настройка на Vercel

Все переменные окружения уже настроены:
- `OPENROUTER_API_KEY` - для GPT-4o Vision
- `NEXTAUTH_URL` - базовый URL приложения

Playwright автоматически работает на Vercel с `chromium`.

## Troubleshooting

### Тесты падают с timeout

Увеличьте `maxDuration` в `app/api/admin/test-agent/route.ts`:

```typescript
export const maxDuration = 300 // секунды
```

### Playwright не запускается

Установите браузеры:

```bash
npx playwright install chromium
```

### AI анализ не работает

Проверьте:
1. `OPENROUTER_API_KEY` установлен
2. Модель `openai/gpt-4o` доступна
3. Баланс на OpenRouter

## Полезные ссылки

- [Playwright Docs](https://playwright.dev/)
- [GPT-4o Vision](https://platform.openai.com/docs/guides/vision)
- [OpenRouter](https://openrouter.ai/)

---

**Создано:** 2025-01-07
**Версия:** 1.0.0
**Автор:** AI Agent

