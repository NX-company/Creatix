/**
 * API Key Pool Manager
 * Управляет несколькими API ключами с load balancing и health checks
 */

interface ApiKeyConfig {
  key: string
  provider: 'openrouter' | 'replicate' | 'openai'
  isHealthy: boolean
  requestCount: number
  errorCount: number
  lastError: Date | null
  rateLimit: {
    requestsPerMinute: number
    currentMinute: number
    requestsThisMinute: number
  }
}

interface KeyPoolStats {
  totalKeys: number
  healthyKeys: number
  totalRequests: number
  totalErrors: number
  averageLoad: number
}

class ApiKeyPoolManager {
  private keys: Map<string, ApiKeyConfig> = new Map()
  private roundRobinIndex = 0
  private readonly maxErrorsBeforeDisable = 5
  private readonly healthCheckInterval = 60000 // 1 минута
  private healthCheckTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initializeKeys()
    this.startHealthChecks()
  }

  /**
   * Инициализация пула ключей из переменных окружения
   */
  private initializeKeys(): void {
    // OpenRouter ключи
    const openrouterKeys = this.getKeysFromEnv('OPENROUTER_API_KEY')
    openrouterKeys.forEach((key, index) => {
      this.keys.set(`openrouter-${index}`, {
        key,
        provider: 'openrouter',
        isHealthy: true,
        requestCount: 0,
        errorCount: 0,
        lastError: null,
        rateLimit: {
          requestsPerMinute: 300, // Средний лимит OpenRouter
          currentMinute: this.getCurrentMinute(),
          requestsThisMinute: 0,
        },
      })
    })

    // Replicate ключи
    const replicateKeys = this.getKeysFromEnv('REPLICATE_API_TOKEN')
    replicateKeys.forEach((key, index) => {
      this.keys.set(`replicate-${index}`, {
        key,
        provider: 'replicate',
        isHealthy: true,
        requestCount: 0,
        errorCount: 0,
        lastError: null,
        rateLimit: {
          requestsPerMinute: 3000, // Replicate имеет высокий лимит
          currentMinute: this.getCurrentMinute(),
          requestsThisMinute: 0,
        },
      })
    })

    // OpenAI ключи (DALL-E 3)
    const openaiKeys = this.getKeysFromEnv('OPENAI_API_KEY')
    openaiKeys.forEach((key, index) => {
      this.keys.set(`openai-${index}`, {
        key,
        provider: 'openai',
        isHealthy: true,
        requestCount: 0,
        errorCount: 0,
        lastError: null,
        rateLimit: {
          requestsPerMinute: 5, // DALL-E 3 медленный
          currentMinute: this.getCurrentMinute(),
          requestsThisMinute: 0,
        },
      })
    })

    console.log(`🔑 API Key Pool initialized: ${this.keys.size} total keys`)
    console.log(`   OpenRouter: ${openrouterKeys.length} keys`)
    console.log(`   Replicate: ${replicateKeys.length} keys`)
    console.log(`   OpenAI: ${openaiKeys.length} keys`)
  }

  /**
   * Получить ключи из переменных окружения
   * Поддерживает форматы: KEY, KEY_1, KEY_2, KEY_3...
   */
  private getKeysFromEnv(baseKey: string): string[] {
    const keys: string[] = []

    // Проверяем базовый ключ
    const baseValue = process.env[baseKey]?.trim()
    if (baseValue) {
      keys.push(baseValue)
    }

    // Проверяем пронумерованные ключи (KEY_1, KEY_2, и т.д.)
    let index = 1
    while (true) {
      const numberedKey = process.env[`${baseKey}_${index}`]?.trim()
      if (!numberedKey) break
      keys.push(numberedKey)
      index++
    }

    return keys
  }

  /**
   * Получить текущую минуту (для rate limiting)
   */
  private getCurrentMinute(): number {
    return Math.floor(Date.now() / 60000)
  }

  /**
   * Получить лучший доступный ключ для запроса
   * Использует round-robin с учетом health и rate limits
   */
  getKey(provider: 'openrouter' | 'replicate' | 'openai'): string | null {
    const providerKeys = Array.from(this.keys.entries()).filter(
      ([, config]) => config.provider === provider && config.isHealthy
    )

    if (providerKeys.length === 0) {
      console.error(`❌ No healthy ${provider} keys available!`)
      return null
    }

    // Фильтруем ключи, у которых не превышен rate limit
    const currentMinute = this.getCurrentMinute()
    const availableKeys = providerKeys.filter(([, config]) => {
      // Сброс счетчика если новая минута
      if (config.rateLimit.currentMinute !== currentMinute) {
        config.rateLimit.currentMinute = currentMinute
        config.rateLimit.requestsThisMinute = 0
      }

      return config.rateLimit.requestsThisMinute < config.rateLimit.requestsPerMinute
    })

    if (availableKeys.length === 0) {
      console.warn(`⚠️ All ${provider} keys are rate limited. Using fallback...`)
      // Возвращаем ключ с наименьшим количеством запросов
      const fallbackKey = providerKeys.reduce((min, curr) =>
        curr[1].rateLimit.requestsThisMinute < min[1].rateLimit.requestsThisMinute
          ? curr
          : min
      )
      return fallbackKey[1].key
    }

    // Round-robin выбор среди доступных ключей
    this.roundRobinIndex = (this.roundRobinIndex + 1) % availableKeys.length
    const selectedKey = availableKeys[this.roundRobinIndex]

    // Увеличиваем счетчики
    selectedKey[1].requestCount++
    selectedKey[1].rateLimit.requestsThisMinute++

    console.log(
      `🔑 Selected ${provider} key: ${selectedKey[0]} (${selectedKey[1].rateLimit.requestsThisMinute}/${selectedKey[1].rateLimit.requestsPerMinute} rpm)`
    )

    return selectedKey[1].key
  }

  /**
   * Отметить успешный запрос
   */
  markSuccess(key: string): void {
    const keyId = this.findKeyId(key)
    if (!keyId) return

    const config = this.keys.get(keyId)
    if (!config) return

    // Сбрасываем счетчик ошибок при успехе
    config.errorCount = Math.max(0, config.errorCount - 1)
    config.lastError = null

    // Восстанавливаем здоровье если ключ был помечен как нездоровый
    if (!config.isHealthy && config.errorCount === 0) {
      config.isHealthy = true
      console.log(`✅ Key ${keyId} restored to healthy state`)
    }
  }

  /**
   * Отметить ошибку запроса
   */
  markError(key: string, error: Error): void {
    const keyId = this.findKeyId(key)
    if (!keyId) return

    const config = this.keys.get(keyId)
    if (!config) return

    config.errorCount++
    config.lastError = new Date()

    console.warn(
      `⚠️ Key ${keyId} error (${config.errorCount}/${this.maxErrorsBeforeDisable}): ${error.message}`
    )

    // Отключаем ключ если слишком много ошибок
    if (config.errorCount >= this.maxErrorsBeforeDisable) {
      config.isHealthy = false
      console.error(`❌ Key ${keyId} marked as unhealthy after ${config.errorCount} errors`)
    }
  }

  /**
   * Найти ID ключа по его значению
   */
  private findKeyId(key: string): string | null {
    for (const [id, config] of this.keys.entries()) {
      if (config.key === key) {
        return id
      }
    }
    return null
  }

  /**
   * Получить статистику пула ключей
   */
  getStats(): KeyPoolStats {
    const stats = Array.from(this.keys.values())

    return {
      totalKeys: this.keys.size,
      healthyKeys: stats.filter((k) => k.isHealthy).length,
      totalRequests: stats.reduce((sum, k) => sum + k.requestCount, 0),
      totalErrors: stats.reduce((sum, k) => sum + k.errorCount, 0),
      averageLoad:
        stats.reduce((sum, k) => sum + k.rateLimit.requestsThisMinute, 0) / stats.length,
    }
  }

  /**
   * Получить детальную статистику по провайдеру
   */
  getProviderStats(provider: 'openrouter' | 'replicate' | 'openai'): any {
    const providerKeys = Array.from(this.keys.entries()).filter(
      ([, config]) => config.provider === provider
    )

    return providerKeys.map(([id, config]) => ({
      id,
      isHealthy: config.isHealthy,
      requestCount: config.requestCount,
      errorCount: config.errorCount,
      currentLoad: `${config.rateLimit.requestsThisMinute}/${config.rateLimit.requestsPerMinute}`,
      lastError: config.lastError?.toISOString() || null,
    }))
  }

  /**
   * Периодическая проверка здоровья ключей
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      const stats = this.getStats()
      console.log(`🏥 Health Check: ${stats.healthyKeys}/${stats.totalKeys} healthy keys`)

      // Пытаемся восстановить нездоровые ключи через 5 минут
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      for (const [id, config] of this.keys.entries()) {
        if (
          !config.isHealthy &&
          config.lastError &&
          config.lastError.getTime() < fiveMinutesAgo
        ) {
          config.isHealthy = true
          config.errorCount = 0
          console.log(`♻️ Key ${id} auto-recovered after cooldown period`)
        }
      }
    }, this.healthCheckInterval)
  }

  /**
   * Остановить health checks (для тестов)
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
  }

  /**
   * Получить все здоровые ключи для провайдера
   */
  getHealthyKeysCount(provider: 'openrouter' | 'replicate' | 'openai'): number {
    return Array.from(this.keys.values()).filter(
      (config) => config.provider === provider && config.isHealthy
    ).length
  }
}

// Singleton instance
let apiKeyPoolInstance: ApiKeyPoolManager | null = null

export function getApiKeyPool(): ApiKeyPoolManager {
  if (!apiKeyPoolInstance) {
    apiKeyPoolInstance = new ApiKeyPoolManager()
  }
  return apiKeyPoolInstance
}

export type { ApiKeyConfig, KeyPoolStats }

