# 🚀 ПОШАГОВЫЙ ДЕПЛОЙ CREATIX НА TIMEWEB

## ✅ ШАГ 1: Настройте Google OAuth (5 минут)

### 1.1 Откройте Google Cloud Console

Перейдите: https://console.cloud.google.com/apis/credentials

### 1.2 Найдите ваш OAuth 2.0 Client ID

Найдите: **524310893493-slg6igj99upep6ufiujvurp2qrks6mkh**

### 1.3 Добавьте Redirect URI

Нажмите **"Edit OAuth client"** (карандаш) и в разделе **"Authorized redirect URIs"** добавьте:

```
http://45.129.128.121/api/auth/callback/google
```

**Нажмите "SAVE"** ✅

---

## ✅ ШАГ 2: Скачайте PuTTY (если на Windows)

Если у вас Windows и нет PuTTY:

1. Скачайте: https://www.putty.org/
2. Установите
3. Запустите **PuTTY.exe**

**Если у вас Linux/Mac**, просто откройте Terminal.

---

## ✅ ШАГ 3: Подключитесь к серверу

### Для Windows (PuTTY):

1. **Host Name:** `45.129.128.121`
2. **Port:** `22`
3. Нажмите **"Open"**
4. **login as:** `root`
5. **password:** `bc#uDaM*k+SQ4K` (не будет видно при вводе)

### Для Linux/Mac (Terminal):

```bash
ssh root@45.129.128.121
# Пароль: bc#uDaM*k+SQ4K
```

**Вы подключены! ✅**

---

## ✅ ШАГ 4: Создайте .env файл на сервере

В терминале сервера (в PuTTY) выполните:

```bash
nano /root/.env
```

**Откроется текстовый редактор.**

### Скопируйте ВЕСЬ текст из файла `server.env`

📁 **Файл находится в вашем проекте:** `C:\NX\Neurodiz\server.env`

1. Откройте файл **server.env** в VSCode или Блокноте
2. Выделите **весь текст** (`Ctrl+A`)
3. Скопируйте (`Ctrl+C`)
4. Вставьте в PuTTY (**правая кнопка мыши** для вставки)

### Сохраните файл:

1. Нажмите `Ctrl+X`
2. Нажмите `Y`
3. Нажмите `Enter`

**✅ Файл .env создан!**

---

## ✅ ШАГ 5: Запустите автоматическую установку

В терминале сервера выполните **по очереди**:

```bash
cd /root
```

```bash
wget https://raw.githubusercontent.com/NX-company/Creatix/main/setup-server.sh
```

```bash
chmod +x setup-server.sh
```

```bash
bash setup-server.sh
```

### ⚠️ ВАЖНО! Во время установки:

Когда скрипт **склонирует проект** и попросит создать .env, выполните:

```bash
cp /root/.env /root/Creatix/.env
```

**Затем скрипт продолжит автоматически!**

### ⏱️ Установка займет **5-10 минут**

Вы увидите:
- ✅ System updated
- ✅ Node.js installed
- ✅ Git installed
- ✅ PM2 installed
- ✅ Nginx installed
- ✅ PostgreSQL installed
- ✅ Project cloned
- ✅ Dependencies installed
- ✅ Application built
- ✅ Application started
- ✅ Nginx configured

---

## ✅ ШАГ 6: Проверьте результат

### В терминале сервера:

```bash
pm2 status
```

**Должно быть:**
```
┌─────┬──────────┬─────────┬─────────┐
│ id  │ name     │ status  │ restart │
├─────┼──────────┼─────────┼─────────┤
│ 0   │ creatix  │ online  │ 0       │
└─────┴──────────┴─────────┴─────────┘
```

**Если status = "online" ✅ - всё работает!**

### Посмотрите логи (необязательно):

```bash
pm2 logs creatix --lines 30
```

---

## ✅ ШАГ 7: Откройте в браузере

Откройте: **http://45.129.128.121**

**🎉 Creatix работает!**

---

## 🔄 Если что-то пошло не так

### Проверьте логи:

```bash
pm2 logs creatix --err --lines 50
```

### Перезапустите приложение:

```bash
pm2 restart creatix
```

### Проверьте PostgreSQL:

```bash
systemctl status postgresql
```

### Проверьте Nginx:

```bash
systemctl status nginx
```

---

## 📞 Если нужна помощь

Скопируйте логи и отправьте мне:

```bash
pm2 logs creatix --lines 100 --nostream
```

---

## 🚀 ПОСЛЕ УСПЕШНОГО ДЕПЛОЯ

### Следующие шаги:

1. **Купите домен aicreatix.ru** (на Timeweb или reg.ru)
2. **Настройте DNS** (покажу как)
3. **Установите SSL** (автоматически через Certbot)
4. **Обновите Google OAuth** (добавлю HTTPS redirect URIs)

**Но это потом! Сначала проверьте, что всё работает на IP! ✅**

---

## 📝 Полезные команды

```bash
# Статус приложения
pm2 status

# Логи приложения
pm2 logs creatix

# Перезапуск приложения
pm2 restart creatix

# Остановка приложения
pm2 stop creatix

# Статус Nginx
systemctl status nginx

# Статус PostgreSQL
systemctl status postgresql
```

---

**🎉 Готово! Начинайте с ШАГ 1!**

