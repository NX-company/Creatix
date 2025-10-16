# 🧪 Руководство по нагрузочному тестированию

## Быстрый старт

### 1. Запустите dev сервер
```bash
npm run dev
```

### 2. Проверьте health check
```bash
curl http://localhost:3000/api/system/health
```

Ожидаемый ответ:
```json
{
  "status": "healthy",
  "overall": {
    "healthy": true,
    "totalCapacity": 83
  }
}
```

### 3. Запустите простой тест (10 запросов)
```bash
curl -X POST http://localhost:3000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"requests": 10, "delay": 100}'
```

## Типы тестов

### Тест 1: Небольшая нагрузка (10 запросов)
```bash
curl -X POST http://localhost:3000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"requests": 10, "delay": 100}'
```

**Ожидаемое время:** 5-10 секунд  
**Цель:** Проверка базовой функциональности

### Тест 2: Средняя нагрузка (30 запросов)
```bash
curl -X POST http://localhost:3000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"requests": 30, "delay": 50}'
```

**Ожидаемое время:** 15-25 секунд  
**Цель:** Проверка работы очереди

### Тест 3: Высокая нагрузка (50 запросов)
```bash
curl -X POST http://localhost:3000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"requests": 50, "delay": 20}'
```

**Ожидаемое время:** 25-40 секунд  
**Цель:** Проверка балансировки нагрузки

### Тест 4: Максимальная нагрузка (100 запросов)
```bash
curl -X POST http://localhost:3000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"requests": 100, "delay": 0}'
```

**Ожидаемое время:** 50-80 секунд  
**Цель:** Проверка максимальной пропускной способности

## Параметры теста

| Параметр | Описание | По умолчанию | Макс |
|----------|----------|--------------|------|
| `requests` | Количество запросов | 10 | 100 |
| `delay` | Задержка между запросами (ms) | 100 | любое |

## Интерпретация результатов

### Пример успешного теста:
```json
{
  "test": {
    "totalRequests": 50,
    "successful": 50,
    "failed": 0,
    "totalTime": "32450ms",
    "avgTimePerRequest": "649ms",
    "requestsPerSecond": 1.5
  },
  "systemStats": {
    "queue": {
      "pending": 0,
      "processing": 0,
      "completed": 50,
      "failed": 0
    },
    "keyPool": {
      "totalKeys": 3,
      "healthyKeys": 3
    }
  }
}
```

### Метрики качества:

| Метрика | Отлично | Хорошо | Требует внимания |
|---------|---------|--------|------------------|
| Success Rate | 100% | 95-99% | < 95% |
| Avg Time/Request | < 1000ms | 1000-2000ms | > 2000ms |
| Requests/Second | > 1.5 | 1.0-1.5 | < 1.0 |
| Failed Requests | 0 | 1-5% | > 5% |

## Мониторинг в реальном времени

### Смотрите логи в консоли:
```bash
# В терминале где запущен npm run dev
# Вы увидите:
🔑 Selected openrouter key: openrouter-0 (45/300 rpm)
📥 Queued request req_xxx (openrouter, priority 5)
⚡ Processing request req_xxx
✅ Request req_xxx completed in 3245ms
```

### Проверяйте статистику во время теста:
```bash
# В другом терминале
curl http://localhost:3000/api/test/load
```

## Troubleshooting

### Проблема: Все запросы падают с ошибкой
**Решение:**
1. Проверьте API ключи в `.env.local`
2. Убедитесь что ключи действительны
3. Проверьте health check: `/api/system/health`

### Проблема: Низкая скорость (< 0.5 req/s)
**Возможные причины:**
1. Недостаточно API ключей → Добавьте больше ключей
2. Медленная сеть → Проверьте интернет соединение
3. Rate limiting → Проверьте логи на warning о лимитах

### Проблема: Запросы зависают
**Решение:**
1. Проверьте что очередь не переполнена (max 1000)
2. Проверьте timeout настройки (default 60s)
3. Перезапустите dev сервер

## Тестирование с дополнительными ключами

### Добавьте больше ключей в `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_API_KEY_1=sk-or-v1-yyy
OPENROUTER_API_KEY_2=sk-or-v1-zzz
```

### Перезапустите сервер:
```bash
# Ctrl+C для остановки
npm run dev
```

### Запустите тест снова:
```bash
curl -X POST http://localhost:3000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"requests": 100, "delay": 0}'
```

**Ожидаемый результат:** Скорость должна вырасти пропорционально количеству ключей.

## Нагрузочное тестирование для продакшена

### Используйте специальные инструменты:

#### Apache Bench (ab)
```bash
ab -n 100 -c 10 -p request.json -T application/json \
  http://localhost:3000/api/openrouter-chat
```

#### wrk
```bash
wrk -t12 -c100 -d30s --timeout 60s \
  http://localhost:3000/api/system/health
```

#### Artillery
```yaml
# artillery-test.yml
config:
  target: http://localhost:3000
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: Load Test
    flow:
      - post:
          url: /api/test/load
          json:
            requests: 10
            delay: 50
```

```bash
artillery run artillery-test.yml
```

## Рекомендации по производительности

### Для локальной разработки (1 ключ):
- Тестируйте до 10-20 запросов одновременно
- Ожидайте ~1-2 req/s

### Для стейджинга (2-3 ключа):
- Тестируйте до 50 запросов одновременно
- Ожидайте ~3-5 req/s

### Для продакшена (5+ ключей):
- Можно обрабатывать 100+ запросов одновременно
- Ожидайте ~10+ req/s

## Автоматизированное тестирование

### Создайте npm скрипт:
```json
{
  "scripts": {
    "test:load": "node scripts/load-test.js"
  }
}
```

### Скрипт `scripts/load-test.js`:
```javascript
async function runLoadTest() {
  const response = await fetch('http://localhost:3000/api/test/load', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: 50, delay: 50 })
  })
  
  const result = await response.json()
  console.log('Load Test Results:', result)
  
  // Проверка успешности
  if (result.test.failed > 0) {
    console.error('❌ Some requests failed!')
    process.exit(1)
  }
  
  console.log('✅ All tests passed!')
}

runLoadTest()
```

## CI/CD Integration

### GitHub Actions пример:
```yaml
name: Load Test
on: [push]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Start server
        run: npm run dev &
      - name: Wait for server
        run: sleep 10
      - name: Run load test
        run: npm run test:load
```

## Следующие шаги

1. ✅ Запустите базовый тест (10 запросов)
2. ✅ Добавьте дополнительные API ключи
3. ✅ Запустите тест с 50-100 запросами
4. ✅ Проверьте health check endpoint
5. ✅ Настройте мониторинг для продакшена

---

**Важно:** Нагрузочное тестирование расходует API кредиты. Используйте разумно!

