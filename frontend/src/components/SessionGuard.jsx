import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import authService from '@/services/authService'
import { Clock } from 'lucide-react'
import {
  MEETING_CHANGE_EVENT,
  isInMeetingThisTab,
  isMeetingActiveAnywhere,
} from '@/lib/activeMeeting'

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000
const DEFAULT_HIDDEN_TIMEOUT_MS = 60 * 1000
// During a video call: leave after 10 minutes without any interaction.
const MEETING_IDLE_TIMEOUT_MS = 10 * 60 * 1000
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
  const [inMeeting, setInMeeting] = useState(isInMeetingThisTab())

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    clearTimer(hiddenTimerRef)
  }, [])

  const performLogout = useCallback(
    async (reason) => {
      if (logoutReasonRef.current) return

      logoutReasonRef.current = reason
      clearTimers()

      if (reason === 'meeting-idle') {
        toast.error('You left the meeting after 10 minutes of inactivity.')
      } else if (reason === 'idle') {
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

    const meetingNow = isInMeetingThisTab()
    const timeoutMs = meetingNow ? MEETING_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS
    setTimeLeft(timeoutMs)
    const endTime = Date.now() + timeoutMs

    idleTimerRef.current = window.setInterval(() => {
      const remaining = endTime - Date.now()
      if (remaining <= 0) {
        clearInterval(idleTimerRef.current)
        void performLogout(meetingNow ? 'meeting-idle' : 'idle')
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
    const handleMeetingChange = () => {
      setInMeeting(isInMeetingThisTab())
      scheduleIdleLogout()
    }
    window.addEventListener(MEETING_CHANGE_EVENT, handleMeetingChange)
    return () => window.removeEventListener(MEETING_CHANGE_EVENT, handleMeetingChange)
  }, [scheduleIdleLogout])

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
        if (isMeetingActiveAnywhere()) return
        hiddenTimerRef.current = window.setTimeout(() => {
          if (isMeetingActiveAnywhere()) return
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
      // A call is in progress (this tab or another): keep the session.
      if (isMeetingActiveAnywhere()) return

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

  const timePill = (
    <div
      aria-label='Session time left'
      className={`fixed top-4 md:top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-1.5 px-3 py-1 rounded-full border select-none leading-none ${
        isWarning
          ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-md'
          : 'bg-[#000023] text-white border-[#F6B72D] shadow-md'
      }`}
    >
      <Clock
        className={`w-4 h-4 shrink-0 ${isWarning ? 'text-white' : 'text-[#F6B72D]'}`}
        strokeWidth={2.5}
      />
      <span
        className={`hidden sm:inline text-[10px] font-semibold uppercase tracking-wide ${isWarning ? 'text-white/90' : 'text-[#F6B72D]'}`}
      >
        Session
      </span>
      <span className='font-mono font-bold text-sm md:text-base tracking-wide'>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )

  // In a video call, warn clearly before the 10-minute inactivity timeout.
  if (inMeeting && isWarning) {
    return (
      <>
        {timePill}
        <div className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-xl border-2 border-[#F6B72D] bg-white p-6 text-center shadow-2xl font-exo'>
            <Clock className='mx-auto mb-3 h-10 w-10 text-[#F6B72D]' />
            <h2 className='text-xl font-extrabold text-gray-900'>Are you still there?</h2>
            <p className='mt-2 text-sm text-gray-600'>
              You will leave the meeting in{' '}
              <span className='font-bold text-red-600'>{seconds}s</span> because there has been
              no activity for almost 10 minutes.
            </p>
            <button
              type='button'
              onClick={() => scheduleIdleLogout()}
              className='mt-5 inline-flex items-center justify-center rounded-lg bg-[#F6B72D] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#e6b82a]'
            >
              Stay in meeting
            </button>
          </div>
        </div>
      </>
    )
  }

  return timePill
}
