// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requireFullDashboardAccess = false,
}) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()
  const isOverviewOnlyClient =
    user?.role === 'client' && user?.hasFullDashboardAccess === false

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  if (requireFullDashboardAccess && isOverviewOnlyClient) {
    return <Navigate to='/client-dashboard' state={{ from: location }} replace />
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleRoutes = {
      master: '/admin-dashboard',
      admin: '/admin-dashboard',
      sales: '/sales-dashboard',
      trainer: '/coaching-dashboard',
      coaching: '/coaching-dashboard',
      client: '/client-dashboard',
    }

    const redirectPath = roleRoutes[user?.role] || '/'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute
