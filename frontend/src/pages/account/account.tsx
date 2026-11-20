import { useEffect, useState } from 'react'
import { Box, Button, Card, Field, Input, Separator, Stack, Text } from '@chakra-ui/react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { PageHeader } from '@/shared/components/page-header'
import { StatusAlert } from '@/shared/components/status-alert'
import { TimezonePicker } from '@/shared/components/timezone-picker'
import { formatTimezoneDisplay } from '@/shared/utils/timezones'

export default function AccountPage() {
  const { user, updateProfile } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [timezone, setTimezone] = useState(user?.timezone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setTimezone(user.timezone)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setErrorMessage(null)

    const result = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      timezone,
    })

    setSaving(false)
    if (result.success) {
      setSaved(true)
    } else {
      setErrorMessage(result.error?.message || 'Could not save account changes.')
    }
  }

  return (
    <Stack gap="8" maxW="2xl">
      <PageHeader
        title="Account"
        description={
          user?.timezone
            ? `Signed in as ${user.email} · ${formatTimezoneDisplay(user.timezone)}`
            : `Signed in as ${user?.email ?? ''}`
        }
      />
      <Separator />

      <Card.Root>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap="5">
              {errorMessage && (
                <StatusAlert status="error" title="Could not save" message={errorMessage} />
              )}
              {saved && (
                <StatusAlert
                  status="success"
                  title="Changes saved"
                  message="Your account details and time zone are up to date."
                />
              )}

              <Field.Root>
                <Field.Label>Email address</Field.Label>
                <Input value={user?.email ?? ''} readOnly disabled />
                <Text textStyle="xs" color="fg.muted">
                  Your sign-in email cannot be changed here.
                </Text>
              </Field.Root>

              <Stack direction={{ base: 'column', sm: 'row' }} gap="4">
                <Field.Root>
                  <Field.Label>
                    First name{' '}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>
                    Last name{' '}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      (optional)
                    </Text>
                  </Field.Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </Field.Root>
              </Stack>

              <TimezonePicker value={timezone} onChange={setTimezone} />

              <Box pt="2">
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </Box>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}
