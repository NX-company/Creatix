/**
 * Функция для подсчёта новых IMAGE_PLACEHOLDER в отредактированном HTML
 * и списания 0.1 генерации за каждое новое изображение
 */

export function countNewImagePlaceholders(originalHTML: string, editedHTML: string): number {
  const originalCount = (originalHTML.match(/IMAGE_PLACEHOLDER/g) || []).length
  const editedCount = (editedHTML.match(/IMAGE_PLACEHOLDER/g) || []).length

  const newPlaceholders = Math.max(0, editedCount - originalCount)

  console.log(`🖼️ Image placeholders: original ${originalCount}, edited ${editedCount}, new ${newPlaceholders}`)

  return newPlaceholders
}

/**
 * Списывает дробные генерации за регенерацию изображений
 */
export async function consumeImageRegenerations(
  imageCount: number,
  session: any
): Promise<{ success: boolean; error?: string; remaining?: number }> {
  if (imageCount <= 0) {
    return { success: true, remaining: 0 }
  }

  const generationsCost = imageCount * 0.1

  console.log(`💰 Consuming ${generationsCost} generations for ${imageCount} image regenerations`)

  try {
    const response = await fetch('/api/user/consume-generation-fractional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: generationsCost,
        reason: `Image regeneration (${imageCount} images)`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to consume generations' }
    }

    const data = await response.json()
    return { success: true, remaining: data.remainingGenerations }

  } catch (error) {
    console.error('❌ Error consuming regeneration:', error)
    return { success: false, error: 'Network error' }
  }
}
