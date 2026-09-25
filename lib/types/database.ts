export type WaterType = 'Freshwater' | 'Saltwater' | 'Brackish'
export type PrivacyLevel = 'Public' | 'Private'

export interface Profile {
  id: string
  username: string | null
  created_at: string
}

export interface FishingSpot {
  id: string
  user_id: string
  title: string
  latitude: number
  longitude: number
  water_type: WaterType
  privacy_level: PrivacyLevel
  notes: string | null
  created_at: string
}

export interface WeatherSnapshot {
  temperature_f?: number
  sky_status?: string
  pressure_inhg?: number
  wind_speed_mph?: number
  wind_heading_deg?: number
  tide_height_ft?: number
  moon_phase?: string
}

export interface CatchRow {
  id: string
  user_id: string
  spot_id: string | null
  species_name: string
  confidence_score: number
  photo_url: string
  weight_lbs: number | null
  length_in: number | null
  bait_used: string | null
  weather_snapshot_json: WeatherSnapshot | null
  caught_at: string
}

export interface PublicStats {
  total_public_spots: number
  total_catches: number
  distinct_species: number
}

export interface FishAnalysis {
  common_name: string
  scientific_name: string
  confidence_percentage: number
  primary_habitats: string[]
  recommended_lures_or_baits: string[]
}

export type Coordinates = { latitude: number; longitude: number }
