'use client'

import { useCallback, useEffect, useState } from 'react'
import { FishingMap } from '@/components/map/fishing-map'
import { LogSpotModal } from '@/components/map/log-spot-modal'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { FishingSpot } from '@/lib/types/database'

export function MapView() {
  const [spots, setSpots] = useState<FishingSpot[]>([])
  const [loading, setLoading] = useState(true)

  const loadSpots = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setLoading(false)
      return
    }

    const [publicSpots, ownSpots] = await Promise.all([
      supabase.from('fishing_spots').select('*').eq('privacy_level', 'Public').order('created_at', { ascending: false }),
      supabase.from('fishing_spots').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])

    const merged = new Map<string, FishingSpot>()
    for (const spot of (publicSpots.data ?? []) as unknown as FishingSpot[]) merged.set(spot.id, spot)
    for (const spot of (ownSpots.data ?? []) as unknown as FishingSpot[]) merged.set(spot.id, spot)
    setSpots(Array.from(merged.values()))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSpots()
    window.addEventListener('castmaster:spots-updated', loadSpots)
    return () => window.removeEventListener('castmaster:spots-updated', loadSpots)
  }, [loadSpots])

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="w-full max-w-md space-y-3 px-6">
            <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-[60vh] animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ) : (
        <>
          <FishingMap spots={spots} authed />
          <LogSpotModal />
        </>
      )}
    </div>
  )
}
