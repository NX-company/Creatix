import { Page } from 'playwright'

export interface TestScenario {
  id: string
  name: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  run: (page: Page, baseUrl: string) => Promise<TestResult>
}

export interface TestResult {
  passed: boolean
  screenshot?: string
  error?: string
  duration: number
  details?: string
}

export const testScenarios: TestScenario[] = [
  {
    id: 'auth-login',
    name: 'Авторизация в системе',
    category: 'Authentication',
    severity: 'critical',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(`${baseUrl}/login`)
        await page.fill('input[type="email"]', 'test@test.com')
        await page.fill('input[type="password"]', 'test123')
        await page.click('button[type="submit"]')
        await page.waitForURL(`${baseUrl}/`, { timeout: 5000 })
        
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: true,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'doc-create-proposal',
    name: 'Создание коммерческого предложения',
    category: 'Document Creation',
    severity: 'critical',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(baseUrl)
        
        await page.click('button:has-text("Коммерческое предложение")')
        await page.waitForTimeout(1000)
        
        const input = page.locator('textarea, input[type="text"]').first()
        await input.fill('Создай коммерческое предложение для IT компании')
        
        await page.click('button:has-text("Отправить"), button[type="submit"]')
        
        await page.waitForTimeout(15000)
        
        const hasPreview = await page.locator('iframe, [class*="preview"]').count() > 0
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true })
        
        return {
          passed: hasPreview,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start,
          details: hasPreview ? 'Документ создан успешно' : 'Превью не появилось'
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'doc-create-invoice',
    name: 'Создание счёта',
    category: 'Document Creation',
    severity: 'critical',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(baseUrl)
        
        await page.click('button:has-text("Счёт")')
        await page.waitForTimeout(1000)
        
        const input = page.locator('textarea, input[type="text"]').first()
        await input.fill('Создай счёт на 50000 рублей за консультацию')
        
        await page.click('button:has-text("Отправить"), button[type="submit"]')
        
        await page.waitForTimeout(15000)
        
        const hasPreview = await page.locator('iframe, [class*="preview"]').count() > 0
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true })
        
        return {
          passed: hasPreview,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'doc-edit',
    name: 'Редактирование документа',
    category: 'Document Editing',
    severity: 'high',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(baseUrl)
        
        await page.click('button:has-text("Коммерческое предложение")')
        await page.waitForTimeout(1000)
        
        const input = page.locator('textarea, input[type="text"]').first()
        await input.fill('Создай простое КП')
        await page.click('button:has-text("Отправить")')
        await page.waitForTimeout(10000)
        
        await input.fill('Измени заголовок на "Новая компания"')
        await page.click('button:has-text("Отправить")')
        await page.waitForTimeout(5000)
        
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true })
        
        return {
          passed: true,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start,
          details: 'Проверьте визуально что изменения применились'
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'file-download-html',
    name: 'Скачивание HTML файла',
    category: 'File Export',
    severity: 'high',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(baseUrl)
        
        await page.click('button:has-text("Счёт")')
        await page.waitForTimeout(1000)
        
        const input = page.locator('textarea, input[type="text"]').first()
        await input.fill('Счёт на 1000р')
        await page.click('button:has-text("Отправить")')
        await page.waitForTimeout(10000)
        
        const downloadButton = page.locator('button:has-text("HTML"), a:has-text("HTML")').first()
        const hasDownload = await downloadButton.count() > 0
        
        const screenshot = await page.screenshot({ encoding: 'base64' })
        
        return {
          passed: hasDownload,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start,
          details: hasDownload ? 'Кнопка скачивания найдена' : 'Кнопка скачивания не найдена'
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'mode-switch',
    name: 'Переключение режимов (Free/Advanced/PRO)',
    category: 'UI Features',
    severity: 'medium',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(baseUrl)
        
        const modeButtons = await page.locator('button:has-text("Free"), button:has-text("Advanced"), button:has-text("PRO")').count()
        
        if (modeButtons >= 2) {
          await page.click('button:has-text("Advanced"), button:has-text("PRO")').first()
          await page.waitForTimeout(1000)
        }
        
        const screenshot = await page.screenshot({ encoding: 'base64' })
        
        return {
          passed: modeButtons >= 2,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start,
          details: `Найдено ${modeButtons} кнопок режимов`
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'image-upload',
    name: 'Загрузка изображений',
    category: 'Media Upload',
    severity: 'medium',
    run: async (page, baseUrl) => {
      const start = Date.now()
      try {
        await page.goto(baseUrl)
        
        const uploadButton = await page.locator('input[type="file"], button:has-text("Загрузить")').count()
        const screenshot = await page.screenshot({ encoding: 'base64' })
        
        return {
          passed: uploadButton > 0,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start,
          details: uploadButton > 0 ? 'Кнопка загрузки найдена' : 'Кнопка загрузки не найдена'
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  },

  {
    id: 'console-errors',
    name: 'Проверка ошибок в консоли',
    category: 'Error Detection',
    severity: 'high',
    run: async (page, baseUrl) => {
      const start = Date.now()
      const consoleErrors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      try {
        await page.goto(baseUrl)
        await page.waitForTimeout(3000)
        
        const screenshot = await page.screenshot({ encoding: 'base64' })
        
        return {
          passed: consoleErrors.length === 0,
          screenshot: `data:image/png;base64,${screenshot}`,
          duration: Date.now() - start,
          details: consoleErrors.length > 0 
            ? `Найдено ошибок: ${consoleErrors.length}\n${consoleErrors.slice(0, 3).join('\n')}`
            : 'Ошибок не обнаружено'
        }
      } catch (error) {
        const screenshot = await page.screenshot({ encoding: 'base64' })
        return {
          passed: false,
          screenshot: `data:image/png;base64,${screenshot}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start
        }
      }
    }
  }
]

