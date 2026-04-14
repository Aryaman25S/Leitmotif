export const PROJECT_ROLES = [
  'director',
  'composer',
  'music_supervisor',
  'sound_designer',
  'viewer',
] as const

export type ProjectRole = (typeof PROJECT_ROLES)[number]

export type EffectiveRole = 'owner' | ProjectRole

export function isValidProjectRole(role: string): role is ProjectRole {
  return (PROJECT_ROLES as readonly string[]).includes(role)
}

/** Owner or invited director — creative control over intent, scenes, generation, project settings. */
export function canDirect(role: EffectiveRole | null): boolean {
  return role === 'owner' || role === 'director'
}

/** Owner, director, or music supervisor — can approve mock cues. */
export function canApprove(role: EffectiveRole | null): boolean {
  return canDirect(role) || role === 'music_supervisor'
}

/** Composer or sound designer — the brief recipients who acknowledge. */
export function canAcknowledge(role: EffectiveRole | null): boolean {
  return role === 'composer' || role === 'sound_designer'
}

/** All accepted members (including viewer) can comment. */
export function canComment(role: EffectiveRole | null): boolean {
  return role != null
}

/** Only the project owner can invite, remove members, or delete the project. */
export function canManage(role: EffectiveRole | null): boolean {
  return role === 'owner'
}

/** Human-readable label for a role string. */
export function formatRoleLabel(role: string): string {
  if (role === 'owner') return 'Owner'
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
