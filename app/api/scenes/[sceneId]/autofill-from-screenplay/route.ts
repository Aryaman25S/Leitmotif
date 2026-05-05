import { NextRequest, NextResponse } from 'next/server'
import { requireApiSession, assertCanDirectScene } from '@/lib/api-auth'
import { autofillFromScreenplay } from '@/lib/ai/autofillFromScreenplay'

const MAX_SCREENPLAY_CHARS = 20_000

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> },
) {
  const { sceneId } = await params
  const profile = await requireApiSession(req)
  if (profile instanceof NextResponse) return profile

  const denied = await assertCanDirectScene(profile, sceneId)
  if (denied) return denied

  let body: { screenplay?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const screenplay = typeof body.screenplay === 'string' ? body.screenplay.trim() : ''
  if (!screenplay) {
    return NextResponse.json({ error: 'screenplay is required' }, { status: 400 })
  }
  if (screenplay.length > MAX_SCREENPLAY_CHARS) {
    return NextResponse.json(
      { error: `screenplay exceeds ${MAX_SCREENPLAY_CHARS} characters` },
      { status: 413 },
    )
  }

  try {
    const result = await autofillFromScreenplay(screenplay)
    return NextResponse.json({ result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Autofill failed'
    console.error('[autofill-from-screenplay]', message)
    const status = message.includes('GEMINI_API_KEY') ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
