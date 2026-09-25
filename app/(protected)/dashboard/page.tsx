import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Fish, MapPin, ScanSearch, Trophy } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, waterTypeBadgeClass } from '@/lib/format'
import type { CatchRow, FishingSpot } from '@/lib/types/database'

export const metadata = { title: 'Dashboard' }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/auth/login')
  const userId = userData.user.id

  const [spotsResult, catchesResult] = await Promise.all([
    supabase.from('fishing_spots').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('catches')
      .select('*')
      .eq('user_id', userId)
      .order('caught_at', { ascending: false })
      .limit(200)
  ])

  const spots = (spotsResult.data ?? []) as unknown as FishingSpot[]
  const catches = (catchesResult.data ?? []) as unknown as CatchRow[]

  const speciesSet = new Set(catches.map((c) => c.species_name))
  const bestCatch = catches.reduce<CatchRow | null>((best, current) => {
    if (current.weight_lbs == null) return best
    if (!best || best.weight_lbs == null || current.weight_lbs > best.weight_lbs) return current
    return best
  }, null)

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Angler Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your private fishing intelligence overview.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/map">
              <MapPin className="h-4 w-4" /> Open Map
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/identify">
              <ScanSearch className="h-4 w-4" /> Identify Catch
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Catches" value={catches.length} sub="Across all logged spots" />
        <StatCard label="Species Tracked" value={speciesSet.size} sub="Distinct classifications" />
        <StatCard label="Map Spots" value={spots.length} sub={`${spots.filter((s) => s.privacy_level === 'Public').length} shared publicly`} />
        <StatCard
          label="Best Catch"
          value={bestCatch?.weight_lbs != null ? `${bestCatch.weight_lbs.toFixed(1)} lbs` : '—'}
          sub={bestCatch?.species_name ?? 'No weighed catches yet'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fish className="h-4 w-4 text-primary" /> Recent Catches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {catches.length === 0 ? (
              <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                No catches yet. Head to the identifier to log your first.
              </p>
            ) : (
              catches.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-md border bg-muted/40 p-2.5">
                  <img
                    src={c.photo_url}
                    alt={c.species_name}
                    className="h-10 w-10 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.species_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.caught_at)}</p>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {(c.confidence_score * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" /> Your Spots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {spots.length === 0 ? (
              <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                No spots pinned yet. Click anywhere on the fishing map to log one.
              </p>
            ) : (
              spots.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Badge variant="outline" className={waterTypeBadgeClass(s.water_type)}>
                      {s.water_type}
                    </Badge>
                    <Badge variant={s.privacy_level === 'Public' ? 'default' : 'secondary'}>
                      {s.privacy_level}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
