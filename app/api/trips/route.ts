import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { generateShareId } from '@/app/lib/utils'

// For now, we'll use mock AI generation. You can replace this with OpenAI/Claude later
async function generateSafetyInfo(tripDescription: string, startDate: string, endDate: string) {
  // Extract location from description (simple regex for MVP)
  const locationMatch = tripDescription.match(/(?:at|to|in)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:with|for|this)|[,.]|$)/i)
  const location = locationMatch ? locationMatch[1].trim() : 'your destination'

  // Mock safety info - replace with actual AI call
  const safetyInfo = {
    location_name: location,
    emergency_numbers: {
      police: '911',
      medical: '911',
      park_ranger: location.toLowerCase().includes('park') ? '1-888-987-PARK' : null,
    },
    weather_summary: '☀️ Mostly sunny with temperatures ranging from 65-78°F. Light winds expected.',
    key_risks: [
      '⚠️ Trail conditions may be slippery after recent rain',
      '🐻 Wildlife activity reported in the area - store food properly',
      '🌄 Altitude changes may cause fatigue - pace yourself',
      '💧 Limited water sources on trail - bring extra',
    ],
    safety_tips: [
      '📱 Download offline maps before you lose signal',
      '🎒 Pack the 10 essentials including first aid kit',
      '👥 Let someone know your exact route and expected return',
      '⏰ Start early to avoid afternoon thunderstorms',
      '🥾 Break in new boots before the trip',
      '📸 Take photos of trail markers for navigation',
      '🔦 Bring headlamp with extra batteries',
    ],
    packing_essentials: [
      '🗺️ Map and compass/GPS',
      '☀️ Sun protection (sunscreen, hat, sunglasses)',
      '🔦 Headlamp + extra batteries',
      '🩹 First aid kit',
      '🔪 Knife or multi-tool',
      '🔥 Fire starter',
      '🏠 Emergency shelter',
      '🍫 Extra food + water',
      '👕 Extra clothes',
      '📞 Emergency whistle',
    ],
    fun_safety_score: {
      score: 7,
      description: "Pretty chill adventure! Just don't pet the wildlife 🦌",
    },
    check_in_schedule: [
      { time: 'Before departure', message: 'Heading out! Weather looks great 🌤️' },
      { time: 'Midday', message: 'Halfway there! Views are incredible 📸' },
      { time: 'Evening/arrival', message: 'Made it safely! Time to relax 🏕️' },
    ],
    local_resources: [
      '🏥 Nearest Hospital: Regional Medical Center (15 miles)',
      '🚁 Search & Rescue: County SAR Team (555-0123)',
      '⛽ Last gas station: Mountain View Gas (at park entrance)',
    ],
  }

  return safetyInfo
}

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