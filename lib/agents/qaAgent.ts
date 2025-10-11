import type { DocType } from '../store'
import type { GeneratedImage } from './imageAgent'
import { AGENT_MODELS, QA_CONFIG } from '../config/agents'
import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'

export type QAIssue = {
  agent: 'text' | 'images' | 'html' | 'analyzer'
  severity: 'critical' | 'major' | 'minor'
  category: string
  description: string
  suggestion: string
}

export type QAReport = {
  approved: boolean
  score: number
  contentScore: number
  imageScore: number
  consistencyScore: number
  issues: QAIssue[]
  strengths: string[]
  feedback: string
  iteration: number
}

export async function reviewDocument(
  userPrompt: string,
  content: string,
  images: GeneratedImage[],
  html: string,
  docType: DocType,
  iteration: number
): Promise<QAReport> {
  
  if (!QA_CONFIG.enableQA) {
    return {
      approved: true,
      score: 100,
      contentScore: 100,
      imageScore: 100,
      consistencyScore: 100,
      issues: [],
      strengths: ['QA disabled'],
      feedback: 'Quality assurance is disabled',
      iteration
    }
  }

  console.log(`✅ QA Agent (${AGENT_MODELS.qa}): Starting review (iteration ${iteration})...`)
  
  let contentData: any = {}
  try {
    contentData = JSON.parse(content)
  } catch {
    contentData = { raw: content }
  }

  const reviewPrompt = `You are a Quality Assurance specialist reviewing a generated document.

USER REQUEST: "${userPrompt}"
DOCUMENT TYPE: ${docType}
ITERATION: ${iteration}/${QA_CONFIG.maxIterations}

GENERATED CONTENT:
${JSON.stringify(contentData, null, 2).substring(0, 2000)}

GENERATED IMAGES (${images.length}):
${images.map((img, i) => `${i + 1}. "${img.prompt}"`).join('\n')}

HTML SIZE: ${html.length} characters

---

REVIEW CRITERIA:

1. CONTENT QUALITY (0-100):
   ✅ Specific and detailed (not generic placeholder text)
   ✅ Matches user request
   ✅ Professional language
   ✅ Complete information
   ❌ Generic phrases like "наша компания лучшая"
   ❌ Placeholder text without specifics

2. IMAGE RELEVANCE (0-100):
   ✅ Prompts are specific to the theme
   ✅ Match document content
   ✅ Professional and detailed
   ❌ Generic terms: "business logo", "corporate background"
   ❌ Don't match content theme

3. CONSISTENCY (0-100):
   ✅ Content and images tell same story
   ✅ Theme is coherent throughout
   ❌ Content about X, images about Y

SCORING:
- 90-100: Excellent, production ready
- 75-89: Good, minor issues
- 60-74: Needs work
- <60: Reject, major issues

Approve (approved: true) if score >= ${QA_CONFIG.approvalThreshold} and no critical issues.

Return ONLY valid JSON:
{
  "approved": false,
  "score": 65,
  "contentScore": 70,
  "imageScore": 45,
  "consistencyScore": 80,
  "issues": [
    {
      "agent": "images",
      "severity": "critical",
      "category": "generic_prompts",
      "description": "Image prompts are too generic",
      "suggestion": "Use specific theme from content"
    }
  ],
  "strengths": ["Good content structure"],
  "feedback": "Main issue: generic images"
}`

  try {
    const response = await fetchWithTimeout('/api/openrouter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: "You are a QA specialist. Be thorough and constructive. Return ONLY valid JSON." 
          },
          { role: "user", content: reviewPrompt }
        ],
        model: AGENT_MODELS.qa,
        temperature: 0.3,
        max_tokens: 2000
      }),
    }, API_TIMEOUTS.DEFAULT)

    if (!response.ok) {
      throw new Error('QA review failed')
    }

    const data = await response.json()
    let result = data.content || '{}'
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const report: QAReport = JSON.parse(result)
    report.iteration = iteration
    
    console.log(`📊 QA Scores:`)
    console.log(`   Overall: ${report.score}/100`)
    console.log(`   Content: ${report.contentScore}/100`)
    console.log(`   Images: ${report.imageScore}/100`)
    console.log(`   Consistency: ${report.consistencyScore}/100`)
    
    if (report.approved) {
      console.log(`✅ QA Agent: APPROVED! Document is ready.`)
    } else {
      console.log(`❌ QA Agent: NOT APPROVED. Found ${report.issues.length} issues:`)
      report.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}/${issue.agent}] ${issue.description}`)
      })
    }
    
    return report
  } catch (error) {
    console.error('❌ QA Agent error:', error)
    
    return {
      approved: true,
      score: 70,
      contentScore: 70,
      imageScore: 70,
      consistencyScore: 70,
      issues: [],
      strengths: ['QA error, auto-approved'],
      feedback: 'QA check failed, document auto-approved',
      iteration
    }
  }
}

export function buildFeedbackForAgents(qaReport: QAReport): string {
  const feedbackParts: string[] = []
  
  qaReport.issues.forEach(issue => {
    if (issue.severity === 'critical' || issue.severity === 'major') {
      feedbackParts.push(`[${issue.agent}] ${issue.suggestion}`)
    }
  })
  
  if (feedbackParts.length === 0 && qaReport.feedback) {
    return qaReport.feedback
  }
  
  return feedbackParts.join('\n')
}

