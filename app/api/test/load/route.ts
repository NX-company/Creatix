/**
 * Load Testing API для тестирования системы очереди
 * 
 * Использование:
 * POST /api/test/load
 * Body: { "requests": 10, "delay": 100 }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRequestManager } from '@/lib/requestManager'

export const maxDuration = 300 // 5 минут для нагрузочного теста

export async function POST(request: NextRequest) {
  try {
    const { requests = 10, delay = 100 } = await request.json()

    if (requests > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 requests per test' },
        { status: 400 }
      )
    }

    const requestManager = getRequestManager()
    const startTime = Date.now()

    console.log(`🧪 Starting load test: ${requests} requests`)

    // Создаем массив промисов для параллельного выполнения
    const promises: Promise<any>[] = []

    for (let i = 0; i < requests; i++) {
      // Задержка между добавлением запросов в очередь
      if (delay > 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      const promise = requestManager
        .openrouterRequest({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'user',
              content: `Напиши короткое предложение (10-15 слов) на тему: "Тест ${i + 1}"`,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
          priority: 5,
        })
        .then((result) => ({
          index: i,
          success: true,
          length: result.content.length,
          model: result.model,
        }))
        .catch((error) => ({
          index: i,
          success: false,
          error: error.message,
        }))

      promises.push(promise)
    }

    console.log(`⏳ Waiting for ${promises.length} requests to complete...`)

    // Ждем завершения всех запросов
    const results = await Promise.all(promises)

    const endTime = Date.now()
    const totalTime = endTime - startTime

    // Анализируем результаты
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    const avgTimePerRequest = totalTime / requests

    // Получаем финальную статистику
    const stats = requestManager.getStats()
    const capacity = requestManager.getCapacity()

    const summary = {
      test: {
        totalRequests: requests,
        successful,
        failed,
        totalTime: `${totalTime}ms`,
        avgTimePerRequest: `${Math.round(avgTimePerRequest)}ms`,
        requestsPerSecond: Math.round((requests / totalTime) * 1000),
      },
      systemStats: {
        queue: stats.queue,
        keyPool: stats.keyPool,
        capacity,
      },
      results: results.slice(0, 10), // Показываем первые 10 результатов
    }

    console.log(`✅ Load test completed:`)
    console.log(`   Total: ${requests} requests`)
    console.log(`   Successful: ${successful}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Total time: ${totalTime}ms`)
    console.log(`   Avg per request: ${Math.round(avgTimePerRequest)}ms`)
    console.log(`   Requests/sec: ${summary.test.requestsPerSecond}`)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Load test error:', error)
    return NextResponse.json(
      {
        error: 'Load test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET метод для получения текущей статистики без запуска теста
 */
export async function GET(request: NextRequest) {
  try {
    const requestManager = getRequestManager()
    const stats = requestManager.getStats()
    const capacity = requestManager.getCapacity()
    const isHealthy = requestManager.isHealthy()

    return NextResponse.json({
      healthy: isHealthy,
      stats,
      capacity,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

