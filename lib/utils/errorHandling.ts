export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return `API Error: ${error.message}${error.details ? ` (${error.details})` : ''}`
  }
  
  if (error instanceof TimeoutError) {
    return 'Request timeout. Please try again.'
  }
  
  if (error instanceof ValidationError) {
    return `Validation Error: ${error.message}`
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Unknown error occurred'
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof Error ? error.name : typeof error,
    timestamp: new Date().toISOString()
  })
}


