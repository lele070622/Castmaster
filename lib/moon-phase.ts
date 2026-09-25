const SYNODIC_MONTH = 29.530588853
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14)

const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent'
] as const

export type FeedWindow = { start: number; end: number; label: string }

export interface MoonPhaseResult {
  phaseIndex: number
  phaseName: string
  illuminationPct: number
  moonAgeDays: number
  rating: 'Best' | 'Good' | 'Average'
  majorWindows: FeedWindow[]
  minorWindows: FeedWindow[]
}

export function computeMoonPhase(date: Date, longitude: number = 0): MoonPhaseResult {
  const daysSinceRef = (date.getTime() - REF_NEW_MOON_MS) / 86_400_000
  const moonAgeDays = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const phaseFraction = moonAgeDays / SYNODIC_MONTH
  const illumination = (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2
  const phaseIndex = Math.round(phaseFraction * 8) % 8
  const phaseName = PHASE_NAMES[phaseIndex]

  const solarNoonUtc = 12 - longitude / 15
  const transit = ((solarNoonUtc + phaseFraction * 24.84) % 24 + 24) % 24
  const underfoot = (transit + 12.42) % 24
  const moonrise = ((transit - 6.21) % 24 + 24) % 24
  const moonset = (transit + 6.21) % 24

  const majorWindows: FeedWindow[] = [
    { start: transit, end: transit + 2, label: 'Moon Overhead' },
    { start: underfoot, end: underfoot + 2, label: 'Moon Underfoot' }
  ]
  const minorWindows: FeedWindow[] = [
    { start: moonrise, end: moonrise + 1, label: 'Moonrise' },
    { start: moonset, end: moonset + 1, label: 'Moonset' }
  ]

  const nearFullOrNew = illumination >= 0.85 || illumination <= 0.15
  const rating: MoonPhaseResult['rating'] = nearFullOrNew ? 'Best' : illumination >= 0.6 || illumination <= 0.4 ? 'Good' : 'Average'

  return {
    phaseIndex,
    phaseName,
    illuminationPct: Math.round(illumination * 100),
    moonAgeDays: Number(moonAgeDays.toFixed(2)),
    rating,
    majorWindows,
    minorWindows
  }
}
