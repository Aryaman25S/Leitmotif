/**
 * Mock authentication — replaces Supabase Auth entirely.
 *
 * In local dev, all requests are treated as MOCK_USER.
 * This module provides the same API shape that pages/routes used to get
 * from Supabase's auth.getUser(), so replacements are mechanical.
 *
 * TODO: Replace with a real auth library (NextAuth.js, Lucia, Clerk, etc.)
 *       when you're ready to add user accounts.
 */

import { MOCK_USER } from './store'
import type { Profile } from './store'

export function getMockUser(): Profile {
  return MOCK_USER
}

