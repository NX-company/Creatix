'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleReset = () => {
    localStorage.removeItem('nx-studio-storage')
    sessionStorage.removeItem('nx-studio-reload-attempts')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="max-w-md p-8 bg-muted rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Ошибка приложения</h1>
            <p className="text-sm mb-6 text-muted-foreground">
              Обнаружена ошибка в старых данных. Нажмите кнопку ниже для очистки и перезагрузки.
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Очистить данные и перезагрузить
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Технические детали
                </summary>
                <pre className="mt-2 p-3 bg-background rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

