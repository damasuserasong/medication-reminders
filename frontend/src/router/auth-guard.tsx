import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@chakra-ui/react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Path } from '@/router/paths'
import { LoadingSpinner } from '@/shared/components/loading-spinner'
import { StatusPage } from '@/shared/components/status-page'

interface AuthGuardProps {
  roles?: string[]
  children: React.ReactNode
}

export function AuthGuard({ roles, children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !isAuthenticated) {
        navigate(Path.Login, { replace: true })
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [isAuthenticated, navigate])

  if (isLoading) {
    return <LoadingSpinner size="lg" minH="60vh" />
  }

  if (!isAuthenticated) {
    const redirectParam = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${Path.Login}?redirect=${redirectParam}`} replace />
  }

  if (roles && roles.length > 0 && user) {
    const userRoles = (user as any).roles || []
    const hasRole = roles.some((role) => userRoles.includes(role))
    if (!hasRole) {
      return (
        <StatusPage
          title="Access denied"
          description="You don't have permission to view this page."
          actions={
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          }
        />
      )
    }
  }

  return <>{children}</>
}
