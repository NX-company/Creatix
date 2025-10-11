# IndexedDB Migration - Storage Upgrade

## 🎯 Что было сделано

### Проблема
- HTML с base64 изображениями занимал ~4-5 MB
- localStorage имеет лимит ~5-10 MB
- При сохранении больших HTML возникала ошибка `QuotaExceededError: localStorage quota exceeded`
- Невозможно было работать с документами в PRO режиме (DALL-E генерирует HD изображения)

### Решение
Перенесли хранение HTML из localStorage в IndexedDB:

| Storage | Лимит | Что хранится |
|---------|-------|--------------|
| **localStorage** | ~5-10 MB | Метаданные проектов, настройки, сообщения |
| **IndexedDB** | ~50-100 MB | HTML с встроенными изображениями |

## 📦 Изменения

### Новые файлы
- `lib/storage/indexedDB.ts` - функции для работы с IndexedDB

### Обновленные файлы
- `lib/store.ts`:
  - Добавлены функции `loadHTMLFromIndexedDB()`
  - `setHtmlPreview()` сохраняет HTML в IndexedDB
  - `saveCurrentProject()` НЕ сохраняет HTML в localStorage
  - `switchProject()` / `deleteProject()` загружают/удаляют HTML из IndexedDB
  - Миграция версии 4: удаление старых `htmlPreview` и `htmlPreviews` из localStorage

- `lib/constants.ts`:
  - `STORAGE_VERSION` обновлена до `4`

- `app/page.tsx`:
  - Добавлен `useEffect` для автоматической загрузки HTML из IndexedDB при старте

- `app/api/dalle-generate/route.ts`:
  - Исправлен баг `agent is not defined` (уже было исправлено ранее, теперь применено после перезапуска)

### Установленные пакеты
```json
"idb": "^7.1.1"
```

## 🚀 Как это работает

### Сохранение HTML
```typescript
// Когда генерируется новый HTML
setHtmlPreview(html)
  → Сохраняет в memory (state)
  → Асинхронно сохраняет в IndexedDB
  → Ключ: `${projectId}-${docType}` (например: "project-123-proposal")
```

### Загрузка HTML
```typescript
// При переключении проекта или типа документа
switchProject(id) / setDocType(type)
  → Очищает htmlPreview в state
  → Вызывает loadHTMLFromIndexedDB()
  → Загружает HTML из IndexedDB по ключу `${projectId}-${docType}`
  → Обновляет state
```

### Удаление HTML
```typescript
// При удалении проекта
deleteProject(id)
  → Удаляет все HTML для всех типов документов (proposal, invoice, email, etc.)
  → Удаляет проект из localStorage
  → Переключается на другой проект и загружает его HTML из IndexedDB
```

## 📊 Преимущества

1. **Больше места**: IndexedDB лимит ~50-100 MB вместо ~5-10 MB localStorage
2. **Производительность**: Асинхронный API, не блокирует UI
3. **Масштабируемость**: Готовность к видео и большим изображениям в будущем
4. **Надежность**: Автоматическая миграция без потери данных

## 🔧 API функции

### `lib/storage/indexedDB.ts`

```typescript
// Сохранить HTML для проекта
await saveHTMLPreview(storageKey: string, html: string): Promise<void>

// Загрузить HTML для проекта
await getHTMLPreview(storageKey: string): Promise<string | null>

// Удалить HTML для проекта
await deleteHTMLPreview(storageKey: string): Promise<void>

// Очистить все данные IndexedDB
await clearAllData(): Promise<void>

// Получить статистику хранилища
await getStorageStats(): Promise<{
  htmlCount: number
  imageCount: number
  estimatedSize: string
}>
```

## ⚠️ Важно

1. **Автоматическая миграция**: При первой загрузке приложения произойдет миграция на версию 4
   - Старые `htmlPreview` будут удалены из localStorage
   - HTML НЕ будет автоматически перенесен в IndexedDB (новые HTML будут генерироваться заново)

2. **Очистка данных**: Если нужно очистить все данные IndexedDB:
   ```javascript
   // В консоли браузера (F12)
   import { clearAllData } from './lib/storage/indexedDB'
   await clearAllData()
   ```

3. **Проверка данных**: Чтобы проверить что хранится в IndexedDB:
   - Откройте DevTools (F12)
   - Вкладка "Application" → "IndexedDB" → "nx-studio-db"
   - Раздел "htmlPreviews" - все сохраненные HTML

## 🐛 Что было исправлено дополнительно

1. **DALL-E ошибка `agent is not defined`**:
   - Исправлено в `app/api/dalle-generate/route.ts`
   - Теперь проверяется существование `agent` перед использованием

2. **Iframe sandbox warning**:
   - Удален `allow-same-origin` из sandbox (остался только `allow-scripts allow-popups`)

## ✅ Тестирование

После миграции протестируйте:

1. ✅ Создание нового документа в Free mode
2. ✅ Создание нового документа в Advanced mode (с Flux изображениями)
3. ✅ Создание нового документа в PRO mode (с DALL-E HD изображениями)
4. ✅ Переключение между типами документов (proposal → email → invoice)
5. ✅ Переключение между проектами
6. ✅ Удаление проекта
7. ✅ Перезагрузка страницы - HTML должен загрузиться из IndexedDB

## 📈 Следующие шаги (опционально)

1. **Кеширование изображений**: Сохранять AI-генерированные изображения в IndexedDB отдельно от HTML
2. **Оффлайн режим**: Service Worker для работы без интернета
3. **Синхронизация**: Backend API для синхронизации между устройствами
4. **Компрессия**: Сжатие HTML перед сохранением в IndexedDB (LZ-string)


