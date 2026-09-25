import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Fish, MapPin, ScanSearch, Waves, Moon, Wind } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublicMapSection } from '@/components/map/public-map-section'
import type { FishingSpot, PublicStats } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

async function loadPublicData() {
  try {
    const supabase = await createSupabaseServerClient()
    const [userResult, statsResult, spotsResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc('get_public_stats'),
      supabase
        .from('fishing_spots')
        .select('id,title,latitude,longitude,water_type,notes,privacy_level,user_id,created_at')
        .eq('privacy_level', 'Public')
        .order('created_at', { ascending: false })
        .limit(25)
    ])

    const spots = (spotsResult.data ?? []) as unknown as FishingSpot[]
    const stats = (statsResult.data ?? {
      total_public_spots: 0,
      total_catches: 0,
      distinct_species: 0
    }) as PublicStats

    return { user: userResult.data.user, stats, spots }
  } catch {
    return {
      user: null,
      stats: { total_public_spots: 0, total_catches: 0, distinct_species: 0 } as PublicStats,
      spots: [] as FishingSpot[]
    }
  }
}

const FEATURES = [
  { icon: MapPin, title: 'Geospatial Hot Spot Map', description: 'Marine satellite imagery with precise private pin logging.' },
  { icon: Waves, title: 'Live Marine Intelligence', description: 'Real-time weather, wind vectors, tide tables, and pressure tracking.' },
  { icon: Moon, title: 'Solunar Feeding Windows', description: 'Moon phase engine computing major and minor fish feeding periods.' },
  { icon: ScanSearch, title: 'AI Vision Identifier', description: 'Snap a photo, get species, habitats, and recommended baits instantly.' }
]

export default async function LandingPage() {
  const { user, stats, spots } = await loadPublicData()
  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Fish className="h-4 w-4" />
            </span>
            CastMaster Pro AI
          </span>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/login">Create Account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col justify-center gap-5">
            <Badge variant="outline" className="w-fit border-primary/40 text-primary">
              Public Community Dashboard
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Where anglers map the water, <span className="text-primary">AI maps the catch.</span>
            </h1>
            <p className="max-w-lg text-muted-foreground">
              CastMaster Pro AI combines a geospatial fishing map, live marine weather and tide intelligence,
              solunar feeding windows, and on-device AI species identification into one installable progressive
              web app.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/login">Start Logging Catches</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#community">Explore Community Hot Spots</a>
              </Button>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <dt className="text-xs text-muted-foreground">Public Hot Spots</dt>
                <dd className="text-2xl font-bold tabular-nums text-primary">{stats.total_public_spots}</dd>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <dt className="text-xs text-muted-foreground">Catches Logged</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.total_catches}</dd>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <dt className="text-xs text-muted-foreground">Species Tracked</dt>
                <dd className="text-2xl font-bold tabular-nums">{stats.distinct_species}</dd>
              </div>
            </dl>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wind className="h-4 w-4 text-primary" /> Global Public Hot Spots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PublicMapSection spots={spots} />
            </CardContent>
          </Card>
        </section>

        <section className="border-t bg-secondary/5 py-14">
          <div className="container grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="space-y-2 rounded-lg border bg-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} CastMaster Pro AI</span>
          <span>Row-level secured · Installable PWA · AI-assisted species vision</span>
        </div>
      </footer>
    </div>
  )
}
