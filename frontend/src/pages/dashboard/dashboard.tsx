import { Separator, Stack } from '@chakra-ui/react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { displayName } from '@/features/auth/utils/display-name'
import { PageHeader } from '@/shared/components/page-header'
import { StackOverview } from './components/stack-overview'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <Stack gap="8">
      <PageHeader
        title="Dashboard"
        description={
          user?.displayName
            ? `Welcome back, ${displayName(user, 'there')}. You are signed in as ${user.email}.`
            : `Welcome back. You are signed in as ${user?.email ?? 'your account'}.`
        }
      />
      <Separator />
      <StackOverview />
    </Stack>
  )
}
