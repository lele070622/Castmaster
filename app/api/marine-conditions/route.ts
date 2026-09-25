import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchMarineConditions } from '@/lib/marine'
import { validateCoordinates } from '@/lib/validation'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { latitude, longitude } = body as { latitude?: unknown; longitude?: unknown }
  const validation = validateCoordinates({
    latitude: typeof latitude === 'number' ? latitude : NaN,
    longitude: typeof longitude === 'number' ? longitude : NaN
  })
  if (!validation.valid) {
    return NextResponse.json({ error: 'Invalid coordinates', details: validation.errors }, { status: 400 })
  }

  const conditions = await fetchMarineConditions(latitude as number, longitude as number)
  return NextResponse.json(conditions, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
