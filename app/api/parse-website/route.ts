import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let browser = null
  
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    console.log(`🌐 Parsing website: ${url}`)

    browser = await chromium.launch({
      headless: true,
    })

    const page = await browser.newPage()
    
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })
    } catch (error) {
      console.error('Failed to load page:', error)
      return NextResponse.json({ 
        error: 'Failed to load website',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 })
    }

    await page.waitForLoadState('networkidle')

    const data = await page.evaluate(() => {
      const getTextContent = (selector: string): string[] => {
        return Array.from(document.querySelectorAll(selector))
          .map(el => el.textContent?.trim() || '')
          .filter(text => text.length > 0)
      }

      const getImages = (): string[] => {
        return Array.from(document.querySelectorAll('img'))
          .map(img => img.src)
          .filter(src => src && src.startsWith('http'))
          .slice(0, 10)
      }

      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        headings: {
          h1: getTextContent('h1'),
          h2: getTextContent('h2').slice(0, 10),
          h3: getTextContent('h3').slice(0, 10),
        },
        paragraphs: getTextContent('p').slice(0, 20),
        links: Array.from(document.querySelectorAll('a'))
          .map(a => ({
            text: a.textContent?.trim() || '',
            href: a.href
          }))
          .filter(link => link.text && link.href)
          .slice(0, 20),
        images: getImages(),
        url: window.location.href
      }
    })

    console.log(`✅ Successfully parsed: ${data.title}`)
    console.log(`   - H1: ${data.headings.h1.length}`)
    console.log(`   - H2: ${data.headings.h2.length}`)
    console.log(`   - Paragraphs: ${data.paragraphs.length}`)
    console.log(`   - Images: ${data.images.length}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('Website parsing error:', error)
    return NextResponse.json(
      { 
        error: 'Website parsing failed',
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

