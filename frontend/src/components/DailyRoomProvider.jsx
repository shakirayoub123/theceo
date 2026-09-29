import React, { useState, useEffect, useRef } from 'react'
import { useDaily } from '@daily-co/daily-react'

// This component sets up a Daily room and provides access to the Daily call object
const DailyRoomComponent = ({ children, roomUrl, token }) => {
  const callObject = useDaily()
  const [joinAttempted, setJoinAttempted] = useState(false)
  // We use these state variables for tracking in logs, even if not directly rendered
  const [joinSuccess, setJoinSuccess] = useState(false) // eslint-disable-line
  const [joinError, setJoinError] = useState(null) // eslint-disable-line
  const [sessionId, setSessionId] = useState(null)
  const isUnmountingRef = useRef(false)
  const hasCleanedUpRef = useRef(false)
  const persistentSessionRef = useRef(null)

  // Extract session information from URL on component mount
  useEffect(() => {
    if (roomUrl) {
      try {
        const urlObj = new URL(roomUrl)
        const roomName = urlObj.pathname.split('/').pop()

        if (roomName) {
          // Store the session ID in a stable ref that won't change
          persistentSessionRef.current = roomName
          setSessionId(roomName)

          // Check if this is a session we've recently joined
          const lastSessionId = localStorage.getItem('daily_session_id')
          const lastSessionTimestamp = localStorage.getItem(
            'daily_session_timestamp',
          )
          const currentTime = Date.now()

          // If we have a recent session (within last 24 hours) for this room
          if (lastSessionId === roomName && lastSessionTimestamp) {
            const sessionTime = parseInt(lastSessionTimestamp, 10)
            const sessionAge = currentTime - sessionTime
            const MAX_SESSION_AGE = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

            if (sessionAge < MAX_SESSION_AGE) {
              console.log(
                `[Daily] Detected recent session (${Math.floor(sessionAge / 60000)} minutes old) for room ${roomName}`,
              )
              // We're likely reconnecting to the same session
            }
          }

          // Update session tracking in localStorage
          localStorage.setItem('daily_session_id', roomName)
          localStorage.setItem(
            'daily_session_timestamp',
            currentTime.toString(),
          )
        }
      } catch (e) {
        console.error('[Daily] Error parsing room URL:', e)
      }
    }

    return () => {
      isUnmountingRef.current = true
    }
  }, [roomUrl])

  // Join the room when component mounts
  useEffect(() => {
    if (!callObject || !roomUrl) return
    if (joinAttempted) return // Prevent multiple join attempts

    const joinRoom = async () => {
      try {
        setJoinAttempted(true)
        console.log('[Daily] Original room URL:', roomUrl)
        console.log('[Daily] Token available:', !!token)

        // Parse the URL and extract any token if present
        let cleanRoomUrl = roomUrl
        let authToken = token

        try {
          const urlObj = new URL(roomUrl)

          // Extract room name for diagnostic logging
          const roomName = urlObj.pathname.split('/').pop()
          console.log('[Daily] Room name from URL:', roomName)
          setSessionId(roomName)

          // If the URL contains a token parameter, extract it
          if (urlObj.searchParams.has('token') || urlObj.searchParams.has('t')) {
            console.log('[Daily] Found token in URL, extracting it')
            // If we don't already have a token, use the one from the URL
            if (!authToken) {
              authToken =
                urlObj.searchParams.get('token') || urlObj.searchParams.get('t')
              console.log('[Daily] Using token from URL')
            } else {
              console.log('[Daily] Already have token, ignoring URL token')
            }

            // Remove token from URL since Daily.co expects them separately
            urlObj.searchParams.delete('token')
            urlObj.searchParams.delete('t')
            cleanRoomUrl = urlObj.toString()
            console.log('[Daily] Cleaned URL:', cleanRoomUrl)
          }
        } catch (e) {
          console.error('[Daily] Error parsing URL:', e)
        }

        // Construct join options with clean URL
        const joinOptions = {
          url: cleanRoomUrl,
          startAudioOff: false, // Always start with audio enabled
          startVideoOff: false, // Always start with video enabled,
          // Session persistence - critical to prevent new sessions
          dailyConfig: {
            experimentalChromeVideoMuteLightOff: true,
            // Prevent automatic destruction of the call object
            callObjectBehavior: {
              autoDetachParticipantTracks: false,
              autoDetachPrebuiltPanel: false,
              autoDestroy: false,
            },
          },
        }

        // Add token if available
        if (authToken) {
          joinOptions.token = authToken
          console.log(
            '[Daily] Using token for authentication. First 10 chars:',
            typeof authToken === 'string'
              ? authToken.substring(0, 10) + '...'
              : 'Invalid token format',
          )
        } else {
          console.log(
            '[Daily] No token provided, joining without authentication',
          )
        }

        console.log('[Daily] Join options:', {
          url: joinOptions.url,
          token: joinOptions.token ? '***redacted***' : null,
          startAudioOff: joinOptions.startAudioOff,
          startVideoOff: joinOptions.startVideoOff,
          dailyConfig: joinOptions.dailyConfig,
        })

        try {
          // Define named handler functions to properly remove them later
          const handleNetworkQuality = (event) => {
            console.log('[Daily] Network quality changed:', event)
          }

          const handleNetworkConnection = (event) => {
            console.log('[Daily] Network connection event:', event)
          }

          const handleParticipantJoined = (event) => {
            console.log(
              '[Daily] Participant joined:',
              event.participant.user_name || event.participant.user_id,
            )
          }

          // Detect when the session is destroyed on the server side
          const handleLeftMeeting = (event) => {
            console.log('[Daily] Left meeting event:', event)
            if (event?.action === 'session-terminated') {
              console.log('[Daily] Session terminated by server')
              // Clear our session tracking if the server terminated it
              localStorage.removeItem('daily_session_id')
            }
          }

          // Store the event handlers on the component instance for cleanup
          callObject._dailyEventHandlers = {
            'network-quality-change': handleNetworkQuality,
            'network-connection': handleNetworkConnection,
            'participant-joined': handleParticipantJoined,
            'left-meeting': handleLeftMeeting,
          }

          // Add event listeners using the named functions
          callObject.on('network-quality-change', handleNetworkQuality)
          callObject.on('network-connection', handleNetworkConnection)
          callObject.on('participant-joined', handleParticipantJoined)
          callObject.on('left-meeting', handleLeftMeeting)

          // Perform the join - handle the "already joined" case
          try {
            await callObject.join(joinOptions)
            console.log('[Daily] Successfully joined room')
            setJoinSuccess(true)
          } catch (joinErr) {
            // Handle the "already joined" case gracefully
            if (joinErr.message && joinErr.message.includes('already joined')) {
              console.log(
                '[Daily] Already joined this meeting, continuing with existing session',
              )
              setJoinSuccess(true)
            } else {
              throw joinErr
            }
          }

          // Log meeting state
          console.log(
            '[Daily] Meeting state after join:',
            callObject.meetingState(),
          )
        } catch (joinError) {
          console.error('[Daily] Failed to join room:', joinError)
          setJoinError(joinError)

          // Provide more detailed error handling
          if (
            joinError.errorMsg === 'You are not allowed to join this meeting'
          ) {
            console.error(
              '[Daily] Authentication error - token may be invalid or expired',
            )
            // Log additional diagnostic information
            console.error('[Daily] Room URL being used:', joinOptions.url)
            console.error('[Daily] Token present:', !!joinOptions.token)
            console.error('[Daily] Error details:', joinError)
          }

          throw joinError
        }
      } catch (error) {
        console.error('[Daily] Error joining room:', error)
        setJoinError(error)
      }
    }

    joinRoom()

    // Clean up on unmount
    return () => {
      if (callObject && !hasCleanedUpRef.current) {
        try {
          console.log('[Daily] Component unmounting, cleaning up...')
          hasCleanedUpRef.current = true

          // First, check if we're actually in a meeting before trying to leave
          const meetingState = callObject.meetingState()
          console.log(
            '[Daily] Current meeting state before cleanup:',
            meetingState,
          )

          // Don't actually leave the room on unmount - this is critical for session persistence
          // Instead, we'll just clean up the event listeners
          console.log(
            '[Daily] NOT leaving room to preserve session. Only cleaning up listeners.',
          )

          // Remove event listeners using the stored handlers
          if (callObject._dailyEventHandlers) {
            Object.entries(callObject._dailyEventHandlers).forEach(
              ([event, handler]) => {
                try {
                  callObject.off(event, handler)
                  console.log(`[Daily] Successfully removed ${event} listener`)
                } catch (err) {
                  console.error(
                    `[Daily] Error removing ${event} listener:`,
                    err,
                  )
                }
              },
            )

            // Clean up the handlers reference
            delete callObject._dailyEventHandlers
          }

          console.log('[Daily] Cleanup complete - session preserved.')
        } catch (e) {
          console.error('[Daily] Error during cleanup:', e)
        }
      }
    }
  }, [callObject, roomUrl, token, joinAttempted])

  // Log diagnostic information about the meeting state
  useEffect(() => {
    if (!callObject) return

    const logState = () => {
      try {
        const state = callObject.meetingState()
        const participants = callObject.participants()
        console.log('[Daily] Current state:', {
          meetingState: state,
          participantCount: participants ? Object.keys(participants).length : 0,
          sessionId: persistentSessionRef.current,
        })
      } catch (e) {
        console.error('[Daily] Error logging state:', e)
      }
    }

    // Log initial state
    logState()

    // Set up interval to log state periodically
    const intervalId = setInterval(logState, 30000) // Every 30 seconds

    return () => {
      clearInterval(intervalId)
    }
  }, [callObject])

  return children
}

// This wrapper ensures we use the DailyRoomComponent
// We don't create a new DailyProvider since one is already in App.jsx
export const DailyRoomProvider = ({ children, roomUrl, token }) => {
  return (
    <DailyRoomComponent roomUrl={roomUrl} token={token}>
      {children}
    </DailyRoomComponent>
  )
}

export default DailyRoomProvider
