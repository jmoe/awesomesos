interface GeocodingResult {
  lat: number
  lng: number
}

interface Location {
  name: string
  type: string
  address?: string
  coordinates?: {
    lat?: number
    lng?: number
  }
}

// Cache geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>()

// Rate limiting: max 1 request per second for Nominatim
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function geocodeLocation(locationName: string): Promise<GeocodingResult | null> {
  // Check cache first
  const cacheKey = locationName.toLowerCase().trim()
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!
  }

  // Rate limiting
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
  }
  lastRequestTime = Date.now()

  try {
    // Use Nominatim (OpenStreetMap) for geocoding
    const encodedLocation = encodeURIComponent(locationName)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`,
      {
        headers: {
          'User-Agent': 'AwesomeSOS/1.0 (https://awesomesos.com)',
        },
      }
    )

    if (!response.ok) {
      console.error(`Geocoding failed for ${locationName}: ${response.status}`)
      return null
    }

    const results = await response.json()
    
    if (results.length > 0) {
      const result = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      }
      
      // Cache the result
      geocodingCache.set(cacheKey, result)
      
      return result
    }
    
    return null
  } catch (error) {
    console.error(`Geocoding error for ${locationName}:`, error)
    return null
  }
}

export async function geocodeLocations(locations: Location[]): Promise<Location[]> {
  const geocodedLocations = await Promise.all(
    locations.map(async (location) => {
      // Skip if coordinates already exist
      if (location.coordinates?.lat && location.coordinates?.lng) {
        return location
      }

      // Determine what to geocode - prefer full address if available
      let searchQuery = location.name
      
      // If we have a full address, use that for more accurate geocoding
      if (location.address) {
        searchQuery = location.address
      } else if (location.type === 'address') {
        // If type is address but no address field, the name might be the address
        searchQuery = location.name
      } else if (location.type === 'hotel' || location.type === 'parking' || location.type === 'trailhead' || location.type === 'visitor_center') {
        // For specific location types, add context to improve geocoding
        searchQuery = `${location.name} ${location.type}`
      }

      // Try to geocode the location
      const coordinates = await geocodeLocation(searchQuery)
      
      if (coordinates) {
        return {
          ...location,
          coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng,
          },
        }
      }
      
      return location
    })
  )

  return geocodedLocations
}

// Pre-populate cache with well-known locations to reduce API calls
const wellKnownLocations: Record<string, GeocodingResult> = {
  'yosemite national park': { lat: 37.8651, lng: -119.5383 },
  'grand canyon national park': { lat: 36.1069, lng: -112.1129 },
  'yellowstone national park': { lat: 44.4280, lng: -110.5885 },
  'zion national park': { lat: 37.2982, lng: -113.0263 },
  'rocky mountain national park': { lat: 40.3428, lng: -105.6836 },
  'glacier national park': { lat: 48.7596, lng: -113.7870 },
  'mount rainier national park': { lat: 46.8523, lng: -121.7603 },
  'olympic national park': { lat: 47.8021, lng: -123.6044 },
  'denali national park': { lat: 63.1148, lng: -151.1926 },
  'everglades national park': { lat: 25.2866, lng: -80.8987 },
}

// Initialize cache with well-known locations
for (const [name, coords] of Object.entries(wellKnownLocations)) {
  geocodingCache.set(name, coords)
}