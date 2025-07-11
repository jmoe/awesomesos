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
    activities: z.array(z.string()).describe("List of activities mentioned"),
    group_size: z.number().optional().describe("Number of people if mentioned"),
    experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
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

export async function analyzeTripAndGenerateSafetyInfo(
  tripDescription: string
): Promise<TripAnalysis> {
  const model = getAIProvider()
  
  const prompt = `You are an expert outdoor safety consultant. Analyze this trip description and extract key details, then generate comprehensive safety information.

Trip Description: ${tripDescription}

First, carefully extract any trip details mentioned:
- Location/destination (required)
- Start/end dates (if mentioned - convert to ISO format like "2024-01-15")
- Duration in days (if mentioned or can be calculated)
- Emergency contact person (if mentioned)
- Activities planned (extract all mentioned)
- Group size/number of people (if mentioned)
- Experience level of participants (if mentioned)

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

    return result.object
  } catch (error) {
    console.error('AI generation failed:', error)
    
    // Fallback to mock data if AI fails
    return getFallbackTripAnalysis(tripDescription)
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
      activities: ['adventure activities'], // Generic fallback
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