import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const Logout = () => {
  const { logout, isAuthenticated, loading } = useAuth()
  const [logoutAttempted, setLogoutAttempted] = useState(false)
  const hasLoggedOutRef = useRef(false)

  useEffect(() => {
    const performLogout = async () => {
      await logout()
      setLogoutAttempted(true)
    }

    if (!hasLoggedOutRef.current) {
      hasLoggedOutRef.current = true
      performLogout()
    }
  }, [logout])

  if (!loading && !isAuthenticated && logoutAttempted) {
    return <Navigate to='/' replace />
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
        <p className='text-lg font-medium text-gray-700'>
          Signing you out, please wait...
        </p>
      </div>
    </div>
  )
}

export default Logout
