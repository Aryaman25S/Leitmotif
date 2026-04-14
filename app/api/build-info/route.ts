import { NextResponse } from 'next/server'

/** Exposes Vercel build metadata (no secrets) to verify which commit is running. */
export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null
  const vercelEnv = process.env.VERCEL_ENV ?? null

  return NextResponse.json({ vercelGitCommitSha: sha, vercelEnv })
}
