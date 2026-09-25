'use client'

import { Sparkles } from 'lucide-react'
import type { FishingSpot } from '@/lib/types/database'
import FishingMap from '@/components/map/map-wrapper'

export function PublicMapSection({ spots }: { spots: FishingSpot[] }) {
  return (
    <div className="space-y-3">
      <div className="h-96 overflow-hidden rounded-xl border shadow-sm">
        <FishingMap spots={spots} authed={false} center={[28.5, -81.5]} zoom={4} />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Click an emerald community pin to preview shared intel. Sign up to unlock private pins, live marine
        conditions, and the AI identifier.
      </p>
    </div>
  )
}
