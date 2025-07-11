import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

// Schema for the AI response
const SafetyInfoSchema = z.object({
  location_name: z.string(),
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
})

type SafetyInfo = z.infer<typeof SafetyInfoSchema>

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

export async function generateSafetyInfo(
  tripDescription: string,
  startDate: string,
  endDate: string
): Promise<SafetyInfo> {
  const model = getAIProvider()
  
  const prompt = `You are an expert outdoor safety consultant. Generate comprehensive safety information for this adventure trip.

Trip Description: ${tripDescription}
Start Date: ${startDate}
End Date: ${endDate}

Guidelines:
- Be informative but encouraging (don't scare people away from adventures!)
- Include emojis to make it engaging and easy to scan
- Provide practical, actionable advice
- Consider the specific location, activities, and timeframe
- Emergency numbers should be realistic for the area (use 911 for US/Canada, research others)
- Weather summary should be general but relevant to the location and season
- Safety score should reflect actual risk level (1=very safe, 10=extreme risk)
- Packing list should be specific to the activities mentioned
- Check-in schedule should be reasonable for the trip length and type

Make it feel like advice from a knowledgeable friend who cares about safety but loves adventure!`

  try {
    const result = await generateObject({
      model,
      schema: SafetyInfoSchema,
      prompt,
      temperature: 0.7,
    })

    return result.object
  } catch (error) {
    console.error('AI generation failed:', error)
    
    // Fallback to mock data if AI fails
    return getFallbackSafetyInfo(tripDescription)
  }
}

// Fallback safety info if AI fails
function getFallbackSafetyInfo(tripDescription: string): SafetyInfo {
  // Extract location from description (simple regex)
  const locationMatch = tripDescription.match(/(?:at|to|in)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:with|for|this)|[,.]|$)/i)
  const location = locationMatch ? locationMatch[1].trim() : 'your destination'

  return {
    location_name: location,
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
      { time: 'Before departure', message: 'Heading out! Weather looks good 🌤️' },
      { time: 'Midday', message: 'Halfway point reached! All going well 📍' },
      { time: 'Evening/arrival', message: 'Made it safely! Time to celebrate 🎉' },
    ],
    local_resources: [
      '🏥 Check local hospital locations before departure',
      '🚁 Research local search & rescue contacts',
      '⛽ Note last gas/supply station locations',
      '📱 Verify cell coverage in the area',
    ],
  }
}