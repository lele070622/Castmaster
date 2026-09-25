import type { WaterType } from '@/lib/types/database'

const SKY_STATUSES = [
  'Clear Sky', 'Few Clouds', 'Scattered Clouds', 'Overcast',
  'Light Drizzle', 'Steady Rain', 'Thunderstorms'
] as const

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromCoords(latitude: number, longitude: number, salt = 0): number {
  const latKey = Math.abs(latitude) * 1_000_000
  const lngKey = Math.abs(longitude) * 1_000_000
  return Math.floor(latKey * 31 + lngKey * 17 + salt * 101)
}

export interface WeatherPayload {
  temperatureF: number
  skyStatus: string
  pressureInHg: number
  humidityPct: number
  windSpeedMph: number
  windHeadingDeg: number
}

export interface TideEvent {
  type: 'High' | 'Low'
  timeIso: string
  heightFt: number
}

export interface TidePayload {
  currentHeightFt: number
  amplitudeFt: number
  events: TideEvent[]
  curve: { t: number; h: number }[]
}

export function mockWeather(latitude: number, longitude: number): WeatherPayload {
  const rand = mulberry32(seedFromCoords(latitude, longitude, 1))
  const isCoastal = Math.abs(longitude % 10) < 5
  const baseTemp = isCoastal ? 68 : 61
  return {
    temperatureF: Number((baseTemp + rand() * 18 - 6).toFixed(1)),
    skyStatus: SKY_STATUSES[Math.floor(rand() * SKY_STATUSES.length)],
    pressureInHg: Number((29.6 + rand() * 0.6).toFixed(2)),
    humidityPct: Math.floor(45 + rand() * 45),
    windSpeedMph: Number((2 + rand() * 14).toFixed(1)),
    windHeadingDeg: Math.floor(rand() * 360)
  }
}

export function mockTides(latitude: number, longitude: number, now: Date = new Date()): TidePayload {
  const rand = mulberry32(seedFromCoords(latitude, longitude, 2))
  const startMs = Math.floor(now.getTime() / 3_600_000) * 3_600_000
  const amplitudeFt = Number((1.4 + rand() * 2.2).toFixed(2))
  const periodHours = 12.42
  const phase = rand() * periodHours

  const curve: TidePayload['curve'] = []
  for (let i = 0; i <= 96; i++) {
    const t = (i * 24) / 96
    const h = amplitudeFt * Math.sin((2 * Math.PI * (t + phase)) / periodHours)
    curve.push({ t: Number(t.toFixed(2)), h: Number(h.toFixed(3)) })
  }

  const events: TideEvent[] = []
  for (let hour = -12; hour <= 36; hour += 6.21) {
    const t = hour + 12
    const h = amplitudeFt * Math.sin((2 * Math.PI * (t + phase)) / periodHours)
    const isHigh = Math.cos((2 * Math.PI * (t + phase)) / periodHours) < 0
    events.push({
      type: isHigh ? 'High' : 'Low',
      timeIso: new Date(startMs + (t - 12) * 3_600_000).toISOString(),
      heightFt: Number(h.toFixed(2))
    })
  }
  events.sort((a, b) => new Date(a.timeIso).getTime() - new Date(b.timeIso).getTime())

  const currentT = 12
  const currentHeightFt = Number(
    (amplitudeFt * Math.sin((2 * Math.PI * (currentT + phase)) / periodHours)).toFixed(2)
  )

  return {
    currentHeightFt,
    amplitudeFt,
    events: events.filter((e) => new Date(e.timeIso).getTime() >= startMs - 12 * 3_600_000).slice(0, 8),
    curve
  }
}

export function inferWaterTypeForMock(latitude: number, longitude: number): WaterType {
  const rand = mulberry32(seedFromCoords(latitude, longitude, 3))
  const pick = rand()
  if (pick < 0.4) return 'Saltwater'
  if (pick < 0.75) return 'Freshwater'
  return 'Brackish'
}
