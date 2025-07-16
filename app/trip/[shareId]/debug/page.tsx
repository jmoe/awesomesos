'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface TripDebugPageProps {
  params: Promise<{ shareId: string }>
}

interface Trip {
  id: string
  share_id: string
  trip_description: string
  start_date: string | null
  end_date: string | null
  view_count: number
  emergency_contact: string | null
  created_at: string
  updated_at: string
  ai_response_log?: {
    provider: string
    model: string
    response_time_ms: number
    prompt_length: number
    error?: string
    raw_response?: unknown
  }
  trip_data: unknown
  safety_info: unknown
}

export default function TripDebugPage({ params }: TripDebugPageProps) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [shareId, setShareId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const resolvedParams = await params
        setShareId(resolvedParams.shareId)
        
        const response = await fetch(`/api/trips/${resolvedParams.shareId}/debug`)
        
        if (!response.ok) {
          setError(true)
          return
        }
        
        const data = await response.json()
        setTrip(data.trip)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTrip()
  }, [params])

  const formatJSON = (obj: unknown) => {
    return JSON.stringify(obj, null, 2)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'null'
    return new Date(dateString).toLocaleString()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(trip, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug information...</p>
        </div>
      </main>
    )
  }

  if (error || !trip) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <Link href={`/trip/${shareId}`} className="inline-flex items-center text-gray-300 hover:text-white mb-2 text-sm group">
                <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span>
                Back to Trip View
              </Link>
              <h1 className="text-2xl font-bold mb-1">🐛 Debug View</h1>
              <p className="text-sm opacity-75">Raw database information for trip: {shareId}</p>
            </div>
            <div className="text-left md:text-right text-sm text-gray-400">
              <p>Trip ID: {trip.id}</p>
              <p>Created: {formatDate(trip.created_at)}</p>
              <p>Updated: {formatDate(trip.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Basic Info */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600">ID:</span>
              <span className="ml-2 font-mono">{trip.id}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Share ID:</span>
              <span className="ml-2 font-mono">{trip.share_id}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Start Date:</span>
              <span className="ml-2">{formatDate(trip.start_date)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">End Date:</span>
              <span className="ml-2">{formatDate(trip.end_date)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">View Count:</span>
              <span className="ml-2">{trip.view_count}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Emergency Contact:</span>
              <span className="ml-2">{trip.emergency_contact || 'null'}</span>
            </div>
          </div>
        </section>

        {/* Trip Description */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Trip Description</h2>
          <div className="bg-gray-900 p-4 rounded overflow-x-auto">
            <pre className="text-sm text-gray-100 whitespace-pre-wrap break-words">{trip.trip_description}</pre>
          </div>
        </section>

        {/* AI Response Log */}
        {trip.ai_response_log && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">AI Response Log</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-600">Provider:</span>
                  <span className="ml-2 font-mono">{trip.ai_response_log.provider}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Model:</span>
                  <span className="ml-2 font-mono">{trip.ai_response_log.model}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Response Time:</span>
                  <span className="ml-2">{trip.ai_response_log.response_time_ms}ms</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Prompt Length:</span>
                  <span className="ml-2">{trip.ai_response_log.prompt_length} chars</span>
                </div>
              </div>
              {trip.ai_response_log.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <span className="font-semibold text-red-800">Error:</span>
                  <p className="text-red-700 mt-1">{trip.ai_response_log.error}</p>
                </div>
              )}
              {trip.ai_response_log.raw_response !== undefined && trip.ai_response_log.raw_response !== null && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                    Raw Response Data (click to expand)
                  </summary>
                  <div className="bg-gray-900 p-4 rounded overflow-x-auto mt-2">
                    <pre className="text-xs text-gray-100">{formatJSON(trip.ai_response_log.raw_response)}</pre>
                  </div>
                </details>
              )}
            </div>
          </section>
        )}

        {/* Trip Data (Parsed) */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Trip Data (Parsed)</h2>
          <div className="bg-gray-900 p-4 rounded overflow-x-auto">
            <pre className="text-sm text-gray-100">{formatJSON(trip.trip_data)}</pre>
          </div>
        </section>

        {/* Safety Info */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Safety Information</h2>
          <div className="bg-gray-900 p-4 rounded overflow-x-auto">
            <pre className="text-sm text-gray-100">{formatJSON(trip.safety_info)}</pre>
          </div>
        </section>

        {/* Raw Database Record */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Complete Database Record</h2>
          <div className="bg-gray-900 p-4 rounded overflow-x-auto">
            <pre className="text-xs text-gray-100">{formatJSON(trip)}</pre>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href={`/trip/${shareId}`} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Back to Trip View
          </Link>
          <button
            onClick={copyToClipboard}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy JSON to Clipboard'}
          </button>
        </div>
      </div>
    </main>
  )
}