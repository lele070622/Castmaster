'use client'

import { FlaskConical, Leaf, Target } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SaveCatchForm } from '@/components/camera/save-catch-form'
import { useAppStore } from '@/lib/store'

export function AiResultModal({
  photoBlob,
  photoDataUrl,
  onSaved
}: {
  photoBlob: Blob | null
  photoDataUrl: string | null
  onSaved: () => void
}) {
  const analysis = useAppStore((s) => s.aiAnalysis)
  const open = useAppStore((s) => s.aiResultOpen)
  const closeAiResult = useAppStore((s) => s.closeAiResult)

  if (!analysis) return null

  const confidence = analysis.confidence_percentage

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : closeAiResult())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Species Identification</DialogTitle>
          <DialogDescription>Verify the details below, then save the catch to your ledger.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-lg border bg-muted/40 p-4">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="Caught fish" className="h-20 w-20 rounded-lg object-cover" />
            ) : null}
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-lg font-semibold leading-tight">{analysis.common_name}</p>
              <p className="text-sm italic text-muted-foreground">{analysis.scientific_name}</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${confidence >= 60 ? 'bg-primary' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold tabular-nums ${confidence >= 60 ? 'text-primary' : 'text-destructive'}`}>
                  {confidence.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Primary Habitats
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.primary_habitats.map((habitat) => (
                <Badge key={habitat} variant="secondary">
                  {habitat}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" /> Recommended Lures &amp; Baits
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.recommended_lures_or_baits.map((bait) => (
                <Badge key={bait} variant="outline" className="border-primary/40 text-primary">
                  <Leaf className="mr-1 h-3 w-3" /> {bait}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <SaveCatchForm
            speciesName={analysis.common_name}
            photoBlob={photoBlob}
            photoDataUrl={photoDataUrl}
            confidence={confidence}
            onSaved={() => {
              closeAiResult()
              onSaved()
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
