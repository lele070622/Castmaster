'use client'

import { compassLabel } from '@/lib/format'

interface WindArrowProps {
  headingDeg: number
  speedMph: number
  size?: number
}

export function WindArrow({ headingDeg, speedMph, size = 56 }: WindArrowProps) {
  const flowDeg = (headingDeg + 180) % 360
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        aria-label={`Wind flowing toward ${compassLabel(flowDeg)}`}
        role="img"
      >
        <circle cx="28" cy="28" r="26" className="fill-muted" />
        <g transform={`rotate(${flowDeg} 28 28)`}>
          <line x1="28" y1="42" x2="28" y2="16" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M28 10 l-6 10 h12 z" fill="#10B981" />
        </g>
        <circle cx="28" cy="28" r="2.5" fill="#10B981" />
      </svg>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{speedMph.toFixed(1)} mph</p>
        <p className="text-sm text-muted-foreground">Flowing toward {compassLabel(flowDeg)}</p>
        <p className="text-xs text-muted-foreground">Heading from {compassLabel(headingDeg)} ({Math.round(headingDeg)}°)</p>
      </div>
    </div>
  )
}
