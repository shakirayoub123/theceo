import { ClientDetails } from '@/components/Details'
import { LiveTranscript } from '@/components/LiveTranscript'
import DailyMeetingRoom from '@/components/DailyMeetingRoom'
import { PrivateNotes } from '@/components/PrivateNotes'
import { MeetingProvider } from '@/contexts/MeetingProvider'
import { useMeetingContext } from '@/contexts/useMeetingContext'
import trainerAPIService from '@/services/trainerAPIService'
import { formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const CoachingMeeting = () => {
  const { meetingId } = useParams()

  return (
    <MeetingProvider meetingId={meetingId} role='trainer'>
      <CoachingMeetingContent meetingId={meetingId} />
    </MeetingProvider>
  )
}

// Separate the content to use the context
const CoachingMeetingContent = ({ meetingId }) => {
  const {
    meetingDetails,
    isLoading: meetingLoading,
    error: meetingError,
    loadMeetingDetails,
  } = useMeetingContext()

  const [roomUrl, setRoomUrl] = useState(null)
  const [token, setToken] = useState(null)
  const [roomUrlError, setRoomUrlError] = useState(null)
  const [diagnosticInfo, setDiagnosticInfo] = useState(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)

  // Load meeting details on mount (like ClientMeeting does)

  useEffect(() => {
    console.log(
      '[CoachingMeetingContent] Loading meeting details for meetingId:',
      meetingId,
    )

    const setupMeeting = async () => {
      try {
        // First load meeting details
        await loadMeetingDetails()

        // Then get room URL for Daily from API
        let roomUrlResponse
        try {
          console.log(
            `[CoachingMeetingContent] Requesting room URL for meeting: ${meetingId}`,
          )
          roomUrlResponse = await trainerAPIService.getMeetingRoomUrl(meetingId)
          console.log(
            '[CoachingMeetingContent] Got API response:',
            roomUrlResponse,
          )
        } catch (roomUrlError) {
          console.error(
            '[CoachingMeetingContent] Failed to get room URL:',
            roomUrlError,
          )
          console.error(
            '[CoachingMeetingContent] Status Code:',
            roomUrlError.httpStatus,
          )
          console.error('[CoachingMeetingContent] Error Details:', {
            message: roomUrlError.message,
            status: roomUrlError.httpStatus,
            detail: roomUrlError.detail,
            code: roomUrlError.code,
          })

          // Handle different error status codes with user-friendly messages
          let errorMessage
          const errorStatus = roomUrlError.httpStatus
          switch (errorStatus) {
            case 403:
              errorMessage = `Access Denied: You do not have permission to access meeting #${meetingId}. This may be because the meeting belongs to another trainer or you have insufficient privileges. Please contact your administrator.`
              break
            case 404:
              errorMessage = `Meeting #${meetingId} not found. It may have been cancelled or deleted.`
              break
            case 409:
              errorMessage = `You appear to already be in this meeting. This usually happens when you try to join a meeting that you're already connected to. Use the 'Resume Meeting' button below to reconnect to your existing session.`
              break
            default:
              errorMessage = `Failed to load meeting room: ${roomUrlError.message || 'Unknown error'}`
          }

          // Save the status code with the error message for later reference
          errorMessage = { message: errorMessage, status: errorStatus }
          setRoomUrlError(errorMessage)
          return // Don't throw, just set error state
        }

        // Parse the URL to extract the base URL and token
        let dailyRoomUrl = roomUrlResponse.roomUrl
        let dailyToken = null

        try {
          // Extract token from URL if present
          const url = new URL(roomUrlResponse.roomUrl)
          dailyToken = url.searchParams.get('token') || url.searchParams.get('t')

          // Remove token from URL - Daily.co expects them separately
          url.searchParams.delete('token')
          url.searchParams.delete('t')
          dailyRoomUrl = url.toString()

          console.log('[CoachingMeetingContent] Parsed room URL:', dailyRoomUrl)
          console.log(
            '[CoachingMeetingContent] Extracted token:',
            dailyToken?.substring(0, 20) + '...',
          )
        } catch (err) {
          console.error('[CoachingMeetingContent] Error parsing URL:', err)
        }

        setRoomUrl(dailyRoomUrl)
        setToken(dailyToken)
      } catch (err) {
        console.error('Error setting up meeting:', err)
      }
    }

    setupMeeting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]) // Only depend on meetingId to avoid infinite re-renders

  // No chat state needed as we're using Daily's built-in chat

  if (meetingError) {
    return (
      <div className='text-center text-red-500 p-4'>
        Error loading meeting: {meetingError}
      </div>
    )
  }

  if (roomUrlError) {
    // Check if the error is an object with status code
    const errorStatus =
      typeof roomUrlError === 'object' && roomUrlError !== null
        ? roomUrlError.status
        : null

    // Get the error message
    const errorMessage =
      typeof roomUrlError === 'object' &&
      roomUrlError !== null &&
      roomUrlError.message
        ? roomUrlError.message
        : roomUrlError

    // Determine if this is a conflict error or another type
    const isConflictError =
      errorStatus === 409 ||
      (errorMessage && errorMessage.includes('already be in this meeting'))

    return (
      <div className='flex flex-col items-center justify-center py-10 px-4'>
        <div
          className={`${isConflictError ? 'bg-amber-50 border-l-4 border-amber-500' : 'bg-red-50 border-l-4 border-red-500'} p-6 rounded-md max-w-2xl w-full`}
        >
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
              {isConflictError ? (
                <svg
                  className='h-6 w-6 text-amber-500'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                  />
                </svg>
              ) : (
                <svg
                  className='h-6 w-6 text-red-500'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
                  />
                </svg>
              )}
            </div>
            <div className='ml-3'>
              <h3
                className={`text-lg font-medium ${isConflictError ? 'text-amber-800' : 'text-red-800'}`}
              >
                {isConflictError ? 'Meeting Already Joined' : 'Access Error'}
              </h3>
              <div
                className={`mt-2 text-md ${isConflictError ? 'text-amber-700' : 'text-red-700'}`}
              >
                {errorMessage}
              </div>
              <div className='mt-4'>
                <p
                  className={`text-sm ${isConflictError ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {isConflictError
                    ? 'To resolve this issue, you can:'
                    : 'If you believe this is an error, please try:'}
                </p>
                {isConflictError ? (
                  <ul className='list-disc pl-5 mt-1 text-sm text-amber-600'>
                    <li>
                      Use the 'Resume Meeting' button below to rejoin your
                      existing session
                    </li>
                    <li>If that doesn't work, try refreshing the page</li>
                    <li>
                      If you were unexpectedly disconnected, your browser may
                      still have an active connection
                    </li>
                  </ul>
                ) : (
                  <ul className='list-disc pl-5 mt-1 text-sm text-red-600'>
                    <li>Refreshing the page</li>
                    <li>Checking that you're assigned to this meeting</li>
                    <li>Contacting your administrator if the issue persists</li>
                  </ul>
                )}
              </div>
              <div className='mt-6 flex flex-wrap gap-2'>
                <Link
                  to='/dashboard'
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Return to Dashboard
                </Link>

                {/* Show Resume Meeting button only for 409 Conflict errors */}
                {isConflictError && (
                  <button
                    onClick={async () => {
                      try {
                        // Retry getting the room URL
                        const response =
                          await trainerAPIService.getMeetingRoomUrl(meetingId)

                        if (response && response.roomUrl) {
                          // Parse the URL to extract the base URL and token
                          let dailyRoomUrl = response.roomUrl
                          let dailyToken = null

                          try {
                            // Extract token from URL if present
                            const url = new URL(response.roomUrl)
                            dailyToken =
                              url.searchParams.get('token') ||
                              url.searchParams.get('t')

                            // Remove token from URL - Daily.co expects them separately
                            url.searchParams.delete('token')
                            url.searchParams.delete('t')
                            dailyRoomUrl = url.toString()
                          } catch (err) {
                            console.error(
                              '[CoachingMeetingContent] Error parsing resume URL:',
                              err,
                            )
                          }

                          setRoomUrl(dailyRoomUrl)
                          setToken(dailyToken)
                          setRoomUrlError(null) // Clear the error
                        }
                      } catch (err) {
                        console.error(
                          '[CoachingMeetingContent] Error resuming meeting:',
                          err,
                        )
                        // Format error with status
                        const resumeErrorStatus = err.httpStatus || 500
                        const resumeErrorMessage = `Failed to resume meeting: ${err.message || 'Unknown error'}`
                        setRoomUrlError({
                          message: resumeErrorMessage,
                          status: resumeErrorStatus,
                        })
                      }
                    }}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  >
                    Resume Meeting
                  </button>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Retry
                </button>
                <button
                  onClick={async () => {
                    setIsDiagnosing(true)
                    try {
                      const info =
                        await trainerAPIService.checkTrainerPermissions(
                          meetingId,
                        )
                      setDiagnosticInfo(info)
                      console.log('[CoachingMeeting] Diagnostic info:', info)
                    } catch (err) {
                      console.error('[CoachingMeeting] Diagnostic error:', err)
                    } finally {
                      setIsDiagnosing(false)
                    }
                  }}
                  disabled={isDiagnosing}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  {isDiagnosing ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Running Diagnostics...
                    </>
                  ) : (
                    'Run Diagnostics'
                  )}
                </button>
              </div>

              {diagnosticInfo && (
                <div className='mt-4 bg-gray-50 rounded-md p-3 border border-gray-200'>
                  <h4 className='text-sm font-medium text-gray-700'>
                    Diagnostic Results
                  </h4>
                  <div className='mt-2 overflow-auto max-h-52 text-xs'>
                    <pre className='whitespace-pre-wrap'>
                      {JSON.stringify(diagnosticInfo, null, 2)}
                    </pre>
                  </div>
                  <p className='text-xs text-gray-500 mt-2'>
                    Please share this information with your administrator to
                    help resolve the issue.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (meetingLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  const clientName = meetingDetails?.clientName || 'client'
  const clientJoinedOn = meetingDetails?.clientJoinedOn
    ? formatDate(meetingDetails?.clientJoinedOn)
    : '—'
  const clientEmail = meetingDetails?.clientEmail || 'client@example.com'

  const clientFields = [
    { label: 'Name', value: clientName },
    { label: 'Joined On', value: clientJoinedOn },
  ]

  const clientCreds = [{ label: 'Email', value: clientEmail }]

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
        Meeting:{' '}
        <span className='opacity-50 ml-3'>
          {meetingDetails?.title || 'PROGRAM 1 Live learning module'}: session{' '}
          {meetingId}
        </span>
      </h2>
      <div className='mb-2 text-xs text-gray-500'>Role: trainer</div>
      <div className='grid grid-cols-12 gap-6 max-w-7xl mx-auto'>
        <div className='col-span-12 lg:col-span-6 flex flex-col'>
          <ClientDetails fields={clientFields} />
        </div>
        <div className='col-span-12 lg:col-span-6 flex flex-col'>
          <ClientDetails fields={clientCreds} title='CLIENT CREDENTIALS' />
        </div>
        <div className='col-span-12 lg:col-span-12 flex flex-col'>
          <DailyMeetingRoom
            meetingId={meetingId}
            roomUrl={roomUrl}
            token={token}
          />
        </div>
        <div className='col-span-12 lg:col-span-8 lg:row-span-2'>
          <PrivateNotes title={'Meeting Notes'} />
        </div>
        {/* <div className='col-span-12 lg:col-span-4 flex flex-col'>
          <LiveTranscript />
        </div> */}
      </div>
      {/* Chat is now handled by Daily.co's built-in chat interface */}
    </div>
  )
}

export default CoachingMeeting
