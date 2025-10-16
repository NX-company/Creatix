/**
 * Unified Request Manager
 * Объединяет API Key Pool и Request Queue для простого использования
 */

import OpenAI from 'openai'
import { getApiKeyPool } from './apiKeyPool'
import { getRequestQueue } from './requestQueue'

interface OpenRouterOptions {
  model: string
  messages: any[]
  temperature?: number
  max_tokens?: number
  priority?: number
}

interface ReplicateImageOptions {
  prompt: string
  model?: string
  priority?: number
}

interface OpenAIImageOptions {
  prompt: string
  model?: string
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  priority?: number
}

interface RequestStats {
  queue: any
  keyPool: any
  providerStats: {
    openrouter: any
    replicate: any
    openai: any
  }
}

class UnifiedRequestManager {
  private keyPool = getApiKeyPool()
  private queue = getRequestQueue()

  /**
   * Выполнить OpenRouter запрос (текстовая генерация)
   */
  async openrouterRequest(options: OpenRouterOptions): Promise<any> {
    return this.queue.enqueue(
      'openrouter',
      async () => {
        const apiKey = this.keyPool.getKey('openrouter')
        if (!apiKey) {
          throw new Error('No available OpenRouter API keys')
        }

        try {
          const client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
              'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://neurodiz.app',
              'X-Title': 'Neurodiz AI Agent',
            },
          })

          const completion = await client.chat.completions.create({
            model: options.model,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            ...(options.max_tokens ? { max_tokens: options.max_tokens } : {}),
          })

          this.keyPool.markSuccess(apiKey)

          return {
            content: completion.choices[0]?.message?.content || '',
            usage: completion.usage,
            model: options.model,
          }
        } catch (error) {
          this.keyPool.markError(apiKey, error as Error)
          throw error
        }
      },
      {
        priority: options.priority ?? 5,
        maxRetries: 3,
        timeout: 60000, // 60 секунд
      }
    )
  }

  /**
   * Выполнить Replicate запрос (генерация изображений Flux)
   */
  async replicateImageRequest(options: ReplicateImageOptions): Promise<any> {
    return this.queue.enqueue(
      'replicate',
      async () => {
        const apiKey = this.keyPool.getKey('replicate')
        if (!apiKey) {
          throw new Error('No available Replicate API keys')
        }

        try {
          const model = options.model || 'black-forest-labs/flux-schnell'

          const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: await this.getReplicateModelVersion(model),
              input: {
                prompt: options.prompt,
                num_outputs: 1,
                aspect_ratio: '16:9',
                output_format: 'png',
                output_quality: 90,
              },
            }),
          })

          if (!response.ok) {
            throw new Error(`Replicate API error: ${response.statusText}`)
          }

          let prediction = await response.json()

          // Ждем завершения генерации
          while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const statusResponse = await fetch(prediction.urls.get, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            })

            prediction = await statusResponse.json()
          }

          if (prediction.status === 'failed') {
            throw new Error(`Replicate generation failed: ${prediction.error}`)
          }

          this.keyPool.markSuccess(apiKey)

          return {
            url: prediction.output[0],
            model: model,
          }
        } catch (error) {
          this.keyPool.markError(apiKey, error as Error)
          throw error
        }
      },
      {
        priority: options.priority ?? 5,
        maxRetries: 2,
        timeout: 120000, // 2 минуты для генерации изображений
      }
    )
  }

  /**
   * Выполнить OpenAI запрос (DALL-E 3)
   */
  async openaiImageRequest(options: OpenAIImageOptions): Promise<any> {
    return this.queue.enqueue(
      'openai',
      async () => {
        const apiKey = this.keyPool.getKey('openai')
        if (!apiKey) {
          throw new Error('No available OpenAI API keys')
        }

        try {
          const client = new OpenAI({ apiKey })

          const response = await client.images.generate({
            model: options.model || 'dall-e-3',
            prompt: options.prompt,
            n: 1,
            size: options.size || '1024x1024',
            quality: 'standard',
          })

          this.keyPool.markSuccess(apiKey)

          return {
            url: response.data[0].url,
            model: options.model || 'dall-e-3',
          }
        } catch (error) {
          this.keyPool.markError(apiKey, error as Error)
          throw error
        }
      },
      {
        priority: options.priority ?? 5,
        maxRetries: 2,
        timeout: 120000, // 2 минуты
      }
    )
  }

  /**
   * Получить версию модели Replicate (кешируем для производительности)
   */
  private async getReplicateModelVersion(model: string): Promise<string> {
    // Hardcoded версии для популярных моделей
    const versions: Record<string, string> = {
      'black-forest-labs/flux-schnell':
        'bbf5f46c35bfbf7e',
      'black-forest-labs/flux-dev':
        '8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f',
    }

    return (
      versions[model] ||
      'bbf5f46c35bfbf7e' // Default to Flux Schnell
    )
  }

  /**
   * Получить общую статистику системы
   */
  getStats(): RequestStats {
    return {
      queue: this.queue.getStats(),
      keyPool: this.keyPool.getStats(),
      providerStats: {
        openrouter: {
          queue: this.queue.getProviderStats('openrouter'),
          keys: this.keyPool.getProviderStats('openrouter'),
        },
        replicate: {
          queue: this.queue.getProviderStats('replicate'),
          keys: this.keyPool.getProviderStats('replicate'),
        },
        openai: {
          queue: this.queue.getProviderStats('openai'),
          keys: this.keyPool.getProviderStats('openai'),
        },
      },
    }
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    const keyPoolStats = this.keyPool.getStats()
    const queueStats = this.queue.getStats()

    // Проверяем что есть хотя бы 1 здоровый ключ и очередь не переполнена
    return (
      keyPoolStats.healthyKeys > 0 &&
      queueStats.pending < 1000 && // Не более 1000 ожидающих запросов
      queueStats.failed < 100 // Не более 100 проваленных запросов
    )
  }

  /**
   * Получить доступную емкость системы
   */
  getCapacity(): {
    openrouter: number
    replicate: number
    openai: number
    total: number
  } {
    const openrouterSlots = this.queue.getAvailableSlots('openrouter')
    const replicateSlots = this.queue.getAvailableSlots('replicate')
    const openaiSlots = this.queue.getAvailableSlots('openai')

    return {
      openrouter: openrouterSlots,
      replicate: replicateSlots,
      openai: openaiSlots,
      total: openrouterSlots + replicateSlots + openaiSlots,
    }
  }
}

// Singleton instance
let requestManagerInstance: UnifiedRequestManager | null = null

export function getRequestManager(): UnifiedRequestManager {
  if (!requestManagerInstance) {
    requestManagerInstance = new UnifiedRequestManager()
  }
  return requestManagerInstance
}

export type {
  OpenRouterOptions,
  ReplicateImageOptions,
  OpenAIImageOptions,
  RequestStats,
}

