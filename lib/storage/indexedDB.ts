import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface StudioDB extends DBSchema {
  htmlPreviews: {
    key: string
    value: {
      projectId: string
      html: string
      timestamp: number
    }
  }
  images: {
    key: string
    value: {
      id: string
      blob: Blob
      type: string
      timestamp: number
    }
  }
  generatedImages: {
    key: string
    value: {
      projectId: string
      imageData: string
      timestamp: number
    }
  }
}

let dbInstance: IDBPDatabase<StudioDB> | null = null
let indexedDBAvailable: boolean | null = null

// Максимальный размер для хранения в localStorage (30 MB)
const MAX_LOCALSTORAGE_SIZE = 30 * 1024 * 1024
const LOCALSTORAGE_PREFIX = 'nx-html-'

/**
 * Проверка доступности IndexedDB
 */
export function isIndexedDBAvailable(): boolean {
  if (indexedDBAvailable !== null) {
    return indexedDBAvailable
  }

  try {
    // Проверяем что IndexedDB существует
    if (typeof indexedDB === 'undefined') {
      console.warn('⚠️ IndexedDB is not available in this browser')
      indexedDBAvailable = false
      return false
    }

    // Проверяем что не в режиме инкогнито (Safari блокирует)
    const test = indexedDB.open('test')
    test.onerror = () => {
      console.warn('⚠️ IndexedDB blocked (possibly private/incognito mode)')
      indexedDBAvailable = false
    }
    test.onsuccess = () => {
      indexedDB.deleteDatabase('test')
      indexedDBAvailable = true
    }

    indexedDBAvailable = true
    return true
  } catch (e) {
    console.warn('⚠️ IndexedDB check failed:', e)
    indexedDBAvailable = false
    return false
  }
}

export async function getDB(): Promise<IDBPDatabase<StudioDB>> {
  if (dbInstance) {
    return dbInstance
  }

  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available')
  }

  try {
    dbInstance = await openDB<StudioDB>('nx-studio-db', 2, {
      upgrade(db, oldVersion) {
        // Увеличена версия до 2 для поддержки больших данных (до 30MB)
        if (!db.objectStoreNames.contains('htmlPreviews')) {
          db.createObjectStore('htmlPreviews')
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images')
        }
        if (!db.objectStoreNames.contains('generatedImages')) {
          db.createObjectStore('generatedImages')
        }
        console.log(`📦 IndexedDB upgraded from v${oldVersion} to v2 (supports up to 30MB per project)`)
      },
    })

    console.log('✅ IndexedDB initialized successfully')
    return dbInstance
  } catch (error) {
    console.error('❌ Failed to open IndexedDB:', error)
    indexedDBAvailable = false
    throw error
  }
}

/**
 * Fallback: Сохранение в localStorage
 */
function saveHTMLToLocalStorage(projectId: string, html: string): boolean {
  try {
    const key = `${LOCALSTORAGE_PREFIX}${projectId}`
    const sizeInBytes = html.length * 2 // UTF-16 = 2 bytes per char

    if (sizeInBytes > MAX_LOCALSTORAGE_SIZE) {
      console.warn(`⚠️ HTML too large for localStorage: ${(sizeInBytes / 1024 / 1024).toFixed(2)} MB (max: 30 MB)`)
      // Сохраняем только первые 30MB
      const maxChars = MAX_LOCALSTORAGE_SIZE / 2
      const truncated = html.substring(0, maxChars)
      localStorage.setItem(key, truncated)
      console.log(`💾 HTML truncated and saved to localStorage (${(maxChars * 2 / 1024 / 1024).toFixed(2)} MB)`)
      return true
    }

    localStorage.setItem(key, html)
    console.log(`💾 HTML saved to localStorage for project ${projectId} (${(sizeInBytes / 1024 / 1024).toFixed(2)} MB)`)
    return true
  } catch (error) {
    console.error('❌ Failed to save HTML to localStorage:', error)
    return false
  }
}

/**
 * Fallback: Загрузка из localStorage
 */
function getHTMLFromLocalStorage(projectId: string): string | null {
  try {
    const key = `${LOCALSTORAGE_PREFIX}${projectId}`
    const html = localStorage.getItem(key)
    if (html) {
      console.log(`📂 HTML loaded from localStorage for project ${projectId} (${(html.length * 2 / 1024 / 1024).toFixed(2)} MB)`)
    }
    return html
  } catch (error) {
    console.error('❌ Failed to load HTML from localStorage:', error)
    return null
  }
}

/**
 * Сохранение HTML с автоматическим fallback
 */
export async function saveHTMLPreview(projectId: string, html: string): Promise<void> {
  // Сначала пробуем IndexedDB
  try {
    const db = await getDB()
    await db.put('htmlPreviews', {
      projectId,
      html,
      timestamp: Date.now()
    }, projectId)
    console.log(`✅ HTML saved to IndexedDB for project ${projectId} (${(html.length * 2 / 1024 / 1024).toFixed(2)} MB)`)
    return
  } catch (error) {
    console.warn('⚠️ IndexedDB save failed, trying localStorage fallback:', error)
  }

  // Fallback: Пробуем localStorage
  const saved = saveHTMLToLocalStorage(projectId, html)
  if (!saved) {
    console.error('❌ CRITICAL: Failed to save HTML to both IndexedDB and localStorage!')
  }
}

/**
 * Загрузка HTML с автоматическим fallback
 */
export async function getHTMLPreview(projectId: string): Promise<string | null> {
  // Сначала пробуем IndexedDB
  try {
    const db = await getDB()
    const data = await db.get('htmlPreviews', projectId)
    if (data) {
      console.log(`✅ HTML loaded from IndexedDB for project ${projectId} (${(data.html.length * 2 / 1024 / 1024).toFixed(2)} MB)`)
      return data.html
    }
  } catch (error) {
    console.warn('⚠️ IndexedDB load failed, trying localStorage fallback:', error)
  }

  // Fallback: Пробуем localStorage
  const html = getHTMLFromLocalStorage(projectId)
  if (html) {
    return html
  }

  console.log(`📭 No HTML found for project ${projectId} in either storage`)
  return null
}

/**
 * Удаление HTML из обоих хранилищ
 */
export async function deleteHTMLPreview(projectId: string): Promise<void> {
  // Удаляем из IndexedDB
  try {
    const db = await getDB()
    await db.delete('htmlPreviews', projectId)
    console.log(`🗑️  HTML deleted from IndexedDB for project ${projectId}`)
  } catch (error) {
    console.warn('⚠️ Failed to delete from IndexedDB:', error)
  }

  // Удаляем из localStorage
  try {
    const key = `${LOCALSTORAGE_PREFIX}${projectId}`
    localStorage.removeItem(key)
    console.log(`🗑️  HTML deleted from localStorage for project ${projectId}`)
  } catch (error) {
    console.warn('⚠️ Failed to delete from localStorage:', error)
  }
}

export async function saveImage(imageId: string, blob: Blob, type: string): Promise<void> {
  try {
    const db = await getDB()
    await db.put('images', {
      id: imageId,
      blob,
      type,
      timestamp: Date.now()
    }, imageId)
    console.log(`💾 Image saved to IndexedDB: ${imageId} (${blob.size} bytes)`)
  } catch (error) {
    console.error('Error saving image to IndexedDB:', error)
  }
}

export async function getImage(imageId: string): Promise<Blob | null> {
  try {
    const db = await getDB()
    const data = await db.get('images', imageId)
    return data?.blob || null
  } catch (error) {
    console.error('Error loading image from IndexedDB:', error)
    return null
  }
}

export async function getImageURL(imageId: string): Promise<string | null> {
  try {
    const blob = await getImage(imageId)
    if (!blob) return null
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error creating image URL from IndexedDB:', error)
    return null
  }
}

export async function deleteImage(imageId: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('images', imageId)
    console.log(`🗑️  Image deleted from IndexedDB: ${imageId}`)
  } catch (error) {
    console.error('Error deleting image from IndexedDB:', error)
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('htmlPreviews')
    await db.clear('images')
    await db.clear('generatedImages')
    console.log('🗑️  All IndexedDB data cleared')
  } catch (error) {
    console.error('Error clearing IndexedDB:', error)
  }
}

export async function getStorageStats(): Promise<{
  htmlCount: number
  imageCount: number
  estimatedSize: string
}> {
  try {
    const db = await getDB()
    const htmlKeys = await db.getAllKeys('htmlPreviews')
    const imageKeys = await db.getAllKeys('images')
    
    const htmls = await db.getAll('htmlPreviews')
    const totalSize = htmls.reduce((acc, item) => acc + item.html.length * 2, 0)
    
    return {
      htmlCount: htmlKeys.length,
      imageCount: imageKeys.length,
      estimatedSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    }
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return {
      htmlCount: 0,
      imageCount: 0,
      estimatedSize: '0 MB'
    }
  }
}


