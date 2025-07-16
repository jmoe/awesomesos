import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeTripAndGenerateSafetyInfo } from '@/lib/ai'
import { geocodeLocations } from '@/lib/geocoding'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const supabase = await createClient()

    // Fetch the existing trip
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (fetchError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Re-analyze the trip description
    const aiResult = await analyzeTripAndGenerateSafetyInfo(trip.trip_description)
    const { analysis, responseLog } = aiResult

    // Geocode locations that don't have coordinates
    const geocodedLocations = await geocodeLocations(analysis.trip_details.locations || [])

    // Extract dates with fallbacks from existing data
    const startDate = analysis.trip_details.start_date || trip.start_date
    const endDate = analysis.trip_details.end_date || trip.end_date
    
    // Calculate duration if not provided
    const durationDays = analysis.trip_details.duration_days || 
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))

    // Update trip data with new analysis
    const updatedTripData = {
      description: trip.trip_description,
      parsed_location: analysis.trip_details.location_name,
      duration_days: durationDays,
      activities: analysis.trip_details.activities,
      group_size: analysis.trip_details.group_size,
      experience_level: analysis.trip_details.experience_level,
      locations: geocodedLocations,
    }

    // Log what we're trying to update
    console.log('Updating trip with AI response log:', {
      shareId,
      hasResponseLog: !!responseLog,
      responseLogKeys: responseLog ? Object.keys(responseLog) : [],
    })

    // Update the trip in the database
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        start_date: startDate,
        end_date: endDate,
        emergency_contact: analysis.trip_details.emergency_contact || trip.emergency_contact,
        safety_info: analysis.safety_info,
        trip_data: updatedTripData,
        ai_response_log: responseLog,
        updated_at: new Date().toISOString(),
      })
      .eq('share_id', shareId)

    if (updateError) {
      console.error('Update error:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { error: 'Failed to update trip' },
        { status: 500 }
      )
    }

    // Fetch the updated trip
    const { data: updatedTrip, error: fetchUpdatedError } = await supabase
      .from('trips')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (fetchUpdatedError || !updatedTrip) {
      console.error('Failed to fetch updated trip:', fetchUpdatedError)
      return NextResponse.json(
        { error: 'Failed to fetch updated trip' },
        { status: 500 }
      )
    }

    // Log to verify AI response log was saved
    console.log('Updated trip AI response log:', {
      hasAIResponseLog: !!updatedTrip.ai_response_log,
      aiResponseLogKeys: updatedTrip.ai_response_log ? Object.keys(updatedTrip.ai_response_log) : [],
    })

    return NextResponse.json({ 
      success: true,
      trip: updatedTrip,
      message: 'Trip safety information has been regenerated successfully!'
    })
  } catch (error) {
    console.error('Regenerate error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate trip information' },
      { status: 500 }
    )
  }
}