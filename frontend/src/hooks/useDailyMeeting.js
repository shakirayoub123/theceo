import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dailyVideoService from '../services/dailyVideoService'
import clientAPIService from '../services/clientAPIService'
import trainerAPIService from '../services/trainerAPIService'
import authService from '../services/authService'

const useDailyMeeting = (meetingId, callObject, options = {}) => {
  const role = options.role || 'client'
  const apiService = role === 'trainer' ? trainerAPIService : clientAPIService

  // Use meeting ID as-is - no normalization needed
  const normalizedMeetingId = meetingId

  const [meetingDetails, setMeetingDetails] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isJoining, setIsJoining] = useState(false)
  const [spotlightedUserId, setSpotlightedUserId] = useState(null)
  const [mediaState, setMediaState] = useState({
    audioMuted: false,
    videoEnabled: true,
  })

  const roomUrlRef = useRef(null)
  const participantsRef = useRef(new Map())

  // Load meeting details
  const loadMeetingDetails = useCallback(async () => {
    if (!normalizedMeetingId) return

    setIsLoading(true)
    setError(null)

    try {
      const details = await apiService.getMeetingDetails(normalizedMeetingId)
      setMeetingDetails(details)
      setParticipants(details.participants || [])
      setSpotlightedUserId(
        details.participants?.find((p) => p.isSpotlighted)?.userId || null,
      )

      // Check if user is already joined
      let currentUser = null
      try {
        currentUser = await authService.getCurrentUser()
      } catch (userError) {
        console.warn(
          '[useDailyMeeting] Could not fetch current user:',
          userError,
        )
        // Try to get user from localStorage as fallback
        const userString = localStorage.getItem('currentUser')
        if (userString) {
          currentUser = JSON.parse(userString)
        } else {
          const userId = localStorage.getItem('userId')
          if (userId) {
            currentUser = { id: userId }
          }
        }
      }

      console.log('[useDailyMeeting] Current user:', currentUser)
      console.log('[useDailyMeeting] Meeting details:', {
        status: details.status,
        participants: details.participants,
      })

      const currentUserParticipant = details.participants?.find(
        (p) =>
          p.userId === String(currentUser?.id) ||
          p.email === currentUser?.email,
      )

      console.log(
        '[useDailyMeeting] Current user participant:',
        currentUserParticipant,
      )

      // Check if user should auto-resume (already joined, or participant status is active)
      const shouldAutoResume =
        currentUserParticipant &&
        details.status === 'active' &&
        (currentUserParticipant.isJoined === true ||
          currentUserParticipant.status === 'active' ||
          details.myParticipantStatus === 'active')

      console.log('[useDailyMeeting] Should auto-resume:', shouldAutoResume)

      if (shouldAutoResume) {
        console.log(
          '[useDailyMeeting] User is already joined, auto-resuming meeting...',
        )
        setIsJoined(true)

        // Auto-resume the meeting
        setIsLoading(true)
        try {
          // Get room URL
          const roomUrlResponse =
            await apiService.getMeetingRoomUrl(normalizedMeetingId)
          roomUrlRef.current = roomUrlResponse.roomUrl

          console.log(
            '[useDailyMeeting] Got room URL for auto-resume:',
            roomUrlRef.current,
          )

          // Initialize Daily.co call
          await dailyVideoService.initialize(roomUrlRef.current)

          // Join the room
          await dailyVideoService.join({
            audio: true,
            video: true,
          })

          // Update participants from Daily.co
          setTimeout(() => {
            updateParticipantsFromDaily()
          }, 1000) // Give Daily.co a moment to populate participants

          console.log('[useDailyMeeting] Successfully auto-resumed meeting')
        } catch (resumeError) {
          console.error(
            '[useDailyMeeting] Failed to auto-resume meeting:',
            resumeError,
          )
          console.error('[useDailyMeeting] Resume error details:', {
            message: resumeError.message,
            error: resumeError.error,
            httpStatus: resumeError.httpStatus,
          })
          setError(
            'Failed to resume meeting. Please click Join Meeting to try again.',
          )
          setIsJoined(false)
        } finally {
          setIsLoading(false)
        }
      }

      return details
    } catch (err) {
      setError(err.message)
      console.error('Failed to load meeting details:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [normalizedMeetingId, apiService, updateParticipantsFromDaily])

  // Get room URL from backend
  const getRoomUrl = useCallback(async () => {
    try {
      console.log(
        '[useDailyMeeting] Getting room URL for meeting:',
        normalizedMeetingId,
      )
      const response = await apiService.getMeetingRoomUrl(normalizedMeetingId)
      roomUrlRef.current = response.roomUrl
      console.log('[useDailyMeeting] Got room URL:', response.roomUrl)
      return response.roomUrl
    } catch (error) {
      console.error('[useDailyMeeting] Failed to get room URL:', error)
      throw error
    }
  }, [normalizedMeetingId, apiService])

  // Join meeting
  const joinMeeting = useCallback(
    async (mediaPreferences = { audioEnabled: true, videoEnabled: true }) => {
      if (isJoining) {
        console.log('[useDailyMeeting] Join already in progress')
        return
      }

      setIsJoining(true)
      setIsLoading(true)
      setError(null)

      try {
        console.log('[useDailyMeeting] Starting join process...')

        // Call backend to register join and get room URL
        try {
          const joinResponse = await apiService.joinMeeting(
            normalizedMeetingId,
            mediaPreferences,
          )
          console.log('[useDailyMeeting] Backend join response:', joinResponse)
        } catch (joinError) {
          // Handle ALREADY_JOINED error gracefully - just continue to join Daily.co room
          if (
            joinError.error === 'ALREADY_JOINED' ||
            joinError.httpStatus === 409
          ) {
            console.log(
              '[useDailyMeeting] Already joined on backend, resuming session...',
            )
          } else {
            throw joinError
          }
        }

        // Get room URL if not already available
        if (!roomUrlRef.current) {
          await getRoomUrl()
        }

        console.log(
          '[useDailyMeeting] Initializing Daily.co with room URL:',
          roomUrlRef.current,
        )

        // Initialize Daily.co call
        const callObject = await dailyVideoService.initialize(
          roomUrlRef.current,
        )

        // Immediately update the call object state
        setDailyCallObjectState(callObject)
        console.log(
          '[useDailyMeeting] Call object set in state after initialization:',
          !!callObject,
        )

        // Join the room
        await dailyVideoService.join({
          audio: mediaPreferences.audioEnabled,
          video: mediaPreferences.videoEnabled,
        })

        // Verify that the call object is still available after joining
        if (!dailyVideoService.callObject) {
          console.error(
            '[useDailyMeeting] Call object missing after join, re-initializing',
          )
          await dailyVideoService.initialize(roomUrlRef.current)
          setDailyCallObjectState(dailyVideoService.callObject)
        }

        // Update local state
        setMediaState({
          audioMuted: !mediaPreferences.audioEnabled,
          videoEnabled: mediaPreferences.videoEnabled,
        })

        setIsJoined(true)

        // Update participants from Daily.co
        setTimeout(() => {
          updateParticipantsFromDaily()
        }, 1000)

        console.log('[useDailyMeeting] Successfully joined meeting')
      } catch (err) {
        setError(err.message)
        console.error('Failed to join meeting:', err)
        throw err
      } finally {
        setIsLoading(false)
        setIsJoining(false)
      }
    },
    [
      isJoining,
      getRoomUrl,
      apiService,
      normalizedMeetingId,
      updateParticipantsFromDaily,
    ],
  )

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    try {
      console.log('[useDailyMeeting] Leaving meeting...')

      await dailyVideoService.leave()
      setIsJoined(false)
      setParticipants([])
      participantsRef.current.clear()

      console.log('[useDailyMeeting] Successfully left meeting')
    } catch (err) {
      setError(err.message)
      console.error('[useDailyMeeting] Failed to leave meeting:', err)
      throw err
    }
  }, [])

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    const newMutedState = !mediaState.audioMuted

    try {
      await dailyVideoService.setLocalAudio(!newMutedState)
      setMediaState((prev) => ({ ...prev, audioMuted: newMutedState }))

      // Update backend
      await apiService.toggleAudio(normalizedMeetingId, newMutedState)

      console.log(
        `[useDailyMeeting] Audio ${newMutedState ? 'muted' : 'unmuted'}`,
      )
    } catch (err) {
      setError(err.message)
      console.error('Failed to toggle audio:', err)
    }
  }, [mediaState.audioMuted, normalizedMeetingId, apiService])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const newVideoState = !mediaState.videoEnabled

    try {
      await dailyVideoService.setLocalVideo(newVideoState)
      setMediaState((prev) => ({ ...prev, videoEnabled: newVideoState }))

      // Update backend
      await apiService.toggleVideo(normalizedMeetingId, newVideoState)

      console.log(
        `[useDailyMeeting] Video ${newVideoState ? 'enabled' : 'disabled'}`,
      )
    } catch (err) {
      setError(err.message)
      console.error('Failed to toggle video:', err)
    }
  }, [mediaState.videoEnabled, normalizedMeetingId, apiService])

  // Update participants from Daily.co or passed callObject
  const updateParticipantsFromDaily = useCallback(() => {
    const currentCallObject = callObject || dailyVideoService.callObject
    if (!currentCallObject) {
      console.log(
        '[useDailyMeeting] No Daily.co call object available for participant update',
      )
      return
    }

    console.log('[useDailyMeeting] Updating participants from Daily.co')

    const dailyParticipants = currentCallObject.participants()
    console.log('[useDailyMeeting] Raw Daily participants:', dailyParticipants)

    // Check if we have valid participants before updating
    if (!dailyParticipants || Object.keys(dailyParticipants).length === 0) {
      console.log(
        '[useDailyMeeting] No participants from Daily.co, skipping update',
      )
      return
    }

    const participantList = Object.values(dailyParticipants).map(
      (participant) => ({
        userId:
          participant.userId || participant.session_id || participant.sessionId,
        displayName:
          participant.userName || participant.user_name || 'Anonymous',
        name: participant.userName || participant.user_name || 'Anonymous',
        role: 'participant',
        avatar: participant.avatar,
        joinedAt:
          participant.joinedAt ||
          participant.joined_at ||
          new Date().toISOString(),
        isAudioMuted: !participant.audio,
        isVideoEnabled: !!participant.video,
        isSpotlighted: false,
        isCurrentUser: participant.local,
        sessionId: participant.session_id || participant.sessionId,
        // Store the raw tracks data for video rendering
        tracks: participant.tracks,
        // Store complete Daily participant data for easier access
        dailyParticipant: participant,
      }),
    )

    console.log('[useDailyMeeting] Transformed participants:', participantList)

    // Carefully update state to prevent component unmounts
    // We'll merge with existing state to preserve properties we care about
    setParticipants((prevParticipants) => {
      const existingParticipantsMap = new Map(
        prevParticipants.map((p) => [p.sessionId || p.userId, p]),
      )

      // Merge new participants with existing data
      const updatedList = participantList.map((newP) => {
        const existingP = existingParticipantsMap.get(
          newP.sessionId || newP.userId,
        )
        if (existingP) {
          return {
            ...existingP,
            ...newP,
            // Preserve sessionId stability
            sessionId: existingP.sessionId || newP.sessionId,
            // Update dynamic properties
            isAudioMuted: newP.isAudioMuted,
            isVideoEnabled: newP.isVideoEnabled,
            tracks: newP.tracks,
            dailyParticipant: newP.dailyParticipant,
          }
        }
        return newP
      })

      return updatedList
    })

    // Update ref for tracking
    participantsRef.current.clear()
    participantList.forEach((p) => {
      participantsRef.current.set(p.sessionId, p)
    })

    console.log('[useDailyMeeting] Participants updated successfully')
  }, [callObject])

  // Set spotlight
  const setSpotlight = useCallback(
    async (spotlightUserId) => {
      try {
        await apiService.setSpotlight(normalizedMeetingId, spotlightUserId)
        setSpotlightedUserId(spotlightUserId)
      } catch (err) {
        setError(err.message)
        console.error('Failed to set spotlight:', err)
      }
    },
    [normalizedMeetingId, apiService],
  )

  // Get participants
  const getParticipants = useCallback(async () => {
    try {
      const response =
        await apiService.getMeetingParticipants(normalizedMeetingId)
      const participantsData = response.participants || []

      const transformedParticipants = participantsData.map((participant) => ({
        userId: participant.userId,
        displayName: participant.name,
        name: participant.name,
        role: participant.role,
        email: participant.email,
        avatar: participant.avatar,
        joinedAt: participant.joinedAt,
        isAudioMuted: participant.isAudioMuted,
        isVideoEnabled: participant.isVideoEnabled,
        isSpotlighted: participant.isSpotlighted,
        isCurrentUser: participant.isCurrentUser,
      }))

      setParticipants(transformedParticipants)
      setSpotlightedUserId(response.spotlightedUserId || null)

      return {
        ...response,
        participants: transformedParticipants,
      }
    } catch (err) {
      setError(err.message)
      console.error('Failed to get participants:', err)
      throw err
    }
  }, [normalizedMeetingId, apiService])

  // Initiate meeting (for hosts)
  const initiateMeeting = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.initiateMeeting(normalizedMeetingId)

      // Get room URL after initiation
      await getRoomUrl()

      // Initialize Daily.co call
      await dailyVideoService.initialize(roomUrlRef.current)

      // Join the room
      await dailyVideoService.join({
        audio: true,
        video: true,
      })

      setMediaState({
        audioMuted: false,
        videoEnabled: true,
      })

      setIsJoined(true)
      updateParticipantsFromDaily()

      return response
    } catch (err) {
      setError(err.message)
      console.error('Failed to initiate meeting:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [normalizedMeetingId, apiService, getRoomUrl, updateParticipantsFromDaily])

  // Close meeting (for hosts)
  const closeMeeting = useCallback(
    async (reason = 'Meeting completed') => {
      try {
        await apiService.closeMeeting(normalizedMeetingId, reason)
        await leaveMeeting()
      } catch (err) {
        setError(err.message)
        console.error('Failed to close meeting:', err)
        throw err
      }
    },
    [normalizedMeetingId, apiService, leaveMeeting],
  )

  // Set up Daily.co event listeners
  useEffect(() => {
    if (!isJoined) return

    const handleParticipantJoined = (participant) => {
      console.log('[useDailyMeeting] Participant joined:', participant)
      updateParticipantsFromDaily()
    }

    const handleParticipantUpdated = (participant) => {
      console.log('[useDailyMeeting] Participant updated:', participant)
      updateParticipantsFromDaily()
    }

    const handleParticipantLeft = (participant) => {
      console.log('[useDailyMeeting] Participant left:', participant)
      updateParticipantsFromDaily()
    }

    const handleJoinedMeeting = () => {
      console.log('[useDailyMeeting] Joined meeting event')
      setIsJoined(true)
    }

    const handleLeftMeeting = () => {
      console.log('[useDailyMeeting] Left meeting event')
      setIsJoined(false)
    }

    const handleError = (error) => {
      console.error('[useDailyMeeting] Daily.co error:', error)
      setError(error.errorMsg || 'Daily.co error occurred')
    }

    const handleTrackStarted = (event) => {
      console.log('[useDailyMeeting] Track started:', event)
      // Force update participants to trigger re-render with new tracks
      updateParticipantsFromDaily()
    }

    const handleTrackStopped = (event) => {
      console.log('[useDailyMeeting] Track stopped:', event)
      // Force update participants to trigger re-render
      updateParticipantsFromDaily()
    }

    // Register event listeners
    dailyVideoService.on('participant-joined', handleParticipantJoined)
    dailyVideoService.on('participant-updated', handleParticipantUpdated)
    dailyVideoService.on('participant-left', handleParticipantLeft)
    dailyVideoService.on('joined-meeting', handleJoinedMeeting)
    dailyVideoService.on('left-meeting', handleLeftMeeting)
    dailyVideoService.on('error', handleError)
    dailyVideoService.on('track-started', handleTrackStarted)
    dailyVideoService.on('track-stopped', handleTrackStopped)

    // Cleanup
    return () => {
      dailyVideoService.off('participant-joined', handleParticipantJoined)
      dailyVideoService.off('participant-updated', handleParticipantUpdated)
      dailyVideoService.off('participant-left', handleParticipantLeft)
      dailyVideoService.off('joined-meeting', handleJoinedMeeting)
      dailyVideoService.off('left-meeting', handleLeftMeeting)
      dailyVideoService.off('error', handleError)
      dailyVideoService.off('track-started', handleTrackStarted)
      dailyVideoService.off('track-stopped', handleTrackStopped)
    }
  }, [isJoined, updateParticipantsFromDaily])

  // Load meeting details on mount
  useEffect(() => {
    if (normalizedMeetingId) {
      loadMeetingDetails()
    }
  }, [normalizedMeetingId, loadMeetingDetails])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isJoined) {
        dailyVideoService
          .destroy()
          .catch((err) =>
            console.error('[useDailyMeeting] Error during cleanup:', err),
          )
      }
    }
  }, [isJoined])

  // Track the Daily.co call object in state to ensure it's always up to date
  const [dailyCallObjectState, setDailyCallObjectState] = useState(
    dailyVideoService.callObject,
  )

  // Update call object state when it changes in the service
  useEffect(() => {
    console.log(
      '[useDailyMeeting] Initial dailyCallObjectState:',
      !!dailyCallObjectState,
    )

    // Immediately check if we already have a callObject
    if (!dailyCallObjectState && dailyVideoService.callObject) {
      console.log('[useDailyMeeting] Setting initial call object from service')
      setDailyCallObjectState(dailyVideoService.callObject)
    }

    // Periodically check for call object updates
    const intervalId = setInterval(() => {
      const currentCallObject = dailyVideoService.callObject
      if (currentCallObject !== dailyCallObjectState) {
        console.log(
          '[useDailyMeeting] Daily call object changed, updating state',
          {
            hadCallObject: !!dailyCallObjectState,
            hasNewCallObject: !!currentCallObject,
          },
        )
        setDailyCallObjectState(currentCallObject)
      }
    }, 500)

    return () => {
      clearInterval(intervalId)
      console.log('[useDailyMeeting] Call object tracking stopped')
    }
  }, [dailyCallObjectState])

  // Check if we're actually in the Daily call
  const isInDailyCall = useMemo(() => {
    return isJoined && dailyCallObjectState && dailyVideoService.isInMeeting()
  }, [isJoined, dailyCallObjectState])

  return useMemo(
    () => ({
      // State
      meetingDetails,
      participants,
      isConnected: isInDailyCall,
      isLoading,
      error,
      spotlightedUserId,
      mediaState,
      role,

      // Actions
      loadMeetingDetails,
      initiateMeeting,
      joinMeeting,
      leaveMeeting,
      closeMeeting,
      toggleAudio,
      toggleVideo,
      setSpotlight,
      getParticipants,

      // Daily.co specific
      roomUrl: roomUrlRef.current,
      dailyCallObject: dailyCallObjectState,
    }),
    [
      meetingDetails,
      participants,
      isInDailyCall,
      isLoading,
      error,
      spotlightedUserId,
      mediaState,
      role,
      loadMeetingDetails,
      initiateMeeting,
      joinMeeting,
      leaveMeeting,
      closeMeeting,
      toggleAudio,
      toggleVideo,
      setSpotlight,
      getParticipants,
      dailyCallObjectState,
    ],
  )
}

export default useDailyMeeting
