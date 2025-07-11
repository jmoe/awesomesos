'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShareButtons } from './ShareButtons'

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
      activities?: string[]
      group_size?: number
      experience_level?: string
    }
    created_at: string
    view_count: number
  }
}

export function TripDisplay({ trip }: TripDisplayProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const safetyInfo = trip.safety_info

  return (
    <main className="min-h-screen bg-gradient-to-br from-sos-light to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-sos-blue to-sos-dark text-white p-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-2">AwesomeSOS Trip Plan 🎒</h1>
          <p className="text-sm opacity-90">When life goes sideways, we're on your side!</p>
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

        {/* Share Section */}
        <div className="card text-center">
          <h3 className="text-xl font-bold mb-3">Share This Trip Plan</h3>
          <p className="text-gray-600 mb-4">Make sure your loved ones have access to this safety information!</p>
          
          <div className="mb-4">
            <button
              onClick={copyToClipboard}
              className="btn-secondary w-full md:w-auto"
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
          </div>

          <ShareButtons url={shareUrl} title={`My ${trip.trip_data.parsed_location} adventure plan`} />
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
        </div>
      </div>
    </main>
  )
}