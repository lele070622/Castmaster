export const MAX_IMAGE_DIMENSION = 1200
export const JPEG_QUALITY = 0.8

export interface CompressedImage {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

export async function compressImage(
  file: File | Blob,
  maxDimension: number = MAX_IMAGE_DIMENSION,
  quality: number = JPEG_QUALITY
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D context unavailable')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Image compression failed')

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return { blob, dataUrl, width, height }
}
