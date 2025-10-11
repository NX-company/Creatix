import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let browser = null
  
  try {
    const { html, docType, fileName } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML content required' }, { status: 400 })
    }

    console.log(`Generating PDF for ${docType}...`)

    // Запускаем браузер
    browser = await chromium.launch({
      headless: true,
    })

    const page = await browser.newPage()
    
    // Устанавливаем размер страницы
    await page.setViewportSize({ width: 1200, height: 1600 })
    
    // Загружаем HTML
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Ждем загрузки всех изображений и шрифтов
    await page.waitForLoadState('networkidle')

    // Настройки PDF
    const pdfOptions: any = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: false,
    }

    // Презентации — альбомная ориентация
    if (docType === 'presentation') {
      pdfOptions.landscape = true
    }

    // Генерируем PDF
    const pdfBuffer = await page.pdf(pdfOptions)

    console.log(`PDF generated successfully: ${fileName}`)

    // Кодируем русское имя файла для HTTP заголовка
            const encodedFileName = encodeURIComponent(fileName)
            
            return new NextResponse(Buffer.from(pdfBuffer), {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
              },
            })

  } catch (error) {
    console.error('Playwright PDF generation error:', error)
    return NextResponse.json(
      { 
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
