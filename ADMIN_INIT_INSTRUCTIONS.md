# Инструкции по инициализации админа на продакшене

## 🔐 Создание админа на aicreatix.ru

### Шаг 1: Добавьте секретный ключ в Vercel

1. Откройте: https://vercel.com/dashboard
2. Выберите проект `nx-studio`
3. Settings → Environment Variables
4. Добавьте новую переменную:
   ```
   Name: ADMIN_INIT_SECRET
   Value: your_super_secret_key_here_12345
   ```
5. Сохраните и передеплойте проект

### Шаг 2: Вызовите API endpoint для создания админа

**Используйте curl или Postman:**

```bash
curl -X POST https://www.aicreatix.ru/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_super_secret_key_here_12345"}'
```

**Или через браузер (fetch в консоли):**

```javascript
fetch('https://www.aicreatix.ru/api/admin/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    secret: 'your_super_secret_key_here_12345'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

### Шаг 3: Проверьте результат

Если успешно, вы увидите:
```json
{
  "success": true,
  "message": "Admin created successfully",
  "admin": {
    "email": "useneurox@gmail.com",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

Если админ уже существует:
```json
{
  "message": "Admin already exists",
  "admin": {
    "email": "useneurox@gmail.com",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Шаг 4: Войдите в админку

1. Откройте: https://www.aicreatix.ru/login
2. Введите:
   - **Логин:** `admin`
   - **Пароль:** `Lenalove123`
3. После входа перейдите: https://www.aicreatix.ru/admin

---

## ⚠️ Безопасность

После создания админа:
1. **Удалите** переменную `ADMIN_INIT_SECRET` из Vercel (чтобы никто не смог создать других админов)
2. **Измените пароль** через интерфейс админки

---

## 📊 Возможности админки

- `/admin` - Общая статистика
- `/admin/users` - Управление пользователями
- `/admin/settings` - Настройки режимов работы
- `/admin/test-agent` - Тестирование AI агентов

---

## 🔧 Альтернативный способ (прямой SQL)

Если API не работает, подключитесь к базе данных Neon и выполните:

```sql
-- Проверьте, существует ли админ
SELECT * FROM "User" WHERE email = 'useneurox@gmail.com';

-- Если НЕ существует, создайте:
INSERT INTO "User" (
  id, 
  email, 
  username, 
  password, 
  role, 
  "appMode", 
  "isActive", 
  name, 
  "createdAt", 
  "updatedAt", 
  "trialGenerations"
)
VALUES (
  gen_random_uuid(),
  'useneurox@gmail.com',
  'admin',
  '$2a$10$JZVEXzL7zw4p8VUZQN1qXO7qnJGH5VqY8Zx4JQDxN7SvQ8Hx8KQNK', -- hash для Lenalove123
  'ADMIN',
  'PRO',
  true,
  'Administrator',
  NOW(),
  NOW(),
  0
);
```

Хеш пароля для `Lenalove123` уже включен в запрос выше.

