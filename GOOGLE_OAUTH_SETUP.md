# Google OAuth Authentication Setup

Система авторизации через Google успешно интегрирована! Теперь пользователи могут регистрироваться и входить одним кликом через свой Google аккаунт.

## Что было сделано

✅ Установлен `next-auth` и `@auth/prisma-adapter`
✅ Обновлена Prisma схема (добавлена модель `Account`, поля `emailVerified`, `image`)
✅ Создан API роут `/api/auth/[...nextauth]` с Google Provider
✅ Добавлена кнопка "Зарегистрироваться через Google" на странице регистрации
✅ Добавлена кнопка "Войти через Google" на странице логина
✅ Обновлен `layout.tsx` с `SessionProvider`
✅ Применена миграция базы данных

## Как получить Google OAuth ключи

### Шаг 1: Перейди в Google Cloud Console
https://console.cloud.google.com

### Шаг 2: Создай проект (если нет)
1. Нажми на выпадающее меню проектов вверху
2. "New Project" → введи название "Creatix"
3. Нажми "Create"

### Шаг 3: Включи Google+ API
1. В боковом меню: "APIs & Services" → "Library"
2. Найди "Google+ API"
3. Нажми "Enable"

### Шаг 4: Создай OAuth 2.0 Client ID
1. В боковом меню: "APIs & Services" → "Credentials"
2. Нажми "Create Credentials" → "OAuth client ID"
3. Если просит, настрой OAuth consent screen:
   - User Type: External
   - App name: Creatix
   - User support email: твой email
   - Developer contact: твой email
   - Сохрани
4. Application type: **Web application**
5. Name: **Creatix Web Client**
6. Authorized redirect URIs:
   - Добавь: `http://localhost:3000/api/auth/callback/google`
7. Нажми "Create"

### Шаг 5: Скопируй ключи
После создания увидишь окно с:
- **Client ID** (длинная строка типа `123456789-abc...googleusercontent.com`)
- **Client Secret** (строка типа `GOCSPX-...`)

### Шаг 6: Добавь в keys.env.local
Замени в файле `keys.env.local`:

```env
GOOGLE_CLIENT_ID=твой_client_id_сюда
GOOGLE_CLIENT_SECRET=твой_client_secret_сюда
```

## Для продакшна (Vercel)

### Добавь продакшн redirect URI в Google Console:
```
https://твой-домен.vercel.app/api/auth/callback/google
```

### Добавь переменные в Vercel:
В файл `upload-env-to-vercel.ps1` добавь:

```powershell
"GOOGLE_CLIENT_ID" = "твой_google_client_id"
"GOOGLE_CLIENT_SECRET" = "твой_google_client_secret"
"NEXTAUTH_URL" = "https://твой-домен.vercel.app"
```

## Как это работает

### Для пользователя:

1. **Регистрация:**
   - Открывает `/register`
   - Нажимает "Зарегистрироваться через Google"
   - Выбирает свою почту из списка Google аккаунтов
   - **Автоматически создается аккаунт** с:
     - Email из Google
     - Имя из Google профиля
     - Аватарка из Google
     - Триал на 3 дня
     - 30 бесплатных генераций
   - Попадает на главную страницу

2. **Вход:**
   - Открывает `/login`
   - Нажимает "Войти через Google"
   - Мгновенный вход (если уже залогинен в Google)

### Технические детали:

- NextAuth автоматически создает записи в таблицах `User` и `Account`
- При первом входе через Google устанавливается триал на 3 дня
- `password` и `username` теперь необязательные (nullable)
- Пользователи могут иметь и email/password, и Google OAuth одновременно

## Запуск

```bash
npm run dev
```

Перейди на http://localhost:3000/register и увидишь кнопку Google!

## Что делать если не работает

1. Проверь, что Google OAuth ключи правильно скопированы
2. Убедись, что Redirect URI в Google Console точно `http://localhost:3000/api/auth/callback/google`
3. Проверь, что база данных обновлена (миграция применена)
4. Перезапусти сервер после добавления ключей

## Безопасность

- ✅ NextAuth использует безопасные токены
- ✅ Google OAuth 2.0 - индустриальный стандарт
- ✅ Пароли не хранятся для Google пользователей
- ✅ Все через HTTPS на продакшне
- ✅ CSRF защита встроена в NextAuth

---

Готово! Пользователи теперь могут регистрироваться одним кликом! 🚀

