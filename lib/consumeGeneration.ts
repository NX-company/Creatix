export async function consumeGeneration(imageCount: number = 10) {
  try {
    const response = await fetch('/api/user/consume-generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageCount }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to consume generation')
    }

    const data = await response.json()
    console.log(`✅ Consumed ${data.consumedGenerations} generation(s)`)
    return data
  } catch (error) {
    console.error('Error consuming generation:', error)
    throw error
  }
}

export async function checkGenerationAvailability(imageCount: number = 10) {
  try {
    const response = await fetch('/api/user/generations')
    
    if (!response.ok) {
      return { canGenerate: false, reason: 'Failed to check' }
    }

    const data = await response.json()
    const neededGenerations = Math.ceil(imageCount / 10)
    const available = data.availableGenerations

    if (available < neededGenerations) {
      return {
        canGenerate: false,
        reason: 'insufficient',
        availableGenerations: available,
        neededGenerations,
      }
    }

    return {
      canGenerate: true,
      availableGenerations: available,
      neededGenerations,
    }
  } catch (error) {
    console.error('Error checking generation availability:', error)
    return { canGenerate: false, reason: 'error' }
  }
}

