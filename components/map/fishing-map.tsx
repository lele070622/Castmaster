'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Compass, Satellite, Mountain } from 'lucide-react'
import type { FishingSpot } from '@/lib/types/database'
import { createSpotIcon } from '@/components/map/pin'
import { SpotPanel } from '@/components/map/spot-panel'
import { useAppStore } from '@/lib/store'
import { roundCoord } from '@/lib/validation'
import { cn } from '@/lib/utils'

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
const TOPO_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
const TOPO_ATTR = 'Map data: &copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap'

interface MapClickHandlerProps {
  enabled: boolean
}

function MapClickHandler({ enabled }: MapClickHandlerProps) {
  const openLogSpot = useAppStore((s) => s.openLogSpot)
  useMapEvents({
    click(e) {
      if (!enabled) return
      openLogSpot({ latitude: roundCoord(e.latlng.lat), longitude: roundCoord(e.latlng.lng) })
    }
  })
  return null
}

function SpotBoundsFitter({ spots }: { spots: FishingSpot[] }) {
  const map = useMap()
  const fitRef = useRef<string>('')
  useEffect(() => {
    const key = spots.map((s) => s.id).join(',')
    if (spots.length === 0 || fitRef.current === key) return
    fitRef.current = key
    const bounds = L.latLngBounds(spots.map((s) => [Number(s.latitude), Number(s.longitude)] as [number, number]))
    map.fitBounds(bounds.pad(0.35), { maxZoom: 12 })
  }, [spots, map])
  return null
}

type BaseLayer = 'satellite' | 'topo'

export interface FishingMapProps {
  spots: FishingSpot[]
  authed: boolean
  className?: string
  center?: [number, number]
  zoom?: number
}

export function FishingMap({ spots, authed, className, center = [30.0, -90.0], zoom = 5 }: FishingMapProps) {
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('satellite')
  const [mapReady, setMapReady] = useState(false)
  const selectSpot = useAppStore((s) => s.selectSpot)
  const selectedSpot = useAppStore((s) => s.selectedSpot)
  const controlsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (controlsRef.current && mapReady) {
      L.DomEvent.disableClickPropagation(controlsRef.current)
      L.DomEvent.disableScrollPropagation(controlsRef.current)
    }
  }, [mapReady])

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        worldCopyJump
        whenReady={() => setMapReady(true)}
      >
        {baseLayer === 'satellite' ? (
          <TileLayer url={SATELLITE_URL} attribution={SATELLITE_ATTR} maxZoom={18} />
        ) : (
          <TileLayer url={TOPO_URL} attribution={TOPO_ATTR} maxZoom={17} />
        )}
        <MapClickHandler enabled={authed} />
        <SpotBoundsFitter spots={spots} />
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[Number(spot.latitude), Number(spot.longitude)]}
            icon={createSpotIcon(spot.privacy_level)}
            eventHandlers={{ click: () => selectSpot(spot) }}
          />
        ))}
      </MapContainer>

      <div ref={controlsRef} className="map-layer-controls flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setBaseLayer('satellite')}
          aria-label="Marine satellite layer"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border bg-background/90 shadow backdrop-blur transition-colors hover:bg-accent',
            baseLayer === 'satellite' && 'border-primary text-primary'
          )}
        >
          <Satellite className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setBaseLayer('topo')}
          aria-label="Topographic layer"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border bg-background/90 shadow backdrop-blur transition-colors hover:bg-accent',
            baseLayer === 'topo' && 'border-primary text-primary'
          )}
        >
          <Mountain className="h-4 w-4" />
        </button>
      </div>

      {selectedSpot ? <SpotPanel authed={authed} /> : null}

      {!mapReady ? (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/80">
          <Compass className="h-8 w-8 animate-pulse text-primary" />
        </div>
      ) : null}
    </div>
  )
}
