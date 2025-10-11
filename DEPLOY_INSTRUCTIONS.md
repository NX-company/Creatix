# 🚀 Финальные шаги деплоя на Vercel

## ✅ Что уже сделано:

1. ✅ PostgreSQL настроен (Neon Database)
2. ✅ Prisma schema обновлен
3. ✅ Миграции созданы и применены
4. ✅ База данных с тестовыми данными (admin/admin123)
5. ✅ Изменения закоммичены и запушены на GitHub
6. ✅ Vercel CLI установлен
7. ✅ Dev сервер запущен и работает

---

## 🎯 Следующие шаги (вручную):

### Шаг 1: Логин в Vercel

Выполните в терминале:

```bash
vercel login
```

Выберите **GitHub** и авторизуйтесь в браузере.

---

### Шаг 2: Первичный деплой (Draft)

```bash
vercel
```

Ответьте на вопросы:
- **Set up and deploy?** → Y
- **Which scope?** → Ваш аккаунт
- **Link to existing project?** → N
- **Project name?** → nx-studio (или оставьте как есть)
- **Directory?** → ./ (просто Enter)
- **Override settings?** → N

---

### Шаг 3: Добавьте переменные окружения в Vercel

После создания проекта откроется браузер. Перейдите в:

**Settings** → **Environment Variables**

Добавьте следующие переменные (для **Production, Preview, Development**):

```env
DATABASE_URL=postgresql://neondb_owner:npg_0CS6NRBsDMeI@ep-red-silence-agh5gmzj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

OPENROUTER_API_KEY=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

OPENAI_API_KEY=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

REPLICATE_API_TOKEN=r8_60fbHrFNfAJ0Udh9gVQs0Yo3dQuxSDg3Hy63d

PROXY_HOST=63.125.89.9

PROXY_PORT=50100

PROXY_LOGIN=useneurox

PROXY_PASSWORD=sEEkkt2bMu

NEXTAUTH_SECRET=yX39jVjxhx/cA24bctYwhuD4H7GeH47AcX6zMhSeiQg=

NEXTAUTH_URL=https://ваш-домен.vercel.app
```

⚠️ **Важно:** Для `NEXTAUTH_URL` используйте ваш реальный Vercel домен (будет показан после деплоя).

---

### Шаг 4: Production деплой

После добавления переменных окружения:

```bash
vercel --prod
```

---

### Шаг 5: Настройте автоматический деплой

В Vercel Dashboard:
1. **Settings** → **Git**
2. **Connect Git Repository** → выберите `NX-company/NX-Studio`
3. Включите **Automatic deployments from main**

Теперь каждый `git push` будет автоматически деплоить! 🎉

---

## 🔐 Данные для входа:

```
Email: admin@nxstudio.com
Password: admin123
```

⚠️ Измените пароль после первого входа!

---

## 📊 Monitoring:

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Dashboard**: https://console.neon.tech
- **GitHub Repo**: https://github.com/NX-company/NX-Studio

---

## 🎯 Что дальше:

1. ✅ Залогиньтесь в Vercel: `vercel login`
2. ✅ Сделайте первый деплой: `vercel`
3. ✅ Добавьте env переменные в Vercel Dashboard
4. ✅ Продакшн деплой: `vercel --prod`
5. ✅ Настройте автодеплой из GitHub

**Готовы? Выполните `vercel login` и продолжайте! 🚀**

