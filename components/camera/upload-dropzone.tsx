'use client'

import { useRef, useState } from 'react'
import { Camera, ImageUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadDropzoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export function UploadDropzone({ onFile, disabled = false }: UploadDropzoneProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) {
      onFile(file)
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="camera-upload"
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:border-primary/60 hover:bg-primary/5',
          dragActive && 'border-primary bg-primary/10',
          disabled && 'pointer-events-none opacity-60'
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ImageUp className="h-6 w-6" />
        </span>
        <div>
          <p className="font-medium">Drop your catch photo here</p>
          <p className="text-sm text-muted-foreground">
            or tap to open your camera — a clear, side-profile view gives the best AI results
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="camera-upload"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
        >
          <Camera className="h-4 w-4" />
          Open Camera
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImageUp className="h-4 w-4" />
          Browse Files
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
