import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import { testScenarios } from '@/lib/testing/scenarios'
import { comprehensiveScenarios } from '@/lib/testing/comprehensive-scenarios'
import { analyzeScreenshotWithAI, generateTestReport } from '@/lib/testing/analyzer'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { scenarios: selectedScenarios, useAI = true, useComprehensive = false } = await request.json()

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    console.log('🤖 AI Testing Agent: Starting tests...')
    console.log(`   Base URL: ${baseUrl}`)
    console.log(`   Test Suite: ${useComprehensive ? 'COMPREHENSIVE (40+ tests)' : 'BASIC (8 tests)'}`)
    console.log(`   Selected scenarios: ${selectedScenarios?.length || 'all'}`)
    console.log(`   AI Analysis: ${useAI ? 'enabled' : 'disabled'}`)

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      recordVideo: {
        dir: './test-videos',
        size: { width: 1280, height: 720 }
      }
    })

    const page = await context.newPage()
    
    console.log('📹 Video recording enabled: ./test-videos')

    // Выбираем набор тестов
    const allScenarios = useComprehensive ? comprehensiveScenarios : testScenarios
    
    const scenariosToRun = selectedScenarios 
      ? allScenarios.filter(s => selectedScenarios.includes(s.id))
      : allScenarios

    const results = []

    for (let i = 0; i < scenariosToRun.length; i++) {
      const scenario = scenariosToRun[i]
      
      console.log(`\n[${i + 1}/${scenariosToRun.length}] Running: ${scenario.name}`)
      
      try {
        const result = await scenario.run(page, baseUrl)
        
        let aiAnalysis
        if (useAI && result.screenshot) {
          console.log(`   🧠 Analyzing with GPT-4o Vision...`)
          aiAnalysis = await analyzeScreenshotWithAI(
            result.screenshot,
            `Test: ${scenario.name}. Expected to ${result.passed ? 'pass' : 'fail'}. ${result.details || ''}`,
            scenario.name
          )
          console.log(`   AI found ${aiAnalysis.issues.length} issues`)
        }

        results.push({
          scenario: {
            id: scenario.id,
            name: scenario.name,
            category: scenario.category,
            severity: scenario.severity
          },
          result: {
            passed: result.passed,
            duration: result.duration,
            error: result.error,
            details: result.details,
            screenshot: result.screenshot
          },
          aiAnalysis
        })

        console.log(`   ${result.passed ? '✅ PASSED' : '❌ FAILED'} (${result.duration}ms)`)
        
        if (result.error) {
          console.log(`   Error: ${result.error}`)
        }

        await page.waitForTimeout(1000)

      } catch (error) {
        console.error(`   ❌ Test crashed:`, error)
        results.push({
          scenario: {
            id: scenario.id,
            name: scenario.name,
            category: scenario.category,
            severity: scenario.severity
          },
          result: {
            passed: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Test crashed'
          }
        })
      }
    }

    // Сохраняем путь к видео перед закрытием браузера
    const videoPath = await page.video()?.path()
    
    await browser.close()

    const report = await generateTestReport(results)

    console.log('\n' + report)

    const passed = results.filter(r => r.result.passed).length
    const failed = results.filter(r => !r.result.passed).length
    const totalDuration = results.reduce((sum, r) => sum + r.result.duration, 0)

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        passed,
        failed,
        duration: totalDuration,
        videoPath: videoPath || null
      },
      results,
      report
    })

  } catch (error) {
    console.error('❌ Test Agent Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Test agent failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

