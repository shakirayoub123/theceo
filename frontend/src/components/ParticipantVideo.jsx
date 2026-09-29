import React, { memo } from 'react'
import { Mic, MicOff } from 'lucide-react'

// Memoized participant video component to prevent unnecessary re-renders
const ParticipantVideo = memo(
  ({ participant, isSpotlighted, remoteStream, onSpotlight }) => {
    return (
      <div
        className={`relative h-44 w-full overflow-hidden rounded-3xl ${
          isSpotlighted ? 'ring-2 ring-yellow-400' : 'ring-1 ring-black/10'
        } shadow cursor-pointer`}
        onClick={onSpotlight}
      >
        {remoteStream ? (
          <video
            className='h-full w-full object-cover'
            playsInline
            autoPlay
            ref={(el) => {
              if (el && el.srcObject !== remoteStream) {
                el.srcObject = remoteStream
              }
            }}
          />
        ) : (
          <div className='bg-gray-200 h-full w-full flex items-center justify-center'>
            <div className='text-gray-500 font-bold'>
              {participant.displayName?.charAt(0) || 'P'}
            </div>
          </div>
        )}

        {/* bottom controls bar */}
        <div className='absolute bottom-3 left-3 right-3 flex items-center gap-2'>
          {/* mic button */}
          <button
            type='button'
            disabled={true} // participants can't control others' audio
            aria-label={
              participant.isAudioMuted
                ? 'Microphone muted'
                : 'Microphone active'
            }
            className={`rounded-lg border bg-white/90 p-2 shadow transition ${
              participant.isAudioMuted
                ? 'border-red-500 text-red-600'
                : 'border-[#3B82F6] text-[#3B82F6]'
            }`}
          >
            {participant.isAudioMuted ? (
              <MicOff className='h-3 w-3' />
            ) : (
              <Mic className='h-3 w-3' />
            )}
          </button>

          {/* name pill (flex-grow takes remaining space) */}
          <div className='flex-grow font-exo rounded-lg bg-[#2C2C2C]/50 border border-[#8B8B8B] px-2 py-1 text-xs text-white shadow text-center truncate'>
            {participant.displayName || `User ${participant.userId.slice(-4)}`}
          </div>
        </div>
      </div>
    )
  },
)

ParticipantVideo.displayName = 'ParticipantVideo'

export default ParticipantVideo
