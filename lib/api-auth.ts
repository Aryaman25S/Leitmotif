import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionProfileFromRequest } from '@/lib/session'
import {
  getSceneCard,
  getMockCue,
  profileCanAccessProject,
  getProjectRoleForProfile,
} from '@/lib/store'
import type { Profile } from '@/lib/store'
import {
  canDirect,
  canApprove,
  canAcknowledge,
  type EffectiveRole,
} from '@/lib/roles'

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

// ── Role-based guards ─────────────────────────────────────────────────────────

export async function getProjectRole(
  profile: Profile,
  projectId: string
): Promise<EffectiveRole | null> {
  return (await getProjectRoleForProfile(profile.id, projectId)) as EffectiveRole | null
}

async function resolveSceneProjectId(sceneId: string): Promise<string | null> {
  const scene = await getSceneCard(sceneId)
  return scene?.project_id ?? null
}

async function resolveCueProjectId(cueId: string): Promise<string | null> {
  const cue = await getMockCue(cueId)
  if (!cue) return null
  const scene = await getSceneCard(cue.scene_card_id)
  return scene?.project_id ?? null
}

export async function assertCanDirectProject(
  profile: Profile,
  projectId: string
): Promise<NextResponse | null> {
  const role = await getProjectRole(profile, projectId)
  if (!canDirect(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function assertCanDirectScene(
  profile: Profile,
  sceneId: string
): Promise<NextResponse | null> {
  const projectId = await resolveSceneProjectId(sceneId)
  if (!projectId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return assertCanDirectProject(profile, projectId)
}

export async function assertCanApproveCue(
  profile: Profile,
  cueId: string
): Promise<NextResponse | null> {
  const projectId = await resolveCueProjectId(cueId)
  if (!projectId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const role = await getProjectRole(profile, projectId)
  if (!canApprove(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function assertCanAcknowledgeCue(
  profile: Profile,
  cueId: string
): Promise<NextResponse | null> {
  const projectId = await resolveCueProjectId(cueId)
  if (!projectId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const role = await getProjectRole(profile, projectId)
  if (!canAcknowledge(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
