# 🚀 Руководство по деплою на Timeweb VPS

## Шаг 1: Покупка и настройка VPS на Timeweb

### 1.1 Зайдите на Timeweb
- Перейдите: https://timeweb.cloud/
- Войдите в личный кабинет или зарегистрируйтесь

### 1.2 Купите VPS сервер
**Рекомендуемая конфигурация:**
- **CPU:** 2 vCPU (минимум)
- **RAM:** 2-4 GB
- **SSD:** 40 GB
- **ОС:** Ubuntu 22.04 LTS
- **Примерная стоимость:** 300-500₽/месяц

**Где купить:**
1. В личном кабинете Timeweb
2. Раздел "Серверы" → "Cloud серверы"
3. Выберите конфигурацию
4. Нажмите "Заказать"

### 1.3 Получите доступы к серверу
После создания сервера вы получите:
- **IP адрес сервера** (например: 123.45.67.89)
- **Логин:** root
- **Пароль:** (придет на email или в личном кабинете)

---

## Шаг 2: Подключение к серверу

### Вариант A: SSH через PowerShell (Windows)

```powershell
ssh root@ВАШ_IP_АДРЕС
```

**Пример:**
```powershell
ssh root@123.45.67.89
```

При первом подключении:
- Введите `yes` для подтверждения fingerprint
- Введите пароль

### Вариант B: SSH через Timeweb панель
В личном кабинете Timeweb есть встроенный терминал - можете использовать его.

---

## Шаг 3: Установка необходимого ПО

### 3.1 Обновите систему
```bash
apt update && apt upgrade -y
```

### 3.2 Установите Node.js 20.x
```bash
# Добавляем репозиторий NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Устанавливаем Node.js
apt install -y nodejs

# Проверяем установку
node --version  # Должно показать v20.x.x
npm --version
```

### 3.3 Установите Git
```bash
apt install -y git
git --version
```

### 3.4 Установите PM2 (менеджер процессов)
```bash
npm install -g pm2
pm2 --version
```

### 3.5 Установите Nginx (веб-сервер)
```bash
apt install -y nginx
nginx -v
```

---

## Шаг 4: Клонирование проекта с GitHub

### 4.1 Создайте директорию для проекта
```bash
cd /var/www
mkdir -p creatix
cd creatix
```

### 4.2 Клонируйте репозиторий
```bash
git clone https://github.com/NX-company/Creatix.git .
```

**Если репозиторий приватный:**
```bash
# Сначала настройте GitHub токен
git clone https://GITHUB_TOKEN@github.com/NX-company/Creatix.git .
```

### 4.3 Проверьте что файлы загружены
```bash
ls -la
# Вы должны увидеть: package.json, app/, components/, lib/, и т.д.
```

---

## Шаг 5: Настройка переменных окружения

### 5.1 Создайте файл .env
```bash
nano .env
```

### 5.2 Вставьте следующее содержимое:
```env
# Database (Neon PostgreSQL - используйте вашу существующую базу)
DATABASE_URL="postgresql://neondb_owner:npg_0CS6NRBsDMeI@ep-red-silence-agh5gmzj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# API Keys
OPENROUTER_API_KEY=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
# OPENROUTER_API_KEY_1=sk-or-v1-YOUR_SECOND_KEY
# OPENROUTER_API_KEY_2=sk-or-v1-YOUR_THIRD_KEY

OPENAI_API_KEY=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

REPLICATE_API_TOKEN=r8_Ho1liDafyZySDXT0T8DPsIHUydqXbfD3yWA5s

# Proxy
PROXY_HOST=63.125.89.9
PROXY_PORT=50100
PROXY_LOGIN=useneurox
PROXY_PASSWORD=sEEkkt2bMu

# NextAuth
NEXTAUTH_SECRET=yX39jVjxhx/cA24bctYwhuD4H7GeH47AcX6zMhSeiQg=
NEXTAUTH_URL=http://ВАШ_IP_АДРЕС:3000

# Google OAuth
GOOGLE_CLIENT_ID=524310893493-slg6igj99upep6ufiujvurp2qrks6mkh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Cron Secret
CRON_SECRET=nx-neurodiz-secure-cron-2025
```

**Замените `ВАШ_IP_АДРЕС` на реальный IP вашего сервера!**

### 5.3 Сохраните файл
- Нажмите `Ctrl+X`
- Нажмите `Y`
- Нажмите `Enter`

---

## Шаг 6: Установка зависимостей и сборка

### 6.1 Установите npm пакеты
```bash
npm install
```
**Это займет 2-5 минут**

### 6.2 Сгенерируйте Prisma Client
```bash
npx prisma generate
```

### 6.3 Примените миграции базы данных
```bash
npx prisma migrate deploy
```

### 6.4 Соберите приложение для production
```bash
npm run build
```
**Это займет 3-7 минут**

---

## Шаг 7: Запуск приложения с PM2

### 7.1 Создайте PM2 конфигурацию
```bash
nano ecosystem.config.js
```

### 7.2 Вставьте следующее:
```javascript
module.exports = {
  apps: [{
    name: 'creatix',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/creatix',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

Сохраните: `Ctrl+X`, `Y`, `Enter`

### 7.3 Создайте директорию для логов
```bash
mkdir -p logs
```

### 7.4 Запустите приложение
```bash
pm2 start ecosystem.config.js
```

### 7.5 Проверьте статус
```bash
pm2 status
```

Вы должны увидеть:
```
┌─────┬──────────┬─────────┬──────┬─────┬──────────┐
│ id  │ name     │ status  │ cpu  │ mem │ uptime   │
├─────┼──────────┼─────────┼──────┼─────┼──────────┤
│ 0   │ creatix  │ online  │ 0%   │ 150M│ 1s       │
└─────┴──────────┴─────────┴──────┴─────┴──────────┘
```

### 7.6 Сохраните PM2 для автозапуска
```bash
pm2 save
pm2 startup
```

Выполните команду, которую PM2 выдаст (обычно начинается с `sudo env PATH=...`)

---

## Шаг 8: Настройка Nginx

### 8.1 Создайте конфигурацию Nginx
```bash
nano /etc/nginx/sites-available/creatix
```

### 8.2 Вставьте следующее:
```nginx
server {
    listen 80;
    server_name ВАШ_IP_АДРЕС;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Увеличиваем timeout для AI генерации
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

**Замените `ВАШ_IP_АДРЕС`!**

Сохраните: `Ctrl+X`, `Y`, `Enter`

### 8.3 Активируйте конфигурацию
```bash
ln -s /etc/nginx/sites-available/creatix /etc/nginx/sites-enabled/
```

### 8.4 Проверьте конфигурацию
```bash
nginx -t
```

Должно показать: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### 8.5 Перезапустите Nginx
```bash
systemctl restart nginx
```

---

## Шаг 9: Настройка Firewall

### 9.1 Разрешите HTTP/HTTPS
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

---

## Шаг 10: Проверка работы

### 10.1 Откройте браузер
Перейдите по адресу: `http://ВАШ_IP_АДРЕС`

Вы должны увидеть приложение Creatix! 🎉

### 10.2 Проверьте health check
`http://ВАШ_IP_АДРЕС/api/system/health`

Должно показать статус системы.

---

## Шаг 11: Настройка домена (опционально)

### 11.1 Купите домен на Timeweb
В личном кабинете Timeweb → Домены → Купить домен

### 11.2 Настройте DNS
**A-запись:**
- Имя: `@` (или `creatix`)
- Тип: `A`
- Значение: `ВАШ_IP_АДРЕС`
- TTL: `600`

### 11.3 Обновите Nginx конфигурацию
```bash
nano /etc/nginx/sites-available/creatix
```

Замените `server_name ВАШ_IP_АДРЕС;` на `server_name your-domain.ru;`

### 11.4 Установите SSL (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.ru
```

### 11.5 Обновите NEXTAUTH_URL
```bash
nano .env
```

Измените:
```env
NEXTAUTH_URL=https://your-domain.ru
```

### 11.6 Перезапустите приложение
```bash
pm2 restart creatix
```

---

## 📝 Полезные команды

### Управление приложением:
```bash
pm2 start creatix        # Запустить
pm2 stop creatix         # Остановить
pm2 restart creatix      # Перезапустить
pm2 logs creatix         # Смотреть логи
pm2 monit                # Мониторинг в реальном времени
```

### Обновление с GitHub:
```bash
cd /var/www/creatix
git pull origin main
npm install
npm run build
pm2 restart creatix
```

### Просмотр логов:
```bash
# PM2 логи
pm2 logs creatix

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Системные логи
journalctl -u nginx -f
```

### Очистка кеша:
```bash
cd /var/www/creatix
rm -rf .next
npm run build
pm2 restart creatix
```

---

## 🚨 Troubleshooting

### Проблема: "Cannot connect to server"
**Решение:**
```bash
pm2 status
# Если offline:
pm2 restart creatix
pm2 logs creatix  # Смотрим ошибки
```

### Проблема: "502 Bad Gateway"
**Решение:**
```bash
# Проверьте что приложение запущено
pm2 status

# Проверьте порт
netstat -tulpn | grep 3000

# Перезапустите Nginx
systemctl restart nginx
```

### Проблема: "Database connection failed"
**Решение:**
```bash
# Проверьте DATABASE_URL в .env
nano .env

# Проверьте соединение
npx prisma db push
```

### Проблема: Медленная работа
**Решение:**
```bash
# Увеличьте RAM сервера на Timeweb
# Или добавьте swap:
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## ✅ Checklist успешного deployment

- [ ] VPS куплен на Timeweb
- [ ] SSH доступ работает
- [ ] Node.js 20.x установлен
- [ ] Git установлен
- [ ] PM2 установлен
- [ ] Nginx установлен
- [ ] Проект склонирован с GitHub
- [ ] .env настроен с правильным IP
- [ ] npm install выполнен
- [ ] npm run build выполнен
- [ ] PM2 запущен и работает
- [ ] Nginx настроен и работает
- [ ] Firewall настроен
- [ ] Приложение открывается в браузере
- [ ] Health check работает
- [ ] (Опционально) Домен настроен
- [ ] (Опционально) SSL установлен

---

## 🔄 Автоматическое обновление с GitHub

### Создайте скрипт для быстрого обновления:
```bash
nano /var/www/creatix/update.sh
```

Вставьте:
```bash
#!/bin/bash
cd /var/www/creatix
git pull origin main
npm install
npm run build
pm2 restart creatix
echo "✅ Update complete!"
```

Сделайте исполняемым:
```bash
chmod +x /var/www/creatix/update.sh
```

Теперь для обновления просто запускайте:
```bash
/var/www/creatix/update.sh
```

---

**Готово! Ваше приложение работает на Timeweb VPS!** 🚀

**Поддержка:** useneurox@gmail.com  
**Дата:** 16 октября 2025

