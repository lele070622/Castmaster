import L from 'leaflet'
import type { PrivacyLevel } from '@/lib/types/database'

export const PUBLIC_PIN_COLOR = '#10B981'
export const PRIVATE_PIN_COLOR = '#0F172A'

export function pinColor(privacyLevel: PrivacyLevel): string {
  return privacyLevel === 'Public' ? PUBLIC_PIN_COLOR : PRIVATE_PIN_COLOR
}

export function createSpotIcon(privacyLevel: PrivacyLevel): L.DivIcon {
  const color = pinColor(privacyLevel)
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.3 0 0 6.3 0 14c0 9.1 14 26 14 26s14-16.9 14-26C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#F8FAFC" stroke-width="2"/><circle cx="14" cy="14" r="5.5" fill="#F8FAFC" opacity="0.9"/></svg>`
  return L.divIcon({
    className: 'spot-marker',
    html,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40]
  })
}
