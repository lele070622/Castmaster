'use client'

import { Droplets, Gauge, Wind } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { WindArrow } from '@/components/map/wind-arrow'
import { TideCurve } from '@/components/map/tide-curve'
import { MoonAsset } from '@/components/map/moon-asset'
import { useAppStore } from '@/lib/store'
import { compassLabel, formatHoursUtc, formatFeet } from '@/lib/format'

export function ConditionsCard() {
  const conditions = useAppStore((s) => s.conditions)
  const loading = useAppStore((s) => s.conditionsLoading)
  const error = useAppStore((s) => s.conditionsError)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (error || !conditions) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        {error ?? 'Marine conditions unavailable.'}
      </div>
    )
  }

  const { weather, wind, tide, moon } = conditions

  return (
    <Tabs defaultValue="weather" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="weather">Weather</TabsTrigger>
        <TabsTrigger value="wind">Wind</TabsTrigger>
        <TabsTrigger value="tide">Tide</TabsTrigger>
        <TabsTrigger value="moon">Moon</TabsTrigger>
      </TabsList>

      <TabsContent value="weather" className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Temperature</p>
            <p className="text-2xl font-semibold tabular-nums">{weather.temperatureF.toFixed(1)}°F</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Sky Status</p>
            <p className="text-lg font-semibold">{weather.skyStatus}</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" /> Pressure
            </p>
            <p className="text-xl font-semibold tabular-nums">{weather.pressureInHg.toFixed(2)} inHg</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" /> Humidity
            </p>
            <p className="text-xl font-semibold tabular-nums">{weather.humidityPct}%</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="wind">
        <div className="rounded-md border bg-muted/40 p-4">
          <WindArrow headingDeg={wind.headingDeg} speedMph={wind.speedMph} />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wind className="h-3.5 w-3.5" /> Meteorological heading: {Math.round(wind.headingDeg)}° ({compassLabel(wind.headingDeg)})
          </p>
        </div>
      </TabsContent>

      <TabsContent value="tide" className="space-y-2">
        <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
          <span>Current Height</span>
          <span className="text-lg font-semibold tabular-nums">{formatFeet(tide.currentHeightFt)}</span>
        </div>
        <TideCurve tide={tide} />
      </TabsContent>

      <TabsContent value="moon" className="space-y-3">
        <div className="rounded-md border bg-muted/40 p-4">
          <MoonAsset phaseIndex={moon.phaseIndex} illuminationPct={moon.illuminationPct} />
          <div className="mt-3 flex items-center justify-between">
            <p className="font-medium">{moon.phaseName}</p>
            <Badge variant={moon.rating === 'Best' ? 'default' : 'secondary'}>Feeding: {moon.rating}</Badge>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Major Windows</p>
            {moon.majorWindows.map((w, i) => (
              <p key={i} className="flex justify-between text-sm">
                <span>{w.label}</span>
                <span className="tabular-nums text-primary">{formatHoursUtc(w.start)}</span>
              </p>
            ))}
          </div>
          <div className="rounded-md border p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Minor Windows</p>
            {moon.minorWindows.map((w, i) => (
              <p key={i} className="flex justify-between text-sm">
                <span>{w.label}</span>
                <span className="tabular-nums">{formatHoursUtc(w.start)}</span>
              </p>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}