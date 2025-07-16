import { NextRequest, NextResponse } from 'next/server'
import { preprocessUrlContent } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let validatedUrl: URL
    try {
      validatedUrl = new URL(url)
      if (validatedUrl.protocol !== 'http:' && validatedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the content
    const response = await fetch(validatedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AwesomeSOS/1.0; +https://awesomesos.com)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Extract text content and title from HTML
    // This is a simple extraction - could be improved with a proper HTML parser
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : undefined

    // Remove script and style elements
    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Limit content length to prevent extremely long inputs
    const maxLength = 10000
    if (textContent.length > maxLength) {
      textContent = textContent.substring(0, maxLength) + '...'
    }

    // Use AI to preprocess and optimize the content
    const processed = await preprocessUrlContent(
      textContent,
      title,
      validatedUrl.toString()
    )

    return NextResponse.json({
      content: processed.summary, // Use the summary as the main content
      optimizedContent: processed.optimizedContent, // Include the optimized content for reference
      title,
      url: validatedUrl.toString(),
      error: processed.error,
    })
  } catch (error) {
    console.error('Error fetching URL:', error)
    return NextResponse.json(
      { error: 'Failed to fetch URL content' },
      { status: 500 }
    )
  }
}