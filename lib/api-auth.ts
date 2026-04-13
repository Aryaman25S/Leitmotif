import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionProfileFromRequest } from '@/lib/session'
import {
  getSceneCard,
  getMockCue,
  profileCanAccessProject,
} from '@/lib/store'
import type { Profile } from '@/lib/store'

export async function requireApiSession(
  req: NextRequest
): Promise<Profile | NextResponse> {
  const profile = await getSessionProfileFromRequest(req)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return profile
}

export async function assertProjectAccess(
  profile: Profile,
  projectId: string
): Promise<NextResponse | null> {
  const ok = await profileCanAccessProject(profile.id, projectId)
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function assertSceneAccess(
  profile: Profile,
  sceneId: string
): Promise<NextResponse | null> {
  const scene = await getSceneCard(sceneId)
  if (!scene) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return assertProjectAccess(profile, scene.project_id)
}

export async function assertMockCueAccess(
  profile: Profile,
  cueId: string
): Promise<NextResponse | null> {
  const cue = await getMockCue(cueId)
  if (!cue) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return assertSceneAccess(profile, cue.scene_card_id)
}
