export interface AIAnalysis {
  hasBugs: boolean
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none'
  issues: string[]
  suggestions: string[]
  uiQuality: number
}

export async function analyzeScreenshotWithAI(
  screenshot: string,
  context: string,
  testName: string
): Promise<AIAnalysis> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/openrouter-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an expert QA engineer and UI/UX analyst. Analyze screenshots for bugs, errors, UI issues, and provide detailed feedback in JSON format.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this screenshot from test: "${testName}"

Context: ${context}

Check for:
1. Visible errors (error messages, red text, console errors on screen)
2. Broken UI (missing elements, overlapping text, broken layout)
3. Loading indicators stuck
4. Empty or placeholder content that shouldn't be empty
5. Incorrect styling or CSS issues
6. Any visual bugs

Return ONLY valid JSON:
{
  "hasBugs": boolean,
  "severity": "critical" | "high" | "medium" | "low" | "none",
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1"],
  "uiQuality": 1-10 score
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshot,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        model: 'openai/gpt-4o',
        temperature: 0.3
      }),
    })

    if (!response.ok) {
      throw new Error('AI analysis failed')
    }

    const data = await response.json()
    let result = data.content

    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    const analysis: AIAnalysis = JSON.parse(result)

    return analysis
  } catch (error) {
    console.error('AI Analysis Error:', error)
    return {
      hasBugs: false,
      severity: 'none',
      issues: [],
      suggestions: ['AI analysis unavailable'],
      uiQuality: 5
    }
  }
}

export async function generateTestReport(
  results: Array<{
    scenario: { id: string; name: string; category: string; severity: string }
    result: { passed: boolean; duration: number; error?: string; details?: string }
    aiAnalysis?: AIAnalysis
  }>
): Promise<string> {
  const passed = results.filter(r => r.result.passed).length
  const failed = results.filter(r => !r.result.passed).length
  const totalDuration = results.reduce((sum, r) => sum + r.result.duration, 0)

  const criticalBugs = results.filter(
    r => r.aiAnalysis?.severity === 'critical' || (!r.result.passed && r.scenario.severity === 'critical')
  )
  const highBugs = results.filter(
    r => r.aiAnalysis?.severity === 'high' || (!r.result.passed && r.scenario.severity === 'high')
  )

  let report = `
╔═══════════════════════════════════════════════╗
║         AI Testing Agent Report               ║
╚═══════════════════════════════════════════════╝

✅ Passed: ${passed}/${results.length} tests
❌ Failed: ${failed}/${results.length} tests
⏱️  Total time: ${(totalDuration / 1000).toFixed(1)}s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

  if (criticalBugs.length > 0 || highBugs.length > 0) {
    report += `\n🐛 FOUND BUGS:\n\n`

    criticalBugs.forEach((bug, i) => {
      report += `${i + 1}. [CRITICAL] ${bug.scenario.name}\n`
      if (bug.result.error) {
        report += `   Error: ${bug.result.error}\n`
      }
      if (bug.aiAnalysis?.issues.length) {
        bug.aiAnalysis.issues.forEach(issue => {
          report += `   - ${issue}\n`
        })
      }
      report += `\n`
    })

    highBugs.forEach((bug, i) => {
      report += `${criticalBugs.length + i + 1}. [HIGH] ${bug.scenario.name}\n`
      if (bug.result.error) {
        report += `   Error: ${bug.result.error}\n`
      }
      if (bug.aiAnalysis?.issues.length) {
        bug.aiAnalysis.issues.forEach(issue => {
          report += `   - ${issue}\n`
        })
      }
      report += `\n`
    })
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

  const passedTests = results.filter(r => r.result.passed)
  if (passedTests.length > 0) {
    report += `✅ WORKING FEATURES:\n\n`
    passedTests.forEach(test => {
      report += `✓ ${test.scenario.name}\n`
      if (test.result.details) {
        report += `  ${test.result.details}\n`
      }
    })
  }

  return report
}

