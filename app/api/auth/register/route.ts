import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  const rawUsername = String(body?.username ?? '').trim().toLowerCase()
  const rawEmail = String(body?.email ?? '').trim().toLowerCase()
  const rawPassword = String(body?.password ?? '')
  const rawName = body?.name == null ? null : String(body.name).trim()

  if (!USERNAME_PATTERN.test(rawUsername)) {
    return NextResponse.json(
      { error: 'Username must be 3-32 chars, lowercase letters, numbers, or underscore.' },
      { status: 400 }
    )
  }

  if (!rawEmail.includes('@') || rawEmail.length < 5) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
  }

  if (rawPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const existing = await prisma.profile.findFirst({
    where: {
      OR: [
        { username: rawUsername },
        { email: rawEmail },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  })

  if (existing?.username === rawUsername) {
    return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 })
  }

  if (existing?.email === rawEmail) {
    return NextResponse.json({ error: 'Email is already registered.' }, { status: 409 })
  }

  const passwordHash = hashPassword(rawPassword)

  const profile = await prisma.profile.create({
    data: {
      username: rawUsername,
      email: rawEmail,
      name: rawName || null,
      role_default: 'director',
      password_hash: passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
    },
  })

  return NextResponse.json({ ok: true, profile }, { status: 201 })
}
