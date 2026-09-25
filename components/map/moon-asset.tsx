'use client'

interface MoonAssetProps {
  phaseIndex: number
  illuminationPct: number
  size?: number
}

export function MoonAsset({ phaseIndex, illuminationPct, size = 64 }: MoonAssetProps) {
  const phaseFraction = phaseIndex / 8
  const k = phaseFraction <= 0.5 ? -104 * phaseFraction : 104 * (1 - phaseFraction)
  const shadowCx = 32 + k

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Moon phase, ${illuminationPct}% illuminated`}>
        <defs>
          <clipPath id="moon-clip">
            <circle cx="32" cy="32" r="26" />
          </clipPath>
        </defs>
        <circle cx="32" cy="32" r="27" className="fill-muted stroke-border" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="26" fill="#E2E8F0" />
        <circle cx={shadowCx} cy="32" r="26" fill="#0F172A" clipPath="url(#moon-clip)" />
        <circle cx="24" cy="24" r="3" fill="#F8FAFC" opacity="0.25" />
        <circle cx="40" cy="40" r="4" fill="#F8FAFC" opacity="0.18" />
        <circle cx="28" cy="42" r="2.5" fill="#F8FAFC" opacity="0.15" />
      </svg>
      <div>
        <p className="text-lg font-semibold">{illuminationPct}% illuminated</p>
      </div>
    </div>
  )
}
