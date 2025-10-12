# 🚀 Деплой Creatix на Vercel - Пошаговая инструкция

## ✅ Предварительная подготовка (ВЫПОЛНЕНО)

- ✅ Код успешно собран (`npm run build`)
- ✅ Все изменения закоммичены в Git
- ✅ Код загружен на GitHub: https://github.com/NX-company/NX-Studio
- ✅ База данных Neon PostgreSQL настроена (EU Central 1)

---

## 📋 ШАГ 1: Создание проекта на Vercel

### 1.1 Зайдите на Vercel
```
https://vercel.com/login
```

### 1.2 Импортируйте проект из GitHub
1. Нажмите **"Add New..."** → **"Project"**
2. Выберите **GitHub** как источник
3. Найдите репозиторий: **NX-company/NX-Studio**
4. Нажмите **"Import"**

### 1.3 Настройки проекта
**Framework Preset:** Next.js (автоопределится)  
**Root Directory:** `./` (оставить по умолчанию)  
**Build Command:** `npm run build` (автоматически)  
**Output Directory:** `.next` (автоматически)

---

## 🔑 ШАГ 2: Настройка переменных окружения

### Обязательные переменные для добавления:

#### 2.1 Через Vercel Dashboard

Зайдите в **Settings** → **Environment Variables** и добавьте:

```bash
# 1. База данных PostgreSQL (Neon)
DATABASE_URL
postgresql://neondb_owner:npg_0CS6NRBsDMeI@ep-red-silence-agh5gmzj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# 2. OpenRouter API (для GPT-4o и Gemini)
OPENROUTER_API_KEY
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

# 3. Replicate API (для Flux изображений)
REPLICATE_API_TOKEN
r8_60fbHrFNfAJ0Udh9gVQs0Yo3dQuxSDg3Hy63d

# 4. JWT Secret (СОЗДАЙТЕ НОВЫЙ!)
JWT_SECRET
<СГЕНЕРИРУЙТЕ НОВЫЙ КЛЮЧ - см. ниже>

# 5. Public URL (ДОБАВЬТЕ ПОСЛЕ ПЕРВОГО ДЕПЛОЯ!)
NEXT_PUBLIC_APP_URL
<будет доступен после деплоя>
```

#### 2.2 Как сгенерировать JWT_SECRET

**Вариант 1: PowerShell (Windows)**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Вариант 2: Онлайн**
```
https://generate-random.org/api-token-generator?count=1&length=64&type=mixed-numbers-symbols
```

**Вариант 3: Node.js**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

#### 2.3 Важно!
- Для каждой переменной отметьте все три окружения: ✅ Production, ✅ Preview, ✅ Development
- После добавления нажмите **"Save"**

---

## ⚙️ ШАГ 3: Настройка Prisma (миграции базы данных)

### 3.1 Добавьте Build Command Override

В **Settings** → **General** → **Build & Development Settings**:

**Build Command:**
```bash
npx prisma generate && npx prisma db push && next build
```

Это обеспечит:
1. Генерацию Prisma Client
2. Применение схемы к базе данных
3. Сборку Next.js

### 3.2 Или используйте `vercel.json` (рекомендуется)

Если нужен более гибкий контроль, создайте файл `vercel.json`:

```json
{
  "buildCommand": "npx prisma generate && npx prisma db push && npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

---

## 🚀 ШАГ 4: Первый деплой

### 4.1 Запустите деплой
Нажмите **"Deploy"** на странице проекта в Vercel.

### 4.2 Мониторинг деплоя
- Следите за логами сборки
- Проверьте, что все этапы выполнены успешно:
  - ✅ Installing dependencies
  - ✅ Prisma generate
  - ✅ Prisma db push
  - ✅ Building Next.js
  - ✅ Deploying

### 4.3 Получите URL
После успешного деплоя Vercel выдаст вам URL:
```
https://your-project-name.vercel.app
```

### 4.4 Обновите NEXT_PUBLIC_APP_URL
1. Скопируйте полученный URL
2. Зайдите в **Settings** → **Environment Variables**
3. Добавьте переменную `NEXT_PUBLIC_APP_URL` с вашим URL
4. Нажмите **"Redeploy"** для применения изменений

---

## 🗄️ ШАГ 5: Инициализация базы данных

### 5.1 Создание администратора

После первого деплоя зайдите на:
```
https://your-project-name.vercel.app/register
```

Зарегистрируйте первого пользователя - он автоматически станет администратором.

### 5.2 Проверка подключения к БД

Проверьте логи в Vercel:
- Зайдите в **Deployments** → выберите последний деплой → **View Function Logs**
- Найдите записи `prisma:query` - это подтвердит работу БД

---

## ✅ ШАГ 6: Проверка работоспособности

### 6.1 Тестовый чек-лист

Зайдите на ваш сайт и проверьте:

- [ ] **Регистрация:** создайте тестового пользователя
- [ ] **Логин:** войдите в систему
- [ ] **Создание документа:** выберите тип и создайте тест-документ
- [ ] **AI генерация (Free):** проверьте базовую генерацию
- [ ] **AI генерация (Advanced):** проверьте расширенный режим
- [ ] **AI генерация (PRO):** проверьте премиум режим
- [ ] **Генерация изображений:** проверьте Flux Schnell
- [ ] **Стили:** примените разные стили (Wildberries, Ozon, Avito)
- [ ] **Админ-панель:** зайдите на `/admin`

### 6.2 Проверка API

Откройте консоль браузера (F12) и проверьте:
- Нет ошибок 401/403 (аутентификация)
- Нет ошибок 500 (сервер)
- API `/api/openrouter-chat` работает
- API `/api/flux-generate` работает

---

## 🔧 ШАГ 7: Настройка домена (опционально)

### 7.1 Добавьте свой домен

1. Зайдите в **Settings** → **Domains**
2. Нажмите **"Add"**
3. Введите ваш домен: `creatix.com`
4. Следуйте инструкциям Vercel для настройки DNS

### 7.2 Обновите NEXT_PUBLIC_APP_URL

После настройки домена обновите переменную:
```
NEXT_PUBLIC_APP_URL=https://creatix.com
```

---

## 🐛 Решение проблем

### Проблема 1: Build Failed - Prisma Error
**Ошибка:** `Prisma Client could not be generated`

**Решение:**
1. Проверьте `DATABASE_URL` в Environment Variables
2. Убедитесь что Build Command содержит `npx prisma generate`
3. Перезапустите деплой

### Проблема 2: 500 Internal Server Error при API запросах
**Ошибка:** API возвращает 500

**Решение:**
1. Проверьте Function Logs в Vercel
2. Убедитесь что все API ключи добавлены
3. Проверьте что `OPENROUTER_API_KEY` и `REPLICATE_API_TOKEN` валидны

### Проблема 3: Изображения не генерируются
**Ошибка:** Flux не создаёт изображения

**Решение:**
1. Проверьте `REPLICATE_API_TOKEN` в Environment Variables
2. Убедитесь что токен не истёк
3. Проверьте баланс на Replicate: https://replicate.com/account/billing

### Проблема 4: JWT Secret Error
**Ошибка:** `JWT_SECRET must be at least 32 characters`

**Решение:**
1. Сгенерируйте новый ключ (см. Шаг 2.2)
2. Обновите `JWT_SECRET` в Environment Variables
3. Перезапустите деплой

### Проблема 5: База данных не подключается
**Ошибка:** `Could not connect to database`

**Решение:**
1. Проверьте `DATABASE_URL` в Neon Dashboard
2. Убедитесь что используется Pooled Connection URL
3. Проверьте что в конце URL есть `?sslmode=require`
4. Попробуйте подключиться через `psql` локально

---

## 📊 Мониторинг и метрики

### Vercel Analytics (бесплатно)
1. Зайдите в **Analytics** в Vercel Dashboard
2. Отслеживайте:
   - Page Views
   - Unique Visitors
   - Top Pages
   - Performance (Core Web Vitals)

### Error Monitoring
1. Зайдите в **Logs** → **Runtime Logs**
2. Фильтруйте по ошибкам (красные)
3. Настройте уведомления на email

---

## 🔄 Обновление приложения

### Автоматический деплой (рекомендуется)
Vercel автоматически деплоит при каждом push в GitHub:

```bash
# Локально
git add .
git commit -m "Update: description"
git push origin main

# Vercel автоматически запустит деплой
```

### Ручной деплой
1. Зайдите в **Deployments**
2. Нажмите **"Redeploy"** на любом предыдущем деплое
3. Или используйте CLI: `vercel --prod`

---

## 💰 Оценка стоимости для 100 пользователей

### Vercel (хостинг)
- **Free Tier:**
  - ✅ 100 GB bandwidth/месяц
  - ✅ 100 GB-hours serverless function execution
  - ✅ Неограниченные деплои
  - ❌ Ограничение: 12 секунд на функцию
  
- **Pro ($20/месяц):**
  - ✅ 1 TB bandwidth
  - ✅ 1000 GB-hours execution
  - ✅ 60 секунд на функцию (нужно для AI)
  - **Рекомендуется для production**

### Neon PostgreSQL (база данных)
- **Free Tier:**
  - ✅ 512 MB storage
  - ✅ 3 GB data transfer
  - ❌ Ограничение: 1 проект
  
- **Launch ($19/месяц):**
  - ✅ 10 GB storage
  - ✅ 50 GB data transfer
  - ✅ Autoscaling
  - **Рекомендуется для 100+ пользователей**

### OpenRouter (AI API)
- **Оплата по использованию:**
  - GPT-4o: ~$2.50 за 1M input tokens
  - Gemini 2.0: ~$0.075 за 1M tokens
  - **Примерно $50-100/месяц для 100 активных пользователей**

### Replicate (изображения)
- **Оплата по использованию:**
  - Flux Schnell: ~$0.003 за изображение
  - Flux 1.1 Pro: ~$0.04 за изображение
  - **Примерно $30-50/месяц для 100 пользователей**

### ИТОГО для 100 пользователей:
- **Минимум (Free тир):** ~$80-150/месяц (только API)
- **Рекомендуемый (Pro):** ~$120-200/месяц

---

## 🎯 Чек-лист финального запуска

### Перед публичным запуском:

- [ ] ✅ Все переменные окружения добавлены
- [ ] ✅ JWT_SECRET создан уникальный для production
- [ ] ✅ База данных настроена и мигрирована
- [ ] ✅ Админ-аккаунт создан
- [ ] ✅ Все режимы (Free/Advanced/PRO) протестированы
- [ ] ✅ Генерация изображений работает
- [ ] ✅ Стили применяются корректно
- [ ] ✅ Мобильная версия отображается правильно
- [ ] ✅ Логи не содержат критических ошибок
- [ ] ✅ Vercel Analytics включен
- [ ] ✅ Error monitoring настроен
- [ ] ✅ Backups базы данных настроены
- [ ] ✅ HTTPS работает корректно
- [ ] ✅ Все API ключи валидны
- [ ] ✅ Баланс на Replicate пополнен

---

## 📞 Поддержка

### Документация
- **Vercel:** https://vercel.com/docs
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Neon:** https://neon.tech/docs

### Полезные ссылки
- **GitHub Repo:** https://github.com/NX-company/NX-Studio
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://console.neon.tech
- **Replicate:** https://replicate.com/account
- **OpenRouter:** https://openrouter.ai/keys

---

## ✨ Готово!

Ваше приложение **Creatix** теперь доступно в интернете! 🎉

**Следующие шаги:**
1. Поделитесь ссылкой с первыми пользователями
2. Мониторьте логи и метрики
3. Собирайте фидбек
4. Итерируйте и улучшайте

**Успешного запуска!** 🚀

