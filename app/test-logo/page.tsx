'use client'

import Logo from '@/components/Logo'
import SimpleLogo from '@/components/SimpleLogo'

export default function TestLogoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тест логотипа Creatix</h1>
        
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Компонент Logo</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-20">Small:</span>
                <Logo size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">Medium:</span>
                <Logo size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">Large:</span>
                <Logo size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">XLarge:</span>
                <Logo size="xl" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Компонент SimpleLogo (Fallback)</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-20">Small:</span>
                <SimpleLogo size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">Medium:</span>
                <SimpleLogo size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">Large:</span>
                <SimpleLogo size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">XLarge:</span>
                <SimpleLogo size="xl" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Прямая ссылка на SVG</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-20">SVG:</span>
                <img src="/creatix-logo.svg" alt="Creatix SVG" className="h-8 w-auto" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20">PNG:</span>
                <img src="/creatix-logo.png" alt="Creatix PNG" className="h-8 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
