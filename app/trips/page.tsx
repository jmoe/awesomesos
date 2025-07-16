'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Trip {
  id: string
  shareId: string
  description: string
  startDate: string
  endDate: string
  location: string
  activities: Array<{
    type: string
    name: string
    difficulty?: string
  }>
  safetyScore: number
  createdAt: string
  viewCount: number
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'created_at' | 'view_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchTrips = useCallback(async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0
      const response = await fetch(
        `/api/trips/list?limit=${limit}&offset=${currentOffset}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch trips')
      
      const data = await response.json()
      
      if (loadMore) {
        setTrips(prev => [...prev, ...data.trips])
      } else {
        setTrips(data.trips)
      }
      
      setHasMore(data.hasMore)
      setOffset(currentOffset + limit)
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }, [offset, sortBy, sortOrder, limit])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getSafetyScoreColor = (score: number) => {
    if (score <= 3) return 'text-green-600'
    if (score <= 6) return 'text-yellow-600'
    if (score <= 8) return 'text-orange-600'
    return 'text-red-600'
  }

  const getActivityEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      walking: '🚶',
      hiking: '🥾',
      biking: '🚴',
      driving: '🚗',
      camping: '🏕️',
      climbing: '🧗',
      swimming: '🏊',
      kayaking: '🛶',
      rafting: '🚣',
      skiing: '⛷️',
      snowboarding: '🏂',
      snowmobiling: '🛷',
      backpacking: '🎒',
      fishing: '🎣',
      wildlife_viewing: '🦌',
      photography: '📸',
      stargazing: '🌟',
    }
    return emojiMap[type] || '🏔️'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sos-light to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-sos-blue to-sos-dark text-white p-4">
        <div className="container mx-auto max-w-6xl">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-2 text-sm group">
            <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span>
            Back to AwesomeSOS
          </Link>
          <h1 className="text-2xl font-bold mb-2">Adventure Trip Plans 🗺️</h1>
          <p className="text-sm opacity-90">Browse and discover amazing adventure plans from the community</p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Sort Controls */}
        <div className="mb-6 flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'view_count')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sos-blue"
          >
            <option value="created_at">Sort by Date</option>
            <option value="view_count">Sort by Views</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:border-sos-blue"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {/* Trips Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No trips found yet.</p>
            <Link href="/create-trip" className="btn-primary inline-block mt-4">
              Create the first trip!
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trip/${trip.shareId}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-sos-dark group-hover:text-sos-blue transition-colors">
                      {trip.location}
                    </h3>
                    <div className={`text-2xl font-bold ${getSafetyScoreColor(trip.safetyScore)}`}>
                      {trip.safetyScore}/10
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {trip.description}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>{formatDate(trip.startDate)}</span>
                    <span className="mx-2">→</span>
                    <span>{formatDate(trip.endDate)}</span>
                  </div>

                  {trip.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {trip.activities.slice(0, 4).map((activity, i) => (
                        <span key={i} className="text-2xl" title={activity.name}>
                          {getActivityEmoji(activity.type)}
                        </span>
                      ))}
                      {trip.activities.length > 4 && (
                        <span className="text-sm text-gray-500 self-center">
                          +{trip.activities.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDate(trip.createdAt)}</span>
                    <span>{trip.viewCount} views</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchTrips(true)}
                  className="btn-secondary"
                >
                  Load More Adventures
                </button>
              </div>
            )}
          </>
        )}

        {/* Create Trip CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-sos-orange to-sos-blue text-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">Ready for Your Next Adventure?</h2>
          <p className="mb-6 opacity-90">Create your own trip plan and get AI-powered safety recommendations</p>
          <Link href="/create-trip" className="btn-primary bg-white text-sos-dark hover:bg-gray-100">
            Create New Trip Plan
          </Link>
        </div>
      </div>
    </main>
  )
}