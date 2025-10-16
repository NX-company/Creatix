# 🚀 Инструкция по деплою Creatix на Timeweb VPS

## 📋 Информация о сервере

```
IP:       45.129.128.121
User:     root
Password: bc#uDaM*k+SQ4K
OS:       Ubuntu 24.04
RAM:      4GB
CPU:      2 vCPU
Disk:     50GB NVMe
```

---

## ⚡ Быстрый деплой (5 минут)

### 1️⃣ Подключитесь к серверу

**Через SSH клиент (Windows - PuTTY, Linux/Mac - Terminal):**

```bash
ssh root@45.129.128.121
# Введите пароль: bc#uDaM*k+SQ4K
```

### 2️⃣ Создайте файл .env

```bash
# Создайте файл
nano /root/.env
```

**Скопируйте и заполните следующий шаблон:**

```env
# ============================================
# CREATIX PRODUCTION ENVIRONMENT
# ============================================

# DATABASE (PostgreSQL на сервере)
DATABASE_URL="postgresql://creatix:creatix_secure_password_2024@localhost:5432/creatix"

# NEXTAUTH (генерируйте секреты: openssl rand -base64 32)
NEXTAUTH_SECRET="ВАШ-СГЕНЕРИРОВАННЫЙ-СЕКРЕТ"
NEXTAUTH_URL="http://45.129.128.121"

# OPENROUTER API (получите на https://openrouter.ai/keys)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_API_KEY_2=""
OPENROUTER_API_KEY_3=""

# REPLICATE API (получите на https://replicate.com/account/api-tokens)
REPLICATE_API_TOKEN="r8_..."
REPLICATE_API_TOKEN_2=""
REPLICATE_API_TOKEN_3=""

# OPENAI API (получите на https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-..."
OPENAI_API_KEY_2=""
OPENAI_API_KEY_3=""

# ADMIN JWT (генерируйте: openssl rand -base64 32)
ADMIN_JWT_SECRET="ВАШ-АДМИН-СЕКРЕТ"

# CRON SECRET (любая строка)
CRON_SECRET="ваш-крон-секрет"

# ENVIRONMENT
NODE_ENV="production"
```

**Сохраните файл:** `Ctrl+X`, затем `Y`, затем `Enter`

### 3️⃣ Загрузите и запустите скрипт установки

```bash
# Загрузите скрипт с GitHub
cd /root
wget https://raw.githubusercontent.com/NX-company/Creatix/main/setup-server.sh

# Сделайте скрипт исполняемым
chmod +x setup-server.sh

# ВАЖНО: Скопируйте .env в папку Creatix после клонирования
# Запустите установку
bash setup-server.sh

# После клонирования проекта скрипт попросит создать .env
# Скопируйте ваш .env:
cp /root/.env /root/Creatix/.env

# Продолжите выполнение скрипта
```

### 4️⃣ Проверьте результат

```bash
# Проверьте статус приложения
pm2 status

# Посмотрите логи
pm2 logs creatix --lines 50
```

**Откройте в браузере:** `http://45.129.128.121`

---

## 🔄 Обновление приложения

После внесения изменений в код и пуша на GitHub:

```bash
# Подключитесь к серверу
ssh root@45.129.128.121

# Запустите скрипт обновления
cd /root/Creatix
bash update-app.sh
```

**Или вручную:**

```bash
cd /root/Creatix
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart creatix
```

---

## 📊 Полезные команды

### PM2 (управление приложением)

```bash
# Статус приложения
pm2 status

# Просмотр логов в реальном времени
pm2 logs creatix

# Последние 100 строк логов
pm2 logs creatix --lines 100

# Перезапуск приложения
pm2 restart creatix

# Остановка приложения
pm2 stop creatix

# Запуск приложения
pm2 start creatix

# Удаление из PM2
pm2 delete creatix

# Сохранение конфигурации PM2
pm2 save

# Мониторинг ресурсов
pm2 monit
```

### Nginx (веб-сервер)

```bash
# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx

# Рестарт Nginx
systemctl restart nginx

# Статус Nginx
systemctl status nginx

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### PostgreSQL (база данных)

```bash
# Подключение к базе
sudo -u postgres psql -d creatix

# Внутри psql:
\dt              # Список таблиц
\q               # Выход
SELECT COUNT(*) FROM "User";  # Количество пользователей

# Бэкап базы
pg_dump -U creatix -d creatix > backup.sql

# Восстановление базы
psql -U creatix -d creatix < backup.sql
```

### Системные команды

```bash
# Использование диска
df -h

# Использование RAM
free -h

# Процессы
htop

# Перезагрузка сервера
reboot

# Обновление системы
apt update && apt upgrade -y
```

---

## 🔒 Настройка SSL (HTTPS)

После покупки домена:

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Получите SSL сертификат
certbot --nginx -d ваш-домен.ru

# Автоматическое обновление сертификата
certbot renew --dry-run
```

Обновите в `.env`:
```env
NEXTAUTH_URL="https://ваш-домен.ru"
```

---

## 🐛 Решение проблем

### Приложение не запускается

```bash
# Проверьте логи
pm2 logs creatix --err --lines 50

# Проверьте переменные окружения
cat /root/Creatix/.env

# Проверьте порт 3000
netstat -tlnp | grep 3000

# Убейте процесс на порту 3000 (если нужно)
kill -9 $(lsof -ti:3000)
```

### База данных не подключается

```bash
# Проверьте статус PostgreSQL
systemctl status postgresql

# Перезапустите PostgreSQL
systemctl restart postgresql

# Проверьте подключение
sudo -u postgres psql -d creatix -c "SELECT 1;"
```

### Nginx выдает ошибки

```bash
# Проверьте конфигурацию
nginx -t

# Проверьте логи
tail -f /var/log/nginx/error.log

# Перезапустите Nginx
systemctl restart nginx
```

### Нехватка памяти

```bash
# Проверьте память
free -h

# Очистите кеш
sync; echo 3 > /proc/sys/vm/drop_caches

# Перезапустите приложение
pm2 restart creatix
```

---

## 📈 Мониторинг

### PM2 Monitoring

```bash
# Установите PM2 Web Dashboard
pm2 install pm2-server-monit

# Доступ: http://45.129.128.121:9615
```

### Логи приложения

```bash
# Все логи
pm2 logs creatix

# Только ошибки
pm2 logs creatix --err

# Последние 200 строк
pm2 logs creatix --lines 200

# Файлы логов находятся в:
# /root/Creatix/logs/error.log
# /root/Creatix/logs/out.log
```

---

## 🔐 Безопасность

### Смена пароля root

```bash
passwd root
```

### Отключение входа по паролю (только SSH ключи)

```bash
# Создайте SSH ключ на вашем компьютере
ssh-keygen -t rsa -b 4096

# Скопируйте публичный ключ на сервер
ssh-copy-id root@45.129.128.121

# Отключите вход по паролю
nano /etc/ssh/sshd_config
# Установите: PasswordAuthentication no
systemctl restart sshd
```

### Firewall

```bash
# Статус
ufw status

# Разрешить порт
ufw allow 8080/tcp

# Запретить порт
ufw deny 8080/tcp
```

---

## 📞 Поддержка

- **Email:** useneurox@gmail.com
- **GitHub:** https://github.com/NX-company/Creatix
- **Документация:** См. README.md в репозитории

---

## ✅ Чек-лист деплоя

- [ ] Создан .env файл с API ключами
- [ ] Сгенерированы NEXTAUTH_SECRET и ADMIN_JWT_SECRET
- [ ] Запущен setup-server.sh
- [ ] Приложение доступно по IP
- [ ] PM2 показывает статус "online"
- [ ] Логи не содержат критических ошибок
- [ ] База данных создана и мигрирована
- [ ] Nginx работает и проксирует запросы
- [ ] Firewall настроен

---

**🎉 Готово! Ваше приложение работает!**

