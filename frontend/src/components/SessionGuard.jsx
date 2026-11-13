import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import authService from '@/services/authService'
import { Clock } from 'lucide-react'

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000
const DEFAULT_HIDDEN_TIMEOUT_MS = 60 * 1000
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'focus',
]

const parseTimeout = (value, fallback) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}

const IDLE_TIMEOUT_MS = parseTimeout(
  import.meta.env.VITE_IDLE_LOGOUT_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_MS,
)
const HIDDEN_TIMEOUT_MS = parseTimeout(
  import.meta.env.VITE_HIDDEN_TAB_LOGOUT_TIMEOUT_MS,
  DEFAULT_HIDDEN_TIMEOUT_MS,
)

const clearTimer = (timerRef) => {
  if (timerRef.current) {
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }
}

export default function SessionGuard() {
  const { isAuthenticated, loading, logout } = useAuth()
  const idleTimerRef = useRef(null)
  const hiddenTimerRef = useRef(null)
  const logoutReasonRef = useRef(null)

  const [timeLeft, setTimeLeft] = useState(IDLE_TIMEOUT_MS)

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    clearTimer(hiddenTimerRef)
  }, [])

  const performLogout = useCallback(
    async (reason) => {
      if (logoutReasonRef.current) return

      logoutReasonRef.current = reason
      clearTimers()

      if (reason === 'idle') {
        toast.error('You were signed out due to inactivity.')
      } else if (reason === 'hidden') {
        toast.error('You were signed out after leaving the tab.')
      }

      await logout()
    },
    [clearTimers, logout],
  )

  const scheduleIdleLogout = useCallback(() => {
    if (idleTimerRef.current) clearInterval(idleTimerRef.current)

    if (
      !isAuthenticated ||
      loading ||
      logoutReasonRef.current ||
      document.visibilityState === 'hidden'
    ) {
      return
    }

    setTimeLeft(IDLE_TIMEOUT_MS)
    const endTime = Date.now() + IDLE_TIMEOUT_MS

    idleTimerRef.current = window.setInterval(() => {
      const remaining = endTime - Date.now()
      if (remaining <= 0) {
        clearInterval(idleTimerRef.current)
        void performLogout('idle')
      } else {
        setTimeLeft(Math.max(0, remaining))
      }
    }, 1000)
  }, [isAuthenticated, loading, performLogout])

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers()
      logoutReasonRef.current = null
    }
  }, [clearTimers, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || loading) {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
      return undefined
    }

    const handleActivity = () => {
      scheduleIdleLogout()
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })

    scheduleIdleLogout()

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  }, [isAuthenticated, loading, scheduleIdleLogout])

  useEffect(() => {
    if (!isAuthenticated || loading) {
      clearTimer(hiddenTimerRef)
      return undefined
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (idleTimerRef.current) clearInterval(idleTimerRef.current)
        clearTimer(hiddenTimerRef)
        hiddenTimerRef.current = window.setTimeout(() => {
          void performLogout('hidden')
        }, HIDDEN_TIMEOUT_MS)
        return
      }

      clearTimer(hiddenTimerRef)
      scheduleIdleLogout()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    handleVisibilityChange()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimer(hiddenTimerRef)
    }
  }, [isAuthenticated, loading, performLogout, scheduleIdleLogout])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const handleWindowExit = () => {
      if (logoutReasonRef.current) return

      logoutReasonRef.current = 'window-exit'
      authService.clearStoredAuth()
      void authService.logout({ keepalive: true })
    }

    window.addEventListener('pagehide', handleWindowExit)
    window.addEventListener('beforeunload', handleWindowExit)

    return () => {
      window.removeEventListener('pagehide', handleWindowExit)
      window.removeEventListener('beforeunload', handleWindowExit)
    }
  }, [isAuthenticated])

  if (!isAuthenticated || loading || logoutReasonRef.current) return null

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const isWarning = timeLeft <= 60000 // Under 1 minute left

  return (
    <div
      title="Session time remaining"
      className={`fixed top-3.5 md:top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-center gap-2.5 px-5 py-2 md:px-6 md:py-2.5 rounded-full transition-all border select-none ${
        isWarning
          ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-lg'
          : 'bg-[#000023] text-white border-[#F6B72D] shadow-[0_4px_16px_rgba(246,183,45,0.25)] lg:bg-white lg:text-[#000023] lg:border-gray-300 lg:shadow-lg hover:shadow-xl'
      }`}
    >
      <Clock
        className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${isWarning ? 'text-white' : 'text-[#F6B72D]'}`}
        strokeWidth={2.25}
      />
      <span className='font-mono font-bold text-base md:text-lg tracking-wider leading-none'>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
