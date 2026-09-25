'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { validateCoordinates } from '@/lib/validation'
import type { PrivacyLevel, WaterType } from '@/lib/types/database'

export function LogSpotModal() {
  const open = useAppStore((s) => s.logSpotOpen)
  const draftCoords = useAppStore((s) => s.draftCoords)
  const closeLogSpot = useAppStore((s) => s.closeLogSpot)

  const [title, setTitle] = useState('')
  const [waterType, setWaterType] = useState<WaterType>('Freshwater')
  const [privacy, setPrivacy] = useState<PrivacyLevel>('Private')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ latitude?: string; longitude?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && draftCoords) {
      setLatitude(String(draftCoords.latitude))
      setLongitude(String(draftCoords.longitude))
      setTitle('')
      setNotes('')
      setWaterType('Freshwater')
      setPrivacy('Private')
      setErrors({})
      setFormError(null)
    }
  }, [open, draftCoords])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const validation = validateCoordinates({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    })
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setErrors({})

    if (!title.trim()) {
      setFormError('Spot title is required.')
      return
    }

    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setSaving(false)
      setFormError('Session expired. Please sign in again.')
      return
    }

    const { error: insertError } = await supabase.from('fishing_spots').insert({
      user_id: user.id,
      title: title.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      water_type: waterType,
      privacy_level: privacy,
      notes: notes.trim() || null
    })
    setSaving(false)

    if (insertError) {
      setFormError(insertError.message)
      return
    }
    closeLogSpot()
    window.dispatchEvent(new Event('castmaster:spots-updated'))
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : closeLogSpot())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Log a Spot
          </DialogTitle>
          <DialogDescription>
            Coordinates were captured from your map click. Verify the details and save.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spot-title">Spot Title</Label>
            <Input
              id="spot-title"
              placeholder="e.g. Stump Field, North Flats"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="spot-lat">Latitude</Label>
              <Input
                id="spot-lat"
                type="number"
                step="0.0000001"
                min={-90}
                max={90}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              {errors.latitude ? <p className="text-xs text-destructive">{errors.latitude}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot-lng">Longitude</Label>
              <Input
                id="spot-lng"
                type="number"
                step="0.0000001"
                min={-180}
                max={180}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
              {errors.longitude ? <p className="text-xs text-destructive">{errors.longitude}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="spot-water">Water Type</Label>
              <Select value={waterType} onValueChange={(v) => setWaterType(v as WaterType)}>
                <SelectTrigger id="spot-water">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Freshwater">Freshwater</SelectItem>
                  <SelectItem value="Saltwater">Saltwater</SelectItem>
                  <SelectItem value="Brackish">Brackish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot-privacy">Privacy</Label>
              <Select value={privacy} onValueChange={(v) => setPrivacy(v as PrivacyLevel)}>
                <SelectTrigger id="spot-privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private">Private (ocean blue pin)</SelectItem>
                  <SelectItem value="Public">Public (community hot spot)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spot-notes">Notes</Label>
            <Textarea
              id="spot-notes"
              placeholder="Structure, access, seasonal patterns..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeLogSpot}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Spot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
