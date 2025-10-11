import { fetchWithTimeout } from '../fetchWithTimeout'
import { API_TIMEOUTS } from '../constants'

export async function generateImageWithDALLE(prompt: string): Promise<string> {
  console.log(`🎨 DALL-E Agent: Generating image...`)
  console.log(`   Prompt: "${prompt.substring(0, 80)}..."`)

  const response = await fetchWithTimeout('/api/dalle-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  }, API_TIMEOUTS.IMAGE_GENERATION)

  if (!response.ok) {
    const error = await response.json()
    console.error(`❌ DALL-E API error:`, error)
    throw new Error(error.details || 'DALL-E generation failed')
  }

  const data = await response.json()
  
  if (!data.success || !data.imageUrl) {
    console.error(`❌ Invalid DALL-E response:`, data)
    throw new Error('Invalid DALL-E response')
  }

  console.log(`✅ DALL-E image generated successfully`)
  return data.imageUrl
}

export async function generateImagesWithDALLE(
  imagePlans: Array<{ prompt: string; type: string; slot: number }>
): Promise<Array<{ slot: number; dataUrl: string; prompt: string }>> {
  console.log(`🎨 DALL-E Agent: Generating ${imagePlans.length} HD images...`)

  const images = []

  for (let i = 0; i < imagePlans.length; i++) {
    const plan = imagePlans[i]
    
    try {
      console.log(`Generating image ${i + 1}/${imagePlans.length}...`)
      console.log(`📝 Type: ${plan.type}`)
      console.log(`📝 Prompt: "${plan.prompt.substring(0, 80)}..."`)

      const dataUrl = await generateImageWithDALLE(plan.prompt)
      
      images.push({
        slot: plan.slot,
        dataUrl: dataUrl,
        prompt: plan.prompt,
      })

      console.log(`✅ Image ${i + 1} generated successfully`)
    } catch (error) {
      console.error(`❌ Failed to generate image ${i + 1}:`, error)
    }
  }

  console.log(`✅ DALL-E Agent: Generated ${images.length}/${imagePlans.length} images`)
  return images
}
