import React, { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { CardContent, CardHeader, CardTitle, Card } from '@/components/ui/card'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Search,
  MoreVertical,
  Maximize,
  UserPlus,
  PhoneOff,
} from 'lucide-react'
import { Button } from './ui/button'
import { useMeetingContext } from '@/contexts/useMeetingContext'
import {
  DailyVideo,
  useDaily,
  useDailyEvent,
  useLocalSessionId,
} from '@daily-co/daily-react'

// Using memo to prevent unnecessary re-renders
export const LiveVideo = memo(({ isCoachView = false }) => {
  const [activeParticipant, setActiveParticipant] = useState(null)

  // Get Daily call object and participants
  const callObject = useDaily()
  const localSessionId = useLocalSessionId()
  const [dailyParticipants, setDailyParticipants] = useState(new Map())
  const [activeSessionId, setActiveSessionId] = useState(null)

  // Track joined participants from Daily events
  useDailyEvent(
    'participant-joined',
    useCallback(
      (event) => {
        const p = event.participant
        console.log('[Daily] Participant joined (raw):', p)

        // Normalize the participant shape we store in local state so
        // the rest of this component can rely on consistent property names.
        const participant = {
          sessionId: p.session_id || p.sessionId,
          userId: p.user_id || p.userId || String(p.session_id || p.sessionId),
          userName:
            p.user_name || p.userName || p.user_id || p.userId || 'Participant',
          local: !!p.local,
          audio: p.audio,
          video: p.video,
          tracks: p.tracks,
          raw: p,
        }

        setDailyParticipants((current) => {
          const updated = new Map(current)
          updated.set(participant.sessionId, participant)
          return updated
        })

        // If this is the first remote participant, make them active
        if (!participant.local && !activeSessionId) {
          setActiveSessionId(participant.sessionId)
        }
      },
      [activeSessionId],
    ),
  )

  useDailyEvent(
    'participant-left',
    useCallback(
      (event) => {
        const p = event.participant
        console.log('[Daily] Participant left (raw):', p)

        const sessionId = p.session_id || p.sessionId

        setDailyParticipants((current) => {
          const updated = new Map(current)
          updated.delete(sessionId)
          return updated
        })

        // If the active participant left, select another remote participant
        if (activeSessionId === sessionId) {
          const remainingParticipants = Array.from(
            dailyParticipants.values(),
          ).filter(
            (existing) => !existing.local && existing.sessionId !== sessionId,
          )

          setActiveSessionId(
            remainingParticipants.length > 0
              ? remainingParticipants[0].sessionId
              : null,
          )
        }
      },
      [activeSessionId, dailyParticipants],
    ),
  )

  // Update participant when their state changes (audio/video/etc)
  useDailyEvent(
    'participant-updated',
    useCallback((event) => {
      const p = event.participant

      const participant = {
        sessionId: p.session_id || p.sessionId,
        userId: p.user_id || p.userId || String(p.session_id || p.sessionId),
        userName:
          p.user_name || p.userName || p.user_id || p.userId || 'Participant',
        local: !!p.local,
        audio: p.audio,
        video: p.video,
        tracks: p.tracks,
        raw: p,
      }

      setDailyParticipants((current) => {
        const updated = new Map(current)
        updated.set(participant.sessionId, participant)
        return updated
      })
    }, []),
  )

  // Get meeting context data for things not directly handled by Daily
  const {
    meetingDetails,
    isConnected,
    isLoading,
    error,
    mediaState,
    initiateMeeting,
    joinMeeting,
    leaveMeeting,
    closeMeeting,
    toggleAudio,
    toggleVideo,
    _setSpotlight,
    getParticipants,
  } = useMeetingContext()

  // Convert Daily participants to an array for rendering
  const participants = useMemo(
    () => Array.from(dailyParticipants.values()),
    [dailyParticipants],
  )

  // Get the spotlighted user ID if available
  const spotlightedUserId = useMemo(() => {
    // If we have an active session ID, find the user ID for that participant
    if (activeSessionId) {
      const participant = dailyParticipants.get(activeSessionId)
      return participant?.userId
    }
    return null
  }, [activeSessionId, dailyParticipants])

  useEffect(() => {
    // Log whenever callObject changes
    if (callObject) {
      console.log('[LiveVideo] callObject is available:', callObject)
    } else {
      console.log('[LiveVideo] callObject is not available')
    }
  }, [callObject])

  useEffect(() => {
    // Log connection status changes
    console.log('[LiveVideo] Connection status changed:', {
      isConnected,
      hasCallObject: !!callObject,
      participantsCount: participants.length,
    })
  }, [isConnected, callObject, participants.length])

  // Update active participant when spotlight or participants change (without self-loop)
  useEffect(() => {
    // Filter out self from participants list
    const otherParticipants = participants.filter((p) => !p.local)

    console.log('[LiveVideo] Participants update:', {
      total: participants.length,
      others: otherParticipants.length,
      spotlighted: spotlightedUserId,
      self: participants.find((p) => p.local),
    })

    if (spotlightedUserId) {
      const sp = participants.find((p) => p.userId === spotlightedUserId)
      if (sp && activeParticipant?.userId !== sp.userId) {
        console.log(
          '[LiveVideo] Setting spotlighted participant as active:',
          sp.userId,
        )
        setActiveParticipant(sp)
      }
      return
    }

    // If there are other participants, set the first one as active
    if (otherParticipants.length > 0) {
      const first = otherParticipants[0]
      if (activeParticipant?.userId !== first.userId) {
        console.log(
          '[LiveVideo] Setting first other participant as active:',
          first.userId,
        )
        setActiveParticipant(first)
      }
    } else if (activeParticipant) {
      console.log(
        '[LiveVideo] No other participants, clearing active participant',
      )
      setActiveParticipant(null)
    }
    // intentionally NOT depending on activeParticipant to avoid loops; guarded by userId checks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlightedUserId, participants])

  // Refresh participants periodically
  useEffect(() => {
    if (!isConnected) return
    const interval = setInterval(() => {
      getParticipants().catch((err) =>
        console.error('Error refreshing participants:', err),
      )
    }, 60000) // 60s to reduce churn
    return () => clearInterval(interval)
  }, [isConnected, getParticipants])

  // Stable handlers
  const handleToggleAudio = useCallback(() => {
    toggleAudio().catch((err) => console.error('Error toggling audio:', err))
  }, [toggleAudio])

  const handleToggleVideo = useCallback(() => {
    toggleVideo().catch((err) => console.error('Error toggling video:', err))
  }, [toggleVideo])

  const handleLeaveCall = useCallback(async () => {
    try {
      if (isCoachView) {
        await closeMeeting('Meeting ended by host')
      }
      await leaveMeeting()
    } catch (err) {
      console.error('Error leaving call:', err)
    }
  }, [isCoachView, closeMeeting, leaveMeeting])

  // No need for this function anymore as we're using setActiveSessionId directly
  // in the onClick handler for participant videos

  return React.createElement(
    Card,
    { className: 'border-0 p-0' },
    React.createElement(
      CardHeader,
      { className: 'pb-2 p-0' },
      React.createElement(
        CardTitle,
        {
          className:
            'text-xl font-semibold uppercase text-gray-900 mb-4 tracking-wide',
        },
        'LIVE VIDEO MEETING',
      ),
      error &&
        React.createElement(
          'div',
          {
            className:
              'mb-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800',
          },
          `Error: ${error}`,
        ),
      meetingDetails?.fallbackNotice &&
        React.createElement(
          'div',
          {
            className:
              'mb-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800',
          },
          meetingDetails.fallbackNotice,
        ),
    ),
    React.createElement(
      CardContent,
      { className: 'space-y-4 p-0' },
      // Main video surface
      React.createElement(
        'div',
        {
          className: 'relative aspect-video w-full overflow-hidden rounded-3xl',
        },
        isLoading
          ? React.createElement(
              'div',
              {
                className:
                  'flex h-full w-full items-center justify-center bg-gray-100',
              },
              React.createElement('div', {
                className:
                  'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500',
              }),
            )
          : isConnected
            ? React.createElement(
                'div',
                { className: 'relative w-full h-full' },
                // Main video - either active participant or local video when alone
                callObject &&
                  React.createElement(
                    React.Fragment,
                    null,
                    participants.filter((p) => !p.local).length > 0 &&
                      activeSessionId
                      ? React.createElement(
                          'div',
                          { className: 'w-full h-full' },
                          React.createElement(DailyVideo, {
                            sessionId: activeSessionId,
                            className: 'w-full h-full object-cover',
                            key: `active-${activeSessionId || 'unknown'}`,
                          }),
                        )
                      : React.createElement(
                          'div',
                          { className: 'w-full h-full' },
                          React.createElement(DailyVideo, {
                            sessionId: localSessionId,
                            className: 'w-full h-full object-cover',
                            key: 'local-main',
                          }),
                        ),
                  ),

                // Picture-in-picture only shown when there are other non-self participants
                callObject &&
                  participants.filter((p) => !p.local).length > 0 &&
                  React.createElement(
                    'div',
                    {
                      className:
                        'absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg',
                      key: 'pip-container',
                    },
                    React.createElement(DailyVideo, {
                      sessionId: localSessionId, // Local participant for PIP
                      className: 'w-full h-full object-cover',
                      key: 'pip-video',
                    }),
                  ),
              )
            : React.createElement(
                'div',
                {
                  className:
                    'flex h-full w-full flex-col items-center justify-center bg-gray-100',
                },
                React.createElement('img', {
                  src: '/images/speaker.png',
                  alt: 'Video placeholder',
                  className: 'object-cover w-full h-full opacity-30',
                }),
                React.createElement(
                  'div',
                  {
                    className:
                      'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center',
                  },
                  React.createElement(
                    'h3',
                    { className: 'text-xl font-bold' },
                    `Meeting ${meetingDetails?.status || 'Loading...'}`,
                  ),
                  React.createElement(
                    'div',
                    { className: 'mb-2' },
                    meetingDetails?.status === 'active'
                      ? React.createElement(
                          'span',
                          {
                            className:
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
                          },
                          React.createElement('span', {
                            className: 'w-2 h-2 mr-1 bg-green-600 rounded-full',
                          }),
                          'Meeting Active',
                        )
                      : meetingDetails?.status === 'scheduled'
                        ? React.createElement(
                            'span',
                            {
                              className:
                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
                            },
                            React.createElement('span', {
                              className:
                                'w-2 h-2 mr-1 bg-yellow-600 rounded-full',
                            }),
                            'Scheduled',
                          )
                        : meetingDetails?.status === 'ended'
                          ? React.createElement(
                              'span',
                              {
                                className:
                                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
                              },
                              React.createElement('span', {
                                className:
                                  'w-2 h-2 mr-1 bg-gray-600 rounded-full',
                              }),
                              'Ended',
                            )
                          : React.createElement(
                              'span',
                              {
                                className:
                                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
                              },
                              React.createElement('span', {
                                className:
                                  'w-2 h-2 mr-1 bg-blue-600 rounded-full',
                              }),
                              'Ready',
                            ),
                  ),
                  React.createElement(
                    'p',
                    { className: 'text-sm text-gray-500 mb-4' },
                    isCoachView
                      ? 'You can join or manage this meeting as a host'
                      : meetingDetails?.status === 'active'
                        ? 'Meeting is ready. Click "Join Meeting" to enter.'
                        : meetingDetails?.status === 'scheduled'
                          ? "Meeting is scheduled but hasn't started yet."
                          : meetingDetails?.status === 'ended'
                            ? 'This meeting has ended.'
                            : 'Waiting for host to start the meeting',
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex flex-col items-center gap-2' },
                    React.createElement(
                      'div',
                      { className: 'flex flex-row gap-4 justify-center' },
                      isCoachView
                        ? React.createElement(
                            Button,
                            {
                              onClick: () => {
                                if (meetingDetails?.status === 'active') {
                                  joinMeeting({
                                    audioEnabled: true,
                                    videoEnabled: true,
                                  }).catch((e) =>
                                    console.error(
                                      'Error joining meeting as coach:',
                                      e,
                                    ),
                                  )
                                } else if (meetingDetails?.status !== 'ended') {
                                  initiateMeeting({
                                    audioEnabled: true,
                                    videoEnabled: true,
                                  }).catch((e) =>
                                    console.error(
                                      'Error initiating meeting:',
                                      e,
                                    ),
                                  )
                                }
                              },
                              className:
                                'bg-green-500 hover:bg-green-600 text-white',
                              disabled: meetingDetails?.status === 'ended',
                            },
                            meetingDetails?.status === 'active'
                              ? 'Join Meeting'
                              : 'Start Meeting',
                          )
                        : React.createElement(
                            Button,
                            {
                              onClick: () => {
                                joinMeeting({
                                  audioEnabled: true,
                                  videoEnabled: true,
                                })
                              },
                              className:
                                'bg-blue-500 hover:bg-blue-600 text-white',
                              disabled: meetingDetails?.status !== 'active',
                            },
                            'Join Meeting',
                          ),
                    ),
                    meetingDetails?.startTime &&
                      React.createElement(
                        'div',
                        { className: 'text-xs text-gray-500' },
                        `${meetingDetails.status === 'scheduled' ? 'Scheduled for: ' : 'Started at: '}${new Date(meetingDetails.startTime).toLocaleString()}`,
                      ),
                  ),
                ),
              ),
        // bottom-left: mic chip + name
        React.createElement(
          'div',
          {
            className:
              'absolute left-3 bottom-3 flex items-center gap-2 font-exo',
          },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: handleToggleAudio,
              disabled: !isConnected,
              'aria-label': mediaState.audioMuted
                ? 'Unmute microphone'
                : 'Mute microphone',
              className: `rounded-lg border bg-white/90 p-3 shadow transition ${mediaState.audioMuted ? 'border-red-500 text-red-600' : 'border-[#3B82F6] text-[#3B82F6]'}`,
            },
            mediaState.audioMuted
              ? React.createElement(MicOff, { className: 'h-4 w-4' })
              : React.createElement(Mic, { className: 'h-4 w-4' }),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: handleToggleVideo,
              disabled: !isConnected,
              'aria-label': mediaState.videoEnabled
                ? 'Turn off camera'
                : 'Turn on camera',
              className: `rounded-lg border bg-white/90 p-3 shadow transition ${!mediaState.videoEnabled ? 'border-red-500 text-red-600' : 'border-[#3B82F6] text-[#3B82F6]'}`,
            },
            mediaState.videoEnabled
              ? React.createElement(Video, { className: 'h-4 w-4' })
              : React.createElement(VideoOff, { className: 'h-4 w-4' }),
          ),
          React.createElement(
            'span',
            {
              className:
                'rounded-lg bg-[#2C2C2C]/50 border border-[#8B8B8B] px-3 py-2 text-sm text-white shadow',
            },
            isCoachView ? 'Coach' : 'You',
          ),
        ),
        // bottom-right: quick controls
        React.createElement(
          'div',
          { className: 'absolute right-3 bottom-3 flex items-center gap-2' },
          isCoachView &&
            React.createElement(
              'button',
              {
                type: 'button',
                className:
                  'rounded-lg bg-[#3B82F6] p-3 text-white hover:bg-[#2563EB]',
                'aria-label': 'Add participant',
              },
              React.createElement(UserPlus, { className: 'h-4 w-4' }),
            ),
          React.createElement(
            'button',
            {
              type: 'button',
              className:
                'rounded-lg bg-red-500 p-3 text-white hover:bg-red-600',
              'aria-label': 'Leave call',
              onClick: handleLeaveCall,
            },
            React.createElement(PhoneOff, { className: 'h-4 w-4' }),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className:
                'rounded-lg bg-[#2C2C2C]/50 border border-[#8B8B8B] p-3 text-white backdrop-blur hover:bg-[#2C2C2C]/60',
              'aria-label': 'Search',
            },
            React.createElement(Search, { className: 'h-4 w-4' }),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className:
                'rounded-lg bg-[#2C2C2C]/50 border border-[#8B8B8B] p-3 text-white backdrop-blur hover:bg-[#2C2C2C]/60',
              'aria-label': 'Maximize',
            },
            React.createElement(Maximize, { className: 'h-4 w-4' }),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className:
                'rounded-lg bg-[#2C2C2C]/50 border border-[#8B8B8B] p-3 text-white backdrop-blur hover:bg-[#2C2C2C]/60',
              'aria-label': 'More options',
            },
            React.createElement(MoreVertical, { className: 'h-4 w-4' }),
          ),
        ),
      ),
      // Participants row - memoized items and stable handlers
      participants.length > 1 &&
        React.createElement(
          'div',
          {
            className:
              'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
          },
          participants
            .filter(
              (participant) =>
                participant.session_id !== activeSessionId &&
                !participant.local,
            )
            .map((participant) =>
              React.createElement(
                'div',
                {
                  key: participant.session_id,
                  className:
                    'relative bg-gray-900 rounded-lg overflow-hidden aspect-video cursor-pointer',
                  onClick: () => setActiveSessionId(participant.session_id),
                },
                React.createElement(DailyVideo, {
                  sessionId: participant.session_id,
                  className: 'w-full h-full object-cover',
                }),
                // Overlay with participant info
                React.createElement(
                  'div',
                  {
                    className:
                      'absolute bottom-2 left-2 right-2 flex items-center justify-between',
                  },
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-2' },
                    !participant.audio
                      ? React.createElement(MicOff, {
                          className:
                            'w-4 h-4 text-red-500 bg-black/50 rounded-full p-1',
                        })
                      : React.createElement(Mic, {
                          className:
                            'w-4 h-4 text-green-500 bg-black/50 rounded-full p-1',
                        }),
                    React.createElement(
                      'span',
                      {
                        className:
                          'text-white text-sm bg-black/50 px-2 py-1 rounded',
                      },
                      participant.user_name || 'Participant',
                    ),
                  ),
                  !participant.video &&
                    React.createElement(VideoOff, {
                      className:
                        'w-4 h-4 text-red-500 bg-black/50 rounded-full p-1',
                    }),
                ),
                // Click to spotlight hint
                React.createElement(
                  'div',
                  {
                    className:
                      'absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100',
                  },
                  React.createElement(
                    'span',
                    {
                      className:
                        'text-white text-sm bg-black/50 px-3 py-1 rounded',
                    },
                    'Click to spotlight',
                  ),
                ),
              ),
            ),
        ),
    ),
  )
})

LiveVideo.displayName = 'LiveVideo'

export default LiveVideo
