'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SaveCatchForm } from '@/components/camera/save-catch-form'

export function ManualEntryForm({
  photoBlob,
  photoDataUrl,
  onSaved
}: {
  photoBlob: Blob | null
  photoDataUrl: string | null
  onSaved: () => void
}) {
  const [speciesName, setSpeciesName] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <PenLine className="h-4 w-4 text-primary" /> Manual species entry
        </p>
        <SaveCatchForm
          speciesName={speciesName}
          photoBlob={photoBlob}
          photoDataUrl={photoDataUrl}
          confidence={null}
          onSaved={onSaved}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <div className="space-y-2">
        <Label htmlFor="manual-species">Species Name</Label>
        <Input
          id="manual-species"
          value={speciesName}
          onChange={(e) => setSpeciesName(e.target.value)}
          placeholder="e.g. Largemouth Bass"
        />
      </div>
      <Button onClick={() => setConfirmed(true)} disabled={!speciesName.trim()} className="w-full">
        Continue to Catch Details
      </Button>
    </div>
  )
}
