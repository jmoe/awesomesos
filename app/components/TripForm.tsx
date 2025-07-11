'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TripForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tripDescription: '',
    startDate: '',
    endDate: '',
    emergencyContact: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const exampleTrips = [
    "I'm going hiking at Yosemite's Half Dome this weekend with my friend Sarah. We're both experienced hikers but it's our first time doing Half Dome.",
    "Solo backpacking trip through the Grand Canyon for 5 days. Planning to camp at Bright Angel and Indian Garden.",
    "Taking my kids (ages 8 and 10) camping at Big Sur for the first time. We'll be doing easy hikes and staying at the campground.",
    "Rock climbing at Joshua Tree with a group of 4 friends. We're intermediate climbers planning to tackle some classic routes.",
  ]

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <label htmlFor="tripDescription" className="block text-lg font-medium mb-2">
          Tell us about your adventure 🎒
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Describe your trip in your own words - where you're going, what you'll be doing, and who's coming with you.
        </p>
        <textarea
          id="tripDescription"
          name="tripDescription"
          value={formData.tripDescription}
          onChange={handleChange}
          required
          rows={6}
          placeholder="Example: I'm going on a 3-day backpacking trip to the Lost Coast Trail in Northern California with two friends. We're planning to hike about 25 miles total and camp on the beach. One friend has a bad knee but we're taking it slow..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sos-orange focus:border-transparent text-base"
        />
        
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Need inspiration? Try one of these:</p>
          <div className="space-y-2">
            {exampleTrips.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFormData({ ...formData, tripDescription: example })}
                className="text-left text-sm text-sos-blue hover:text-sos-orange transition-colors"
              >
                → {example.substring(0, 60)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-2">
            When do you leave? 📅
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sos-orange focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-2">
            When do you return? 🏁
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sos-orange focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="emergencyContact" className="block text-sm font-medium mb-2">
          Emergency Contact 📞
        </label>
        <input
          type="text"
          id="emergencyContact"
          name="emergencyContact"
          value={formData.emergencyContact}
          onChange={handleChange}
          required
          placeholder="Mom: (555) 123-4567"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sos-orange focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Your Safety Plan... 🤖
          </span>
        ) : (
          'Generate Safety Plan 🚀'
        )}
      </button>
    </form>
  )
}