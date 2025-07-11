import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShareId } from '@/lib/utils'
import { generateSafetyInfo } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tripDescription, startDate, endDate, emergencyContact } = body

    if (!tripDescription || !startDate || !endDate || !emergencyContact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate safety info
    const safetyInfo = await generateSafetyInfo(tripDescription, startDate, endDate)

    // Parse trip data from description (for MVP, keep it simple)
    const tripData = {
      description: tripDescription,
      parsed_location: safetyInfo.location_name,
      duration_days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
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
        trip_description: tripDescription,
        start_date: startDate,
        end_date: endDate,
        emergency_contact: emergencyContact,
        safety_info: safetyInfo,
        trip_data: tripData,
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