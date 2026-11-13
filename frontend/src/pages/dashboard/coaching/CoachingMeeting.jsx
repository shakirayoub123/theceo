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
import { MeetingAccessValidation } from '@/components/MeetingAccessValidation'

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

  const handleResumeMeeting = async () => {
    try {
      const response = await trainerAPIService.getMeetingRoomUrl(meetingId)
      if (response && response.roomUrl) {
        let dailyRoomUrl = response.roomUrl
        let dailyToken = null
        try {
          const url = new URL(response.roomUrl)
          dailyToken = url.searchParams.get('token') || url.searchParams.get('t')
          url.searchParams.delete('token')
          url.searchParams.delete('t')
          dailyRoomUrl = url.toString()
        } catch (err) {
          console.error('[CoachingMeetingContent] Error parsing resume URL:', err)
        }
        setRoomUrl(dailyRoomUrl)
        setToken(dailyToken)
        setRoomUrlError(null)
      }
    } catch (err) {
      console.error('[CoachingMeetingContent] Error resuming meeting:', err)
      setRoomUrlError({
        message: `Failed to resume meeting: ${err.message || 'Unknown error'}`,
        status: err.httpStatus || 500,
      })
    }
  }

  if (meetingLoading) {
    return (
      <div className='flex flex-col justify-center items-center h-64 gap-3'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        <p className='text-sm text-gray-600 font-exo'>
          Validating meeting session and credentials...
        </p>
      </div>
    )
  }

  if (meetingError) {
    return (
      <MeetingAccessValidation
        error={meetingError}
        meetingId={meetingId}
        role='trainer'
        onRetry={() => window.location.reload()}
        onResume={handleResumeMeeting}
      />
    )
  }

  if (roomUrlError) {
    return (
      <MeetingAccessValidation
        error={roomUrlError}
        meetingId={meetingId}
        role='trainer'
        onRetry={() => window.location.reload()}
        onResume={handleResumeMeeting}
      />
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
