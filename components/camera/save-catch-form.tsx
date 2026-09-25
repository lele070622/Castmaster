'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPinPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { validateCoordinates } from '@/lib/validation'
import type { FishingSpot } from '@/lib/types/database'
import { waterTypeBadgeClass, WATER_TYPE_LABELS } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

interface SaveCatchFormProps {
  speciesName: string
  photoBlob: Blob | null
  photoDataUrl: string | null
  confidence: number | null
  onSaved: () => void
}

export function SaveCatchForm({ speciesName, photoBlob, photoDataUrl, confidence, onSaved }: SaveCatchFormProps) {
  const [spots, setSpots] = useState<FishingSpot[]>([])
  const [spotChoice, setSpotChoice] = useState<string>('none')
  const [newSpotTitle, setNewSpotTitle] = useState('')
  const [newSpotLat, setNewSpotLat] = useState('')
  const [newSpotLng, setNewSpotLng] = useState('')
  const [weight, setWeight] = useState('')
  const [lengthIn, setLengthIn] = useState('')
  const [bait, setBait] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSpots() {
      const supabase = createSupabaseBrowserClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      const { data } = await supabase
        .from('fishing_spots')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
      setSpots((data ?? []) as unknown as FishingSpot[])
    }
    loadSpots()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setError('Session expired. Please sign in again.')
      return
    }

    setSaving(true)
    try {
      let spotId: string | null = null

      if (spotChoice === 'new') {
        const validation = validateCoordinates({
          latitude: parseFloat(newSpotLat),
          longitude: parseFloat(newSpotLng)
        })
        if (!validation.valid) {
          throw new Error(
            validation.errors.latitude ??
            validation.errors.longitude ??
            'New spot coordinates are invalid.'
          )
        }
        if (!newSpotTitle.trim()) {
          throw new Error('New spot title is required.')
        }
        const { data: inserted, error: spotError } = await supabase
          .from('fishing_spots')
          .insert({
            user_id: user.id,
            title: newSpotTitle.trim(),
            latitude: parseFloat(newSpotLat),
            longitude: parseFloat(newSpotLng),
            water_type: 'Freshwater',
            privacy_level: 'Private'
          })
          .select('id')
          .single()
        if (spotError) throw new Error(spotError.message)
        spotId = inserted.id
      } else if (spotChoice !== 'none') {
        spotId = spotChoice
      }

      let photoUrl = '/placeholder-catch.svg'
      if (photoBlob) {
        const path = `${user.id}/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('catch-photos')
          .upload(path, photoBlob, { contentType: 'image/jpeg', upsert: false })
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)
        const { data: publicUrl } = supabase.storage.from('catch-photos').getPublicUrl(path)
        photoUrl = publicUrl.publicUrl
      }

      const { error: catchError } = await supabase.from('catches').insert({
        user_id: user.id,
        spot_id: spotId,
        species_name: speciesName.trim(),
        confidence_score: confidence ?? 0,
        photo_url: photoUrl,
        weight_lbs: weight ? parseFloat(weight) : null,
        length_in: lengthIn ? parseFloat(lengthIn) : null,
        bait_used: bait.trim() || null
      })
      if (catchError) throw new Error(catchError.message)

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save catch.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="Catch preview" className="h-14 w-14 rounded-lg object-cover" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate font-medium">{speciesName}</p>
          {confidence != null ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              AI confidence {confidence.toFixed(1)}%
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Manual entry</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attach to map pin</Label>
        <Select value={spotChoice} onValueChange={setSpotChoice}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a spot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No pin (journal only)</SelectItem>
            {spots.map((spot) => (
              <SelectItem key={spot.id} value={spot.id}>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${spot.privacy_level === 'Public' ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-slate-700'}`} />
                  {spot.title}
                  <Badge variant="outline" className={`ml-1 text-[10px] ${waterTypeBadgeClass(spot.water_type)}`}>
                    {WATER_TYPE_LABELS[spot.water_type]}
                  </Badge>
                </span>
              </SelectItem>
            ))}
            <SelectItem value="new">
              <span className="flex items-center gap-1.5">
                <MapPinPlus className="h-3.5 w-3.5" /> New spot at coordinates…
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {spotChoice === 'new' ? (
        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="space-y-2">
            <Label htmlFor="new-spot-title">Spot Title</Label>
            <Input
              id="new-spot-title"
              value={newSpotTitle}
              onChange={(e) => setNewSpotTitle(e.target.value)}
              placeholder={`e.g. ${speciesName} honey hole`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-spot-lat">Latitude [-90, 90]</Label>
              <Input
                id="new-spot-lat"
                type="number"
                step="0.0000001"
                min={-90}
                max={90}
                value={newSpotLat}
                onChange={(e) => setNewSpotLat(e.target.value)}
                placeholder="28.5383"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-spot-lng">Longitude [-180, 180]</Label>
              <Input
                id="new-spot-lng"
                type="number"
                step="0.0000001"
                min={-180}
                max={180}
                value={newSpotLng}
                onChange={(e) => setNewSpotLng(e.target.value)}
                placeholder="-81.3792"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="catch-weight">Weight (lbs)</Label>
          <Input
            id="catch-weight"
            type="number"
            step="0.1"
            min={0}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="catch-length">Length (in)</Label>
          <Input
            id="catch-length"
            type="number"
            step="0.1"
            min={0}
            value={lengthIn}
            onChange={(e) => setLengthIn(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="catch-bait">Bait / Lure Used</Label>
        <Input
          id="catch-bait"
          value={bait}
          onChange={(e) => setBait(e.target.value)}
          placeholder="e.g. Zoom Fluke, live shrimp"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={saving || !speciesName.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save to Catch Ledger
      </Button>
    </form>
  )
}
