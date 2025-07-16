import { NextRequest, NextResponse } from 'next/server'
import { preprocessUrlContent } from '@/lib/ai'

export async function POST(request: NextRequest) {
  console.log('[fetch-url] API called')
  try {
    const { url } = await request.json()
    console.log('[fetch-url] Requested URL:', url)

    if (!url) {
      console.log('[fetch-url] No URL provided')
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
    } catch (error) {
      console.log('[fetch-url] Invalid URL:', error)
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the content with safety limits
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    let html: string
    
    try {
      const response = await fetch(validatedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AwesomeSOS/1.0; +https://awesomesos.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
        // Limit redirects to prevent loops
        // Note: fetch API doesn't support max redirects, but most browsers limit to 20
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log('[fetch-url] HTTP error:', response.status, response.statusText)
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
          { status: 400 }
        )
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
        return NextResponse.json(
          { error: 'URL does not appear to be a webpage (invalid content type)' },
          { status: 400 }
        )
      }

      // Limit response size to 5MB
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Page is too large to process (over 5MB)' },
          { status: 400 }
        )
      }

      html = await response.text()
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. The page took too long to load.' },
          { status: 408 }
        )
      }
      throw err
    }

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

    console.log('[fetch-url] Content extracted:', {
      titleLength: title?.length,
      contentLength: textContent.length,
      url: validatedUrl.toString()
    })

    // Use AI to preprocess and optimize the content
    console.log('[fetch-url] Starting AI preprocessing...')
    const processed = await preprocessUrlContent(
      textContent,
      title,
      validatedUrl.toString()
    )
    console.log('[fetch-url] AI preprocessing complete:', {
      summaryLength: processed.summary?.length,
      optimizedLength: processed.optimizedContent?.length,
      hasError: !!processed.error
    })

    // Validate the summary doesn't contain URLs
    if (processed.summary && /^https?:\/\//i.test(processed.summary.trim())) {
      console.error('[fetch-url] AI returned URL as summary:', processed.summary)
      processed.summary = `Information from ${title || 'webpage'}`
    }
    
    const response = {
      content: processed.summary, // Use the summary as the main content
      optimizedContent: processed.optimizedContent, // Include the optimized content for reference
      title,
      url: validatedUrl.toString(),
      error: processed.error,
    }
    
    console.log('[fetch-url] Returning response:', {
      contentPreview: response.content?.substring(0, 100) + '...',
      isContentUrl: response.content ? /^https?:\/\//i.test(response.content.trim()) : false,
      contentLength: response.content?.length
    })
    
    // Final safety check
    if (response.content && /^https?:\/\//i.test(response.content.trim())) {
      console.error('[fetch-url] SAFETY: Blocking URL from being returned as content')
      response.content = `Trip information from ${title || validatedUrl.hostname}`
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[fetch-url] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch URL content' },
      { status: 500 }
    )
  }
}