import React from 'react'
import { DailyVideo } from '@daily-co/daily-react'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

const DailyVideoComponent = ({
  sessionId,
  isLocal = false,
  isActive = false,
  showControls = true,
  participant,
  onClick,
  className = '',
}) => {
  // For local participants, use sessionId = false
  const videoSessionId = isLocal ? false : sessionId

  // Get display name and media state from participant object if available
  const displayName =
    participant?.user_name || (isLocal ? 'You' : 'Participant')
  const isAudioMuted = participant?.audio ? !participant.audio : false
  const isVideoEnabled = participant?.video ? participant.video : true

  return (
    <div
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${
        isActive ? 'w-full h-full' : 'aspect-video'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Daily Video Element */}
      <DailyVideo
        automirror={isLocal}
        sessionId={videoSessionId}
        type={isActive ? 'main' : 'thumbnail'}
        className='w-full h-full object-cover'
      />

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
}

export default DailyVideoComponent
