'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ConditionsCard } from '@/components/map/conditions-card'
import { useAppStore } from '@/lib/store'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatDateTime, waterTypeBadgeClass } from '@/lib/format'
import type { CatchRow } from '@/lib/types/database'
import type { MarineConditions } from '@/lib/marine'

interface SpotPanelProps {
  authed: boolean
}

export function SpotPanel({ authed }: SpotPanelProps) {
  const spot = useAppStore((s) => s.selectedSpot)
  const closeSpotPanel = useAppStore((s) => s.closeSpotPanel)
  const history = useAppStore((s) => s.spotHistory)
  const setSpotHistory = useAppStore((s) => s.setSpotHistory)
  const setConditionsLoading = useAppStore((s) => s.setConditionsLoading)
  const setConditions = useAppStore((s) => s.setConditions)
  const setConditionsError = useAppStore((s) => s.setConditionsError)

  const spotId = spot?.id
  const latitude = spot ? Number(spot.latitude) : null
  const longitude = spot ? Number(spot.longitude) : null

  useEffect(() => {
    if (!spotId) return
    let cancelled = false

    async function fetchHistory() {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('catches')
        .select('*')
        .eq('spot_id', spotId)
        .order('caught_at', { ascending: false })
        .limit(10)
      if (!cancelled) {
        setSpotHistory({ spotId: spotId as string, catches: (data ?? []) as unknown as CatchRow[], loading: false })
      }
    }

    fetchHistory()

    if (authed && latitude != null && longitude != null) {
      setConditionsLoading(true)
      fetch('/api/marine-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status))
          const json = (await res.json()) as MarineConditions
          if (!cancelled) setConditions(json)
        })
        .catch(() => {
          if (!cancelled) setConditionsError('Unable to load live marine conditions. Retry shortly.')
        })
    } else {
      setConditionsLoading(false)
      setConditions(null)
    }

    return () => {
      cancelled = true
    }
  }, [spotId, authed, latitude, longitude, setSpotHistory, setConditions, setConditionsLoading, setConditionsError])

  if (!spot) return null

  const historyIsCurrent = history?.spotId === spot.id
  const catches = historyIsCurrent ? history.catches : []

  return (
    <div className="absolute inset-x-2 bottom-2 z-[600] max-h-[65%] overflow-y-auto rounded-lg border bg-popover/95 text-popover-foreground shadow-xl backdrop-blur sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto sm:w-96">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate font-semibold">{spot.title}</h3>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={waterTypeBadgeClass(spot.water_type)}>
              {spot.water_type}
            </Badge>
            <Badge variant={spot.privacy_level === 'Public' ? 'default' : 'secondary'}>
              {spot.privacy_level}
            </Badge>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            {Number(spot.latitude).toFixed(5)}, {Number(spot.longitude).toFixed(5)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={closeSpotPanel} aria-label="Close panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-[calc(65vh-64px)] space-y-4 overflow-y-auto p-4">
        {authed ? (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Environmental Conditions
            </h4>
            <ConditionsCard />
          </section>
        ) : null}

        {spot.notes ? (
          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Historical Notes
            </h4>
            <p className="rounded-md border bg-muted/40 p-3 text-sm">{spot.notes}</p>
          </section>
        ) : null}

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Past Catches Here
          </h4>
          {!historyIsCurrent || history?.loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
            </div>
          ) : catches.length === 0 ? (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              No logged catches at this exact point yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {catches.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-md border bg-muted/40 p-2">
                  <img
                    src={c.photo_url}
                    alt={c.species_name}
                    className="h-10 w-10 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.species_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(c.caught_at)}</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {(c.confidence_score * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!authed ? (
          <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
            Create an angler account to unlock live weather, tide, and moon-phase intelligence for this spot.
          </p>
        ) : null}
      </div>
    </div>
  )
}