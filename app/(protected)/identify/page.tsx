'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ScanSearch } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { UploadDropzone } from '@/components/camera/upload-dropzone'
import { AiResultModal } from '@/components/camera/ai-result-modal'
import { ManualEntryForm } from '@/components/camera/manual-entry-form'
import { useAppStore } from '@/lib/store'
import { compressImage } from '@/lib/image-compression'
import type { FishAnalysis } from '@/lib/types/database'

type IdentifyPhase = 'idle' | 'processing' | 'result' | 'fallback'

const LOW_CONFIDENCE_MESSAGE =
  'Species unverified. Please enter manually or upload a clear, side-profile view of your catch.'

function AnalysisSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanSearch className="h-4 w-4 animate-pulse text-primary" /> AI Vision Analysis Running
        </CardTitle>
        <CardDescription>Compressing payload, querying the multimodal model…</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 italic" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function IdentifyPage() {
  const [phase, setPhase] = useState<IdentifyPhase>('idle')
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const setAiAnalysis = useAppStore((s) => s.setAiAnalysis)
  const openAiResult = useAppStore((s) => s.openAiResult)
  const aiResultOpen = useAppStore((s) => s.aiResultOpen)
  const closeAiResult = useAppStore((s) => s.closeAiResult)

  async function handleFile(file: File) {
    setApiError(null)
    setPhotoBlob(null)
    setPhotoDataUrl(null)
    setPhase('processing')

    try {
      const compressed = await compressImage(file)
      setPhotoBlob(compressed.blob)
      setPhotoDataUrl(compressed.dataUrl)

      const formData = new FormData()
      formData.append('file', new File([compressed.blob], 'catch.jpg', { type: 'image/jpeg' }))

      const res = await fetch('/api/identify-fish', { method: 'POST', body: formData })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Identification service error (${res.status})`)
      }

      const analysis = (await res.json()) as FishAnalysis

      if (analysis.confidence_percentage < 60.0) {
        setPhase('fallback')
        return
      }

      setAiAnalysis(analysis)
      setPhase('result')
      openAiResult()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Identification failed unexpectedly.')
      setPhase('fallback')
    }
  }

  function reset() {
    setPhase('idle')
    setPhotoBlob(null)
    setPhotoDataUrl(null)
    setApiError(null)
    closeAiResult()
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ScanSearch className="h-6 w-6 text-primary" /> AI Fish Identifier
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture or upload a catch photo. The image is compressed to 1200px at 80% quality on-device before
          analysis, keeping mobile uploads fast.
        </p>
      </div>

      {phase === 'idle' ? (
        <Card>
          <CardContent className="pt-6">
            <UploadDropzone onFile={handleFile} />
          </CardContent>
        </Card>
      ) : null}

      {phase === 'processing' ? <AnalysisSkeleton /> : null}

      {phase === 'fallback' ? (
        <div className="space-y-4">
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangle className="h-4 w-4" /> Species Unverified
              </CardTitle>
              <CardDescription>{LOW_CONFIDENCE_MESSAGE}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="Uploaded catch" className="max-h-56 rounded-lg object-cover" />
              ) : null}
              <ManualEntryForm
                photoBlob={photoBlob}
                photoDataUrl={photoDataUrl}
                onSaved={() => setPhase('idle')}
              />
              <Button variant="outline" className="w-full" onClick={reset}>
                Try Another Photo
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {phase === 'result' && !aiResultOpen ? (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm">Identification saved. Ready for another catch?</p>
            <Button size="sm" onClick={reset}>
              Identify Another
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <AiResultModal
        photoBlob={photoBlob}
        photoDataUrl={photoDataUrl}
        onSaved={() => setPhase('idle')}
      />
    </div>
  )
}
