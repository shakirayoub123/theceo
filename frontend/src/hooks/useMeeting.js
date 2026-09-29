// src/hooks/useMeeting.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import clientAPIService from '../services/clientAPIService'
import trainerAPIService from '../services/trainerAPIService'
import meetingWebSocketService from '../services/meetingWebSocketService'
import authService from '../services/authService'

const useMeeting = (meetingId, options = {}) => {
  const role = options.role || 'client' // 'client' | 'trainer'
  const apiService = role === 'trainer' ? trainerAPIService : clientAPIService
  // Use meeting ID as-is - no normalization needed
  const normalizedMeetingId = meetingId

  const [meetingDetails, setMeetingDetails] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isJoined, setIsJoined] = useState(false)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isJoining, setIsJoining] = useState(false)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState(new Map())
  const [spotlightedUserId, setSpotlightedUserId] = useState(null)
  const [mediaState, setMediaState] = useState({
    audioMuted: false,
    videoEnabled: true,
  })

  const peerConnections = useRef(new Map())
  const localUserIdRef = useRef(null)
  const wsConnectionAttemptedRef = useRef(false)

  // Determine current user id lazily
  useEffect(() => {
    if (!localUserIdRef.current) {
      try {
        const stored = localStorage.getItem('userId')
        if (stored) localUserIdRef.current = String(stored)
      } catch (e) {
        console.warn('[useMeeting] Unable to load userId from storage', e)
      }
    }
  }, [])

  // WebRTC configuration
  const rtcConfig = useRef({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // TURN servers will be provided by the backend API
    ],
  })

  // PeerConnection map and helper (defined early so effects can reference safely)
  const ensurePeerConnection = useCallback(
    (remoteUserId, shouldCreateOffer = false) => {
      if (!remoteUserId) return null
      let pc = peerConnections.current.get(remoteUserId)
      if (pc) {
        return pc
      }
      console.log('[WebRTC] Creating new RTCPeerConnection for', remoteUserId)
      const pcInstance = new RTCPeerConnection(rtcConfig.current)

      pcInstance.ontrack = (event) => {
        console.log('[WebRTC] ontrack from', remoteUserId, event.streams)
        const [stream] = event.streams
        if (stream) {
          setRemoteStreams((prev) => {
            const map = new Map(prev)
            map.set(remoteUserId, stream)
            return map
          })
        }
      }

      pcInstance.onicecandidate = (event) => {
        if (event.candidate) {
          meetingWebSocketService.sendICECandidate(
            event.candidate,
            event.candidate.sdpMid,
            event.candidate.sdpMLineIndex,
            remoteUserId,
          )
        }
      }

      pcInstance.oniceconnectionstatechange = () => {
        console.log(
          '[WebRTC] ICE state change',
          remoteUserId,
          pcInstance.iceConnectionState,
        )
        if (pcInstance.iceConnectionState === 'failed') {
          console.warn('[WebRTC] ICE failed for', remoteUserId)
        }
      }

      if (localStream) {
        localStream
          .getTracks()
          .forEach((track) => pcInstance.addTrack(track, localStream))
      }

      peerConnections.current.set(remoteUserId, pcInstance)

      if (shouldCreateOffer) {
        pcInstance
          .createOffer()
          .then((offer) =>
            pcInstance.setLocalDescription(offer).then(() => offer),
          )
          .then((offer) => {
            console.log('[WebRTC] Sending offer to', remoteUserId)
            meetingWebSocketService.sendWebRTCOffer(offer, remoteUserId)
          })
          .catch((err) =>
            console.error('[WebRTC] Failed to create/send offer', err),
          )
      }
      return pcInstance
    },
    [localStream],
  )

  // Load meeting details
  const loadMeetingDetails = useCallback(async () => {
    if (!normalizedMeetingId) return

    setIsLoading(true)
    setError(null)

    try {
      let details
      try {
        details = await apiService.getMeetingDetails(normalizedMeetingId)
      } catch (primaryErr) {
        console.error(
          '[loadMeetingDetails] Primary meeting details fetch failed',
          {
            role,
            httpStatus: primaryErr.httpStatus,
            message: primaryErr.message,
          },
        )

        // Special handling for ALREADY_JOINED error - treat as successful since user is already joined
        if (
          primaryErr.error === 'ALREADY_JOINED' ||
          primaryErr.httpStatus === 409
        ) {
          console.log(
            '[loadMeetingDetails] User is already joined to meeting, proceeding with minimal meeting data',
            { joinedAt: primaryErr.joinedAt },
          )
          // Create minimal meeting details for already joined user
          details = {
            id: normalizedMeetingId,
            status: 'active',
            title: 'Meeting',
            participants: [],
            __alreadyJoined: true,
            joinedAt: primaryErr.joinedAt,
          }
        }
        // Fallback: if trainer endpoint fails with 500 or 409, attempt client endpoint for basic data
        else if (
          role === 'trainer' &&
          (primaryErr.httpStatus === 500 || primaryErr.httpStatus === 409)
        ) {
          try {
            console.log(
              '[loadMeetingDetails] Attempting fallback to client meeting details endpoint',
            )
            details =
              await clientAPIService.getMeetingDetails(normalizedMeetingId)
            details.__fallbackUsed = true
          } catch (fallbackErr) {
            console.error(
              '[loadMeetingDetails] Fallback client meeting details fetch failed',
              fallbackErr,
            )
            // If fallback also fails with ALREADY_JOINED, treat as successful
            if (fallbackErr.error === 'ALREADY_JOINED') {
              console.log(
                '[loadMeetingDetails] Fallback also returned ALREADY_JOINED, proceeding with minimal meeting data',
                { joinedAt: fallbackErr.joinedAt },
              )
              details = {
                id: normalizedMeetingId,
                status: 'active',
                title: 'Meeting',
                participants: [],
                __alreadyJoined: true,
                joinedAt: fallbackErr.joinedAt,
              }
            } else {
              throw primaryErr // rethrow original
            }
          }
        } else {
          throw primaryErr
        }
      }
      if (details.__fallbackUsed) {
        details.fallbackNotice =
          'Trainer endpoint failed; using limited client meeting data.'
      }
      setMeetingDetails(details)
      setParticipants(details.participants || [])
      setSpotlightedUserId(
        details.participants?.find((p) => p.isSpotlighted)?.userId || null,
      )

      // Check if the current user is already joined to the meeting
      try {
        // Check if user is authenticated first
        if (!authService.isAuthenticated()) {
          console.log(
            '[loadMeetingDetails] User is not authenticated, skipping user join check',
          )
          return details
        }

        // Get current user from authService (async call)
        let currentUser = null
        try {
          currentUser = await authService.getCurrentUser()
          console.log(
            '[loadMeetingDetails] Current user from API:',
            currentUser,
          )
        } catch (userError) {
          console.warn(
            '[loadMeetingDetails] Could not fetch current user from API:',
            userError,
          )
          // Fallback to localStorage
          const userString = localStorage.getItem('currentUser')
          if (userString) {
            currentUser = JSON.parse(userString)
            console.log(
              '[loadMeetingDetails] Current user from localStorage:',
              currentUser,
            )
          } else {
            // Try to get userId from localStorage as last resort
            const userId = localStorage.getItem('userId')
            if (userId) {
              currentUser = { id: userId }
              console.log(
                '[loadMeetingDetails] Current user from userId only:',
                currentUser,
              )
            }
          }
        }

        // If we got ALREADY_JOINED from getMeetingDetails, the user is definitely joined
        const isAlreadyJoinedFromAPI = details.__alreadyJoined === true

        // Find the current user in participants list
        const currentUserParticipant = details.participants?.find(
          (p) =>
            // Try to match by userId (as string comparison)
            p.userId === String(currentUser?.id) ||
            // Also check email as fallback
            p.email === currentUser?.email,
        )

        console.log('[loadMeetingDetails] Current user participant info:', {
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          participant: currentUserParticipant,
          isJoined: currentUserParticipant?.isJoined,
          status: currentUserParticipant?.status,
          isAlreadyJoinedFromAPI,
        })

        // If API indicates we're already joined, connect to WebSocket (but only once)
        if (
          isAlreadyJoinedFromAPI ||
          ((currentUserParticipant?.isJoined === true ||
            currentUserParticipant?.status === 'active' ||
            details.myParticipantStatus === 'active') &&
            !wsConnectionAttemptedRef.current)
        ) {
          console.log(
            '[loadMeetingDetails] Server indicates you are already joined to this meeting. Connecting to WebSocket and fetching participants.',
            {
              userId: currentUser?.id,
              participantStatus: currentUserParticipant?.status,
              myParticipantStatus: details.myParticipantStatus,
              joinedAt: details.joinedAt,
              isAlreadyJoinedFromAPI,
            },
          )

          // Mark that we've attempted connection to prevent duplicate attempts
          wsConnectionAttemptedRef.current = true

          // For ALREADY_JOINED cases, set joined state immediately since user is already joined on server
          setIsJoined(true)

          // Check if WebSocket is already connected before attempting to connect
          const wsStatus = meetingWebSocketService.getConnectionStatus()
          console.log(
            '[loadMeetingDetails] Current WebSocket status:',
            wsStatus,
          )

          if (!wsStatus.isConnected) {
            // Connect to WebSocket to receive real-time updates
            try {
              console.log(
                '[loadMeetingDetails] Connecting to WebSocket for already joined user...',
              )
              await meetingWebSocketService.connect(normalizedMeetingId)
              console.log(
                '[loadMeetingDetails] WebSocket connection successful for already joined user',
              )
            } catch (wsError) {
              console.error(
                '[loadMeetingDetails] WebSocket connection failed for already joined user:',
                wsError,
              )
              // Reset the ref so we can retry on next load
              wsConnectionAttemptedRef.current = false
              // For ALREADY_JOINED cases, WebSocket failure is not critical
              // The user is still joined on the server, they just won't get real-time updates
              console.warn(
                '[loadMeetingDetails] Continuing with isConnected=true despite WebSocket failure - user is already joined on server',
              )
            }
          } else {
            console.log(
              '[loadMeetingDetails] WebSocket already connected, skipping connection attempt',
            )
          }

          // Fetch current participants list since we're already joined
          try {
            console.log(
              '[loadMeetingDetails] Fetching participants list for already joined user...',
            )
            if (getParticipantsRef.current) {
              await getParticipantsRef.current()
              console.log(
                '[loadMeetingDetails] Successfully fetched participants list',
              )
            } else {
              console.warn(
                '[loadMeetingDetails] getParticipants ref not available yet',
              )
            }
          } catch (participantsError) {
            console.error(
              '[loadMeetingDetails] Failed to fetch participants:',
              participantsError,
            )
            // Don't fail the entire load - participants can be fetched later via WebSocket events
          }
        }
      } catch (err) {
        console.error(
          '[loadMeetingDetails] Error checking current user join status:',
          err,
        )
      }

      return details
    } catch (err) {
      setError(err.message)
      console.error('Failed to load meeting details:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [normalizedMeetingId, apiService, role])

  // Get user media (camera and microphone)
  const getUserMedia = useCallback(async () => {
    console.log('[getUserMedia] Requesting access to camera and microphone...')
    try {
      // Check if we already have a stream before requesting a new one
      if (localStream) {
        const audioTracks = localStream.getAudioTracks()
        const videoTracks = localStream.getVideoTracks()
        const liveVideo = videoTracks.some((t) => t.readyState === 'live')
        const liveAudio = audioTracks.some((t) => t.readyState === 'live')
        console.log('[getUserMedia] Existing stream found', {
          audioTracks: audioTracks.length,
          videoTracks: videoTracks.length,
          liveVideo,
          liveAudio,
        })
        if (liveVideo) {
          return localStream
        } else {
          console.warn(
            '[getUserMedia] Existing localStream has no live video tracks; reacquiring...',
          )
        }
      }
      const constraintAttempts = [
        {
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        },
        {
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: true,
        },
        { video: { facingMode: 'user' }, audio: true },
        { video: true, audio: true },
      ]

      let stream = null
      let lastError = null
      for (let i = 0; i < constraintAttempts.length; i++) {
        const constraints = constraintAttempts[i]
        console.log('[getUserMedia] Attempting constraints', i + 1, constraints)
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          console.log('[getUserMedia] Constraints succeeded', constraints)
          break
        } catch (err) {
          console.warn('[getUserMedia] Constraint set failed', constraints, err)
          lastError = err
        }
      }
      if (!stream) {
        throw lastError || new Error('All constraint attempts failed')
      }

      console.log('[getUserMedia] Access granted', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      })

      // Instrument tracks for debugging unexpected stop/mute
      stream.getTracks().forEach((track) => {
        console.log('[mediaTrack] Added track', {
          id: track.id,
          kind: track.kind,
          label: track.label,
          readyState: track.readyState,
          enabled: track.enabled,
        })
        track.onended = (ev) =>
          console.warn('[mediaTrack] onended fired', {
            id: track.id,
            kind: track.kind,
            label: track.label,
            readyState: track.readyState,
            enabled: track.enabled,
            event: ev?.type,
          })
        track.onmute = (ev) =>
          console.warn('[mediaTrack] onmute fired', {
            id: track.id,
            kind: track.kind,
            label: track.label,
            readyState: track.readyState,
            enabled: track.enabled,
            event: ev?.type,
          })
        track.onunmute = (ev) =>
          console.log('[mediaTrack] onunmute fired', {
            id: track.id,
            kind: track.kind,
            label: track.label,
            readyState: track.readyState,
            enabled: track.enabled,
            event: ev?.type,
          })
      })

      setLocalStream(stream)
      return stream
    } catch (err) {
      console.error('[getUserMedia] Failed to get user media:', err)
      setError(`Failed to access camera and microphone: ${err.message}`)
      throw err
    }
  }, [localStream])

  // Manual camera refresh (re-acquire even if we have a stream)
  const refreshCamera = useCallback(async () => {
    console.log('[refreshCamera] Forcing camera refresh...')
    if (localStream) {
      localStream.getTracks().forEach((t) => {
        console.log('[refreshCamera] Stopping existing track', {
          id: t.id,
          kind: t.kind,
          readyState: t.readyState,
        })
        t.stop()
      })
    }
    setLocalStream(null)
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      console.log('[refreshCamera] Acquired new stream', {
        videoTracks: newStream.getVideoTracks().length,
        audioTracks: newStream.getAudioTracks().length,
      })
      setLocalStream(newStream)
      return newStream
    } catch (err) {
      console.error('[refreshCamera] Failed to refresh camera:', err)
      throw err
    }
  }, [localStream])

  // Use refs to store function references to break circular dependencies
  const joinMeetingRef = useRef(null)
  const getParticipantsRef = useRef(null)

  // Initiate meeting
  const initiateMeeting = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let response
      try {
        response = await apiService.initiateMeeting(normalizedMeetingId)
      } catch (apiError) {
        // Check for special error cases
        if (
          apiError.error === 'MEETING_ALREADY_ACTIVE' ||
          apiError.error === 'ALREADY_JOINED'
        ) {
          console.log('Meeting already active, joining instead...')
          // If meeting is already active, just join it instead of initiating
          // Use the ref to call joinMeeting to avoid circular dependency
          if (joinMeetingRef.current) {
            return joinMeetingRef.current({
              audioEnabled: true,
              videoEnabled: true,
            })
          } else {
            // Fallback if ref isn't set yet (shouldn't happen in practice)
            throw new Error(
              'Cannot join meeting - meeting reference not initialized',
            )
          }
        } else {
          // For other errors, propagate them as usual
          throw apiError
        }
      }

      // Update WebRTC config if provided
      if (response.meeting?.webrtcConfig?.iceServers) {
        rtcConfig.current.iceServers = response.meeting.webrtcConfig.iceServers
      }

      // Connect to WebSocket
      await meetingWebSocketService.connect(normalizedMeetingId)
      setIsJoined(true)

      // Get user media
      await getUserMedia()

      // Reload meeting details to get updated status
      // await loadMeetingDetails() // Removed to prevent re-calling loadMeetingDetails

      return response
    } catch (err) {
      setError(err.message)
      console.error('Failed to initiate meeting:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [normalizedMeetingId, getUserMedia, apiService])

  // Join meeting
  const joinMeeting = useCallback(
    async (mediaPreferences = { audioEnabled: true, videoEnabled: true }) => {
      console.log(
        `[joinMeeting] Attempting to join meeting ${normalizedMeetingId} with current state:`,
        {
          isConnected: isJoined,
          meetingStatus: meetingDetails?.status,
          participants: participants.length,
          isJoining,
        },
      )

      // Prevent concurrent join attempts
      if (isJoining) {
        console.log(
          '[joinMeeting] Join already in progress, ignoring duplicate request',
        )
        return
      }

      setIsJoining(true)
      setIsLoading(true)
      setError(null)

      try {
        let response
        try {
          console.log(
            `[joinMeeting] Making API call to join meeting ${normalizedMeetingId}...`,
          )
          response = await apiService.joinMeeting(
            normalizedMeetingId,
            mediaPreferences,
          )
          console.log('[joinMeeting] Join meeting API response:', response)
        } catch (apiError) {
          console.warn('[joinMeeting] Join meeting API error:', apiError)

          // Special handling for MEETING_NOT_ACTIVE error - initiate meeting instead if trainer
          if (
            (apiError.error === 'MEETING_NOT_ACTIVE' ||
              apiError.error === 'MEETING_NOT_STARTED' ||
              apiError.message?.includes('not active') ||
              apiError.message?.includes('not started')) &&
            role === 'trainer'
          ) {
            console.log(
              `[joinMeeting] Meeting not active, initiating meeting instead as trainer...`,
            )
            // If meeting is not active and we're a trainer, initiate it instead
            return await initiateMeeting()
          }

          // Special handling for ALREADY_JOINED error
          if (
            apiError.error === 'ALREADY_JOINED' ||
            apiError.httpStatus === 409
          ) {
            console.log(
              `[joinMeeting] Already joined meeting ${normalizedMeetingId} (detected via error code or status), joinedAt:`,
              apiError.joinedAt,
            )

            // For ALREADY_JOINED, we should still try to connect and show the video
            // even if WebSocket connection fails - the user is already joined on the server
            setIsJoined(true)

            // Check if we're already connected via WebSocket
            const wsStatus = meetingWebSocketService.getConnectionStatus()
            console.log(
              '[joinMeeting] Current WebSocket status for already joined user:',
              wsStatus,
            )

            if (!wsStatus.isConnected) {
              // Since the server says we're already joined, we still need to connect to WebSocket
              // to receive real-time updates and send messages
              console.log(
                '[joinMeeting] Connecting to WebSocket for already joined meeting...',
              )
              try {
                await meetingWebSocketService.connect(normalizedMeetingId)
                console.log(
                  '[joinMeeting] WebSocket connection successful for already joined meeting',
                )
              } catch (wsError) {
                console.error(
                  '[joinMeeting] WebSocket connection failed for already joined meeting:',
                  wsError,
                )
                // For ALREADY_JOINED, WebSocket failure is not critical
                // The user can still participate in the meeting, they just won't get real-time updates
                console.warn(
                  '[joinMeeting] Continuing without WebSocket - user is already joined on server',
                )
              }
            } else {
              console.log(
                '[joinMeeting] WebSocket already connected for already joined meeting',
              )
            }

            // Get user media if we don't have it yet
            if (!localStream) {
              console.log(
                '[joinMeeting] Getting user media for already joined meeting...',
              )
              try {
                await getUserMedia()
              } catch (mediaError) {
                console.error(
                  '[joinMeeting] Failed to get user media:',
                  mediaError,
                )
                // Don't throw - media acquisition is non-critical for ALREADY_JOINED case
              }
            }

            // If we're already joined on the server side, we can still proceed with setting up media
            // without making another join API call - just return success
            console.log(
              '[joinMeeting] Already joined - returning early without full join flow',
            )
            setIsLoading(false)
            return {
              meeting: {
                id: normalizedMeetingId,
                status: 'active',
              },
            }
          } else {
            // For other errors, propagate them as usual
            throw apiError
          }
        }

        // Update WebRTC config if provided
        if (response.meeting?.webrtcConfig?.iceServers) {
          rtcConfig.current.iceServers =
            response.meeting.webrtcConfig.iceServers
        }

        // Connect to WebSocket
        console.log('[joinMeeting] Connecting to WebSocket...')
        try {
          await meetingWebSocketService.connect(normalizedMeetingId)
          console.log('[joinMeeting] WebSocket connection successful')
          setIsWebSocketConnected(true)
          setIsJoined(true)
        } catch (wsError) {
          console.error('[joinMeeting] WebSocket connection failed:', wsError)
          setError(`Failed to connect to meeting: ${wsError.message}`)
          throw wsError
        }

        // Set initial media state
        console.log('[joinMeeting] Setting initial media state:', {
          audioMuted: !mediaPreferences.audioEnabled,
          videoEnabled: mediaPreferences.videoEnabled,
        })
        setMediaState({
          audioMuted: !mediaPreferences.audioEnabled,
          videoEnabled: mediaPreferences.videoEnabled,
        })

        // Get user media
        await getUserMedia()

        // Update participants list
        if (response.meeting?.activeParticipants) {
          setParticipants(response.meeting.activeParticipants)
        } else {
          // Refresh participants if not provided in the response
          try {
            // Use the ref to avoid circular dependency
            if (getParticipantsRef.current) {
              await getParticipantsRef.current()
            }
          } catch (err) {
            console.warn('Could not fetch participants after joining', err)
          }
        }

        return response
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
      normalizedMeetingId,
      getUserMedia,
      isJoined,
      meetingDetails,
      participants,
      apiService,
      role,
      initiateMeeting,
      localStream,
      isJoining,
    ],
  )

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    console.log(
      `[leaveMeeting] Attempting to leave meeting ${normalizedMeetingId}`,
    )

    try {
      console.log(
        `[leaveMeeting] Calling API to leave meeting ${normalizedMeetingId}`,
      )
      await apiService.leaveMeeting(normalizedMeetingId)
      console.log(
        `[leaveMeeting] Successfully left meeting ${normalizedMeetingId} on server`,
      )

      // Clean up local resources
      if (localStream) {
        console.log(
          `[leaveMeeting] Stopping ${localStream.getTracks().length} local media tracks`,
        )
        localStream.getTracks().forEach((track) => {
          console.log(
            `[leaveMeeting] Stopping ${track.kind} track (${track.enabled ? 'enabled' : 'disabled'})`,
          )
          track.stop()
        })
        setLocalStream(null)
        console.log('[leaveMeeting] Local stream cleared')
      } else {
        console.log('[leaveMeeting] No local stream to clean up')
      }

      // Close all peer connections
      console.log(
        `[leaveMeeting] Cleaning up ${peerConnections.current.size} peer connections`,
      )
      peerConnections.current.forEach((pc, userId) => {
        console.log(`[leaveMeeting] Closing peer connection with ${userId}`)
        pc.close()
      })
      peerConnections.current.clear()
      setRemoteStreams(new Map())
      console.log(
        '[leaveMeeting] All peer connections closed and remote streams cleared',
      )

      // Disconnect WebSocket
      console.log('[leaveMeeting] Disconnecting WebSocket')
      meetingWebSocketService.disconnect()
      setIsJoined(false)
      // Reset the connection attempt ref so we can reconnect if needed
      wsConnectionAttemptedRef.current = false
      console.log('[leaveMeeting] WebSocket disconnected')

      console.log(
        '[leaveMeeting] Successfully completed all leave meeting cleanup',
      )
    } catch (err) {
      setError(err.message)
      console.error('[leaveMeeting] Failed to leave meeting:', err)

      // Even if the API call fails, we should still clean up local resources
      console.log(
        '[leaveMeeting] Attempting to clean up local resources despite API error',
      )

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
        setLocalStream(null)
      }

      peerConnections.current.forEach((pc) => pc.close())
      peerConnections.current.clear()
      setRemoteStreams(new Map())

      meetingWebSocketService.disconnect()
      setIsJoined(false)
      // Reset the connection attempt ref so we can reconnect if needed
      wsConnectionAttemptedRef.current = false

      throw err
    }
  }, [normalizedMeetingId, localStream, apiService])

  // Close meeting (for host/trainer)
  const closeMeeting = useCallback(
    async (reason = 'Meeting completed') => {
      try {
        await apiService.closeMeeting(normalizedMeetingId, reason)
      } catch (err) {
        setError(err.message)
        console.error('Failed to close meeting:', err)
        throw err
      }
    },
    [normalizedMeetingId, apiService],
  )

  // Toggle audio mute
  const toggleAudio = useCallback(async () => {
    const newMutedState = !mediaState.audioMuted

    try {
      await apiService.toggleAudio(normalizedMeetingId, newMutedState)

      // Update local media state
      setMediaState((prev) => ({ ...prev, audioMuted: newMutedState }))

      // Mute/unmute local stream
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !newMutedState
        })
      }

      // Notify other participants via WebSocket
      console.log('[toggleAudio] Sending media state update via WebSocket:', {
        audioMuted: newMutedState,
        videoEnabled: mediaState.videoEnabled,
        isJoined,
      })

      // Check if WebSocket is connected before sending
      if (meetingWebSocketService.getConnectionStatus().isConnected) {
        const success = meetingWebSocketService.updateMediaState(
          newMutedState,
          mediaState.videoEnabled,
        )
        if (!success) {
          console.warn(
            '[toggleAudio] Failed to send media state update via WebSocket',
          )
        }
      } else {
        console.warn(
          '[toggleAudio] WebSocket not connected, attempting to reconnect...',
        )
        if (normalizedMeetingId) {
          try {
            await meetingWebSocketService.connect(normalizedMeetingId)
            console.log('[toggleAudio] WebSocket reconnected successfully')
            // Now try to send the message
            const success = meetingWebSocketService.updateMediaState(
              newMutedState,
              mediaState.videoEnabled,
            )
            if (!success) {
              console.warn(
                '[toggleAudio] Failed to send media state update after reconnect',
              )
            }
          } catch (reconnectError) {
            console.error(
              '[toggleAudio] Failed to reconnect WebSocket:',
              reconnectError,
            )
          }
        } else {
          console.warn('[toggleAudio] Cannot reconnect - missing meetingId')
        }
      }
    } catch (err) {
      setError(err.message)
      console.error('Failed to toggle audio:', err)
    }
  }, [normalizedMeetingId, mediaState, localStream, isJoined, apiService])

  // Toggle video
  // Using a ref to track if a toggle is in progress to prevent rapid state updates
  const isTogglingVideoRef = useRef(false)

  const toggleVideo = useCallback(async () => {
    // Debounce the toggle operation to prevent rapid state changes
    if (isTogglingVideoRef.current) {
      console.log('[toggleVideo] Toggle already in progress, ignoring request')
      return
    }

    isTogglingVideoRef.current = true

    const newVideoState = !mediaState.videoEnabled
    console.log('[toggleVideo] Starting toggle. Current state:', {
      currentVideoEnabled: mediaState.videoEnabled,
      newVideoState,
      hasLocalStream: !!localStream,
      isJoined,
    })

    try {
      console.log('[toggleVideo] Calling API to toggle video...')
      await apiService.toggleVideo(normalizedMeetingId, newVideoState)
      console.log('[toggleVideo] API call successful')

      // Update local media state
      console.log('[toggleVideo] Updating local media state to:', {
        videoEnabled: newVideoState,
      })
      setMediaState((prev) => ({ ...prev, videoEnabled: newVideoState }))

      // Enable/disable local video stream
      if (localStream) {
        const videoTracks = localStream.getVideoTracks()
        console.log('[toggleVideo] Video tracks found:', videoTracks.length)
        videoTracks.forEach((track, index) => {
          console.log(
            `[toggleVideo] Track ${index}: enabled=${track.enabled}, readyState=${track.readyState}`,
          )
          if (newVideoState && track.readyState === 'ended') {
            console.log(
              `[toggleVideo] Track ${index} is ended, cannot re-enable`,
            )
            // If track is ended, we might need to get new user media
            // For now, just log the issue
          } else {
            track.enabled = newVideoState
            console.log(
              `[toggleVideo] Track ${index} set to enabled=${newVideoState}`,
            )
          }
        })
      } else {
        console.warn('[toggleVideo] No local stream available for video toggle')
      }

      // Notify other participants via WebSocket
      console.log('[toggleVideo] Sending media state update via WebSocket:', {
        audioMuted: mediaState.audioMuted,
        videoEnabled: newVideoState,
        isJoined,
      })

      // Check if WebSocket is connected before sending
      if (meetingWebSocketService.getConnectionStatus().isConnected) {
        const success = meetingWebSocketService.updateMediaState(
          mediaState.audioMuted,
          newVideoState,
        )
        if (!success) {
          console.warn(
            '[toggleVideo] Failed to send media state update via WebSocket',
          )
        } else {
          console.log('[toggleVideo] WebSocket message sent successfully')
        }
      } else {
        console.warn(
          '[toggleVideo] WebSocket not connected, attempting to reconnect...',
        )
        if (normalizedMeetingId) {
          try {
            await meetingWebSocketService.connect(normalizedMeetingId)
            console.log('[toggleVideo] WebSocket reconnected successfully')
            // Now try to send the message
            const success = meetingWebSocketService.updateMediaState(
              mediaState.audioMuted,
              newVideoState,
            )
            if (!success) {
              console.warn(
                '[toggleVideo] Failed to send media state update after reconnect',
              )
            } else {
              console.log(
                '[toggleVideo] WebSocket message sent after reconnect',
              )
            }
          } catch (reconnectError) {
            console.error(
              '[toggleVideo] Failed to reconnect WebSocket:',
              reconnectError,
            )
          }
        } else {
          console.warn('[toggleVideo] Cannot reconnect - missing meetingId')
        }
      }

      console.log('[toggleVideo] Toggle video completed successfully')
    } catch (err) {
      console.error('[toggleVideo] Failed to toggle video:', err)
      setError(err.message)
    } finally {
      // Release the toggle lock after a delay to prevent rapid toggling
      setTimeout(() => {
        isTogglingVideoRef.current = false
      }, 1000)
    }
  }, [normalizedMeetingId, mediaState, localStream, isJoined, apiService])

  // Set spotlight participant
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

      // Handle new API response format
      const participantsData = response.participants || []
      const spotlightedUserId = response.spotlightedUserId || null

      // Transform participant data to match expected format
      const transformedParticipants = participantsData.map((participant) => ({
        userId: participant.userId,
        displayName: participant.name, // Map 'name' to 'displayName' for backward compatibility
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
      setSpotlightedUserId(spotlightedUserId)

      // Log the response for debugging
      console.log('[getParticipants] API response:', {
        meetingId: response.meetingId,
        status: response.status,
        totalParticipants: response.totalParticipants,
        spotlightedUserId: response.spotlightedUserId,
        participantsCount: transformedParticipants.length,
      })

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

  // Get meeting events
  const getMeetingEvents = useCallback(async () => {
    try {
      const response = await apiService.getMeetingEvents(normalizedMeetingId)
      return response
    } catch (err) {
      setError(err.message)
      console.error('Failed to get meeting events:', err)
      throw err
    }
  }, [normalizedMeetingId, apiService])

  // WebSocket event handlers - defined as useCallback to prevent duplicate registrations
  const handleParticipantJoined = useCallback(
    (data) => {
      console.log('[WebSocketEvents] Participant joined:', data)
      if (data.user) {
        console.log(
          `[WebSocketEvents] Adding user ${data.user.userId} to participants list`,
        )
        setParticipants((prev) => {
          // Check if this participant is already in the list (avoid duplicates)
          const exists = prev.some((p) => p.userId === data.user.user.userId)
          if (exists) {
            console.log(
              `[WebSocketEvents] User ${data.user.userId} already in participants list, not adding`,
            )
            return prev // Return same reference to prevent re-render
          }
          return [...prev, data.user]
        })

        // Decide deterministic initiator: lexicographically smaller userId starts offer
        try {
          const localId =
            localUserIdRef.current || localStorage.getItem('userId')
          if (localId && String(localId) < String(data.user.userId)) {
            console.log(
              '[WebRTC] Acting as initiator for new participant',
              data.user.userId,
            )
            ensurePeerConnection(data.user.userId, true)
          } else {
            console.log(
              '[WebRTC] Waiting for offer from participant',
              data.user.userId,
            )
            ensurePeerConnection(data.user.userId, false)
          }
        } catch (e) {
          console.warn(
            '[WebRTC] Failed to initiate peer connection decision',
            e,
          )
        }
      }
    },
    [ensurePeerConnection],
  )

  const handleParticipantLeft = useCallback((data) => {
    console.log('[WebSocketEvents] Participant left:', data)
    // Use functional update to batch multiple rapid updates
    setParticipants((prev) => {
      const filtered = prev.filter((p) => p.userId !== data.userId)
      console.log(
        `[WebSocketEvents] Removed user ${data.userId} from participants list. Count: ${filtered.length}`,
      )
      return filtered
    })

    // Clean up peer connection
    const pc = peerConnections.current.get(data.userId)
    if (pc) {
      console.log(
        `[WebSocketEvents] Closing peer connection for user ${data.userId}`,
      )
      pc.close()
      peerConnections.current.delete(data.userId)
    } else {
      console.log(
        `[WebSocketEvents] No peer connection found for user ${data.userId}`,
      )
    }

    // Remove remote stream
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev)
      const hadStream = newStreams.has(data.userId)
      newStreams.delete(data.userId)
      console.log(
        `[WebSocketEvents] ${hadStream ? 'Removed' : 'No'} remote stream for user ${data.userId}`,
      )
      return newStreams
    })
  }, [])

  const handleMeetingEnded = useCallback(
    (data) => {
      console.log('[WebSocketEvents] Meeting ended:', data)
      // Clean up and redirect
      if (localStream) {
        console.log('[WebSocketEvents] Stopping all local media tracks')
        localStream.getTracks().forEach((track) => {
          console.log(`[WebSocketEvents] Stopping ${track.kind} track`)
          track.stop()
        })
        setLocalStream(null)
      }

      console.log(
        `[WebSocketEvents] Closing ${peerConnections.current.size} peer connections`,
      )
      peerConnections.current.forEach((pc, userId) => {
        console.log(`[WebSocketEvents] Closing peer connection for ${userId}`)
        pc.close()
      })
      peerConnections.current.clear()
      setRemoteStreams(new Map())
      setIsJoined(false)

      console.log(
        '[WebSocketEvents] Meeting cleanup complete after meeting ended',
      )
    },
    [localStream],
  )

  const handleMediaStateChanged = useCallback((data) => {
    console.log('[WebSocketEvents] Media state changed:', data)
    setParticipants((prev) => {
      const updated = prev.map((p) =>
        p.userId === data.userId
          ? {
              ...p,
              isAudioMuted: data.audioMuted,
              isVideoEnabled: data.videoEnabled,
            }
          : p,
      )
      // Check if anything actually changed to prevent unnecessary re-renders
      const hasChanged = updated.some(
        (p, index) =>
          p.userId === data.userId &&
          (p.isAudioMuted !== prev[index]?.isAudioMuted ||
            p.isVideoEnabled !== prev[index]?.isVideoEnabled),
      )
      if (!hasChanged) {
        console.log(
          `[WebSocketEvents] No media state change for user ${data.userId}, skipping update`,
        )
        return prev
      }
      console.log(
        `[WebSocketEvents] Updated media state for user ${data.userId}`,
      )
      return updated
    })
  }, [])

  const handleSpotlightChanged = useCallback((data) => {
    console.log('[WebSocketEvents] Spotlight changed:', data)
    setSpotlightedUserId(data.spotlightedUserId)
  }, [])

  const handleWebRTCOffer = useCallback(
    (data) => {
      console.log('[WebSocketEvents] WebRTC offer received:', data)
      const { offer, fromUserId } = data
      const pc = ensurePeerConnection(fromUserId, false)
      if (!pc) return
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          return pc.createAnswer()
        })
        .then((answer) => {
          return pc.setLocalDescription(answer).then(() => answer)
        })
        .then((answer) => {
          console.log('[WebRTC] Sending answer to', fromUserId)
          meetingWebSocketService.sendWebRTCAnswer(answer, fromUserId)
        })
        .catch((err) => {
          console.error('[WebRTC] Error handling offer:', err)
        })
    },
    [ensurePeerConnection],
  )

  const handleWebRTCAnswer = useCallback((data) => {
    console.log('[WebSocketEvents] WebRTC answer received:', data)
    const { answer, fromUserId } = data
    const pc = peerConnections.current.get(fromUserId)
    if (!pc) {
      console.warn('[WebRTC] Received answer for unknown PC', fromUserId)
      return
    }
    pc.setRemoteDescription(new RTCSessionDescription(answer)).catch((err) =>
      console.error('[WebRTC] Failed to set remote description (answer)', err),
    )
  }, [])

  const handleICECandidate = useCallback((data) => {
    console.log('[WebSocketEvents] ICE candidate received:', data)
    const { candidate, fromUserId } = data
    const pc = peerConnections.current.get(fromUserId)
    if (!pc) {
      console.warn(
        '[WebRTC] No peer connection for ICE candidate sender',
        fromUserId,
      )
      return
    }
    if (candidate) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
        console.error('[WebRTC] Error adding ICE candidate', err),
      )
    }
  }, [])

  const handleWebSocketDisconnected = useCallback((data) => {
    console.log('[WebSocketEvents] WebSocket disconnected:', data)
    setIsWebSocketConnected(false)
    // Note: We don't set isJoined to false here because the user might still be joined on the server
    // even if WebSocket disconnects (e.g., network issues)
  }, [])

  const handleWebSocketConnected = useCallback((data) => {
    console.log('[WebSocketEvents] WebSocket connected:', data)
    setIsWebSocketConnected(true)
  }, [])

  // WebSocket event handlers
  useEffect(() => {
    if (!isJoined) {
      console.log(
        '[WebSocketEvents] Not setting up event handlers because not joined yet. This is normal until you join/start a meeting.',
      )
      return
    }

    console.log(
      '[WebSocketEvents] Setting up event handlers for meeting',
      normalizedMeetingId,
    )

    // Register event listeners
    meetingWebSocketService.on('participant_joined', handleParticipantJoined)
    meetingWebSocketService.on('participant_left', handleParticipantLeft)
    meetingWebSocketService.on('meeting_ended', handleMeetingEnded)
    meetingWebSocketService.on('media_state_changed', handleMediaStateChanged)
    meetingWebSocketService.on('spotlight_changed', handleSpotlightChanged)
    meetingWebSocketService.on('webrtc_offer', handleWebRTCOffer)
    meetingWebSocketService.on('webrtc_answer', handleWebRTCAnswer)
    meetingWebSocketService.on('ice_candidate', handleICECandidate)
    meetingWebSocketService.on('disconnected', handleWebSocketDisconnected)
    meetingWebSocketService.on('connected', handleWebSocketConnected)

    // Cleanup event listeners
    return () => {
      meetingWebSocketService.off('participant_joined', handleParticipantJoined)
      meetingWebSocketService.off('participant_left', handleParticipantLeft)
      meetingWebSocketService.off('meeting_ended', handleMeetingEnded)
      meetingWebSocketService.off(
        'media_state_changed',
        handleMediaStateChanged,
      )
      meetingWebSocketService.off('spotlight_changed', handleSpotlightChanged)
      meetingWebSocketService.off('webrtc_offer', handleWebRTCOffer)
      meetingWebSocketService.off('webrtc_answer', handleWebRTCAnswer)
      meetingWebSocketService.off('ice_candidate', handleICECandidate)
      meetingWebSocketService.off('disconnected', handleWebSocketDisconnected)
      meetingWebSocketService.off('connected', handleWebSocketConnected)
    }
  }, [
    isJoined,
    normalizedMeetingId,
    handleParticipantJoined,
    handleParticipantLeft,
    handleMeetingEnded,
    handleMediaStateChanged,
    handleSpotlightChanged,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleICECandidate,
    handleWebSocketDisconnected,
    handleWebSocketConnected,
  ])

  // Load meeting details on mount
  useEffect(() => {
    if (normalizedMeetingId) {
      loadMeetingDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedMeetingId]) // Remove loadMeetingDetails from dependencies to prevent re-runs when function reference changes

  // If we're marked joined (e.g. server says ALREADY_JOINED on refresh) but have no local stream yet, acquire media
  useEffect(() => {
    if (isJoined && !localStream) {
      console.log(
        '[autoMedia] Joined to meeting but no localStream present. Attempting to acquire user media...',
      )
      getUserMedia()
        .then((stream) => {
          console.log('[autoMedia] Successfully acquired media after join', {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
          })
        })
        .catch((err) => {
          console.error('[autoMedia] Failed to acquire media after join:', err)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, localStream]) // Removed getUserMedia from dependencies to prevent infinite re-renders

  // Device change listener
  useEffect(() => {
    const handler = () => {
      console.log('[devices] devicechange event fired')
      if (isJoined) {
        // Optionally we can refresh devices or attempt recovery if no live track
        if (localStream) {
          const hasLiveVideo = localStream
            .getVideoTracks()
            .some((t) => t.readyState === 'live')
          if (!hasLiveVideo && mediaState.videoEnabled) {
            console.log(
              '[devices] No live video track after devicechange; attempting refreshCamera()',
            )
            navigator.mediaDevices
              .getUserMedia({ video: true, audio: true })
              .then((s) => {
                console.log('[devices] Acquired new stream after devicechange')
                setLocalStream(s)
              })
              .catch((e) => {
                console.error(
                  '[devices] Failed to reacquire after devicechange',
                  e,
                )
              })
          }
        }
      }
    }
    navigator.mediaDevices.addEventListener('devicechange', handler)
    return () =>
      navigator.mediaDevices.removeEventListener('devicechange', handler)
  }, [isJoined, localStream, mediaState.videoEnabled])

  // Early polling after first obtaining a stream to catch silent failures
  useEffect(() => {
    if (!localStream) return
    let cancelled = false
    const start = Date.now()
    const poll = () => {
      if (cancelled) return
      const elapsed = Date.now() - start
      if (elapsed > 8000) return // stop after 8s
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach((t, i) => {
        console.log('[trackPoll]', {
          index: i,
          id: t.id,
          readyState: t.readyState,
          enabled: t.enabled,
          muted: t.muted,
          settings: t.getSettings ? t.getSettings() : undefined,
        })
      })
      setTimeout(poll, 1000)
    }
    setTimeout(poll, 500)
    return () => {
      cancelled = true
    }
  }, [localStream])

  // Recovery: if video should be enabled but we lost all live video tracks, try to reacquire
  // Add timestamp to prevent too frequent re-acquisition
  const lastRecoveryRef = useRef(0)
  useEffect(() => {
    if (!isJoined) return
    if (!mediaState.videoEnabled) return
    if (!localStream) return
    const videoTracks = localStream.getVideoTracks()
    const now = Date.now()
    // Only attempt recovery if it's been at least 10 seconds since last attempt
    if (now - lastRecoveryRef.current < 10000) {
      console.log(
        '[videoRecovery] Skipping recovery - too soon since last attempt',
      )
      return
    }

    if (videoTracks.length === 0) {
      console.warn(
        '[videoRecovery] No video tracks present while enabled; reacquiring...',
      )
      lastRecoveryRef.current = now
      // Use refreshCamera instead of getUserMedia to properly clean up old tracks
      refreshCamera()
        .then((stream) => {
          console.log(
            '[videoRecovery] Re-acquired media stream via refreshCamera',
            {
              audio: stream.getAudioTracks().length,
              video: stream.getVideoTracks().length,
            },
          )
        })
        .catch((err) => {
          console.error('[videoRecovery] Failed to re-acquire media:', err)
        })
      return
    }
    // Don't recover if tracks exist but are not live - they might recover on their own
    console.log(
      '[videoRecovery] Tracks exist but not live - waiting for natural recovery',
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, mediaState.videoEnabled, localStream]) // Removed getUserMedia from dependencies to prevent infinite re-renders

  // Cleanup local media resources on unmount without calling leaveMeeting API
  useEffect(() => {
    const connections = peerConnections.current

    return () => {
      console.log(
        '[cleanup] Component unmounting, cleaning up resources without API call',
      )

      // Only clean up local media resources without making an API call
      if (localStream) {
        console.log(
          `[cleanup] Stopping ${localStream.getTracks().length} local media tracks on unmount`,
        )
        localStream.getTracks().forEach((track) => {
          console.log(`[cleanup] Stopping ${track.kind} track`)
          track.stop()
        })
        // Clear reference so future logic doesn't treat ended stream as usable
        setLocalStream(null)
      } else {
        console.log('[cleanup] No local stream to clean up on unmount')
      }

      // Clean up peer connections
      console.log(
        `[cleanup] Cleaning up ${connections.size} peer connections on unmount`,
      )
      connections.forEach((pc, userId) => {
        console.log(
          `[cleanup] Closing peer connection with ${userId} on unmount`,
        )
        pc.close()
      })

      // Disconnect WebSocket but don't call leaveMeeting API
      if (isWebSocketConnected) {
        console.log('[cleanup] Disconnecting WebSocket on unmount')
        meetingWebSocketService.disconnect()
        // Reset the connection attempt ref on cleanup
        wsConnectionAttemptedRef.current = false
        console.log('[cleanup] WebSocket disconnected on unmount')
      } else {
        console.log(
          '[cleanup] No active WebSocket connection to disconnect on unmount',
        )
      }

      console.log('[cleanup] Cleanup on unmount complete')
    }
  }, [localStream, isWebSocketConnected])

  // Update the refs to break circular dependencies
  useEffect(() => {
    joinMeetingRef.current = joinMeeting
  }, [joinMeeting])

  useEffect(() => {
    getParticipantsRef.current = getParticipants
  }, [getParticipants])

  return useMemo(
    () => ({
      // State
      meetingDetails,
      participants,
      isConnected: isJoined, // Backward compatibility - isConnected now represents joined status
      isLoading,
      error,
      localStream,
      remoteStreams,
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
      getUserMedia,
      getParticipants,
      getMeetingEvents,
      refreshCamera,
    }),
    [
      meetingDetails,
      participants,
      isJoined,
      isLoading,
      error,
      localStream,
      remoteStreams,
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
      getUserMedia,
      getParticipants,
      getMeetingEvents,
      refreshCamera,
    ],
  )
}

export default useMeeting
