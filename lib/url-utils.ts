export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function fetchUrlContent(url: string): Promise<{
  content: string
  title?: string
  optimizedContent?: string
  error?: string
}> {
  try {
    // Use our API route to fetch the content to avoid CORS issues
    const response = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch URL content')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching URL:', error)
    return {
      content: '',
      error: 'Failed to fetch content from the URL. Please check the URL and try again.',
    }
  }
}