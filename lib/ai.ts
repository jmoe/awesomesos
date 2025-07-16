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
      type: z.string().describe("Type of activity - common types include: walking, hiking, biking, driving, camping, climbing, swimming, kayaking, rafting, skiing, snowboarding, snowmobiling, backpacking, fishing, hunting, horseback_riding, rock_climbing, mountaineering, surfing, diving, snorkeling, sailing, canoeing, paddleboarding, running, trail_running, wildlife_viewing, photography, stargazing, but any activity type is allowed"),
      name: z.string().describe("Specific activity name or description"),
      difficulty: z.string().optional().describe("Difficulty level if mentioned - common values: easy, moderate, difficult, extreme, but any difficulty description is allowed"),
    })).describe("List of activities with their types"),
    group_size: z.number().optional().describe("Number of people if mentioned"),
    experience_level: z.string().optional().describe("Experience level - common values: beginner, intermediate, advanced, expert, but any experience level description is allowed"),
    locations: z.array(z.object({
      name: z.string().describe("Location name (e.g., 'Yosemite National Park', 'Half Dome Trail')"),
      type: z.string().describe("Type of location - common types include: park, trail, campground, landmark, city, wilderness_area, address, hotel, parking, trailhead, visitor_center, lake, river, beach, mountain, forest, desert, canyon, waterfall, hot_spring, cave, island, glacier, meadow, valley, summit, pass, road, viewpoint, picnic_area, boat_launch, marina, resort, lodge, hut, shelter, ranger_station, rest_area, overlook, bridge, dam, reservoir, spring, creek, wetland, marsh, estuary, bay, cove, peninsula, cliff, gorge, ridge, plateau, but any location type is allowed"),
      address: z.string().optional().describe("Full street address if mentioned (e.g., '123 Main St, Yosemite, CA 95389')"),
      city: z.string().optional().describe("City name if mentioned or known"),
      state: z.string().optional().describe("State/province code (e.g., 'CA', 'OR', 'WA') if mentioned or known"),
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

// Schema for URL content preprocessing
const URLContentSchema = z.object({
  summary: z.string().describe("A descriptive but concise summary of the trip/event (2-4 sentences) that sounds natural"),
  trip_type: z.enum(['trail', 'event', 'itinerary', 'blog_post', 'guide', 'other']).describe("Type of content - must be one of these exact values"),
  optimized_content: z.string().describe("Detailed content with all trip-relevant information for safety plan generation"),
})

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
      return openai('gpt-4o')
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

Note: The description below might be from a webpage, blog post, or event listing. Extract relevant trip information even if the format is unconventional.

Trip Description: ${tripDescription}

First, identify the general geographic area of the trip (state, region, park system) to help with location extraction.

Then, carefully extract any trip details mentioned:
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
- Extract city and state when mentioned or when you know them (e.g., Yosemite is in CA)

CRITICAL: For better geocoding accuracy, ALWAYS try to infer and include the city and/or state for each location:
- If a trail is in a national park, include the park name and state in the location name
- If multiple locations are mentioned in the same area, infer they share the same city/state
- Use context clues from the description to determine the general area
- Examples:
  * "Half Dome Trail" → name: "Half Dome Trail, Yosemite National Park, CA"
  * "Angels Landing" (when Zion is mentioned) → name: "Angels Landing, Zion National Park, UT"
  * "Bright Angel Trail" (when Grand Canyon is mentioned) → name: "Bright Angel Trail, Grand Canyon, AZ"
  * "Paradise Loop Trail" (when Mount Rainier is mentioned) → name: "Paradise Loop Trail, Mount Rainier National Park, WA"
  * "Emerald Lake Trail" (when Rocky Mountain NP is mentioned) → name: "Emerald Lake Trail, Rocky Mountain National Park, CO"

- For well-known locations, include approximate GPS coordinates (lat/lng)
- Examples of locations to extract:
  * "Yosemite National Park" → {name: "Yosemite National Park, CA", type: "park", state: "CA", coordinates: {lat: 37.8651, lng: -119.5383}}
  * "Half Dome Trail" → {name: "Half Dome Trail, Yosemite National Park, CA", type: "trail", state: "CA", coordinates: {lat: 37.7459, lng: -119.5332}}
  * "123 Main Street, Yosemite, CA" → {name: "123 Main Street, Yosemite, CA", type: "address", city: "Yosemite", state: "CA", address: "123 Main Street, Yosemite, CA"}
  * "Yosemite Valley Lodge" → {name: "Yosemite Valley Lodge, Yosemite Valley, CA", type: "hotel", city: "Yosemite Valley", state: "CA", address: "9006 Yosemite Lodge Drive, Yosemite Valley, CA 95389"}
  * "Moab, Utah" → {name: "Moab, UT", type: "city", city: "Moab", state: "UT"}
  * "Cathedral Beach Picnic Area parking" → {name: "Cathedral Beach Picnic Area, Yosemite National Park, CA", type: "parking", state: "CA"}
  * "Happy Isles Trailhead" → {name: "Happy Isles Trailhead, Yosemite Valley, CA", type: "trailhead", state: "CA"}
- If you don't know exact coordinates for a location, still include it but omit the coordinates field - we will geocode it later

LOCATION NAME ENRICHMENT RULES:
1. Always include the parent location (park, city, or region) in the name field for better geocoding
2. If a trip mentions "We're going to Yosemite" and later mentions "Half Dome", the location should be "Half Dome Trail, Yosemite National Park, CA"
3. For any trail/campground/landmark within a park, always append the park name and state
4. For locations in cities, append the city and state
5. Use common abbreviations for states (CA, OR, WA, UT, AZ, CO, etc.)
6. This enrichment should be in the 'name' field itself, not just in separate city/state fields

Then, SEPARATELY from trip_details, generate comprehensive safety information:
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

If dates or emergency contacts aren't mentioned, leave those fields empty - don't make them up.

IMPORTANT: The response must have two top-level fields:
1. trip_details (containing location_name, activities, locations, etc.)
2. safety_info (containing emergency_numbers, weather_summary, key_risks, etc.)

These should be SEPARATE top-level fields, NOT nested inside each other.`

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
        model: provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022',
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

export async function preprocessUrlContent(
  content: string,
  title?: string,
  url?: string
): Promise<{
  summary: string
  optimizedContent: string
  error?: string
}> {
  const model = getAIProvider()
  
  const isAllTrails = url?.includes('alltrails.com')
  const isOuterSpatial = url?.includes('outerspatial.com')
  const isTrailWebsite = url && (isAllTrails || isOuterSpatial || url.includes('hikingproject.com') || url.includes('trailforks.com'))
  
  const prompt = `You are helping extract trip/adventure information from a webpage. 

Title: ${title || 'No title'}
URL: ${url || 'No URL'}
Content: ${content}

${isAllTrails ? 'This is an AllTrails link. Focus on extracting trail-specific information.' : ''}
${isTrailWebsite ? 'This appears to be a trail/hiking website.' : ''}

Please analyze this content and:

1. Create a descriptive but concise summary (2-4 sentences) that captures the essence of the trip/adventure. 
   ${isTrailWebsite ? 
     'For trail websites, format like: "I\'m planning to hike [trail name] in [location]. It\'s a [distance] [difficulty] [trail type] with [elevation gain] that typically takes [duration]. [Add one interesting feature or characteristic]."' : 
     'This should read like something a user would naturally type when describing their plans to a friend. Include key details that make the trip unique.'}
   
   IMPORTANT: The summary must NOT contain any URLs or look like a URL. Write in natural language only.
   
   DO NOT return the URL itself as the summary. 
   DO NOT return text that starts with "http://" or "https://".
   DO NOT return text that looks like a web address.
   
   Example BAD summaries (never return these):
   - "https://www.outerspatial.com/outings/buckeye-lake-marie-loop"
   - "www.alltrails.com/trail/us/oregon/riley-ranch-trails"
   - "Check out this trail at example.com"
   
   Example GOOD summaries:
   - "I'm planning to hike the Buckeye Lake Marie Loop, a 5.2 mile moderate loop trail with 800ft elevation gain. It features beautiful lake views and typically takes 2-3 hours to complete."
   - "I want to explore Riley Ranch Trails in Oregon. It's a 7 mile network of trails suitable for hiking and mountain biking with varied terrain."

2. Identify the trip_type based on the content:
   - "trail" for trail/hiking websites
   - "event" for organized outdoor events
   - "itinerary" for trip plans
   - "blog_post" for personal trip stories
   - "guide" for how-to guides
   - "other" for anything else

3. Extract and optimize the content to focus ONLY on trip-relevant information:
   ${isTrailWebsite ? `
   For trail websites, prioritize:
   - Trail name and exact location
   - Trail length/distance
   - Elevation gain
   - Difficulty rating
   - Typical duration/time to complete
   - Trail type (loop, out-and-back, point-to-point)
   - Key features (waterfalls, views, etc.)
   - Best season/conditions
   - Parking and trailhead info
   - Permit requirements
   - Dog-friendly status
   - Recent trail conditions or alerts` : `
   General trip information:
   - Destination/location details
   - Dates and duration
   - Activities planned
   - Group size or participants
   - Difficulty level or experience requirements
   - Meeting points or logistics
   - Any mentioned safety considerations
   - Emergency contacts if provided`}

Remove all irrelevant content like:
- Website navigation elements
- User reviews and ratings (just note if highly rated)
- Photo galleries
- Advertisements
- Social media links
- Generic website footer content
- Unrelated articles or content

The optimized content should be comprehensive and include ALL relevant details that would be useful for generating a safety plan. Don't over-summarize - keep important details like specific locations, features, warnings, conditions, etc. This will be used behind the scenes for safety planning, so more detail is better.

IMPORTANT: Your response MUST include all three fields:
1. summary - The natural language summary
2. trip_type - One of: trail, event, itinerary, blog_post, guide, other
3. optimized_content - The detailed extracted information`

  try {
    const result = await generateObject({
      model,
      schema: URLContentSchema,
      prompt,
      temperature: 0.7,
    })

    return {
      summary: result.object.summary,
      optimizedContent: result.object.optimized_content,
    }
  } catch (error) {
    console.error('URL content preprocessing failed:', error)
    
    // Try a simpler approach without the enum field
    try {
      const simpleSchema = z.object({
        summary: z.string(),
        optimized_content: z.string(),
      })
      
      const simpleResult = await generateObject({
        model,
        schema: simpleSchema,
        prompt: prompt.replace('IMPORTANT: Your response MUST include all three fields:', 'Your response must include:').replace('2. trip_type - One of: trail, event, itinerary, blog_post, guide, other\n3. optimized_content', '2. optimized_content'),
        temperature: 0.7,
      })
      
      return {
        summary: simpleResult.object.summary,
        optimizedContent: simpleResult.object.optimized_content,
      }
    } catch (retryError) {
      console.error('Simple schema also failed:', retryError)
      // Final fallback to basic extraction
      return {
        summary: title ? `Trip information from: ${title}` : 'Trip information from webpage',
        optimizedContent: content.substring(0, 2000) + '...',
        error: 'Failed to optimize content',
      }
    }
  }
}