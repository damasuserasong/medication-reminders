import type { RouteObject } from 'react-router-dom'
import { Path } from '@/router/paths'
import AccountPage from './account'

export const accountRoutes: RouteObject[] = [
  {
    path: Path.Account,
    element: <AccountPage />,
  },
]
