import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

export interface SessionUser {
  id: string
  email: string
  name: string | null
}

async function findProfileForSignIn(identifier: string) {
  const normalized = identifier.trim().toLowerCase()
  if (!normalized) return null

  return prisma.profile.findFirst({
    where: {
      OR: [
        { username: normalized },
        { email: normalized },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      password_hash: true,
    },
  })
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? '').trim()
        const password = String(credentials?.password ?? '')

        if (!identifier || !password) return null

        const profile = await findProfileForSignIn(identifier)
        if (!profile?.password_hash) return null
        if (!verifyPassword(password, profile.password_hash)) return null

        return {
          id: profile.id,
          name: profile.name ?? profile.username ?? profile.email,
          email: profile.email,
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.profileId = user.id
      if (user?.email) token.email = user.email
      if (user?.name) token.name = user.name
      return token
    },
    async session({ session, token }) {
      if (!session.user) return session

      if (typeof token.profileId === 'string') {
        session.user.id = token.profileId
      }
      if (typeof token.email === 'string') {
        session.user.email = token.email
      }
      if (typeof token.name === 'string') {
        session.user.name = token.name
      }

      return session
    },
  },
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const email = session?.user?.email

  if (!userId || !email) return null

  return {
    id: userId,
    email,
    name: session.user.name ?? null,
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}
