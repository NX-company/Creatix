# 🚀 Деплой на Timeweb - НАЧНИТЕ ЗДЕСЬ!

## ⚡ Быстрый старт (5 минут)

### Шаг 1: Подключитесь к серверу

Откройте **PuTTY** (или Terminal) и подключитесь:

```
Host: 45.129.128.121
User: root
Password: bc#uDaM*k+SQ4K
```

### Шаг 2: Подготовьте .env файл

На сервере выполните:

```bash
nano /root/.env
```

Скопируйте этот шаблон и **заполните ваши API ключи**:

```env
DATABASE_URL="postgresql://creatix:creatix_secure_password_2024@localhost:5432/creatix"

# Генерируйте секрет: openssl rand -base64 32
NEXTAUTH_SECRET="СГЕНЕРИРУЙТЕ-СЕКРЕТ"
NEXTAUTH_URL="http://45.129.128.121"

# Ваши API ключи из keys.env.local
OPENROUTER_API_KEY="ваш-ключ"
REPLICATE_API_TOKEN="ваш-токен"
OPENAI_API_KEY="ваш-ключ"

# Генерируйте: openssl rand -base64 32
ADMIN_JWT_SECRET="СГЕНЕРИРУЙТЕ-СЕКРЕТ"
CRON_SECRET="любая-строка"
NODE_ENV="production"
```

**Сохраните:** `Ctrl+X` → `Y` → `Enter`

### Шаг 3: Запустите автоматическую установку

```bash
cd /root
wget https://raw.githubusercontent.com/NX-company/Creatix/main/setup-server.sh
chmod +x setup-server.sh
bash setup-server.sh
```

**Во время установки:**
- Скрипт клонирует проект
- Попросит создать .env в папке проекта
- Выполните: `cp /root/.env /root/Creatix/.env`
- Скрипт продолжит автоматически

### Шаг 4: Проверьте результат

```bash
pm2 status
pm2 logs creatix
```

**Откройте браузер:** `http://45.129.128.121` ✅

---

## 🔄 Обновление в будущем

После изменений в коде:

```bash
cd /root/Creatix
bash update-app.sh
```

---

## 📚 Полная документация

См. **TIMEWEB_DEPLOY_INSTRUCTIONS.md** для:
- Настройки SSL
- Решения проблем
- Мониторинга
- Резервного копирования

---

## ⚠️ ВАЖНО перед запуском!

1. **Заполните все API ключи** в .env
2. **Сгенерируйте секреты** командой: `openssl rand -base64 32`
3. **Проверьте DATABASE_URL** (должен быть PostgreSQL, не SQLite!)

---

**🎉 Всё готово к деплою!**

