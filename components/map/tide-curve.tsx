'use client'

import type { TidePayload } from '@/lib/marine/mock'
import { formatDateTime } from '@/lib/format'

interface TideCurveProps {
  tide: TidePayload
}

const WIDTH = 300
const HEIGHT = 110
const PADDING = 10

export function TideCurve({ tide }: TideCurveProps) {
  const maxAbs = Math.max(tide.amplitudeFt, 0.5)
  const points = tide.curve
    .filter((p) => p.t <= 24)
    .map((p) => {
      const x = PADDING + (p.t / 24) * (WIDTH - PADDING * 2)
      const y = HEIGHT / 2 - (p.h / maxAbs) * (HEIGHT / 2 - PADDING)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const baselineY = HEIGHT / 2
  const eventsInWindow = tide.events
    .filter((e) => {
      const t = (new Date(e.timeIso).getTime() - Date.now()) / 3_600_000 + 12
      return t >= 0 && t <= 24
    })
    .map((e) => {
      const t = Math.max(0, Math.min(24, (new Date(e.timeIso).getTime() - Date.now()) / 3_600_000 + 12))
      return {
        ...e,
        x: PADDING + (t / 24) * (WIDTH - PADDING * 2),
        y: HEIGHT / 2 - (e.heightFt / maxAbs) * (HEIGHT / 2 - PADDING)
      }
    })

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Tidal wave curve">
        <line x1={PADDING} y1={baselineY} x2={WIDTH - PADDING} y2={baselineY} className="stroke-border" strokeDasharray="4 4" />
        <polyline
          points={points}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {eventsInWindow.map((e, i) => (
          <circle
            key={i}
            cx={e.x}
            cy={e.y}
            r="3.5"
            fill={e.type === 'High' ? '#10B981' : '#F8FAFC'}
            stroke="#0F172A"
            strokeWidth="1.5"
          />
        ))}
        <text x={PADDING} y={HEIGHT - 1} className="fill-current text-[8px]" textAnchor="start">now -12h</text>
        <text x={WIDTH - PADDING} y={HEIGHT - 1} className="fill-current text-[8px]" textAnchor="end">now +12h</text>
      </svg>

      <div className="grid gap-1.5">
        {tide.events.slice(0, 4).map((event, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${event.type === 'High' ? 'bg-primary' : 'bg-foreground/40'}`}
              />
              {event.type} Tide
            </span>
            <span className="tabular-nums text-muted-foreground">{formatDateTime(event.timeIso)}</span>
            <span className="tabular-nums font-medium">{event.heightFt.toFixed(2)} ft</span>
          </div>
        ))}
      </div>
    </div>
  )
}
