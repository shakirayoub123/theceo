// Example usage in a React component
// src/components/MeetingExample.jsx
import React, { useState } from 'react'
import useMeeting from '../hooks/useMeeting'

const MeetingExample = ({ meetingId }) => {
  const currentUserId = '456' // Example user ID - in real app, get from auth context
  const [isJoined, setIsJoined] = useState(false)

  const {
    meetingDetails,
    participants,
    isConnected,
    isLoading,
    error,
    localStream,
    remoteStreams,
    spotlightedUserId,
    mediaState,
    initiateMeeting,
    joinMeeting,
    leaveMeeting,
    closeMeeting,
    toggleAudio,
    toggleVideo,
    setSpotlight,
    clearError,
  } = useMeeting(meetingId)

  // Example: Handle initiate meeting
  const handleInitiateMeeting = async () => {
    try {
      await initiateMeeting(currentUserId)
      setIsJoined(true)
      console.log('Meeting initiated successfully!')
    } catch (error) {
      console.error('Failed to initiate meeting:', error)
    }
  }

  // Example: Handle join meeting
  const handleJoinMeeting = async () => {
    try {
      await joinMeeting(currentUserId, {
        audioEnabled: true,
        videoEnabled: true,
      })
      setIsJoined(true)
      console.log('Joined meeting successfully!')
    } catch (error) {
      console.error('Failed to join meeting:', error)
    }
  }

  // Example: Handle leave meeting
  const handleLeaveMeeting = async () => {
    try {
      await leaveMeeting(currentUserId)
      setIsJoined(false)
      console.log('Left meeting successfully!')
    } catch (error) {
      console.error('Failed to leave meeting:', error)
    }
  }

  // Example: Handle close meeting
  const handleCloseMeeting = async () => {
    try {
      await closeMeeting(currentUserId, 'Meeting completed by host')
      setIsJoined(false)
      console.log('Meeting closed successfully!')
    } catch (error) {
      console.error('Failed to close meeting:', error)
    }
  }

  // Check if current user can initiate (based on API specification)
  const canInitiate =
    meetingDetails?.canInitiate &&
    meetingDetails?.participants?.some(
      (p) => p.userId === currentUserId && p.role === 'trainer',
    )

  // Check if meeting is active for joining
  const canJoin =
    meetingDetails?.status === 'active' ||
    meetingDetails?.status === 'scheduled'

  if (isLoading) {
    return <div className='p-4'>Loading meeting details...</div>
  }

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <h1 className='text-2xl font-bold mb-6'>
        Meeting: {meetingDetails?.title || meetingId}
      </h1>

      {/* Error Display */}
      {error && (
        <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          <div className='flex justify-between items-center'>
            <span>{error}</span>
            <button
              onClick={clearError}
              className='text-red-500 hover:text-red-700'
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Meeting Details */}
      {meetingDetails && (
        <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
          <h2 className='text-lg font-semibold mb-2'>Meeting Details</h2>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <strong>Program:</strong> {meetingDetails.programTitle}
            </div>
            <div>
              <strong>Session:</strong> {meetingDetails.sessionNumber}
            </div>
            <div>
              <strong>Status:</strong>
              <span
                className={`ml-1 px-2 py-1 rounded text-xs ${
                  meetingDetails.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : meetingDetails.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {meetingDetails.status}
              </span>
            </div>
            <div>
              <strong>Start Time:</strong>{' '}
              {new Date(meetingDetails.scheduledStartTime).toLocaleString()}
            </div>
            <div>
              <strong>End Time:</strong>{' '}
              {new Date(meetingDetails.scheduledEndTime).toLocaleString()}
            </div>
            <div>
              <strong>Minutes Until Start:</strong>{' '}
              {meetingDetails.minutesUntilStart}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className='mb-6'>
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Meeting Controls */}
      <div className='mb-6'>
        <h2 className='text-lg font-semibold mb-4'>Meeting Controls</h2>
        <div className='flex flex-wrap gap-3'>
          {/* Initiate Meeting Button */}
          {!isJoined && canInitiate && (
            <button
              onClick={handleInitiateMeeting}
              disabled={isLoading}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
            >
              Initiate Meeting
            </button>
          )}

          {/* Join Meeting Button */}
          {!isJoined && canJoin && !canInitiate && (
            <button
              onClick={handleJoinMeeting}
              disabled={isLoading}
              className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
            >
              Join Meeting
            </button>
          )}

          {/* Leave Meeting Button */}
          {isJoined && (
            <button
              onClick={handleLeaveMeeting}
              disabled={isLoading}
              className='px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50'
            >
              Leave Meeting
            </button>
          )}

          {/* Close Meeting Button (only for trainers) */}
          {isJoined && canInitiate && (
            <button
              onClick={handleCloseMeeting}
              disabled={isLoading}
              className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50'
            >
              Close Meeting
            </button>
          )}
        </div>
      </div>

      {/* Media Controls */}
      {isJoined && (
        <div className='mb-6'>
          <h2 className='text-lg font-semibold mb-4'>Media Controls</h2>
          <div className='flex gap-3'>
            <button
              onClick={toggleAudio}
              className={`px-4 py-2 rounded ${
                mediaState.audioMuted
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {mediaState.audioMuted ? 'Unmute' : 'Mute'}
            </button>

            <button
              onClick={toggleVideo}
              className={`px-4 py-2 rounded ${
                !mediaState.videoEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {mediaState.videoEnabled ? 'Turn Off Video' : 'Turn On Video'}
            </button>
          </div>
        </div>
      )}

      {/* Participants List */}
      {participants.length > 0 && (
        <div className='mb-6'>
          <h2 className='text-lg font-semibold mb-4'>
            Participants ({participants.length})
          </h2>
          <div className='space-y-2'>
            {participants.map((participant) => (
              <div
                key={participant.userId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  participant.userId === spotlightedUserId
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    {participant.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className='w-8 h-8 rounded-full'
                      />
                    ) : (
                      <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs'>
                        {participant.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className='ml-3'>
                    <div className='flex items-center'>
                      <span className='font-medium'>{participant.name}</span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          participant.role === 'trainer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {participant.role}
                      </span>
                      {participant.userId === spotlightedUserId && (
                        <span className='ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded'>
                          Spotlighted
                        </span>
                      )}
                    </div>
                    <div className='text-sm text-gray-600 flex items-center mt-1'>
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          participant.isAudioMuted
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                      ></span>
                      {participant.isAudioMuted ? 'Muted' : 'Audio On'}

                      <span
                        className={`w-2 h-2 rounded-full mr-2 ml-4 ${
                          participant.isVideoEnabled
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      ></span>
                      {participant.isVideoEnabled ? 'Video On' : 'Video Off'}
                    </div>
                  </div>
                </div>

                {/* Spotlight Controls */}
                {isJoined && participant.userId !== spotlightedUserId && (
                  <button
                    onClick={() => setSpotlight(participant.userId)}
                    className='px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700'
                  >
                    Spotlight
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Streams */}
      {isJoined && (
        <div className='mb-6'>
          <h2 className='text-lg font-semibold mb-4'>Video Streams</h2>

          {/* Local Stream */}
          {localStream && (
            <div className='mb-4'>
              <h3 className='text-md font-medium mb-2'>Your Video</h3>
              <video
                ref={(video) => {
                  if (video && localStream) {
                    video.srcObject = localStream
                  }
                }}
                autoPlay
                muted
                playsInline
                className='w-64 h-48 bg-gray-200 rounded-lg border'
              />
            </div>
          )}

          {/* Remote Streams */}
          {remoteStreams.size > 0 && (
            <div>
              <h3 className='text-md font-medium mb-2'>Participant Videos</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
                  const participant = participants.find(
                    (p) => p.userId === userId,
                  )
                  return (
                    <div key={userId} className='relative'>
                      <video
                        ref={(video) => {
                          if (video && stream) {
                            video.srcObject = stream
                          }
                        }}
                        autoPlay
                        playsInline
                        className={`w-full h-48 bg-gray-200 rounded-lg border ${
                          userId === spotlightedUserId
                            ? 'border-4 border-yellow-400'
                            : ''
                        }`}
                      />
                      <div className='absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm'>
                        {participant?.name || userId}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      <details className='mt-8'>
        <summary className='cursor-pointer text-sm text-gray-600 hover:text-gray-800'>
          Debug Information
        </summary>
        <pre className='mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto'>
          {JSON.stringify(
            {
              meetingId,
              currentUserId,
              isJoined,
              isConnected,
              meetingDetails,
              participants,
              mediaState,
              spotlightedUserId,
              remoteStreamsCount: remoteStreams.size,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  )
}

export default MeetingExample
