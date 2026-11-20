import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Menu, Portal, Text } from '@chakra-ui/react'
import { LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { displayName } from '@/features/auth/utils/display-name'
import { Path } from '@/router/paths'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(Path.Login, { replace: true })
  }

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger aria-label="Account menu" borderRadius="full" focusVisibleRing="outside" cursor="pointer">
        <Avatar.Root size="sm">
          <Avatar.Fallback name={displayName(user, 'User')} />
        </Avatar.Root>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="60">
            <Box px="2.5" py="2">
              <Text textStyle="sm" fontWeight="medium" truncate>
                {user?.displayName || 'User'}
              </Text>
              <Text textStyle="xs" color="fg.muted" truncate>
                {user?.email}
              </Text>
            </Box>
            <Menu.Separator />
            <Menu.Item value="profile" onClick={() => navigate(Path.Account)}>
              <User size={16} />
              Account & time zone
            </Menu.Item>
            <Menu.Item value="settings" onClick={() => navigate(Path.Dashboard)}>
              <Settings size={16} />
              Medicine courses
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="logout" onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
