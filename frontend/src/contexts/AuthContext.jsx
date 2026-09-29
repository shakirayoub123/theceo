import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)

  const applyLoggedOutState = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    setToken(null)
  }, [])

  const clearAuthState = useCallback(() => {
    authService.clearStoredAuth()
    applyLoggedOutState()
  }, [applyLoggedOutState])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
        setIsAuthenticated(true)
        setToken('cookie-authenticated')
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearAuthState()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [clearAuthState])

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.storageArea !== window.localStorage) return

      const authKeyChanged =
        event.key === 'user' || event.key === 'userId' || event.key === null

      if (!authKeyChanged) return
      if (window.localStorage.getItem('userId')) return

      applyLoggedOutState()
      setLoading(false)
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [applyLoggedOutState])

  // Login function
  const login = async (credentials) => {
    console.log('AuthContext: Starting login process')
    setLoading(true)
    try {
      const response = await authService.login(credentials)
      console.log('AuthContext: Login response received:', response)
      setToken('cookie-authenticated')

      // After successful login, fetch user data since API doesn't return it
      try {
        console.log('AuthContext: Fetching user data after login')
        const userData = await authService.getCurrentUser()
        console.log('AuthContext: User data fetched:', userData)

        setUser(userData)
        setIsAuthenticated(true)
        console.log('AuthContext: Authentication state set to true')

        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (userError) {
        console.error('AuthContext: Error fetching user data:', userError)
        // If we can't get fresh user data, fall back to persisted profile data
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            console.log('AuthContext: Using stored user data:', userData)
            setUser(userData)
            setIsAuthenticated(true)
          } catch (e) {
            console.error('AuthContext: Error parsing stored user data:', e)
            setIsAuthenticated(true) // At least mark as authenticated
          }
        } else {
          setIsAuthenticated(false)
          setToken(null)
        }
      }

      return response
    } catch (error) {
      console.error('AuthContext: Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (userData) => {
    setLoading(true)
    try {
      const response = await authService.register(userData)
      return response
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async (options = {}) => {
    setLoading(true)
    try {
      await authService.logout(options)
      applyLoggedOutState()
    } finally {
      setLoading(false)
    }
  }

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true)
    try {
      const updatedUser = await authService.updateProfile(userData)
      setUser(updatedUser)
      return updatedUser
    } finally {
      setLoading(false)
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'admin'
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    token,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
