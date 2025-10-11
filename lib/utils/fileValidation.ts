import { FILE_SIZE_LIMITS } from '../constants'

export type FileValidationResult = {
  valid: boolean
  error?: string
  sizeMB?: number
}

export function validateFileSize(file: File): FileValidationResult {
  const sizeMB = file.size / 1024 / 1024
  const fileType = file.type

  if (fileType.startsWith('image/')) {
    if (file.size > FILE_SIZE_LIMITS.IMAGE) {
      return {
        valid: false,
        error: `Image too large (${sizeMB.toFixed(2)} MB). Max: ${FILE_SIZE_LIMITS.IMAGE / 1024 / 1024} MB`,
        sizeMB
      }
    }
  } else if (fileType.startsWith('video/')) {
    if (file.size > FILE_SIZE_LIMITS.VIDEO) {
      return {
        valid: false,
        error: `Video too large (${sizeMB.toFixed(2)} MB). Max: ${FILE_SIZE_LIMITS.VIDEO / 1024 / 1024} MB`,
        sizeMB
      }
    }
  } else {
    if (file.size > FILE_SIZE_LIMITS.FILE) {
      return {
        valid: false,
        error: `File too large (${sizeMB.toFixed(2)} MB). Max: ${FILE_SIZE_LIMITS.FILE / 1024 / 1024} MB`,
        sizeMB
      }
    }
  }

  return { valid: true, sizeMB }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return fileName.endsWith(type)
    }
    return fileType.includes(type)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}


