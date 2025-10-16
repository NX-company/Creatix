/**
 * System Health Check API
 * Мониторинг состояния API ключей и очереди запросов
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRequestManager } from '@/lib/requestManager'

export const maxDuration = 10

export async function GET(request: NextRequest) {
  try {
    const requestManager = getRequestManager()

    // Получаем полную статистику системы
    const stats = requestManager.getStats()
    const capacity = requestManager.getCapacity()
    const isHealthy = requestManager.isHealthy()

    // Формируем ответ
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      
      // Общая информация
      overall: {
        healthy: isHealthy,
        totalCapacity: capacity.total,
        availableSlots: {
          openrouter: capacity.openrouter,
          replicate: capacity.replicate,
          openai: capacity.openai,
        },
      },

      // Статистика ключей
      keyPool: {
        totalKeys: stats.keyPool.totalKeys,
        healthyKeys: stats.keyPool.healthyKeys,
        totalRequests: stats.keyPool.totalRequests,
        totalErrors: stats.keyPool.totalErrors,
        averageLoad: Math.round(stats.keyPool.averageLoad),
      },

      // Статистика очереди
      queue: {
        pending: stats.queue.pending,
        processing: stats.queue.processing,
        completed: stats.queue.completed,
        failed: stats.queue.failed,
        averageWaitTime: `${stats.queue.averageWaitTime}ms`,
        averageProcessingTime: `${stats.queue.averageProcessingTime}ms`,
      },

      // Детальная статистика по провайдерам
      providers: {
        openrouter: {
          queue: stats.providerStats.openrouter.queue,
          healthyKeys: stats.providerStats.openrouter.keys.filter(
            (k: any) => k.isHealthy
          ).length,
          totalKeys: stats.providerStats.openrouter.keys.length,
          keys: stats.providerStats.openrouter.keys,
        },
        replicate: {
          queue: stats.providerStats.replicate.queue,
          healthyKeys: stats.providerStats.replicate.keys.filter(
            (k: any) => k.isHealthy
          ).length,
          totalKeys: stats.providerStats.replicate.keys.length,
          keys: stats.providerStats.replicate.keys,
        },
        openai: {
          queue: stats.providerStats.openai.queue,
          healthyKeys: stats.providerStats.openai.keys.filter(
            (k: any) => k.isHealthy
          ).length,
          totalKeys: stats.providerStats.openai.keys.length,
          keys: stats.providerStats.openai.keys,
        },
      },
    }

    // Возвращаем соответствующий HTTP статус
    const httpStatus = isHealthy ? 200 : 503

    return NextResponse.json(healthStatus, { status: httpStatus })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

