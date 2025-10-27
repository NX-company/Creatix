# 🚀 Руководство по работе с Git Worktrees

## 📋 Содержание
1. [Что такое Git Worktrees](#что-такое-git-worktrees)
2. [Структура проекта](#структура-проекта)
3. [Быстрый старт](#быстрый-старт)
4. [Рабочий процесс](#рабочий-процесс)
5. [Деплой в production](#деплой-в-production)
6. [Полезные команды](#полезные-команды)
7. [Troubleshooting](#troubleshooting)

---

## 🤔 Что такое Git Worktrees

Git Worktrees позволяет работать с **несколькими ветками одновременно** без переключения между ними.

**Преимущества:**
- ✅ Одновременная работа в 3 ветках
- ✅ Каждая ветка в отдельной папке
- ✅ Общий `.git` репозиторий (экономия места)
- ✅ Не нужно делать `git checkout` между ветками
- ✅ Каждая ветка со своим dev сервером (разные порты)

---

## 📁 Структура проекта

```
C:\Projects\
├── Creatix\                     # 🏠 Основной репозиторий (ветка main)
│   ├── .git\                    # Git репозиторий (общий для всех)
│   └── scripts\                 # Лаунчеры и deploy скрипты
│
├── Creatix-wt-payments\         # 💰 Ветка dev/payments (порт 3001)
│   └── (полная копия проекта на ветке dev/payments)
│
├── Creatix-wt-core\             # ⚙️ Ветка dev/core-features (порт 3002)
│   └── (полная копия проекта на ветке dev/core-features)
│
└── Creatix-wt-exp\              # 🧪 Ветка dev/experimental (порт 3003)
    └── (полная копия проекта на ветке dev/experimental)
```

---

## ⚡ Быстрый старт

### 1️⃣ Запуск workspace для работы с оплатами

```bash
# Из любой директории запустите:
C:\Projects\Creatix\scripts\start-payments.bat
```

**Что произойдет:**
- 🪟 Откроется VS Code в `C:\Projects\Creatix-wt-payments`
- 🌐 Запустится dev сервер на `http://localhost:3001`
- 🔗 Подключение к production БД (через SSH туннель)

### 2️⃣ Запуск workspace для работы с функциями системы

```bash
C:\Projects\Creatix\scripts\start-core.bat
```

**Что произойдет:**
- 🪟 Откроется VS Code в `C:\Projects\Creatix-wt-core`
- 🌐 Запустится dev сервер на `http://localhost:3002`

### 3️⃣ Запуск экспериментального workspace

```bash
C:\Projects\Creatix\scripts\start-exp.bat
```

**Что произойдет:**
- 🪟 Откроется VS Code в `C:\Projects\Creatix-wt-exp`
- 🌐 Запустится dev сервер на `http://localhost:3003`

---

## 🔄 Рабочий процесс

### Типичный день работы:

#### **Утро (запуск всех workspace)**

1. Запустите SSH туннель к БД (если еще не запущен):
   ```bash
   C:\Projects\Creatix\start-db-tunnel.bat
   ```

2. Запустите нужные workspace:
   ```bash
   # Запустить payments workspace
   C:\Projects\Creatix\scripts\start-payments.bat

   # Запустить core workspace
   C:\Projects\Creatix\scripts\start-core.bat

   # Запустить experimental workspace (если нужно)
   C:\Projects\Creatix\scripts\start-exp.bat
   ```

3. У вас откроется **3 окна VS Code** и **3 dev сервера**:
   - 💰 Payments: `http://localhost:3001`
   - ⚙️ Core: `http://localhost:3002`
   - 🧪 Experimental: `http://localhost:3003`

---

#### **Работа в течение дня**

**В workspace Payments** (`C:\Projects\Creatix-wt-payments`):
- Правите API оплат, подписок, активаций
- Тестируете на `http://localhost:3001`
- Коммитите изменения:
  ```bash
  git add .
  git commit -m "Fix payment activation"
  git push origin dev/payments
  ```

**В workspace Core** (`C:\Projects\Creatix-wt-core`):
- Правите промпты, агентов, основные функции
- Тестируете на `http://localhost:3002`
- Коммитите изменения:
  ```bash
  git add .
  git commit -m "Update AI prompt for generation"
  git push origin dev/core-features
  ```

**В workspace Experimental** (`C:\Projects\Creatix-wt-exp`):
- Экспериментируете с новыми фичами
- Тестируете на `http://localhost:3003`

---

#### **Важно! Изоляция веток**

Каждый workspace **полностью изолирован**:
- ✅ Изменения в `Creatix-wt-payments` не влияют на `Creatix-wt-core`
- ✅ Можно делать commits в одной ветке, не трогая другие
- ✅ Можно деплоить только одну ветку, не затрагивая другие

---

## 🚀 Деплой в production

### Деплой ветки payments

```bash
C:\Projects\Creatix\scripts\deploy-payments.bat
```

**Что произойдет:**
1. Переключение на `main` в основном репозитории
2. Merge `dev/payments` в `main`
3. Push в GitHub
4. Автоматический деплой на production сервер

### Деплой ветки core-features

```bash
C:\Projects\Creatix\scripts\deploy-core.bat
```

### Деплой ветки experimental

```bash
C:\Projects\Creatix\scripts\deploy-exp.bat
```

---

## 💡 Полезные команды

### Посмотреть все worktrees

```bash
cd C:\Projects\Creatix
git worktree list
```

**Вывод:**
```
C:/Projects/Creatix              b8c2397 [main]
C:/Projects/Creatix-wt-payments  b8c2397 [dev/payments]
C:/Projects/Creatix-wt-core      b8c2397 [dev/core-features]
C:/Projects/Creatix-wt-exp       b8c2397 [dev/experimental]
```

### Посмотреть статус в конкретном workspace

```bash
# В payments
cd C:\Projects\Creatix-wt-payments
git status

# В core
cd C:\Projects\Creatix-wt-core
git status

# В experimental
cd C:\Projects\Creatix-wt-exp
git status
```

### Синхронизация с GitHub

```bash
# Обновить payments ветку из GitHub
cd C:\Projects\Creatix-wt-payments
git pull origin dev/payments

# Обновить core ветку из GitHub
cd C:\Projects\Creatix-wt-core
git pull origin dev/core-features

# Обновить experimental ветку из GitHub
cd C:\Projects\Creatix-wt-exp
git pull origin dev/experimental
```

### Коммит и push изменений

```bash
# В любом workspace:
git add .
git commit -m "Your commit message"
git push origin <branch-name>

# Примеры:
# В payments:
git push origin dev/payments

# В core:
git push origin dev/core-features

# В experimental:
git push origin dev/experimental
```

---

## 🔧 Troubleshooting

### ❌ Проблема: Dev сервер не запускается

**Решение:**
1. Проверьте, не занят ли порт:
   ```bash
   netstat -ano | findstr ":3001"
   netstat -ano | findstr ":3002"
   netstat -ano | findstr ":3003"
   ```

2. Если порт занят, убейте процесс:
   ```bash
   taskkill /PID <PID> /F
   ```

3. Перезапустите launcher скрипт

---

### ❌ Проблема: БД не подключается

**Решение:**
1. Проверьте SSH туннель:
   ```bash
   netstat -ano | findstr ":5432"
   ```

2. Если туннель не работает, перезапустите его:
   ```bash
   C:\Projects\Creatix\start-db-tunnel.bat
   ```

---

### ❌ Проблема: Git конфликты при деплое

**Решение:**
1. Если deploy скрипт выдал ошибку merge conflict:
   ```bash
   cd C:\Projects\Creatix
   git status
   ```

2. Откройте конфликтующие файлы в VS Code и разрешите конфликты

3. Закоммитьте merge:
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   git push origin main
   ```

4. Запустите деплой на production:
   ```bash
   "C:\Program Files\PuTTY\plink.exe" -ssh root@45.129.128.121 -pw "pzaNtMznbq@hw3" -batch "cd /root/Creatix && git pull origin main && docker compose build app && docker compose up -d app"
   ```

---

### ❌ Проблема: VS Code открывается не в той папке

**Решение:**
- Проверьте путь в launcher скрипте:
  ```bash
  # Правильные пути:
  C:\Projects\Creatix-wt-payments
  C:\Projects\Creatix-wt-core
  C:\Projects\Creatix-wt-exp
  ```

---

### ❌ Проблема: Хочу удалить worktree

**Решение:**
```bash
cd C:\Projects\Creatix

# Удалить payments worktree
git worktree remove Creatix-wt-payments

# Удалить core worktree
git worktree remove Creatix-wt-core

# Удалить experimental worktree
git worktree remove Creatix-wt-exp
```

---

### ❌ Проблема: Хочу пересоздать worktree

**Решение:**
```bash
cd C:\Projects\Creatix

# Удалить старый
git worktree remove Creatix-wt-payments

# Создать новый
git worktree add C:\Projects\Creatix-wt-payments dev/payments
```

---

## 📝 Чеклист ежедневной работы

### ✅ Утро:
- [ ] Запустить SSH туннель к БД
- [ ] Запустить нужные workspace (payments/core/experimental)
- [ ] Проверить что все dev серверы работают

### ✅ В течение дня:
- [ ] Вносить изменения в соответствующем workspace
- [ ] Тестировать на локальном dev сервере
- [ ] Коммитить и пушить изменения в свою ветку

### ✅ Перед деплоем:
- [ ] Убедиться что все изменения закоммичены
- [ ] Убедиться что изменения запушены в GitHub
- [ ] Запустить соответствующий deploy скрипт
- [ ] Проверить что production работает корректно

---

## 🎯 Назначение каждой ветки

### 💰 `dev/payments` (порт 3001)
**Для работы с:**
- API оплат (`/api/payments/*`)
- Активация подписок
- Интеграция с Tochka Bank
- Webhook от банка
- Транзакции в БД

### ⚙️ `dev/core-features` (порт 3002)
**Для работы с:**
- Промптами для AI
- Агентами и их логикой
- Основными функциями системы
- UI компонентами
- Генерацией контента

### 🧪 `dev/experimental` (порт 3003)
**Для работы с:**
- Экспериментальными фичами
- Proof of concept
- Тестированием новых идей
- Резервная ветка для параллельной работы

---

## 🔗 Полезные ссылки

- **GitHub репозиторий:** https://github.com/NX-company/Creatix
- **Production:** https://creatix.app
- **Production сервер:** root@45.129.128.121

---

## 📞 Что делать если что-то пошло не так

1. Проверьте логи dev сервера в терминале
2. Проверьте что SSH туннель к БД работает
3. Проверьте что порты не заняты другими процессами
4. Перезапустите соответствующий launcher скрипт
5. В крайнем случае - перезапустите все workspace

---

**Удачной работы! 🚀**
