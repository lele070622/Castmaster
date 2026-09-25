import type { WaterType } from '@/lib/types/database'

const COMPASS_DIRS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
] as const

export function compassLabel(degrees: number): string {
  return COMPASS_DIRS[Math.round(degrees / 22.5) % 16]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatHoursUtc(hours: number): string {
  const normalized = ((hours % 24) + 24) % 24
  const h = Math.floor(normalized)
  const m = Math.round((normalized - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} UTC`
}

export const WATER_TYPE_LABELS: Record<WaterType, string> = {
  Freshwater: 'Freshwater',
  Saltwater: 'Saltwater',
  Brackish: 'Brackish'
}

export function waterTypeBadgeClass(waterType: WaterType): string {
  switch (waterType) {
    case 'Freshwater':
      return 'bg-sky-500/15 text-sky-500 border-sky-500/30'
    case 'Saltwater':
      return 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30'
    case 'Brackish':
      return 'bg-amber-500/15 text-amber-500 border-amber-500/30'
  }
}

export function formatFeet(value: number): string {
  return `${value.toFixed(2)} ft`
}

export function formatLbs(value: number | null): string {
  return value == null ? '—' : `${value.toFixed(1)} lbs`
}

export function formatInches(value: number | null): string {
  return value == null ? '—' : `${value.toFixed(1)} in`
}
