/**
 * In-Memory Request Queue
 * Управляет очередью запросов с приоритетами и rate limiting
 */

interface QueuedRequest<T = any> {
  id: string
  priority: number // 0 = highest, 10 = lowest
  provider: 'openrouter' | 'replicate' | 'openai'
  request: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
  retryCount: number
  maxRetries: number
  timeout?: number
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  averageWaitTime: number
  averageProcessingTime: number
}

class RequestQueueManager {
  private queue: QueuedRequest[] = []
  private processing = new Set<string>()
  private completed = new Map<string, number>() // requestId -> completionTime
  private failed = new Map<string, Error>()

  private readonly maxConcurrentRequests: Record<string, number> = {
    openrouter: 50, // 50 одновременных запросов на OpenRouter
    replicate: 30, // 30 для Replicate
    openai: 3, // 3 для DALL-E 3 (медленный)
  }

  private processingTimer: NodeJS.Timeout | null = null
  private statsResetTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startProcessing()
    this.startStatsReset()
  }

  /**
   * Добавить запрос в очередь
   */
  async enqueue<T>(
    provider: 'openrouter' | 'replicate' | 'openai',
    request: () => Promise<T>,
    options: {
      priority?: number
      maxRetries?: number
      timeout?: number
    } = {}
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id: this.generateRequestId(),
        priority: options.priority ?? 5,
        provider,
        request,
        resolve: resolve as any,
        reject,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries ?? 3,
        timeout: options.timeout,
      }

      this.queue.push(queuedRequest)
      this.sortQueue()

      console.log(
        `📥 Queued request ${queuedRequest.id} (${provider}, priority ${queuedRequest.priority})`
      )
      console.log(`   Queue size: ${this.queue.length}, Processing: ${this.processing.size}`)
    })
  }

  /**
   * Сортировка очереди по приоритету и времени
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Сначала по приоритету
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // Потом по времени добавления (FIFO)
      return a.timestamp - b.timestamp
    })
  }

  /**
   * Обработка очереди
   */
  private async processQueue(): Promise<void> {
    // Проверяем каждого провайдера отдельно
    for (const provider of ['openrouter', 'replicate', 'openai'] as const) {
      const currentProcessing = Array.from(this.processing).filter((id) => {
        const request = this.queue.find((r) => r.id === id)
        return request?.provider === provider
      }).length

      const maxConcurrent = this.maxConcurrentRequests[provider]
      const availableSlots = maxConcurrent - currentProcessing

      if (availableSlots <= 0) continue

      // Берем запросы для этого провайдера
      const providerRequests = this.queue
        .filter((r) => r.provider === provider && !this.processing.has(r.id))
        .slice(0, availableSlots)

      for (const request of providerRequests) {
        this.processRequest(request)
      }
    }
  }

  /**
   * Обработать один запрос
   */
  private async processRequest(queuedRequest: QueuedRequest): Promise<void> {
    this.processing.add(queuedRequest.id)
    
    // Удаляем из очереди
    const index = this.queue.findIndex((r) => r.id === queuedRequest.id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }

    const startTime = Date.now()

    try {
      console.log(
        `⚡ Processing request ${queuedRequest.id} (${queuedRequest.provider}, attempt ${queuedRequest.retryCount + 1}/${queuedRequest.maxRetries + 1})`
      )

      // Добавляем timeout если указан
      let result: any
      if (queuedRequest.timeout) {
        result = await Promise.race([
          queuedRequest.request(),
          this.timeoutPromise(queuedRequest.timeout),
        ])
      } else {
        result = await queuedRequest.request()
      }

      const duration = Date.now() - startTime
      console.log(`✅ Request ${queuedRequest.id} completed in ${duration}ms`)

      this.completed.set(queuedRequest.id, duration)
      this.processing.delete(queuedRequest.id)

      queuedRequest.resolve(result)
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(
        `❌ Request ${queuedRequest.id} failed after ${duration}ms:`,
        error instanceof Error ? error.message : error
      )

      // Retry logic
      if (queuedRequest.retryCount < queuedRequest.maxRetries) {
        queuedRequest.retryCount++
        this.processing.delete(queuedRequest.id)
        
        console.log(
          `🔄 Retrying request ${queuedRequest.id} (attempt ${queuedRequest.retryCount + 1}/${queuedRequest.maxRetries + 1})`
        )

        // Добавляем обратно в очередь с небольшой задержкой
        setTimeout(() => {
          this.queue.push(queuedRequest)
          this.sortQueue()
        }, 1000 * queuedRequest.retryCount) // Exponential backoff
      } else {
        this.failed.set(queuedRequest.id, error as Error)
        this.processing.delete(queuedRequest.id)
        queuedRequest.reject(error as Error)
      }
    }
  }

  /**
   * Promise для timeout
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    })
  }

  /**
   * Генерация уникального ID для запроса
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Получить статистику очереди
   */
  getStats(): QueueStats {
    const completedTimes = Array.from(this.completed.values())
    const avgProcessingTime =
      completedTimes.length > 0
        ? completedTimes.reduce((sum, t) => sum + t, 0) / completedTimes.length
        : 0

    // Вычисляем среднее время ожидания
    const currentTime = Date.now()
    const waitTimes = this.queue.map((r) => currentTime - r.timestamp)
    const avgWaitTime =
      waitTimes.length > 0 ? waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length : 0

    return {
      pending: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      averageWaitTime: Math.round(avgWaitTime),
      averageProcessingTime: Math.round(avgProcessingTime),
    }
  }

  /**
   * Получить детальную статистику по провайдеру
   */
  getProviderStats(provider: 'openrouter' | 'replicate' | 'openai'): any {
    const providerQueue = this.queue.filter((r) => r.provider === provider)
    const providerProcessing = Array.from(this.processing).filter((id) => {
      const request = this.queue.find((r) => r.id === id)
      return request?.provider === provider
    })

    return {
      provider,
      pending: providerQueue.length,
      processing: providerProcessing.length,
      maxConcurrent: this.maxConcurrentRequests[provider],
      utilizationPercent: Math.round(
        (providerProcessing.length / this.maxConcurrentRequests[provider]) * 100
      ),
    }
  }

  /**
   * Запустить обработку очереди
   */
  private startProcessing(): void {
    // Проверяем очередь каждые 100ms для быстрой реакции
    this.processingTimer = setInterval(() => {
      this.processQueue()
    }, 100)

    console.log('🚀 Request Queue Manager started')
  }

  /**
   * Периодически сбрасываем статистику
   */
  private startStatsReset(): void {
    this.statsResetTimer = setInterval(() => {
      const stats = this.getStats()
      console.log(
        `📊 Queue Stats: ${stats.pending} pending, ${stats.processing} processing, ${stats.completed} completed, ${stats.failed} failed`
      )
      console.log(
        `   Avg wait: ${stats.averageWaitTime}ms, Avg processing: ${stats.averageProcessingTime}ms`
      )

      // Очищаем старую статистику (старше 5 минут)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      for (const [id, time] of this.completed.entries()) {
        if (time < fiveMinutesAgo) {
          this.completed.delete(id)
        }
      }

      // Очищаем старые ошибки
      this.failed.clear()
    }, 60000) // Каждую минуту
  }

  /**
   * Остановить обработку (для тестов)
   */
  stop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
      this.processingTimer = null
    }
    if (this.statsResetTimer) {
      clearInterval(this.statsResetTimer)
      this.statsResetTimer = null
    }
    console.log('🛑 Request Queue Manager stopped')
  }

  /**
   * Получить количество доступных слотов для провайдера
   */
  getAvailableSlots(provider: 'openrouter' | 'replicate' | 'openai'): number {
    const currentProcessing = Array.from(this.processing).filter((id) => {
      const request = this.queue.find((r) => r.id === id)
      return request?.provider === provider
    }).length

    return this.maxConcurrentRequests[provider] - currentProcessing
  }
}

// Singleton instance
let queueInstance: RequestQueueManager | null = null

export function getRequestQueue(): RequestQueueManager {
  if (!queueInstance) {
    queueInstance = new RequestQueueManager()
  }
  return queueInstance
}

export type { QueuedRequest, QueueStats }

