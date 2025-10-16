# 🚀 API Queue System - Система управления запросами

## Обзор

Профессиональная система для обработки **100+ одновременных API запросов** с автоматической балансировкой нагрузки, retry логикой и health checks.

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Request Manager                       │
│  (Единая точка входа для всех API запросов)            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│  API Key Pool  │      │ Request Queue   │
│   Manager      │      │   Manager       │
│                │      │                 │
│ • Load Balance │      │ • Priorities    │
│ • Health Check │      │ • Rate Limiting │
│ • Auto-recovery│      │ • Retry Logic   │
└────────────────┘      └─────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   OpenRouter / AI APIs   │
        └─────────────────────────┘
```

## Компоненты системы

### 1. API Key Pool Manager (`lib/apiKeyPool.ts`)

Управляет несколькими API ключами для каждого провайдера.

**Возможности:**
- ✅ Round-robin балансировка нагрузки
- ✅ Rate limiting на уровне ключей (requests/minute)
- ✅ Автоматическое отключение неисправных ключей
- ✅ Auto-recovery после cooldown периода
- ✅ Детальная статистика по каждому ключу

**Поддерживаемые провайдеры:**
- `openrouter` - текстовая генерация (Gemini, GPT-4o)
- `replicate` - Flux Schnell (генерация изображений)
- `openai` - DALL-E 3 (генерация изображений)

**Пример использования:**
```typescript
import { getApiKeyPool } from '@/lib/apiKeyPool'

const keyPool = getApiKeyPool()
const key = keyPool.getKey('openrouter')

// После запроса
keyPool.markSuccess(key) // или keyPool.markError(key, error)
```

### 2. Request Queue Manager (`lib/requestQueue.ts`)

Управляет очередью запросов с приоритетами.

**Возможности:**
- ✅ Приоритетная очередь (0 = highest, 10 = lowest)
- ✅ Контроль максимального количества одновременных запросов
- ✅ Автоматический retry с exponential backoff
- ✅ Timeout для каждого запроса
- ✅ Статистика времени ожидания и обработки

**Лимиты одновременных запросов:**
- OpenRouter: **50 запросов**
- Replicate: **30 запросов**
- OpenAI: **3 запроса**

**Пример использования:**
```typescript
import { getRequestQueue } from '@/lib/requestQueue'

const queue = getRequestQueue()
const result = await queue.enqueue(
  'openrouter',
  async () => {
    // Ваш API запрос
  },
  {
    priority: 5,
    maxRetries: 3,
    timeout: 60000
  }
)
```

### 3. Unified Request Manager (`lib/requestManager.ts`)

Единая точка входа, объединяющая Key Pool и Queue.

**API методы:**

#### `openrouterRequest(options)`
Текстовая генерация через OpenRouter.

```typescript
const result = await requestManager.openrouterRequest({
  model: 'google/gemini-2.5-flash-lite',
  messages: [...],
  temperature: 0.7,
  max_tokens: 2000,
  priority: 5, // опционально
})
```

#### `replicateImageRequest(options)`
Генерация изображений через Flux Schnell.

```typescript
const result = await requestManager.replicateImageRequest({
  prompt: 'A beautiful landscape...',
  model: 'black-forest-labs/flux-schnell',
  priority: 5,
})
```

#### `openaiImageRequest(options)`
Генерация изображений через DALL-E 3.

```typescript
const result = await requestManager.openaiImageRequest({
  prompt: 'A futuristic city...',
  size: '1024x1024',
  priority: 5,
})
```

## Настройка API ключей

### Формат переменных окружения

Система поддерживает несколько ключей для каждого провайдера:

```env
# Базовый ключ
OPENROUTER_API_KEY=sk-or-v1-xxx

# Дополнительные ключи (нумерация с _1)
OPENROUTER_API_KEY_1=sk-or-v1-yyy
OPENROUTER_API_KEY_2=sk-or-v1-zzz
OPENROUTER_API_KEY_3=sk-or-v1-aaa
```

### Рекомендации по количеству ключей

| Нагрузка | OpenRouter | Replicate | OpenAI |
|----------|------------|-----------|--------|
| 10-30 запросов | 1 ключ | 1 ключ | 1 ключ |
| 30-60 запросов | 2-3 ключа | 1 ключ | 1 ключ |
| 60-100 запросов | 3-4 ключа | 1-2 ключа | 1-2 ключа |
| 100+ запросов | 5+ ключей | 2 ключа | 2 ключа |

## Мониторинг и Health Checks

### API Endpoint: `/api/system/health`

Возвращает детальную статистику системы:

```bash
curl http://localhost:3000/api/system/health
```

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "overall": {
    "healthy": true,
    "totalCapacity": 83,
    "availableSlots": {
      "openrouter": 50,
      "replicate": 30,
      "openai": 3
    }
  },
  "keyPool": {
    "totalKeys": 5,
    "healthyKeys": 5,
    "totalRequests": 1234,
    "totalErrors": 5,
    "averageLoad": 45
  },
  "queue": {
    "pending": 12,
    "processing": 38,
    "completed": 1189,
    "failed": 5,
    "averageWaitTime": "250ms",
    "averageProcessingTime": "3500ms"
  },
  "providers": {
    "openrouter": {
      "queue": {...},
      "healthyKeys": 3,
      "totalKeys": 3,
      "keys": [...]
    },
    ...
  }
}
```

### Автоматические Health Checks

Система автоматически:
- ✅ Проверяет здоровье ключей каждую минуту
- ✅ Отключает ключи после 5 последовательных ошибок
- ✅ Восстанавливает ключи через 5 минут cooldown
- ✅ Сбрасывает rate limit счетчики каждую минуту

## Использование в API Endpoints

### До (старый код):
```typescript
const apiKey = process.env.OPENROUTER_API_KEY
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
})
const completion = await client.chat.completions.create({...})
```

### После (новая система):
```typescript
import { getRequestManager } from '@/lib/requestManager'

const requestManager = getRequestManager()
const result = await requestManager.openrouterRequest({
  model: 'google/gemini-2.5-flash-lite',
  messages: [...],
  priority: 5, // опционально, по умолчанию 5
})
```

## Приоритеты запросов

| Приоритет | Использование |
|-----------|---------------|
| 0-2 | Критические запросы (админ операции) |
| 3-4 | Высокий приоритет (платные пользователи) |
| 5 | **Обычный приоритет (по умолчанию)** |
| 6-7 | Низкий приоритет (фоновые задачи) |
| 8-10 | Очень низкий приоритет (аналитика) |

## Retry логика

Автоматические повторы с exponential backoff:
- 1-я попытка: сразу
- 2-я попытка: через 1 секунду
- 3-я попытка: через 2 секунды
- 4-я попытка (если maxRetries=3): не выполняется

## Производительность

### Ожидаемые показатели:

| Метрика | Значение |
|---------|----------|
| Максимальная пропускная способность | **100+ req/s** |
| Среднее время ожидания в очереди | **< 500ms** |
| Среднее время обработки (Gemini) | **2-5s** |
| Среднее время обработки (Flux) | **10-20s** |
| Среднее время обработки (DALL-E 3) | **30-60s** |

### Оптимизация:
- ✅ In-memory queue (без Redis)
- ✅ Round-robin балансировка
- ✅ Parallel processing
- ✅ Smart retry только при необходимости

## Отладка

### Логи в консоли:

```
🔑 API Key Pool initialized: 5 total keys
   OpenRouter: 3 keys
   Replicate: 1 keys
   OpenAI: 1 keys

🚀 Request Queue Manager started

🔑 Selected openrouter key: openrouter-0 (45/300 rpm)
📥 Queued request req_1234567890_abc (openrouter, priority 5)
   Queue size: 12, Processing: 38
⚡ Processing request req_1234567890_abc (openrouter, attempt 1/4)
✅ Request req_1234567890_abc completed in 3245ms
```

## Deployment на сервер

Система полностью совместима с:
- ✅ Vercel
- ✅ Timeweb VPS
- ✅ AWS EC2
- ✅ Docker

**Для продакшена:**
1. Добавьте все API ключи в переменные окружения
2. Убедитесь что health check endpoint доступен
3. Настройте мониторинг (опционально)

## Безопасность

- ✅ Ключи никогда не логируются полностью
- ✅ Автоматическое отключение скомпрометированных ключей
- ✅ Rate limiting предотвращает превышение лимитов
- ✅ Timeout защищает от зависших запросов

## FAQ

**Q: Нужно ли добавлять все ключи сразу?**
A: Нет, можно начать с одного и добавлять по мере роста нагрузки.

**Q: Что если один ключ заблокируют?**
A: Система автоматически переключится на другие здоровые ключи.

**Q: Можно ли использовать без дополнительных ключей?**
A: Да, система работает и с одним ключом для каждого провайдера.

**Q: Как часто нужно проверять health check?**
A: Система делает это автоматически, но можно вызывать `/api/system/health` для мониторинга.

## Что дальше?

1. ✅ Добавьте дополнительные API ключи в `.env.local`
2. ✅ Протестируйте систему: `npm run dev`
3. ✅ Проверьте health check: `http://localhost:3000/api/system/health`
4. ✅ Деплой на сервер с новыми ключами

---

**Версия:** 1.0.0  
**Дата:** 16 октября 2025  
**Автор:** Neurodiz AI Team

