/**
 * GET /api/export/brief-data?cueId=...
 *
 * JSON bundle of approved cue + intent + scene + project for integrations
 * (e.g. custom PDF tooling, Slack bots). Not a PDF file — use browser print
 * on /brief/[cueId] for a printable view.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  void req
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
