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

export async function getDB(): Promise<IDBPDatabase<StudioDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<StudioDB>('nx-studio-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('htmlPreviews')) {
        db.createObjectStore('htmlPreviews')
      }
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images')
      }
      if (!db.objectStoreNames.contains('generatedImages')) {
        db.createObjectStore('generatedImages')
      }
    },
  })

  return dbInstance
}

export async function saveHTMLPreview(projectId: string, html: string): Promise<void> {
  try {
    const db = await getDB()
    await db.put('htmlPreviews', {
      projectId,
      html,
      timestamp: Date.now()
    }, projectId)
    console.log(`💾 HTML saved to IndexedDB for project ${projectId} (${html.length} chars)`)
  } catch (error) {
    console.error('Error saving HTML to IndexedDB:', error)
  }
}

export async function getHTMLPreview(projectId: string): Promise<string | null> {
  try {
    const db = await getDB()
    const data = await db.get('htmlPreviews', projectId)
    if (data) {
      console.log(`📂 HTML loaded from IndexedDB for project ${projectId} (${data.html.length} chars)`)
      return data.html
    }
    return null
  } catch (error) {
    console.error('Error loading HTML from IndexedDB:', error)
    return null
  }
}

export async function deleteHTMLPreview(projectId: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('htmlPreviews', projectId)
    console.log(`🗑️  HTML deleted from IndexedDB for project ${projectId}`)
  } catch (error) {
    console.error('Error deleting HTML from IndexedDB:', error)
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


