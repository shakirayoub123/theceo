import React, { useEffect, useRef, useState, memo } from 'react'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

/**
 * DailyParticipantVideo: Component for rendering Daily.co participant video
 */
export const DailyParticipantVideo = memo(
  ({
    participant,
    callObject,
    isActive = false,
    showControls = true,
    onClick,
    className = '',
  }) => {
    const videoRef = useRef(null)
    const audioRef = useRef(null)
    const [waitingForCallObject, setWaitingForCallObject] =
      useState(!callObject)

    // If callObject wasn't available initially, check for it periodically
    useEffect(() => {
      if (!callObject) {
        console.log(
          '[DailyParticipantVideo] No call object available initially, will wait',
        )
        setWaitingForCallObject(true)

        const checkInterval = setInterval(() => {
          if (callObject) {
            console.log(
              '[DailyParticipantVideo] Call object now available after waiting',
            )
            setWaitingForCallObject(false)
            clearInterval(checkInterval)
          }
        }, 500)

        return () => clearInterval(checkInterval)
      } else {
        setWaitingForCallObject(false)
      }
    }, [callObject])

    useEffect(() => {
      if (!callObject) {
        console.log('[DailyParticipantVideo] No call object available')
        return
      }

      if (!videoRef.current) {
        console.log('[DailyParticipantVideo] No video element ref')
        return
      }

      const videoElement = videoRef.current
      const audioElement = audioRef.current

      // For local participant (participant is null)
      if (!participant) {
        console.log(
          '[DailyParticipantVideo] Setting up local participant video',
        )

        try {
          // Get local participant from Daily to check if we have video
          const localParticipant = callObject.participants()?.local

          console.log(
            '[DailyParticipantVideo] Local participant data:',
            localParticipant,
          )
          console.log(
            '[DailyParticipantVideo] Video track state:',
            localParticipant?.tracks?.video?.state,
            'enabled:',
            localParticipant?.tracks?.video?.enabled,
            'has track:',
            !!localParticipant?.tracks?.video?.persistentTrack,
          )

          // First try Daily's API to set video elements
          callObject.setLocalVideoElement(videoElement)
          console.log(
            '[DailyParticipantVideo] Local video element set with Daily.co method',
          )

          // If the video isn't showing, try direct attachment as fallback
          const checkVideoShowing = () => {
            // If we have a track but no video is showing, try manual attachment
            if (
              localParticipant?.tracks?.video?.persistentTrack &&
              !videoElement.srcObject
            ) {
              try {
                videoElement.srcObject = new MediaStream([
                  localParticipant.tracks.video.persistentTrack,
                ])
                console.log(
                  '[DailyParticipantVideo] Local video track manually attached as fallback',
                )
              } catch (e) {
                console.error(
                  '[DailyParticipantVideo] Error attaching video track:',
                  e,
                )
              }
            }
          }

          // Try fallback after a short delay
          setTimeout(checkVideoShowing, 1000)
        } catch (e) {
          console.error(
            '[DailyParticipantVideo] Error setting up local video:',
            e,
          )
        }

        // Local audio should be muted to prevent feedback
        if (audioElement) {
          audioElement.muted = true
          callObject.setLocalAudioElement(audioElement)
          console.log('[DailyParticipantVideo] Local audio element set (muted)')
        }

        return () => {
          console.log('[DailyParticipantVideo] Cleaning up local video element')
          if (callObject) {
            callObject.setLocalVideoElement(null)
            if (audioElement) {
              callObject.setLocalAudioElement(null)
            }
            if (videoElement) {
              videoElement.srcObject = null
            }
          }
        }
      }

      // For remote participants
      const sessionId = participant.sessionId || participant.userId
      if (!sessionId) {
        console.warn(
          '[DailyParticipantVideo] No sessionId for participant:',
          participant,
        )
        return
      }

      console.log(
        '[DailyParticipantVideo] Setting up remote participant video for:',
        sessionId,
      )

      try {
        // Get participant from Daily to check if we have video
        const participants = callObject.participants()
        const dailyParticipant = participants[sessionId]

        console.log(
          '[DailyParticipantVideo] Remote participant data:',
          dailyParticipant,
        )
        if (dailyParticipant?.tracks?.video) {
          console.log(
            '[DailyParticipantVideo] Remote video track state:',
            dailyParticipant.tracks.video.state,
            'enabled:',
            dailyParticipant.tracks.video.enabled,
            'has track:',
            !!dailyParticipant.tracks.video.persistentTrack,
          )
        }

        // First try Daily's API to set video elements
        callObject.setVideoElement(sessionId, videoElement)
        console.log(
          '[DailyParticipantVideo] Remote video element set for:',
          sessionId,
        )

        // If the video isn't showing, try direct attachment as fallback
        const checkVideoShowing = () => {
          // If we have a track but no video is showing, try manual attachment
          if (
            dailyParticipant?.tracks?.video?.persistentTrack &&
            !videoElement.srcObject
          ) {
            try {
              videoElement.srcObject = new MediaStream([
                dailyParticipant.tracks.video.persistentTrack,
              ])
              console.log(
                '[DailyParticipantVideo] Remote video track manually attached as fallback',
              )
            } catch (e) {
              console.error(
                '[DailyParticipantVideo] Error attaching remote video track:',
                e,
              )
            }
          }
        }

        // Try fallback after a short delay
        setTimeout(checkVideoShowing, 1000)
      } catch (e) {
        console.error(
          '[DailyParticipantVideo] Error setting up remote video:',
          e,
        )
      }

      if (audioElement) {
        callObject.setAudioElement(sessionId, audioElement)
        console.log(
          '[DailyParticipantVideo] Remote audio element set for:',
          sessionId,
        )
      }

      return () => {
        console.log(
          '[DailyParticipantVideo] Cleaning up remote video element for:',
          sessionId,
        )
        if (callObject) {
          callObject.setVideoElement(sessionId, null)
          if (audioElement) {
            callObject.setAudioElement(sessionId, null)
          }
          if (videoElement) {
            videoElement.srcObject = null
          }
        }
      }
    }, [participant, callObject])

    const displayName = participant
      ? participant.displayName || participant.name || 'Anonymous'
      : 'You'
    const isAudioMuted = participant ? participant.isAudioMuted : false
    const isVideoEnabled = participant ? participant.isVideoEnabled : true

    // Display waiting state if we're still waiting for call object
    const isWaiting = waitingForCallObject || !callObject

    return (
      <div
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${isActive ? 'w-full h-full' : 'aspect-video'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        {isWaiting && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-800 z-10'>
            <div className='text-center text-white'>
              <div className='animate-spin rounded-full h-10 w-10 border-2 border-b-transparent border-white mx-auto mb-3'></div>
              <p className='text-sm'>Connecting to call...</p>
            </div>
          </div>
        )}
        {/* Video element */}
        <video
          ref={videoRef}
          className='w-full h-full object-cover'
          playsInline
          autoPlay
          muted={participant === null}
          disablePictureInPicture
          disableRemotePlayback
          onPlay={() =>
            console.log(
              '[DailyParticipantVideo] Video playback started',
              participant ? 'for remote' : 'for local',
            )
          }
          onLoadedMetadata={() =>
            console.log(
              '[DailyParticipantVideo] Video metadata loaded',
              participant ? 'for remote' : 'for local',
            )
          }
        />

        {/* Hidden audio element for remote participants */}
        {participant && <audio ref={audioRef} autoPlay playsInline />}

        {/* No video placeholder */}
        {!isVideoEnabled && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-800'>
            <div className='text-center text-white'>
              <VideoOff className='w-12 h-12 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>Camera off</p>
            </div>
          </div>
        )}

        {/* Participant info overlay */}
        {showControls && (
          <div className='absolute bottom-2 left-2 right-2 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {/* Audio status */}
              {isAudioMuted ? (
                <MicOff className='w-4 h-4 text-red-500 bg-black/50 rounded-full p-1' />
              ) : (
                <Mic className='w-4 h-4 text-green-500 bg-black/50 rounded-full p-1' />
              )}

              {/* Name */}
              <span className='text-white text-sm bg-black/50 px-2 py-1 rounded'>
                {displayName}
              </span>
            </div>

            {/* Video status */}
            {!isVideoEnabled && (
              <VideoOff className='w-4 h-4 text-red-500 bg-black/50 rounded-full p-1' />
            )}
          </div>
        )}

        {/* Click to spotlight hint */}
        {onClick && !isActive && (
          <div className='absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100'>
            <span className='text-white text-sm bg-black/50 px-3 py-1 rounded'>
              Click to spotlight
            </span>
          </div>
        )}
      </div>
    )
  },
)

DailyParticipantVideo.displayName = 'DailyParticipantVideo'

export default DailyParticipantVideo
