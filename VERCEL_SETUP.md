# 🚀 Настройка для Vercel деплоя

## ✅ Что уже сделано:

1. ✅ Prisma schema обновлен на PostgreSQL
2. ✅ package.json настроен для Vercel (добавлен vercel-build)
3. ✅ Prisma Client сгенерирован

---

## 📋 Следующие шаги:

### Шаг 1: Создайте .env.local

Создайте файл `.env.local` в корне проекта с таким содержимым:

```env
# Neon PostgreSQL Database
DATABASE_URL="postgresql://neondb_owner:npg_0CS6NRBsDMeI@ep-red-silence-agh5gmzj-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# API Keys (замените на ваши реальные ключи)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
REPLICATE_API_TOKEN=r8_xxxxx
OPENAI_API_KEY=sk-xxxxx

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

**⚠️ Для NEXTAUTH_SECRET сгенерируйте случайную строку:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### Шаг 2: После создания .env.local напишите мне:

```
создал .env.local, продолжай
```

Я создам миграции для PostgreSQL и протестирую подключение к Neon.

---

## 🔐 Для деплоя на Vercel понадобятся:

Эти переменные нужно будет добавить в Vercel Dashboard:

- `DATABASE_URL` - ваш Neon connection string
- `OPENROUTER_API_KEY` - ваш ключ от OpenRouter
- `REPLICATE_API_TOKEN` - ваш токен от Replicate
- `OPENAI_API_KEY` - ваш ключ от OpenAI
- `NEXTAUTH_SECRET` - случайная строка (сгенерируйте новую для production!)
- `NEXTAUTH_URL` - `https://ваш-домен.vercel.app`

---

**Сейчас создайте `.env.local` файл и дайте знать! 🎯**

