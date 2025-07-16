'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ShareButtons } from './ShareButtons'

// Dynamic import for the map component to avoid SSR issues with Leaflet
const TripMap = dynamic(() => import('@/app/components/TripMap').then(mod => mod.TripMap), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
})

interface TripDisplayProps {
  trip: {
    id: string
    share_id: string
    trip_description: string
    start_date: string
    end_date: string
    emergency_contact: string | null
    safety_info: {
      emergency_numbers: {
        police: string
        medical: string
        park_ranger?: string
      }
      weather_summary: string
      key_risks: string[]
      safety_tips: string[]
      packing_essentials: string[]
      fun_safety_score: {
        score: number
        description: string
      }
      check_in_schedule: Array<{
        time: string
        message: string
      }>
      local_resources: string[]
    }
    trip_data: {
      description: string
      parsed_location: string
      duration_days: number
      activities?: Array<{
        type: string
        name: string
        difficulty?: string
      }>
      group_size?: number
      experience_level?: string
      locations?: Array<{
        name: string
        type: string
        address?: string
        coordinates?: {
          lat?: number
          lng?: number
        }
      }>
    }
    created_at: string
    view_count: number
  }
}

export function TripDisplay({ trip }: TripDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateMessage, setRegenerateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    // Return a consistent format during SSR
    if (!mounted) {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setRegenerateMessage(null)
    
    try {
      const response = await fetch(`/api/trips/${trip.share_id}/regenerate`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to regenerate')
      }
      
      const data = await response.json()
      setRegenerateMessage({ type: 'success', text: data.message })
      
      // Reload the page after a short delay to show the updated content
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch {
      setRegenerateMessage({ 
        type: 'error', 
        text: 'Failed to regenerate safety information. Please try again.' 
      })
    } finally {
      setRegenerating(false)
    }
  }

  const safetyInfo = trip.safety_info

  return (
    <main className="min-h-screen bg-gradient-to-br from-sos-light to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-sos-blue to-sos-dark text-white p-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-2 text-sm group">
            <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span>
            Back to AwesomeSOS
          </Link>
          <h1 className="text-2xl font-bold mb-2">AwesomeSOS Trip Plan 🎒</h1>
          <p className="text-sm opacity-90">When life goes sideways we got your back!</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Trip Overview */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4 text-sos-dark">
            {trip.trip_data.parsed_location} Adventure
          </h2>
          <p className="text-gray-700 mb-4">{trip.trip_description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="font-semibold">{formatDate(trip.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Return</p>
              <p className="font-semibold">{formatDate(trip.end_date)}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-1">Emergency Contact</p>
            <p className="text-red-700">{trip.emergency_contact}</p>
          </div>
        </div>

        {/* Regenerate AI Section */}
        <div className="card mb-6 bg-gradient-to-r from-sos-blue/10 to-sos-orange/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-sos-dark mb-1">Update Safety Information</h3>
              <p className="text-sm text-gray-600">Re-run AI analysis to get the latest safety recommendations</p>
            </div>
            {mounted && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  regenerating 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-sos-orange text-white hover:bg-sos-dark hover:scale-105'
                }`}
              >
                {regenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Regenerating...
                  </span>
                ) : (
                  '🔄 Regenerate AI Analysis'
                )}
              </button>
            )}
          </div>
          
          {regenerateMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              regenerateMessage.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {regenerateMessage.text}
            </div>
          )}
        </div>

        {/* Trip Map */}
        {trip.trip_data.locations && trip.trip_data.locations.length > 0 && (
          <TripMap 
            locations={trip.trip_data.locations} 
            mainLocation={trip.trip_data.parsed_location}
          />
        )}

        {/* Activities Section */}
        {trip.trip_data.activities && trip.trip_data.activities.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-3">🎯 Planned Activities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trip.trip_data.activities.map((activity, i) => (
                <div key={i} className="flex items-start space-x-3 bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl">
                    {activity.type === 'walking' && '🚶'}
                    {activity.type === 'hiking' && '🥾'}
                    {activity.type === 'biking' && '🚴'}
                    {activity.type === 'driving' && '🚗'}
                    {activity.type === 'camping' && '🏕️'}
                    {activity.type === 'climbing' && '🧗'}
                    {activity.type === 'swimming' && '🏊'}
                    {activity.type === 'kayaking' && '🛶'}
                    {activity.type === 'rafting' && '🚣'}
                    {activity.type === 'skiing' && '⛷️'}
                    {activity.type === 'snowboarding' && '🏂'}
                    {activity.type === 'snowmobiling' && '🛷'}
                    {activity.type === 'backpacking' && '🎒'}
                    {activity.type === 'fishing' && '🎣'}
                    {activity.type === 'wildlife_viewing' && '🦌'}
                    {activity.type === 'photography' && '📸'}
                    {activity.type === 'stargazing' && '🌟'}
                    {(activity.type === 'other' || !['walking', 'hiking', 'biking', 'driving', 'camping', 'climbing', 'swimming', 'kayaking', 'rafting', 'skiing', 'snowboarding', 'snowmobiling', 'backpacking', 'fishing', 'wildlife_viewing', 'photography', 'stargazing'].includes(activity.type)) && '🏔️'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sos-dark">{activity.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{activity.type.replace('_', ' ')}</p>
                    {activity.difficulty && (
                      <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                        activity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        activity.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        activity.difficulty === 'difficult' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Score */}
        <div className="card mb-6 text-center">
          <h3 className="text-lg font-bold mb-2">Adventure Safety Score</h3>
          <div className="text-5xl font-bold text-sos-orange mb-2">
            {safetyInfo.fun_safety_score.score}/10
          </div>
          <p className="text-gray-600">{safetyInfo.fun_safety_score.description}</p>
        </div>

        {/* Weather */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-3">Weather Forecast</h3>
          <p className="text-gray-700">{safetyInfo.weather_summary}</p>
        </div>

        {/* Emergency Numbers */}
        <div className="card mb-6 bg-red-50">
          <h3 className="text-xl font-bold mb-3 text-red-800">Emergency Numbers 🚨</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Police/Medical:</span>
              <a href={`tel:${safetyInfo.emergency_numbers.police}`} className="text-red-700 font-bold">
                {safetyInfo.emergency_numbers.police}
              </a>
            </div>
            {safetyInfo.emergency_numbers.park_ranger && (
              <div className="flex justify-between">
                <span className="font-medium">Park Ranger:</span>
                <a href={`tel:${safetyInfo.emergency_numbers.park_ranger}`} className="text-red-700 font-bold">
                  {safetyInfo.emergency_numbers.park_ranger}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Key Risks */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-3">Things to Watch Out For</h3>
          <ul className="space-y-2">
            {safetyInfo.key_risks.map((risk: string, i: number) => (
              <li key={i} className="text-gray-700">{risk}</li>
            ))}
          </ul>
        </div>

        {/* Safety Tips */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-3">Safety Tips</h3>
          <ul className="space-y-2">
            {safetyInfo.safety_tips.map((tip: string, i: number) => (
              <li key={i} className="text-gray-700">{tip}</li>
            ))}
          </ul>
        </div>

        {/* Packing List */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-3">Don't Forget to Pack!</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {safetyInfo.packing_essentials.map((item: string, i: number) => (
              <div key={i} className="text-gray-700">{item}</div>
            ))}
          </div>
        </div>

        {/* Check-in Schedule */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-3">Check-in Schedule 📱</h3>
          <div className="space-y-3">
            {safetyInfo.check_in_schedule.map((checkin, i: number) => (
              <div key={i} className="border-l-4 border-sos-orange pl-4">
                <p className="font-semibold text-sos-dark">{checkin.time}</p>
                <p className="text-gray-600">{checkin.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Local Resources */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-3">Local Resources</h3>
          <ul className="space-y-2">
            {safetyInfo.local_resources.map((resource: string, i: number) => (
              <li key={i} className="text-gray-700">{resource}</li>
            ))}
          </ul>
        </div>

        {/* Locations Section */}
        {trip.trip_data.locations && trip.trip_data.locations.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-3">📍 Trip Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trip.trip_data.locations.map((location, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-sos-blue transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sos-dark">{location.name}</p>
                      <p className="text-sm text-gray-600 capitalize mt-1">
                        {location.type === 'wilderness_area' ? 'Wilderness Area' : 
                         location.type === 'visitor_center' ? 'Visitor Center' :
                         location.type.replace('_', ' ').charAt(0).toUpperCase() + location.type.slice(1)}
                      </p>
                      {location.address && (
                        <p className="text-xs text-gray-500 mt-1">{location.address}</p>
                      )}
                    </div>
                    {location.coordinates?.lat && location.coordinates?.lng && mounted && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-mono">
                          {Math.abs(location.coordinates.lat).toFixed(4)}°{location.coordinates.lat >= 0 ? 'N' : 'S'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {Math.abs(location.coordinates.lng).toFixed(4)}°{location.coordinates.lng >= 0 ? 'E' : 'W'}
                        </p>
                      </div>
                    )}
                  </div>
                  {location.coordinates?.lat && location.coordinates?.lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-sos-blue hover:text-sos-dark mt-2"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Section */}
        <div className="card text-center">
          <h3 className="text-xl font-bold mb-3">Share This Trip Plan</h3>
          <p className="text-gray-600 mb-4">Make sure your loved ones have access to this safety information!</p>
          
          {mounted && (
            <div className="mb-4">
              <button
                onClick={copyToClipboard}
                className="btn-secondary w-full md:w-auto"
              >
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          )}

          {mounted && (
            <ShareButtons url={shareUrl} title={`My ${trip.trip_data.parsed_location} adventure plan`} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Trip plan created on {new Date(trip.created_at).toLocaleDateString()}</p>
          <p className="mt-2">
            Create your own safety plan at{' '}
            <Link href="/" className="text-sos-blue hover:underline">
              AwesomeSOS.com
            </Link>
          </p>
          {/* Debug Link - subtle placement */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link 
              href={`/trip/${trip.share_id}/debug`} 
              className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="mr-1">🐛</span>
              Debug View
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}