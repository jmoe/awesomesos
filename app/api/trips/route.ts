import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShareId } from '@/lib/utils'
import { analyzeTripAndGenerateSafetyInfo } from '@/lib/ai'
import { geocodeLocations } from '@/lib/geocoding'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tripDescription, optimizedContent, sourceUrl } = body

    if (!tripDescription?.trim()) {
      return NextResponse.json(
        { error: 'Trip description is required' },
        { status: 400 }
      )
    }

    // Use optimized content for AI analysis if available (from URL), otherwise use the description
    const contentForAnalysis = optimizedContent || tripDescription.trim()
    
    // Analyze trip and generate safety info using AI
    const aiResult = await analyzeTripAndGenerateSafetyInfo(contentForAnalysis)
    const { analysis, responseLog } = aiResult

    // Geocode locations that don't have coordinates
    const geocodedLocations = await geocodeLocations(analysis.trip_details.locations || [])

    // Extract dates with fallbacks
    const now = new Date()
    const startDate = analysis.trip_details.start_date || now.toISOString().split('T')[0]
    const endDate = analysis.trip_details.end_date || 
      new Date(now.getTime() + (analysis.trip_details.duration_days || 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Calculate duration if not provided
    const durationDays = analysis.trip_details.duration_days || 
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))

    // Parse trip data from AI analysis
    const tripData = {
      description: tripDescription,
      parsed_location: analysis.trip_details.location_name,
      duration_days: durationDays,
      activities: analysis.trip_details.activities,
      group_size: analysis.trip_details.group_size,
      experience_level: analysis.trip_details.experience_level,
      locations: geocodedLocations,
    }

    // Create Supabase client
    const supabase = await createClient()

    // Generate unique share ID
    const shareId = generateShareId()

    // Insert trip into database
    const { data, error } = await supabase
      .from('trips')
      .insert({
        share_id: shareId,
        trip_description: tripDescription.trim(), // Always use the user-friendly summary for display
        start_date: startDate,
        end_date: endDate,
        emergency_contact: analysis.trip_details.emergency_contact || null,
        safety_info: analysis.safety_info,
        trip_data: tripData,
        ai_response_log: responseLog,
        source_url: sourceUrl || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      )
    }

    return NextResponse.json({ shareId, trip: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}