import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { FishAnalysis } from '@/lib/types/database'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MOCK_SPECIES: FishAnalysis[] = [
  {
    common_name: 'Largemouth Bass',
    scientific_name: 'Micropterus salmoides',
    confidence_percentage: 92.4,
    primary_habitats: ['Freshwater lakes', 'Ponds', 'Slow-moving rivers'],
    recommended_lures_or_baits: ['Senko worm', 'Crankbait', 'Jig with craw trailer']
  },
  {
    common_name: 'Red Drum',
    scientific_name: 'Sciaenops ocellatus',
    confidence_percentage: 88.1,
    primary_habitats: ['Brackish bays', 'Coastal marshes', 'Estuaries'],
    recommended_lures_or_baits: ['Live mullet', 'Gold spoon', 'Soft plastic paddle tail']
  },
  {
    common_name: 'Rainbow Trout',
    scientific_name: 'Oncorhynchus mykiss',
    confidence_percentage: 90.6,
    primary_habitats: ['Cold streams', 'Alpine lakes', 'Tailwaters'],
    recommended_lures_or_baits: ['Woolly Bugger', 'PowerBait', 'Inline spinner']
  },
  {
    common_name: 'Northern Pike',
    scientific_name: 'Esox lucius',
    confidence_percentage: 86.9,
    primary_habitats: ['Weedy lakes', 'Backwater sloughs', 'River bends'],
    recommended_lures_or_baits: ['Daredevle spoon', 'Buzzbait', 'Large swimbait']
  },
  {
    common_name: 'Snook',
    scientific_name: 'Centropomus undecimalis',
    confidence_percentage: 84.3,
    primary_habitats: ['Mangrove shorelines', 'Brackish passes', 'Beach troughs'],
    recommended_lures_or_baits: ['D.O.A. Shrimp', 'Yo-Zuri Crystal Minnow', 'Live pilchard']
  }
]

function mockAnalysis(fileSize: number): FishAnalysis {
  const rand = mulberry32(fileSize)
  const species = MOCK_SPECIES[Math.floor(rand() * MOCK_SPECIES.length)]
  const confidence = Number((55 + rand() * 42).toFixed(1))
  return { ...species, confidence_percentage: confidence }
}

function isValidAnalysis(value: unknown): value is FishAnalysis {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.common_name === 'string' &&
    typeof v.scientific_name === 'string' &&
    typeof v.confidence_percentage === 'number' &&
    Array.isArray(v.primary_habitats) &&
    Array.isArray(v.recommended_lures_or_baits)
  )
}

async function identifyWithOpenAI(base64Image: string, mimeType: string): Promise<FishAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a fish species identification engine. Analyze the provided side-profile photo and return ONLY unwrapped JSON matching exactly: {"common_name": "string", "scientific_name": "string", "confidence_percentage": number, "primary_habitats": ["string"], "recommended_lures_or_baits": ["string"]}. If the image does not contain a recognizable fish, return confidence_percentage as 0. Do not include any text outside the JSON.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify the fish species in this photo.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400
    }),
    signal: AbortSignal.timeout(30_000)
  })
  if (!res.ok) throw new Error(`Upstream vision model error: ${res.status}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Empty vision model response')
  return JSON.parse(content)
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 415 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Image exceeds 5MB upload limit' }, { status: 413 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Image = buffer.toString('base64')

    let analysis: FishAnalysis
    if (process.env.OPENAI_API_KEY) {
      analysis = await identifyWithOpenAI(base64Image, file.type)
    } else {
      analysis = mockAnalysis(file.size)
    }

    if (!isValidAnalysis(analysis)) {
      return NextResponse.json(
        { error: 'Species recognition failed. The vision model returned an unparsable result.' },
        { status: 422 }
      )
    }

    return NextResponse.json(analysis, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return NextResponse.json(
      { error: 'Species recognition failed. Please try again with a clear, side-profile photo.' },
      { status: 502 }
    )
  }
}
