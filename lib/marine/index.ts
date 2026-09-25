import { computeMoonPhase, type MoonPhaseResult } from '@/lib/moon-phase'
import { mockTides, mockWeather, type TidePayload, type WeatherPayload } from '@/lib/marine/mock'

export interface MarineConditions {
  weather: WeatherPayload
  wind: { speedMph: number; headingDeg: number }
  tide: TidePayload
  moon: MoonPhaseResult
  source: { weather: 'live' | 'mock'; tide: 'live' | 'mock' }
  generatedAt: string
}

async function fetchLiveWeather(latitude: number, longitude: number): Promise<WeatherPayload | null> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${key}`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      temperatureF: Number(data.main?.temp?.toFixed(1) ?? 0),
      skyStatus: data.weather?.[0]?.main ?? 'Unknown',
      pressureInHg: Number(((data.main?.pressure ?? 1013) * 0.02953).toFixed(2)),
      humidityPct: data.main?.humidity ?? 0,
      windSpeedMph: Number(((data.wind?.speed ?? 0) * 2.23694).toFixed(1)),
      windHeadingDeg: data.wind?.deg ?? 0
    }
  } catch {
    return null
  }
}

async function fetchLiveTides(latitude: number, longitude: number): Promise<TidePayload | null> {
  const station = process.env.NOAA_TIDE_STATION
  if (!station) return null
  try {
    const begin = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const res = await fetch(
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MLLW&time_zone=gmt&interval=hilo&units=english&format=json&begin_date=${begin}&range=36&station=${station}`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    const predictions = data.predictions?.predictions
    if (!Array.isArray(predictions) || predictions.length === 0) return null

    const events = predictions.map((p: { t: string; v: string; type: 'High' | 'Low' }) => ({
      type: p.type,
      timeIso: new Date(`${p.t}Z`).toISOString(),
      heightFt: Number(p.v)
    }))
    const heights = events.map((e: { heightFt: number }) => e.heightFt)
    const min = Math.min(...heights)
    const max = Math.max(...heights)
    const amplitude = Number(((max - min) / 2).toFixed(2))
    const mean = (max + min) / 2

    const curve: TidePayload['curve'] = []
    for (let i = 0; i <= 96; i++) {
      const t = (i * 24) / 96
      const h = mean + amplitude * Math.sin((2 * Math.PI * t) / 12.42)
      curve.push({ t: Number(t.toFixed(2)), h: Number(h.toFixed(3)) })
    }

    return {
      currentHeightFt: Number(
        (mean + amplitude * Math.sin((2 * Math.PI * 12) / 12.42)).toFixed(2)
      ),
      amplitudeFt: amplitude,
      events: events.slice(0, 8),
      curve
    }
  } catch {
    return null
  }
}

export async function fetchMarineConditions(latitude: number, longitude: number): Promise<MarineConditions> {
  const now = new Date()
  const [weather, tide] = await Promise.all([
    fetchLiveWeather(latitude, longitude),
    fetchLiveTides(latitude, longitude)
  ])

  const weatherPayload = weather ?? mockWeather(latitude, longitude)
  const tidePayload = tide ?? mockTides(latitude, longitude, now)
  const moon = computeMoonPhase(now, longitude)

  return {
    weather: weatherPayload,
    wind: {
      speedMph: weatherPayload.windSpeedMph,
      headingDeg: weatherPayload.windHeadingDeg
    },
    tide: tidePayload,
    moon,
    source: {
      weather: weather ? 'live' : 'mock',
      tide: tide ? 'live' : 'mock'
    },
    generatedAt: now.toISOString()
  }
}
