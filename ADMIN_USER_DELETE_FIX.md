# 🔧 Исправление удаления пользователей в админке

**Дата:** 16 октября 2025  
**Статус:** ✅ Исправлено

---

## ❌ **Проблема:**

При попытке удалить пользователя из админки возникала ошибка:
```
DELETE http://localhost:3000/api/admin/users 
405 (Method Not Allowed)
```

**Причина:** В API endpoint `/api/admin/users` не был реализован метод `DELETE`.

---

## ✅ **Решение:**

Добавлен метод `DELETE` в `app/api/admin/users/route.ts`:

### **Функциональность:**

1. **Проверка прав:**
   - Верификация администратора через `verifyAdmin(request)`
   - Только админы могут удалять пользователей

2. **Валидация:**
   - Проверка наличия `userId` в запросе
   - Проверка существования пользователя
   - **Защита от удаления админов** (нельзя удалить пользователя с ролью `ADMIN`)

3. **Удаление:**
   - Каскадное удаление всех связанных данных (благодаря `onDelete: Cascade` в схеме Prisma)
   - Удаляются: проекты, файлы, сессии, API usage, транзакции

4. **Логирование:**
   ```
   ✅ User deleted by admin: user@example.com
   ```

---

## 🔐 **Безопасность:**

✅ **Реализовано:**
- Только администраторы могут удалять пользователей
- Невозможно удалить пользователя с ролью `ADMIN`
- Логирование всех операций удаления

---

## 📋 **Код:**

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Защита от удаления админов
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    console.log(`✅ User deleted by admin: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🧪 **Как протестировать:**

1. **Войдите в админку:**
   ```
   http://localhost:3000/admin
   ```

2. **Перейдите в "Пользователи"**

3. **Нажмите иконку корзины** у любого пользователя (кроме админа)

4. **Подтвердите удаление** в диалоговом окне

5. **Результат:**
   - Пользователь удален
   - Список обновлен
   - В консоли: `✅ User deleted by admin: user@example.com`

---

## ⚠️ **Важно:**

- **Админов удалить нельзя** (защита от случайного удаления)
- **Каскадное удаление:** удаляются все связанные данные (проекты, файлы, сессии и т.д.)
- **Операция необратима!** Восстановить данные невозможно

---

## 📊 **Что удаляется:**

При удалении пользователя каскадно удаляются:
- ✅ Все проекты (`Project`)
- ✅ Все сообщения проектов (`ProjectMessage`)
- ✅ Все файлы проектов (`ProjectFile`)
- ✅ Planning данные (`ProjectPlanningData`)
- ✅ Сессии (`Session`)
- ✅ API usage логи (`ApiUsage`)
- ✅ Транзакции (`Transaction`)
- ✅ Accounts (Google OAuth связи)

---

## 🎉 **Итог:**

✅ Удаление пользователей из админки теперь работает корректно!

**Файлы изменены:**
- `app/api/admin/users/route.ts` — добавлен метод DELETE

