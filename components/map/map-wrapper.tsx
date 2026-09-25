'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

function MapSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      <Skeleton className="h-full w-full rounded-none" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}

const FishingMap = dynamic(() => import('@/components/map/fishing-map').then((m) => m.FishingMap), {
  ssr: false,
  loading: () => <MapSkeleton />
})

export default FishingMap
