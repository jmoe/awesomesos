'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isValidUrl, fetchUrlContent } from '@/lib/url-utils'

export function TripForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tripDescription, setTripDescription] = useState('')
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null)
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  
  // Track if we're setting the value programmatically
  const isProgrammaticChange = useRef(false)
  // Track the last processed URL to prevent re-processing
  const lastProcessedUrl = useRef<string | null>(null)

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setTripDescription(newValue)
    setUrlError(null)
    
    // Skip URL detection if this is a programmatic change
    if (isProgrammaticChange.current) {
      console.log('[TripForm] Skipping URL check - programmatic change')
      isProgrammaticChange.current = false
      return
    }
    
    // Check if the new value is a URL
    const trimmedValue = newValue.trim()
    
    // If it's not a URL, clear our tracking
    if (!isValidUrl(trimmedValue)) {
      console.log('[TripForm] Not a valid URL, clearing tracking')
      lastProcessedUrl.current = null
      setOptimizedContent(null)
      setSourceUrl(null)
      return
    }
    
    console.log('[TripForm] Valid URL detected:', trimmedValue)
    
    // If it's the same URL we just processed, skip
    if (trimmedValue === lastProcessedUrl.current) {
      console.log('[TripForm] Skipping - same URL already processed')
      return
    }
    
    // If we're already fetching, skip
    if (fetchingUrl) {
      console.log('[TripForm] Skipping - already fetching')
      return
    }
    
    // New URL detected
    console.log('[TripForm] New URL detected, fetching:', trimmedValue)
    setFetchingUrl(true)
    lastProcessedUrl.current = trimmedValue
    
    try {
      const result = await fetchUrlContent(trimmedValue)
      
      if (result.error) {
        console.error('[TripForm] Fetch error:', result.error)
        setUrlError(result.error)
        lastProcessedUrl.current = null // Allow retry
      } else {
        console.log('[TripForm] Fetch success, setting content programmatically')
        
        // Safety check: ensure we're not setting a URL as content
        if (result.content && isValidUrl(result.content.trim())) {
          console.error('[TripForm] SAFETY: Received URL as content, using fallback')
          const fallbackContent = result.title 
            ? `Trip information from: ${result.title}` 
            : 'Trip information fetched from URL'
          
          // Mark the next change as programmatic
          isProgrammaticChange.current = true
          setTripDescription(fallbackContent)
        } else {
          // Mark the next change as programmatic
          isProgrammaticChange.current = true
          // Replace the URL with the fetched content
          setTripDescription(result.content)
        }
        
        setOptimizedContent(result.optimizedContent || null)
        setSourceUrl(trimmedValue)
      }
    } catch (error) {
      console.error('[TripForm] Unexpected error:', error)
      setUrlError('Failed to fetch URL content')
      lastProcessedUrl.current = null
    } finally {
      setFetchingUrl(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripDescription.trim() || fetchingUrl) return
    
    setLoading(true)
    setUrlError(null)
    
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tripDescription: tripDescription.trim(),
          optimizedContent: optimizedContent,
          sourceUrl: sourceUrl
        }),
      })

      if (!response.ok) throw new Error('Failed to create trip')
      
      const { shareId } = await response.json()
      router.push(`/trip/${shareId}`)
    } catch (error) {
      console.error('Error creating trip:', error)
      alert('Oops! Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const exampleTrips = [
    "I'm going hiking at Yosemite's Half Dome this Saturday with my friend Sarah. We're both experienced hikers but it's our first time doing Half Dome. If something happens, contact my mom at (555) 123-4567.",
    "Solo backpacking trip through the Grand Canyon from March 15-20. Planning to camp at Bright Angel and Indian Garden. Emergency contact is my brother Mike at mike.smith@email.com.",
    "Taking my kids (ages 8 and 10) camping at Big Sur this weekend for 2 nights. We'll be doing easy hikes and staying at the campground. Wife's number: (555) 987-6543.",
    "Rock climbing at Joshua Tree with a group of 4 friends next month. We're intermediate climbers planning to tackle some classic routes over 3 days. Contact person: Dave (555) 456-7890.",
  ]

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <label htmlFor="tripDescription" className="block text-lg font-medium mb-2">
          Tell us about your adventure 🎒
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Describe your trip in your own words - where you're going, when, what you'll be doing, who's coming, and who to contact in an emergency.
          <span className="block mt-1 text-sos-orange">You can also paste a URL from AllTrails, blog posts, or event pages!</span>
        </p>
        <textarea
          id="tripDescription"
          value={tripDescription}
          onChange={handleTextChange}
          required
          rows={6}
          placeholder="Paste an AllTrails link (e.g., https://www.alltrails.com/trail/...) or describe your trip: I'm going on a 3-day backpacking trip..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sos-orange focus:border-transparent text-base"
          disabled={fetchingUrl}
        />
        
        {fetchingUrl && (
          <div className="mt-2 text-sm text-sos-orange flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching content from URL...
          </div>
        )}
        
        {urlError && (
          <div className="mt-2 text-sm text-red-600">
            {urlError}
          </div>
        )}
        
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Need inspiration? Try one of these:</p>
          <div className="space-y-2">
            {exampleTrips.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  isProgrammaticChange.current = true
                  setTripDescription(example)
                  setOptimizedContent(null)
                  setSourceUrl(null)
                }}
                className="text-left text-sm text-sos-blue hover:text-sos-orange transition-colors"
              >
                → {example.substring(0, 70)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || fetchingUrl || !tripDescription.trim()}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing your trip and creating safety plan... 🤖
          </span>
        ) : (
          'Generate My Safety Plan 🚀'
        )}
      </button>
    </form>
  )
}