'use client'

import Link from 'next/link'
import { TripForm } from '../components/TripForm'

export default function CreateTrip() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sos-light to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-sos-blue hover:text-sos-dark mb-6 group">
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-center mb-2">Plan Your Adventure 🗺️</h1>
          <p className="text-center text-gray-600 mb-2">
            Tell us about your trip and we'll create a safety plan to share with your crew!
          </p>
          <p className="text-center text-sm text-sos-orange font-medium mb-8">
            Because when life goes sideways, we're on your side ❤️
          </p>
          <TripForm />
        </div>
      </div>
    </main>
  )
}