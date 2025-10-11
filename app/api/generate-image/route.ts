import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let browser = null
  
  try {
    const { html, width, height, format, fileName } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML content required' }, { status: 400 })
    }

    if (!width || !height) {
      return NextResponse.json({ error: 'Width and height required' }, { status: 400 })
    }

    console.log(`Generating ${format || 'png'} image ${width}x${height}...`)

    browser = await chromium.launch({
      headless: true,
    })

    const page = await browser.newPage()
    
    await page.setViewportSize({ width: parseInt(width), height: parseInt(height) })
    
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    await page.waitForLoadState('networkidle')

    const imageBuffer = await page.screenshot({
      type: format || 'png',
      fullPage: false,
      omitBackground: false,
    })

    console.log(`Image generated successfully: ${fileName || 'image'}`)

    const encodedFileName = encodeURIComponent(fileName || 'image.png')
    const contentType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
      },
    })

  } catch (error) {
    console.error('Playwright image generation error:', error)
    return NextResponse.json(
      { 
        error: 'Image generation failed',
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


