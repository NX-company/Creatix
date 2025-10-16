# 💾 S3 Storage & File Limits - Database Setup

## ✅ COMPLETED: Database Migration

**Дата:** 16 октября 2024  
**Миграция:** `20251016094736_add_s3_storage_and_limits`

---

## 📊 **ЧТО ДОБАВЛЕНО В БАЗУ ДАННЫХ:**

### **1. Модель `User` - Лимиты хранения:**

```prisma
model User {
  // ... existing fields ...
  
  // S3 Storage Limits
  projectsCount       Int       @default(0)   // Текущее количество проектов
  projectsLimit       Int       @default(5)   // Лимит: 5 проектов
  filesCount          Int       @default(0)   // Текущее количество файлов (общий)
  filesLimit          Int       @default(70)  // Лимит: 70 файлов на все проекты
}
```

**Жесткие лимиты:**
- ✅ **Максимум 5 проектов** на пользователя
- ✅ **Максимум 70 файлов** на все проекты (общий лимит)

---

### **2. Модель `Project` - S3 хранилище:**

```prisma
model Project {
  // ... existing fields ...
  
  // S3 Storage
  s3Key         String?              // Путь в S3: documents/user-{userId}/{projectId}.html
  s3Url         String?              // Полный URL для доступа к файлу
  fileSize      Int?                 // Размер HTML файла в байтах
  isSaved       Boolean  @default(false)  // Сохранен ли проект в S3
  
  @@index([userId, createdAt])  // Индекс для быстрой сортировки
}
```

**Назначение:**
- `s3Key` - путь к файлу в S3 bucket
- `s3Url` - прямая ссылка для скачивания/просмотра
- `fileSize` - размер для контроля хранилища
- `isSaved` - флаг, сохранен ли проект на сервере

---

### **3. Модель `ProjectFile` - S3 для файлов:**

```prisma
model ProjectFile {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(...)
  fileName    String
  fileType    String   // image/png, image/jpeg, etc.
  fileSize    Int      // Размер в байтах
  
  // S3 Storage
  s3Key       String   // Путь в S3: images/user-{userId}/uploads/{fileId}.{ext}
  s3Url       String   // Полный URL для доступа
  
  uploadedAt  DateTime @default(now())
  
  @@index([projectId])
}
```

**Назначение:**
- Хранение загруженных пользователем файлов (логотипы, фото)
- AI-сгенерированные изображения
- Счетчик общий: максимум 70 файлов на все проекты

---

## 🗂️ **СТРУКТУРА ХРАНИЛИЩА S3:**

```
neurodiz-storage/
├── documents/
│   └── user-{userId}/
│       ├── {projectId}.html         # HTML документы
│       └── {projectId}_v2.html      # Версии (будущее)
│
└── images/
    └── user-{userId}/
        ├── ai-generated/
        │   └── {imageId}.png        # AI изображения
        └── uploads/
            └── {fileId}.jpg         # Загруженные файлы
```

---

## 🔒 **ЛОГИКА ОГРАНИЧЕНИЙ:**

### **Проверка перед сохранением проекта:**

```typescript
if (user.projectsCount >= user.projectsLimit) {
  // Автоматически удалить самый старый проект
  const oldestProject = await prisma.project.findFirst({
    where: { userId, isSaved: true },
    orderBy: { createdAt: 'asc' }
  });
  
  if (oldestProject) {
    // Удалить из S3
    await deleteFromS3(oldestProject.s3Key);
    
    // Удалить из БД
    await prisma.project.delete({ where: { id: oldestProject.id } });
    
    // Обновить счетчик
    await prisma.user.update({
      where: { id: userId },
      data: { projectsCount: { decrement: 1 } }
    });
  }
}
```

### **Проверка перед загрузкой файла:**

```typescript
if (user.filesCount >= user.filesLimit) {
  // Автоматически удалить самый старый файл
  const oldestFile = await prisma.projectFile.findFirst({
    where: { project: { userId } },
    orderBy: { uploadedAt: 'asc' }
  });
  
  if (oldestFile) {
    // Удалить из S3
    await deleteFromS3(oldestFile.s3Key);
    
    // Удалить из БД
    await prisma.projectFile.delete({ where: { id: oldestFile.id } });
    
    // Обновить счетчик
    await prisma.user.update({
      where: { id: userId },
      data: { filesCount: { decrement: 1 } }
    });
  }
}
```

---

## 📋 **SQL ИЗМЕНЕНИЯ (МИГРАЦИЯ):**

```sql
-- Добавляем поля в User
ALTER TABLE "User" 
  ADD COLUMN "filesCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "filesLimit" INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN "projectsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "projectsLimit" INTEGER NOT NULL DEFAULT 5;

-- Добавляем поля в Project
ALTER TABLE "Project" 
  ADD COLUMN "fileSize" INTEGER,
  ADD COLUMN "isSaved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "s3Key" TEXT,
  ADD COLUMN "s3Url" TEXT;

-- Обновляем ProjectFile
ALTER TABLE "ProjectFile" 
  DROP COLUMN "storagePath",
  ADD COLUMN "s3Key" TEXT NOT NULL,
  ADD COLUMN "s3Url" TEXT NOT NULL;

-- Создаем индексы
CREATE INDEX "Project_userId_createdAt_idx" ON "Project"("userId", "createdAt");
CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");
```

---

## ✅ **СТАТУС:**

- ✅ Schema обновлена
- ✅ Миграция создана и применена
- ✅ Prisma Client сгенерирован
- ✅ Индексы добавлены для производительности
- ⏳ API endpoints (следующий шаг)
- ⏳ S3 интеграция (следующий шаг)

---

## 🚀 **СЛЕДУЮЩИЕ ШАГИ:**

### **1. Настройка Timeweb S3 (30 мин)**
- Создать bucket
- Получить Access Key & Secret Key
- Настроить CORS

### **2. Установка зависимостей (5 мин)**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### **3. Создание API endpoints (2-3 часа)**
- `POST /api/projects/save` - сохранение в S3
- `GET /api/projects/list` - список проектов
- `GET /api/projects/:id` - получение проекта
- `GET /api/projects/:id/download` - скачивание
- `DELETE /api/projects/:id` - удаление
- `POST /api/files/upload` - загрузка файлов
- `DELETE /api/files/:id` - удаление файлов

### **4. Обновление UI (1-2 часа)**
- Кнопка "Сохранить" в ChatPanel
- Раздел "Мои документы" в Sidebar
- Показывать лимиты (3/5 проектов, 15/70 файлов)
- Автосохранение после генерации

---

## 📊 **МОНИТОРИНГ ЛИМИТОВ:**

```typescript
// Проверка статуса хранилища
const storageStatus = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    projectsCount: true,
    projectsLimit: true,
    filesCount: true,
    filesLimit: true
  }
});

console.log(`Проекты: ${storageStatus.projectsCount}/${storageStatus.projectsLimit}`);
console.log(`Файлы: ${storageStatus.filesCount}/${storageStatus.filesLimit}`);
```

---

## ⚠️ **ВАЖНО:**

1. **Счетчики обновляются автоматически** при сохранении/удалении
2. **Автоудаление** работает по принципу FIFO (First In, First Out)
3. **Пользователь видит предупреждение** перед автоудалением
4. **Можно вручную управлять** через раздел "Мои документы"

---

**База данных готова к интеграции S3! 🎉**

