'use client'

import { useState } from 'react'
import { testScenarios } from '@/lib/testing/scenarios'
import Logo from '@/components/Logo'

interface TestResult {
  scenario: {
    id: string
    name: string
    category: string
    severity: string
  }
  result: {
    passed: boolean
    duration: number
    error?: string
    details?: string
    screenshot?: string
  }
  aiAnalysis?: {
    hasBugs: boolean
    severity: string
    issues: string[]
    suggestions: string[]
    uiQuality: number
  }
}

export default function TestAgentPage() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [report, setReport] = useState<string>('')
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [useAI, setUseAI] = useState(true)
  const [useComprehensive, setUseComprehensive] = useState(false)
  const [expandedTest, setExpandedTest] = useState<string | null>(null)

  const runTests = async () => {
    setRunning(true)
    setResults(null)
    setSummary(null)
    setReport('')

    try {
      const response = await fetch('/api/admin/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios: selectedScenarios.length > 0 ? selectedScenarios : null,
          useAI,
          useComprehensive
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setSummary(data.summary)
        setReport(data.report)
      } else {
        alert(`Ошибка: ${data.details || data.error}`)
      }
    } catch (error) {
      console.error('Test error:', error)
      alert('Ошибка запуска тестов')
    } finally {
      setRunning(false)
    }
  }

  const toggleScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(s => s !== id))
    } else {
      setSelectedScenarios([...selectedScenarios, id])
    }
  }

  const selectAll = () => {
    setSelectedScenarios(testScenarios.map(s => s.id))
  }

  const deselectAll = () => {
    setSelectedScenarios([])
  }

  const categories = Array.from(new Set(testScenarios.map(s => s.category)))

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Logo size="lg" />
            <div>
              <h1 className="text-4xl font-bold mb-2">🤖 AI Testing Agent</h1>
              <p className="text-gray-400">Автоматическое тестирование с AI анализом</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Настройки тестирования</h2>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useComprehensive}
                  onChange={(e) => setUseComprehensive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold">🚀 ПОЛНЫЙ набор тестов (40+ тестов)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Использовать GPT-4o Vision анализ</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
              >
                Выбрать все
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
              >
                Снять все
              </button>
              <div className="ml-auto text-sm text-gray-400">
                Выбрано: {selectedScenarios.length} / {testScenarios.length}
              </div>
            </div>

            <div className="space-y-4">
              {categories.map(category => (
                <div key={category} className="border border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-400">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {testScenarios
                      .filter(s => s.category === category)
                      .map(scenario => (
                        <label
                          key={scenario.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedScenarios.includes(scenario.id)}
                            onChange={() => toggleScenario(scenario.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{scenario.name}</span>
                          <span
                            className={`ml-auto text-xs px-2 py-1 rounded ${
                              scenario.severity === 'critical'
                                ? 'bg-red-900 text-red-200'
                                : scenario.severity === 'high'
                                ? 'bg-orange-900 text-orange-200'
                                : scenario.severity === 'medium'
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                          >
                            {scenario.severity}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runTests}
            disabled={running}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              running
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {running ? '🔄 Тестирование...' : '🚀 Запустить тесты'}
          </button>
        </div>

        {summary && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Результаты</h2>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-gray-400 text-sm">Всего тестов</div>
                <div className="text-3xl font-bold">{summary.total}</div>
              </div>
              <div className="bg-green-900/30 p-4 rounded border border-green-800">
                <div className="text-green-400 text-sm">Успешно</div>
                <div className="text-3xl font-bold text-green-400">{summary.passed}</div>
              </div>
              <div className="bg-red-900/30 p-4 rounded border border-red-800">
                <div className="text-red-400 text-sm">Провалено</div>
                <div className="text-3xl font-bold text-red-400">{summary.failed}</div>
              </div>
              <div className="bg-blue-900/30 p-4 rounded border border-blue-800">
                <div className="text-blue-400 text-sm">Время</div>
                <div className="text-3xl font-bold text-blue-400">
                  {(summary.duration / 1000).toFixed(1)}s
                </div>
              </div>
            </div>

            {report && (
              <div className="bg-gray-950 p-4 rounded font-mono text-sm whitespace-pre-wrap overflow-x-auto border border-gray-800">
                {report}
              </div>
            )}
          </div>
        )}

        {results && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Детали тестов</h2>
            <div className="space-y-3">
              {results.map((test, i) => (
                <div
                  key={test.scenario.id}
                  className={`border rounded-lg overflow-hidden ${
                    test.result.passed
                      ? 'border-green-800 bg-green-900/10'
                      : 'border-red-800 bg-red-900/10'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-800/50"
                    onClick={() =>
                      setExpandedTest(expandedTest === test.scenario.id ? null : test.scenario.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {test.result.passed ? '✅' : '❌'}
                        </span>
                        <div>
                          <div className="font-semibold">{test.scenario.name}</div>
                          <div className="text-sm text-gray-400">{test.scenario.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">
                          {test.result.duration}ms
                        </div>
                        <span className="text-gray-400">
                          {expandedTest === test.scenario.id ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedTest === test.scenario.id && (
                    <div className="border-t border-gray-800 p-4 bg-gray-950/50">
                      {test.result.error && (
                        <div className="mb-4">
                          <div className="text-red-400 font-semibold mb-2">Error:</div>
                          <div className="bg-red-900/20 p-3 rounded text-sm">
                            {test.result.error}
                          </div>
                        </div>
                      )}

                      {test.result.details && (
                        <div className="mb-4">
                          <div className="text-gray-400 font-semibold mb-2">Details:</div>
                          <div className="bg-gray-900 p-3 rounded text-sm">
                            {test.result.details}
                          </div>
                        </div>
                      )}

                      {test.aiAnalysis && (
                        <div className="mb-4">
                          <div className="text-purple-400 font-semibold mb-2">
                            🧠 AI Analysis (GPT-4o Vision)
                          </div>
                          <div className="bg-purple-900/20 p-3 rounded text-sm space-y-2 border border-purple-800">
                            <div>
                              <span className="text-gray-400">Severity:</span>{' '}
                              <span
                                className={`font-semibold ${
                                  test.aiAnalysis.severity === 'critical'
                                    ? 'text-red-400'
                                    : test.aiAnalysis.severity === 'high'
                                    ? 'text-orange-400'
                                    : 'text-yellow-400'
                                }`}
                              >
                                {test.aiAnalysis.severity}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">UI Quality:</span>{' '}
                              <span className="font-semibold">{test.aiAnalysis.uiQuality}/10</span>
                            </div>
                            {test.aiAnalysis.issues.length > 0 && (
                              <div>
                                <div className="text-gray-400 mb-1">Issues:</div>
                                <ul className="list-disc list-inside space-y-1">
                                  {test.aiAnalysis.issues.map((issue, i) => (
                                    <li key={i} className="text-red-300">
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {test.aiAnalysis.suggestions.length > 0 && (
                              <div>
                                <div className="text-gray-400 mb-1">Suggestions:</div>
                                <ul className="list-disc list-inside space-y-1">
                                  {test.aiAnalysis.suggestions.map((suggestion, i) => (
                                    <li key={i} className="text-green-300">
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {test.result.screenshot && (
                        <div>
                          <div className="text-gray-400 font-semibold mb-2">Screenshot:</div>
                          <img
                            src={test.result.screenshot}
                            alt="Test screenshot"
                            className="w-full rounded border border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

