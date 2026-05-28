'use client'
import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon (Leaflet ships paths assuming webpack public path)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const numberedIcon = (n: number, color = '#0d9488') =>
  L.divIcon({
    className: 'route-marker',
    html: `<div style="
      background:${color};
      color:white;
      width:28px;height:28px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:12px;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

const poiIcon = (type?: string) => {
  const emoji = type === 'viewpoint' ? '🔭'
    : type === 'town' ? '🏘️'
    : type === 'nature' ? '🌳'
    : type === 'food' ? '🍝'
    : '⭐'
  return L.divIcon({
    className: 'poi-marker',
    html: `<div style="
      background:#f59e0b;
      width:22px;height:22px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

const airportIcon = (label: string, color: string) =>
  L.divIcon({
    className: 'airport-marker',
    html: `<div style="
      background:${color};
      color:white;
      padding:2px 6px;
      border-radius:6px;
      font-weight:700;font-size:10px;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      white-space:nowrap;
    ">✈ ${label}</div>`,
    iconSize: [50, 22],
    iconAnchor: [25, 11],
  })

export interface MapPoint {
  city: string
  lat: number
  lng: number
  nights?: number
}

export interface MapPoi {
  name: string
  type?: string
  lat: number
  lng: number
}

interface Props {
  arrival?: { city: string; iata: string; lat?: number; lng?: number }
  departure?: { city: string; iata: string; lat?: number; lng?: number }
  stops: MapPoint[]
  pois?: MapPoi[]
  height?: number
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 })
  }, [points, map])
  return null
}

export default function RouteMap({ arrival, departure, stops, pois = [], height = 280 }: Props) {
  const validStops = useMemo(() => stops.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng)), [stops])
  const validPois = useMemo(() => pois.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)), [pois])
  const allPoints = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = validStops.map(s => [s.lat, s.lng])
    if (arrival?.lat !== undefined && arrival.lng !== undefined) pts.push([arrival.lat, arrival.lng])
    if (departure?.lat !== undefined && departure.lng !== undefined) pts.push([departure.lat, departure.lng])
    for (const p of validPois) pts.push([p.lat, p.lng])
    return pts
  }, [validStops, arrival, departure, validPois])

  if (allPoints.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
        No map coordinates available for this route.
      </div>
    )
  }

  const polyline: Array<[number, number]> = []
  if (arrival?.lat !== undefined && arrival.lng !== undefined) polyline.push([arrival.lat, arrival.lng])
  for (const s of validStops) polyline.push([s.lat, s.lng])
  if (departure?.lat !== undefined && departure.lng !== undefined) polyline.push([departure.lat, departure.lng])

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={allPoints[0]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='© OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />
        <Polyline positions={polyline} pathOptions={{ color: '#0d9488', weight: 3, dashArray: '6 8' }} />

        {arrival?.lat !== undefined && arrival.lng !== undefined && (
          <Marker position={[arrival.lat, arrival.lng]} icon={airportIcon(arrival.iata, '#0ea5e9')}>
            <Popup>Fly into {arrival.city} ({arrival.iata})</Popup>
          </Marker>
        )}

        {validStops.map((s, i) => (
          <Marker key={`${s.city}-${i}`} position={[s.lat, s.lng]} icon={numberedIcon(i + 1)}>
            <Popup>
              <b>{i + 1}. {s.city}</b>{s.nights ? ` · ${s.nights} nights` : ''}
            </Popup>
          </Marker>
        ))}

        {departure?.lat !== undefined && departure.lng !== undefined && (
          <Marker position={[departure.lat, departure.lng]} icon={airportIcon(departure.iata, '#f97316')}>
            <Popup>Fly out of {departure.city} ({departure.iata})</Popup>
          </Marker>
        )}

        {validPois.map((p, i) => (
          <Marker key={`poi-${p.name}-${i}`} position={[p.lat, p.lng]} icon={poiIcon(p.type)}>
            <Popup>
              <b>{p.name}</b>{p.type ? ` · ${p.type}` : ''}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
