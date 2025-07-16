import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

// Schema for the AI response
const TripAnalysisSchema = z.object({
  // Extracted trip details
  trip_details: z.object({
    location_name: z.string(),
    start_date: z.string().optional().describe("ISO date string if mentioned in description"),
    end_date: z.string().optional().describe("ISO date string if mentioned in description"),
    duration_days: z.number().optional().describe("Trip duration in days if determinable"),
    emergency_contact: z.string().optional().describe("Emergency contact if mentioned"),
    activities: z.array(z.object({
      type: z.enum(['walking', 'hiking', 'biking', 'driving', 'camping', 'climbing', 'swimming', 'kayaking', 'rafting', 'skiing', 'snowboarding', 'snowmobiling', 'backpacking', 'fishing', 'hunting', 'horseback_riding', 'rock_climbing', 'mountaineering', 'surfing', 'diving', 'snorkeling', 'sailing', 'canoeing', 'paddleboarding', 'running', 'trail_running', 'wildlife_viewing', 'photography', 'stargazing', 'other']).describe("Type of activity"),
      name: z.string().describe("Specific activity name or description"),
      difficulty: z.enum(['easy', 'moderate', 'difficult', 'extreme']).optional().describe("Difficulty level if mentioned"),
    })).describe("List of activities with their types"),
    group_size: z.number().optional().describe("Number of people if mentioned"),
    experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    locations: z.array(z.object({
      name: z.string().describe("Location name (e.g., 'Yosemite National Park', 'Half Dome Trail')"),
      type: z.enum(['park', 'trail', 'campground', 'landmark', 'city', 'wilderness_area', 'address', 'hotel', 'parking', 'trailhead', 'visitor_center', 'other']),
      address: z.string().optional().describe("Full street address if mentioned (e.g., '123 Main St, Yosemite, CA 95389')"),
      coordinates: z.object({
        lat: z.number().optional().describe("Latitude if known"),
        lng: z.number().optional().describe("Longitude if known"),
      }).optional(),
    })).describe("Specific locations mentioned in the trip description, including addresses"),
  }),
  // Safety information
  safety_info: z.object({
    emergency_numbers: z.object({
      police: z.string(),
      medical: z.string(),
      park_ranger: z.string().optional(),
    }),
    weather_summary: z.string(),
    key_risks: z.array(z.string()).max(5),
    safety_tips: z.array(z.string()).max(8),
    packing_essentials: z.array(z.string()).max(12),
    fun_safety_score: z.object({
      score: z.number().min(1).max(10),
      description: z.string(),
    }),
    check_in_schedule: z.array(z.object({
      time: z.string(),
      message: z.string(),
    })).max(4),
    local_resources: z.array(z.string()).max(5),
  }),
})

type TripAnalysis = z.infer<typeof TripAnalysisSchema>

// Get AI provider based on environment variable
function getAIProvider() {
  const provider = process.env.AI_PROVIDER || 'openai'
  
  switch (provider.toLowerCase()) {
    case 'anthropic':
    case 'claude':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required when using Anthropic provider')
      }
      return anthropic('claude-3-5-sonnet-20241022')
    
    case 'openai':
    case 'gpt':
    default:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required when using OpenAI provider')
      }
      return openai('gpt-4o-mini')
  }
}

interface AIAnalysisResult {
  analysis: TripAnalysis
  responseLog: {
    provider: string
    model: string
    timestamp: string
    prompt_length: number
    response_time_ms?: number
    raw_response?: unknown
    error?: string
  }
}

export async function analyzeTripAndGenerateSafetyInfo(
  tripDescription: string
): Promise<AIAnalysisResult> {
  const startTime = Date.now()
  const provider = process.env.AI_PROVIDER || 'openai'
  const model = getAIProvider()
  
  const prompt = `You are an expert outdoor safety consultant. Analyze this trip description and extract key details, then generate comprehensive safety information.

Trip Description: ${tripDescription}

First, carefully extract any trip details mentioned:
- Location/destination (required)
- Start/end dates (if mentioned - convert to ISO format like "2024-01-15")
- Duration in days (if mentioned or can be calculated)
- Emergency contact person (if mentioned)
- Activities planned (extract all mentioned with their types and details)
  * For each activity, identify:
    - Type: walking, hiking, biking, driving, camping, climbing, swimming, kayaking, etc.
    - Name: specific activity description (e.g., "Half Dome day hike", "Mountain biking at Slickrock Trail")
    - Difficulty: easy, moderate, difficult, extreme (if mentioned)
- Group size/number of people (if mentioned)
- Experience level of participants (if mentioned)

IMPORTANT: Extract ALL specific locations and addresses mentioned in the trip description:
- Include every park, trail, landmark, campground, city, wilderness area, viewpoint, lake, etc.
- ESPECIALLY look for and extract any street addresses, hotels, parking areas, trailheads, visitor centers
- For each location, identify its type (park, trail, campground, landmark, city, wilderness_area, address, hotel, parking, trailhead, visitor_center, other)
- If a full street address is mentioned, include it in the address field
- For well-known locations, include approximate GPS coordinates (lat/lng)
- Examples of locations to extract:
  * "Yosemite National Park" → {name: "Yosemite National Park", type: "park", coordinates: {lat: 37.8651, lng: -119.5383}}
  * "Half Dome Trail" → {name: "Half Dome Trail", type: "trail", coordinates: {lat: 37.7459, lng: -119.5332}}
  * "123 Main Street, Yosemite, CA" → {name: "123 Main Street", type: "address", address: "123 Main Street, Yosemite, CA"}
  * "Yosemite Valley Lodge" → {name: "Yosemite Valley Lodge", type: "hotel", address: "9006 Yosemite Lodge Drive, Yosemite Valley, CA 95389"}
  * "Cathedral Beach Picnic Area parking" → {name: "Cathedral Beach Picnic Area", type: "parking"}
  * "Happy Isles Trailhead" → {name: "Happy Isles Trailhead", type: "trailhead"}
- If you don't know exact coordinates for a location, still include it but omit the coordinates field - we will geocode it later

Then generate comprehensive safety information:
- Emergency numbers for the specific location
- Weather considerations for the area and time
- Location and activity-specific risks
- Practical safety tips
- Detailed packing list for the activities
- Fun safety score (1=very safe, 10=extreme risk)
- Reasonable check-in schedule with specific times (e.g., "8:00 AM", "12:00 PM", "6:00 PM")
- Local resources and facilities

Guidelines:
- Be informative but encouraging (don't scare people away from adventures!)
- Include emojis to make it engaging and easy to scan
- Provide practical, actionable advice
- Emergency numbers should be realistic for the area (use 911 for US/Canada, research others)
- Safety score should reflect actual risk level
- Check-in times should be specific times like "7:00 AM", "1:00 PM", "7:00 PM" not generic descriptions
- Make it feel like advice from a knowledgeable friend who cares about safety but loves adventure!

If dates or emergency contacts aren't mentioned, leave those fields empty - don't make them up.`

  try {
    const result = await generateObject({
      model,
      schema: TripAnalysisSchema,
      prompt,
      temperature: 0.7,
    })

    const responseTime = Date.now() - startTime

    return {
      analysis: result.object,
      responseLog: {
        provider,
        model: provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022',
        timestamp: new Date().toISOString(),
        prompt_length: prompt.length,
        response_time_ms: responseTime,
        raw_response: result,
      }
    }
  } catch (error) {
    console.error('AI generation failed:', error)
    
    // Fallback to mock data if AI fails
    return {
      analysis: getFallbackTripAnalysis(tripDescription),
      responseLog: {
        provider: 'fallback',
        model: 'none',
        timestamp: new Date().toISOString(),
        prompt_length: prompt.length,
        response_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Fallback trip analysis if AI fails
function getFallbackTripAnalysis(tripDescription: string): TripAnalysis {
  // Extract location from description (simple regex)
  const locationMatch = tripDescription.match(/(?:at|to|in)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:with|for|this)|[,.]|$)/i)
  const location = locationMatch ? locationMatch[1].trim() : 'your destination'

  return {
    trip_details: {
      location_name: location,
      activities: [{ type: 'other', name: 'Adventure activities', difficulty: undefined }], // Generic fallback
      locations: location ? [{
        name: location,
        type: 'other',
      }] : [],
      // Leave dates and emergency contact empty since they weren't extracted
    },
    safety_info: {
      emergency_numbers: {
        police: '911',
        medical: '911',
        park_ranger: location.toLowerCase().includes('park') ? '1-888-987-PARK' : undefined,
      },
      weather_summary: '☀️ Please check current weather conditions for your specific location and dates.',
      key_risks: [
        '⚠️ Weather conditions can change rapidly',
        '🐻 Wildlife may be present in the area',
        '🌄 Terrain difficulty varies by location',
        '💧 Water sources may be limited',
      ],
      safety_tips: [
        '📱 Download offline maps before losing signal',
        '🎒 Pack the 10 essentials',
        '👥 Share your itinerary with emergency contacts',
        '⏰ Start early to avoid afternoon weather',
        '🥾 Wear appropriate footwear',
        '📸 Take photos of trail markers',
        '🔦 Bring headlamp with extra batteries',
      ],
      packing_essentials: [
        '🗺️ Map and navigation tools',
        '☀️ Sun protection',
        '🔦 Headlamp + batteries',
        '🩹 First aid kit',
        '🔪 Multi-tool',
        '🔥 Fire starter',
        '🏠 Emergency shelter',
        '🍫 Extra food + water',
        '👕 Extra clothes',
        '📞 Emergency whistle',
      ],
      fun_safety_score: {
        score: 6,
        description: "Moderate adventure - stay alert and have fun! 🌟",
      },
      check_in_schedule: [
        { time: '8:00 AM', message: 'Heading out! Weather looks good 🌤️' },
        { time: '12:00 PM', message: 'Halfway point reached! All going well 📍' },
        { time: '6:00 PM', message: 'Made it safely! Time to celebrate 🎉' },
      ],
      local_resources: [
        '🏥 Check local hospital locations before departure',
        '🚁 Research local search & rescue contacts',
        '⛽ Note last gas/supply station locations',
        '📱 Verify cell coverage in the area',
      ],
    },
  }
}