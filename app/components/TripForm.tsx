'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TripForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tripDescription, setTripDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripDescription.trim()) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripDescription: tripDescription.trim() }),
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
        </p>
        <textarea
          id="tripDescription"
          value={tripDescription}
          onChange={(e) => setTripDescription(e.target.value)}
          required
          rows={6}
          placeholder="Example: I'm going on a 3-day backpacking trip to the Lost Coast Trail in Northern California with two friends from Friday to Sunday. We're planning to hike about 25 miles total and camp on the beach. One friend has a bad knee but we're taking it slow. If something happens, contact my mom Sarah at (555) 123-4567."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sos-orange focus:border-transparent text-base"
        />
        
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Need inspiration? Try one of these:</p>
          <div className="space-y-2">
            {exampleTrips.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTripDescription(example)}
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
        disabled={loading || !tripDescription.trim()}
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