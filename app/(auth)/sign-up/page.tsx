import SignUpForm from './SignUpForm'
import { getEnabledOAuthProviderIds } from '@/lib/oauth-providers'

export default function SignUpPage() {
  const oauthProviders = getEnabledOAuthProviderIds()
  return <SignUpForm oauthProviders={oauthProviders} />
}
