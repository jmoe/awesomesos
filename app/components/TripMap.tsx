'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon issue with Next.js
interface LeafletIconDefault extends L.Icon.Default {
  _getIconUrl?: string
}
delete (L.Icon.Default.prototype as LeafletIconDefault)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Location {
  name: string
  type: string
  address?: string
  coordinates?: {
    lat?: number
    lng?: number
  }
}

interface TripMapProps {
  locations: Location[]
  mainLocation: string
}

export function TripMap({ locations }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return

    // Initialize map with a default view (US center)
    const map = L.map(mapContainer.current).setView([39.8283, -98.5795], 4)
    mapInstance.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add markers for locations with coordinates
    const markers: L.Marker[] = []
    locations.forEach((location) => {
      if (location.coordinates?.lat && location.coordinates?.lng) {
        const marker = L.marker([location.coordinates.lat, location.coordinates.lng])
          .addTo(map)
          .bindPopup(`
            <div class="text-center">
              <strong>${location.name}</strong><br>
              <span class="text-sm text-gray-600">${location.type}</span>
              ${location.address ? `<br><span class="text-xs text-gray-500">${location.address}</span>` : ''}
            </div>
          `)
        markers.push(marker)
      }
    })

    // If we have markers, fit the map to show all of them
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [locations])

  // If no locations have coordinates, we'll use a geocoding service
  const hasCoordinates = locations.some(loc => loc.coordinates?.lat && loc.coordinates?.lng)

  return (
    <div className="card mb-6">
      <h3 className="text-xl font-bold mb-3">Adventure Map 🗺️</h3>
      {!hasCoordinates && (
        <p className="text-sm text-gray-600 mb-3">
          Map shows general area. Specific coordinates will be loaded when available.
        </p>
      )}
      <div 
        ref={mapContainer} 
        className="h-96 rounded-lg overflow-hidden border border-gray-200"
        style={{ minHeight: '400px' }}
      />
      {locations.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Locations:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {locations.map((location, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{location.name}</span>
                <span className="text-gray-500 ml-2">({location.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}