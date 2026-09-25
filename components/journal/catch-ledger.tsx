'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Search, NotebookPen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatDate, formatInches, formatLbs, waterTypeBadgeClass } from '@/lib/format'
import type { CatchRow, FishingSpot, WaterType } from '@/lib/types/database'

type WaterFilter = 'All' | WaterType | 'Unknown'

const WATER_FILTERS: WaterFilter[] = ['All', 'Freshwater', 'Saltwater', 'Brackish', 'Unknown']

interface LedgerEntry extends CatchRow {
  waterType: WaterType | 'Unknown'
  spotTitle: string | null
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = score * 100
  return (
    <Badge
      variant="outline"
      className={
        pct >= 80
          ? 'border-primary/40 text-primary'
          : pct >= 60
            ? 'border-amber-500/40 text-amber-500'
            : 'border-destructive/40 text-destructive'
      }
    >
      {pct.toFixed(0)}%
    </Badge>
  )
}

function LedgerSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function CatchLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [speciesQuery, setSpeciesQuery] = useState('')
  const [waterFilter, setWaterFilter] = useState<WaterFilter>('All')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        setLoading(false)
        return
      }

      const [catchesResult, spotsResult] = await Promise.all([
        supabase
          .from('catches')
          .select('*')
          .eq('user_id', user.id)
          .order('caught_at', { ascending: false }),
        supabase.from('fishing_spots').select('id,title,water_type').eq('user_id', user.id)
      ])

      const spotMap = new Map<string, { title: string; water_type: WaterType }>()
      for (const spot of (spotsResult.data ?? []) as unknown as Pick<FishingSpot, 'id' | 'title' | 'water_type'>[]) {
        spotMap.set(spot.id, { title: spot.title, water_type: spot.water_type })
      }

      const rows = ((catchesResult.data ?? []) as unknown as CatchRow[]).map(
        (row): LedgerEntry => {
          const spot = row.spot_id ? spotMap.get(row.spot_id) : undefined
          return { ...row, waterType: spot?.water_type ?? 'Unknown', spotTitle: spot?.title ?? null }
        }
      )

      setEntries(rows)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = speciesQuery.trim().toLowerCase()
    return entries.filter((entry) => {
      if (query && !entry.species_name.toLowerCase().includes(query)) return false
      if (waterFilter !== 'All' && entry.waterType !== waterFilter) return false
      if (dateRange?.from) {
        const caught = new Date(entry.caught_at)
        caught.setHours(0, 0, 0, 0)
        const from = new Date(dateRange.from)
        from.setHours(0, 0, 0, 0)
        if (caught < from) return false
        if (dateRange.to) {
          const to = new Date(dateRange.to)
          to.setHours(23, 59, 59, 999)
          if (caught > to) return false
        }
      }
      return true
    })
  }, [entries, speciesQuery, waterFilter, dateRange])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search species…"
            className="pl-8"
            value={speciesQuery}
            onChange={(e) => setSpeciesQuery(e.target.value)}
          />
        </div>
        <Select value={waterFilter} onValueChange={(v) => setWaterFilter(v as WaterFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WATER_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === 'All' ? 'All water types' : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <Card>
        <CardContent className="p-0 pt-0">
          {loading ? (
            <div className="p-4">
              <LedgerSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <NotebookPen className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">
                {entries.length === 0 ? 'No catches logged yet' : 'No catches match your filters'}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {entries.length === 0
                  ? 'Identify your first catch with AI vision or log a spot on the map to get started.'
                  : 'Try widening the date range or clearing the species search.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 pl-4">Photo</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>AI Conf.</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Bait / Lure</TableHead>
                  <TableHead>Water</TableHead>
                  <TableHead className="pr-4 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="pl-4">
                      <img
                        src={entry.photo_url}
                        alt={entry.species_name}
                        className="h-10 w-10 rounded-md object-cover"
                        loading="lazy"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.species_name}</span>
                        {entry.spotTitle ? (
                          <span className="text-xs text-muted-foreground">{entry.spotTitle}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ConfidenceBadge score={entry.confidence_score} />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatLbs(entry.weight_lbs)}</TableCell>
                    <TableCell className="tabular-nums">{formatInches(entry.length_in)}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.bait_used ?? '—'}</TableCell>
                    <TableCell>
                      {entry.waterType === 'Unknown' ? (
                        <span className="text-xs text-muted-foreground">Unknown</span>
                      ) : (
                        <Badge variant="outline" className={waterTypeBadgeClass(entry.waterType as WaterType)}>
                          {entry.waterType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground">
                      {formatDate(entry.caught_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {entries.length} ledger entries. All rows are verified against your
        authenticated user id server-side.
      </p>
    </div>
  )
}
