import React, { useCallback, useEffect, useState } from 'react'
import { DailyProvider, useDaily, useDailyEvent } from '@daily-co/daily-react'
import { createContext, useContext } from 'react'

// Create a context to expose Daily call state and methods to the rest of the app
const DailyCallContext = createContext(null)

export const useDailyCall = () => {
  const context = useContext(DailyCallContext)
  if (!context) {
    throw new Error('useDailyCall must be used within a DailyCallProvider')
  }
  return context
}

// Inner component to access Daily hooks
const DailyCallManager = ({
  children,
  roomUrl = null,
  token = null,
  meetingId,
}) => {
  const daily = useDaily()
  const [callState, setCallState] = useState({
    state: 'idle', // idle, joining, joined, leaving, ended, error
    participants: new Map(),
    activeSpeakerId: null,
    error: null,
    isJoined: false,
    localParticipant: null,
  })

  // Join a meeting when roomUrl is provided
  useEffect(() => {
    if (!daily || !roomUrl) return

    const joinCall = async () => {
      try {
        setCallState((prev) => ({ ...prev, state: 'joining' }))
        console.log('[DailyCallManager] Joining room:', roomUrl)

        const options = {
          url: roomUrl,
        }

        if (token) {
          options.token = token
        }

        await daily.join(options)

        console.log('[DailyCallManager] Successfully joined room')
        setCallState((prev) => ({
          ...prev,
          state: 'joined',
          isJoined: true,
          error: null,
        }))
      } catch (error) {
        console.error('[DailyCallManager] Error joining call:', error)
        setCallState((prev) => ({
          ...prev,
          state: 'error',
          error: error.message || 'Failed to join meeting',
        }))
      }
    }

    joinCall()

    return () => {
      if (daily && daily.participants()) {
        daily.leave()
      }
    }
  }, [daily, roomUrl, token])

  // Handle participant changes
  useDailyEvent(
    'participant-joined',
    useCallback((event) => {
      const participant = event.participant
      console.log('[DailyCallManager] Participant joined:', participant)

      setCallState((prevState) => {
        const updatedParticipants = new Map(prevState.participants)
        updatedParticipants.set(participant.session_id, participant)

        return {
          ...prevState,
          participants: updatedParticipants,
          localParticipant: participant.local
            ? participant
            : prevState.localParticipant,
        }
      })
    }, []),
  )

  useDailyEvent(
    'participant-updated',
    useCallback((event) => {
      const participant = event.participant

      setCallState((prevState) => {
        if (!participant) return prevState

        const updatedParticipants = new Map(prevState.participants)
        updatedParticipants.set(participant.session_id, participant)

        return {
          ...prevState,
          participants: updatedParticipants,
          localParticipant: participant.local
            ? participant
            : prevState.localParticipant,
        }
      })
    }, []),
  )

  useDailyEvent(
    'participant-left',
    useCallback((event) => {
      const participant = event.participant
      console.log('[DailyCallManager] Participant left:', participant)

      setCallState((prevState) => {
        const updatedParticipants = new Map(prevState.participants)
        updatedParticipants.delete(participant.session_id)

        return {
          ...prevState,
          participants: updatedParticipants,
        }
      })
    }, []),
  )

  // Handle active speaker changes
  useDailyEvent(
    'active-speaker-change',
    useCallback((event) => {
      console.log(
        '[DailyCallManager] Active speaker changed:',
        event.activeSpeaker.peerId,
      )

      setCallState((prevState) => ({
        ...prevState,
        activeSpeakerId: event.activeSpeaker.peerId,
      }))
    }, []),
  )

  // Handle call state changes
  useDailyEvent(
    'call-state-updated',
    useCallback((event) => {
      console.log('[DailyCallManager] Call state updated:', event)

      setCallState((prevState) => ({
        ...prevState,
        state: event.callState,
      }))
    }, []),
  )

  // Handle errors
  useDailyEvent(
    'error',
    useCallback((event) => {
      console.error('[DailyCallManager] Call error:', event.errorMsg)

      setCallState((prevState) => ({
        ...prevState,
        error: event.errorMsg,
        state: 'error',
      }))
    }, []),
  )

  // Actions to manipulate call state
  const toggleAudio = useCallback(() => {
    if (!daily) return
    daily.setLocalAudio(!daily.localAudio())
  }, [daily])

  const toggleVideo = useCallback(() => {
    if (!daily) return
    daily.setLocalVideo(!daily.localVideo())
  }, [daily])

  const leaveCall = useCallback(async () => {
    if (!daily) return
    try {
      setCallState((prev) => ({ ...prev, state: 'leaving' }))
      await daily.leave()
      setCallState((prev) => ({
        ...prev,
        state: 'ended',
        isJoined: false,
        participants: new Map(),
      }))
    } catch (error) {
      console.error('[DailyCallManager] Error leaving call:', error)
    }
  }, [daily])

  // Package up the state and methods for the context
  const value = {
    callObject: daily,
    state: callState.state,
    error: callState.error,
    isJoined: callState.isJoined,
    participants: callState.participants,
    activeSpeakerId: callState.activeSpeakerId,
    localParticipant: callState.localParticipant,

    // Actions
    toggleAudio,
    toggleVideo,
    leaveCall,

    // Meeting info
    meetingId,
  }

  return (
    <DailyCallContext.Provider value={value}>
      {children}
    </DailyCallContext.Provider>
  )
}

// Wrapper component that provides the DailyProvider
export const DailyCallProvider = ({ children, roomUrl, token, meetingId }) => {
  return (
    <DailyProvider>
      <DailyCallManager roomUrl={roomUrl} token={token} meetingId={meetingId}>
        {children}
      </DailyCallManager>
    </DailyProvider>
  )
}
