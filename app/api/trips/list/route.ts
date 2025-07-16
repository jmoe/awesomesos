import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const supabase = await createClient()

    // Query trips with pagination and sorting
    let query = supabase
      .from('trips')
      .select('id, share_id, trip_description, start_date, end_date, trip_data, safety_info, created_at, view_count')
      .range(offset, offset + limit - 1)

    // Apply sorting
    if (sortBy === 'view_count') {
      query = query.order('view_count', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    const { data: trips, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      )
    }

    // Transform trips to include parsed data
    const transformedTrips = trips?.map(trip => ({
      id: trip.id,
      shareId: trip.share_id,
      description: trip.trip_description,
      startDate: trip.start_date,
      endDate: trip.end_date,
      location: trip.trip_data?.parsed_location || 'Unknown Location',
      activities: trip.trip_data?.activities || [],
      safetyScore: trip.safety_info?.fun_safety_score?.score || 0,
      createdAt: trip.created_at,
      viewCount: trip.view_count,
    })) || []

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      trips: transformedTrips,
      totalCount: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}