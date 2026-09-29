// src/hooks/useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Return default values if context is not available
    return {
      user: null,
      loading: true,
      isAuthenticated: false,
      token: null,
      login: () => {},
      register: () => {},
      logout: () => {},
      updateProfile: () => {},
      hasRole: () => false,
      hasAnyRole: () => false,
      isAdmin: () => false,
    }
  }
  return context
}
