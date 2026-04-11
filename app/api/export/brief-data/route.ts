/**
 * GET /api/export/brief-data?cueId=...
 *
 * JSON bundle of approved cue + intent + scene + project for integrations
 * (e.g. custom PDF tooling, Slack bots). Not a PDF file — use browser print
 * on /brief/[cueId] for a printable view.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockCue, getIntent, getSceneCard, getProject } from '@/lib/store'

export async function GET(req: NextRequest) {
  const cueId = req.nextUrl.searchParams.get('cueId')
  if (!cueId) return NextResponse.json({ error: 'cueId required' }, { status: 400 })

  const cue = await getMockCue(cueId)
  if (!cue || !cue.is_approved) {
    return NextResponse.json({ error: 'Not found or not approved' }, { status: 404 })
  }

  const intent = await getIntent(cue.intent_version_id)
  const scene = await getSceneCard(cue.scene_card_id)
  const project = scene ? await getProject(scene.project_id) : undefined

  return NextResponse.json({
    data: { cue, intent, scene, project },
  })
}
