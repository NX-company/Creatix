import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { logApiUsage, prisma } from '@/lib/db'

export const maxDuration = 30

type DocType = 'proposal' | 'invoice' | 'email' | 'presentation' | 'logo' | 'product-card'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }
    
    console.log('🧠 Analyzing user intent...')
    console.log(`   Prompt: "${prompt}"`)
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': NEXT_PUBLIC_APP_URL,
        'X-Title': 'Creatix AI',
        'X-Organization': 'Creatix',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: `Ты AI-ассистент Creatix. Анализируй запрос пользователя и определи тип документа.

ТИПЫ ДОКУМЕНТОВ:
- proposal: коммерческое предложение, КП, оффер, предложение
- invoice: счет, счёт, инвойс, квитанция
- email: письмо, email, сообщение, рассылка
- presentation: презентация, питч, слайды
- logo: логотип, лого, брендинг, фирменный стиль
- product-card: карточка товара, карточка, товар, маркетплейс, ozon, wildberries, avito

ОТВЕТ В JSON:
{
  "docType": "тип документа",
  "confidence": "high/medium/low",
  "extractedInfo": "краткое описание что хочет пользователь"
}

Если не уверен - ставь docType: "proposal" и confidence: "low"`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150,
        top_p: 1,
        response_format: { type: 'json_object' }
      })
    })
    
    if (!response.ok) {
      console.error('❌ OpenRouter error:', response.status)
      const errorData = await response.json().catch(() => ({}))
      console.error('Error details:', errorData)
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }
    
    const data = await response.json()
    console.log('OpenRouter response:', data)
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from AI')
    }
    
    const result = JSON.parse(content)
    
    console.log('✅ Intent analyzed:')
    console.log(`   Document type: ${result.docType}`)
    console.log(`   Confidence: ${result.confidence}`)
    console.log(`   Info: ${result.extractedInfo}`)
    
    const session = await getServerSession(authOptions)
    if (session?.user?.email && data.usage) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      
      if (user) {
        const tokensUsed = data.usage.total_tokens || 0
        const cost = (tokensUsed / 1000) * 0.00015
        await logApiUsage({
          userId: user.id,
          provider: 'OpenRouter',
          model: 'openai/gpt-4o-mini',
          endpoint: '/api/analyze-intent',
          tokensUsed: tokensUsed,
          cost: cost
        })
      }
    }
    
    return NextResponse.json({
      docType: result.docType as DocType,
      confidence: result.confidence,
      extractedInfo: result.extractedInfo,
      originalPrompt: prompt
    })
    
  } catch (error) {
    console.error('❌ Intent analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze intent',
        details: error instanceof Error ? error.message : 'Unknown error',
        docType: 'proposal',
        confidence: 'low'
      },
      { status: 500 }
    )
  }
}

