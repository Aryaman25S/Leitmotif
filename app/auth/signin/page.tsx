import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSessionUser } from '@/lib/auth'
import SignInForm from './SignInForm'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const user = await getSessionUser()
  if (user) {
    redirect('/projects')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Leitmotif</CardTitle>
          <CardDescription>
            Username/password access for v1.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  )
}
