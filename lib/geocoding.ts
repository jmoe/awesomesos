interface GeocodingResult {
  lat: number;
  lng: number;
  display_name?: string;
  confidence?: number;
  city?: string;
  state?: string;
  country?: string;
}

interface Location {
  name: string;
  type: string;
  address?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  city?: string;
  state?: string;
  country?: string;
}

// Cache geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>();

// Rate limiting configuration
const rateLimits = {
  nominatim: { interval: 1000, lastRequest: 0 }, // 1 req/second
  mapbox: { interval: 0, lastRequest: 0 }, // No rate limit
  google: { interval: 0, lastRequest: 0 }, // No rate limit
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mapbox Geocoding (requires API key)
async function geocodeWithMapbox(query: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
  if (!apiKey) return null;

  try {
    console.log('Geocoding with Mapbox:', query);
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${apiKey}&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      
      // Extract city, state from context
      let city: string | undefined;
      let state: string | undefined;
      let country: string | undefined;
      
      if (feature.context) {
        feature.context.forEach((context: { id: string; text: string }) => {
          if (context.id.startsWith('place.')) {
            city = context.text;
          } else if (context.id.startsWith('region.')) {
            state = context.text;
          } else if (context.id.startsWith('country.')) {
            country = context.text;
          }
        });
      }
      
      // Sometimes city info is in the place itself
      if (!city && feature.place_type?.includes('place')) {
        city = feature.text;
      }
      
      return {
        lat: feature.center[1],
        lng: feature.center[0],
        display_name: feature.place_name,
        confidence: feature.relevance,
        city,
        state,
        country,
      };
    }
  } catch (error) {
    console.error('Mapbox geocoding error:', error);
  }
  return null;
}

// Google Maps Geocoding (requires API key)
async function geocodeWithGoogle(query: string): Promise<GeocodingResult | null> {
  console.log('Geocoding with Google Maps:', query);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      
      // Extract city, state, country from address components
      let city: string | undefined;
      let state: string | undefined;
      let country: string | undefined;
      
      if (result.address_components) {
        result.address_components.forEach((component: { types: string[]; long_name: string; short_name?: string }) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name || component.long_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          }
        });
      }
      
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        display_name: result.formatted_address,
        confidence: 1.0, // Google doesn't provide confidence scores
        city,
        state,
        country,
      };
    }
  } catch (error) {
    console.error('Google geocoding error:', error);
  }
  return null;
}

// Nominatim (OpenStreetMap) - Free fallback
async function geocodeWithNominatim(query: string): Promise<GeocodingResult | null> {
  console.log('Geocoding with Nominatim:', query);
  const now = Date.now();
  const timeSinceLastRequest = now - rateLimits.nominatim.lastRequest;
  if (timeSinceLastRequest < rateLimits.nominatim.interval) {
    await sleep(rateLimits.nominatim.interval - timeSinceLastRequest);
  }
  rateLimits.nominatim.lastRequest = Date.now();

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AwesomeSOS/1.0 (https://awesomesos.com)',
        },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (results.length > 0) {
      const result = results[0];
      
      // Extract city, state, country from address details
      let city: string | undefined;
      let state: string | undefined;
      let country: string | undefined;
      
      if (result.address) {
        city = result.address.city || result.address.town || result.address.village;
        state = result.address.state;
        country = result.address.country;
      }
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        confidence: parseFloat(result.importance || 0.5),
        city,
        state,
        country,
      };
    }
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
  }
  return null;
}

// Improve search query based on location type
function enhanceSearchQuery(location: Location): string {
  let query = location.name;

  // Use full address if available
  if (location.address) {
    return location.address;
  }

  // Add city and state if available and not already in the query
  const queryLower = query.toLowerCase();
  
  if (location.city && location.state) {
    // Check if city and state aren't already in the name
    if (!queryLower.includes(location.city.toLowerCase()) && !queryLower.includes(location.state.toLowerCase())) {
      query = `${query}, ${location.city}, ${location.state}`;
    }
  } else if (location.state) {
    // Check if state isn't already in the name (as abbreviation or full name)
    if (!queryLower.includes(location.state.toLowerCase())) {
      query = `${query}, ${location.state}`;
    }
  } else if (location.city) {
    // Check if city isn't already in the name
    if (!queryLower.includes(location.city.toLowerCase())) {
      query = `${query}, ${location.city}`;
    }
  }

  // Enhance query based on location type
  const typeEnhancements: Record<string, string> = {
    trail: 'trail',
    trailhead: 'trailhead parking',
    campground: 'campground',
    park: 'park',
    visitor_center: 'visitor center',
    parking: 'parking lot',
    hotel: 'hotel',
    lodge: 'lodge',
    lake: 'lake',
    river: 'river',
    mountain: 'mountain peak',
    summit: 'summit',
    waterfall: 'waterfall',
    hot_spring: 'hot springs',
    viewpoint: 'viewpoint overlook',
    picnic_area: 'picnic area',
    boat_launch: 'boat launch',
    marina: 'marina',
    beach: 'beach',
    canyon: 'canyon',
    glacier: 'glacier',
    meadow: 'meadow',
    valley: 'valley',
  };

  const enhancement = typeEnhancements[location.type];
  if (enhancement && !query.toLowerCase().includes(enhancement.split(' ')[0])) {
    query = `${query} ${enhancement}`;
  }

  return query;
}

// Main geocoding function with fallback support
async function geocodeLocation(location: Location): Promise<GeocodingResult | null> {
  const query = enhanceSearchQuery(location);

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  let result: GeocodingResult | null = null;

  // Try providers in order of preference
  // 1. Try Mapbox (best for outdoor locations)
  result = await geocodeWithMapbox(query);

  // 2. Try Google Maps (most comprehensive)
  if (!result) {
    result = await geocodeWithGoogle(query);
  }

  // 3. Fall back to Nominatim (free but limited)
  if (!result) {
    result = await geocodeWithNominatim(query);
  }

  // Cache successful results
  if (result) {
    geocodingCache.set(cacheKey, result);
  }

  return result;
}

export async function geocodeLocations(locations: Location[]): Promise<Location[]> {
  const geocodedLocations = await Promise.all(
    locations.map(async (location) => {
      // Skip if coordinates already exist
      if (location.coordinates?.lat && location.coordinates?.lng) {
        return location;
      }

      // Try to geocode the location
      const result = await geocodeLocation(location);

      if (result) {
        return {
          ...location,
          coordinates: {
            lat: result.lat,
            lng: result.lng,
          },
          city: result.city || location.city,
          state: result.state || location.state,
          country: result.country || location.country,
        };
      }

      return location;
    })
  );

  return geocodedLocations;
}

// Pre-populate cache with well-known outdoor locations
const wellKnownLocations: Record<string, GeocodingResult> = {
  // National Parks
  'yosemite national park': { lat: 37.8651, lng: -119.5383, state: 'CA', country: 'USA' },
  'grand canyon national park': { lat: 36.1069, lng: -112.1129, state: 'AZ', country: 'USA' },
  'yellowstone national park': { lat: 44.4280, lng: -110.5885, state: 'WY', country: 'USA' },
  'zion national park': { lat: 37.2982, lng: -113.0263, state: 'UT', country: 'USA' },
  'rocky mountain national park': { lat: 40.3428, lng: -105.6836, state: 'CO', country: 'USA' },
  'glacier national park': { lat: 48.7596, lng: -113.7870, state: 'MT', country: 'USA' },
  'mount rainier national park': { lat: 46.8523, lng: -121.7603, state: 'WA', country: 'USA' },
  'olympic national park': { lat: 47.8021, lng: -123.6044, state: 'WA', country: 'USA' },
  'denali national park': { lat: 63.1148, lng: -151.1926, state: 'AK', country: 'USA' },
  'everglades national park': { lat: 25.2866, lng: -80.8987, state: 'FL', country: 'USA' },

  // Popular Trails
  'half dome trail': { lat: 37.7459, lng: -119.5332, state: 'CA', country: 'USA' },
  'angels landing trail': { lat: 37.2593, lng: -112.9516, state: 'UT', country: 'USA' },
  'bright angel trail': { lat: 36.0573, lng: -112.1445, state: 'AZ', country: 'USA' },

  // Mountains
  'mount whitney': { lat: 36.5786, lng: -118.2920, state: 'CA', country: 'USA' },
  'mount hood': { lat: 45.3736, lng: -121.6959, state: 'OR', country: 'USA' },
  'mount shasta': { lat: 41.4092, lng: -122.1949, state: 'CA', country: 'USA' },
  'pikes peak': { lat: 38.8409, lng: -105.0422, state: 'CO', country: 'USA' },

  // Popular Outdoor Areas
  'joshua tree national park': { lat: 33.8734, lng: -115.9010, state: 'CA', country: 'USA' },
  'big sur': { lat: 36.2704, lng: -121.8079, city: 'Big Sur', state: 'CA', country: 'USA' },
  'lake tahoe': { lat: 39.0968, lng: -120.0324, state: 'CA', country: 'USA' },
  'moab': { lat: 38.5733, lng: -109.5498, city: 'Moab', state: 'UT', country: 'USA' },
};

// Initialize cache with well-known locations
for (const [name, coords] of Object.entries(wellKnownLocations)) {
  geocodingCache.set(name, coords);
}