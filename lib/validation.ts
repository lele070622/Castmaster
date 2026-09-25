import type { Coordinates } from '@/lib/types/database'

export interface CoordinateValidationResult {
  valid: boolean
  errors: { latitude?: string; longitude?: string }
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

export function validateCoordinates(coords: Partial<Coordinates>): CoordinateValidationResult {
  const errors: { latitude?: string; longitude?: string } = {}
  const latitude = Number(coords.latitude)
  const longitude = Number(coords.longitude)

  if (!Number.isFinite(latitude)) {
    errors.latitude = 'Latitude is required'
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude must be within [-90, 90]'
  }

  if (!Number.isFinite(longitude)) {
    errors.longitude = 'Longitude is required'
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude must be within [-180, 180]'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function roundCoord(value: number, precision = 7): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
