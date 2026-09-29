import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import DailyPrebuiltMeeting from './DailyPrebuiltMeeting'

// Use memo to prevent unnecessary re-renders of the entire meeting room
const DailyMeetingRoom = memo(({ meetingId, roomUrl, token }) => {
  const [isReady, setIsReady] = useState(false)
  const [persistentRoomUrl, setPersistentRoomUrl] = useState(null)
  const [persistentToken, setPersistentToken] = useState(null)
  const mountedRef = useRef(false)
  const sessionRef = useRef(null)
  const sessionTimeRef = useRef(Date.now())

  // Extract room name for logging and session tracking
  const getRoomName = useCallback((url) => {
    if (!url) return null
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.split('/').pop()
    } catch (e) {
      console.error('[DailyMeetingRoom] Error parsing room URL:', e)
      return null
    }
  }, [])

  // Initialize once on mount
  useEffect(() => {
    mountedRef.current = true
    // Generate a stable instance ID to track this component instance
    const instanceId = Math.random().toString(36).substring(2, 10)
    console.log(`[DailyMeetingRoom:${instanceId}] Component mounted`)

    // Store mount time for accurate duration tracking
    const mountTime = Date.now()
    sessionTimeRef.current = mountTime

    // Store the session ID in localStorage to help track reconnections
    if (roomUrl) {
      const roomName = getRoomName(roomUrl)
      if (roomName) {
        console.log(
          `[DailyMeetingRoom:${instanceId}] Setting up room session for: ${roomName}`,
        )
        sessionRef.current = roomName

        // Check if this is the same session we already have stored
        const lastSession = localStorage.getItem('daily_last_session')
        const lastMeetingId = localStorage.getItem('daily_last_meeting_id')
        const lastSessionTime = localStorage.getItem('daily_last_session_time')

        if (lastSession === roomName && lastMeetingId === meetingId) {
          console.log(
            `[DailyMeetingRoom:${instanceId}] Re-using existing session - preventing new session creation`,
          )

          // Update the timestamp to keep the session active
          localStorage.setItem('daily_last_session_time', Date.now().toString())

          if (lastSessionTime) {
            const sessionAge = Date.now() - parseInt(lastSessionTime, 10)
            console.log(
              `[DailyMeetingRoom:${instanceId}] Session age: ${Math.floor(sessionAge / 1000)} seconds`,
            )
          }
        } else {
          localStorage.setItem('daily_last_session', roomName)
          localStorage.setItem('daily_last_meeting_id', meetingId)
          localStorage.setItem('daily_last_session_time', Date.now().toString())
          console.log(
            `[DailyMeetingRoom:${instanceId}] Stored new session details`,
          )
        }
      }
    }

    return () => {
      // Use the captured mount time for duration calculation
      const duration = Math.floor((Date.now() - mountTime) / 1000)
      console.log(
        `[DailyMeetingRoom:${instanceId}] Component unmounting after ${duration} seconds`,
      )
      mountedRef.current = false
    }
  }, [roomUrl, meetingId, getRoomName])

  // Process room URL and token - this runs only once to capture and preserve the initial values
  useEffect(() => {
    if (!roomUrl) {
      console.log('[DailyMeetingRoom] No room URL provided')
      return
    }

    // Store URL and token persistently so they don't change during component lifetime
    // This prevents unnecessary room reconnections
    if (!persistentRoomUrl) {
      console.log(`[DailyMeetingRoom] Room URL available: ${roomUrl}`)
      setPersistentRoomUrl(roomUrl)
    }

    if (token && !persistentToken) {
      console.log('[DailyMeetingRoom] Token available')
      setPersistentToken(token)
    }

    setIsReady(true)

    // Check for session continuity
    const roomName = getRoomName(roomUrl)
    const lastSession = localStorage.getItem('daily_last_session')
    if (roomName && lastSession && roomName === lastSession) {
      console.log('[DailyMeetingRoom] Continuing previous session:', roomName)
    } else if (roomName) {
      console.log('[DailyMeetingRoom] Starting new session:', roomName)
    }
  }, [roomUrl, token, persistentRoomUrl, persistentToken, getRoomName])

  // If we don't have a room URL, show loading or error
  if (!isReady) {
    return (
      <div className='flex flex-col items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4'></div>
        <p>Preparing video meeting room...</p>
        {!roomUrl && <p className='text-red-500 mt-2'>No room URL available</p>}
      </div>
    )
  }

  // When we have a room URL, render the DailyPrebuiltMeeting component
  // Use the persistent URL and token to prevent reconnection cycles
  return (
    <div className='w-full'>
      <DailyPrebuiltMeeting
        roomUrl={persistentRoomUrl}
        token={persistentToken}
      />
    </div>
  )
})

// Add a display name for better debugging
DailyMeetingRoom.displayName = 'DailyMeetingRoom'

export default DailyMeetingRoom
