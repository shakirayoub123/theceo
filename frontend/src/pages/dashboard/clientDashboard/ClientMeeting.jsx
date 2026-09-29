import DailyMeetingRoom from '@/components/DailyMeetingRoom'
import { CreatePaymentLinkModal } from '@/components/CreatePaymentLinkModal'
import { PrivateNotes } from '@/components/PrivateNotes'
import { MeetingProvider } from '@/contexts/MeetingProvider'
import { useAuth } from '@/contexts/AuthContext'
import { useMeetingContext } from '@/contexts/useMeetingContext'
import MeetingResources from '@/components/MeetingResources'
import { Button } from '@/components/ui/button'
import authService from '@/services/authService'
import clientAPIService from '@/services/clientAPIService'
import trainerAPIService from '@/services/trainerAPIService'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAssetUrl } from '@/lib/utils'
import { CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ClientMeeting = () => {
  const { meetingId } = useParams()
  const { user } = useAuth()
  const meetingRole = user?.role === 'sales' ? 'trainer' : 'client'

  return (
    <MeetingProvider meetingId={meetingId} role={meetingRole}>
      <ClientMeetingContent
        meetingId={meetingId}
        meetingRole={meetingRole}
        userRole={user?.role}
      />
    </MeetingProvider>
  )
}

// Separate the content to use the context
const ClientMeetingContent = ({ meetingId, meetingRole, userRole }) => {
  const {
    meetingDetails,
    isLoading: meetingLoading,
    error: meetingError,
    loadMeetingDetails,
  } = useMeetingContext()

  const [roomUrl, setRoomUrl] = useState(null)
  const [roomUrlLoading, setRoomUrlLoading] = useState(false)
  const [roomUrlError, setRoomUrlError] = useState(null)
  const [token, setToken] = useState(null)
  const [serviceData, setServiceData] = useState(null)
  const [chapterLoading, setChapterLoading] = useState(false)
  const [activeChapterId, setActiveChapterId] = useState(null)
  const meetingAPIService =
    meetingRole === 'trainer' ? trainerAPIService : clientAPIService
  const isSalesUser = userRole === 'sales'

  // Load meeting details on mount
  useEffect(() => {
    console.log(
      '[ClientMeetingContent] Loading meeting details for meetingId:',
      meetingId,
    )

    const setupMeeting = async () => {
      try {
        // First load meeting details
        const details = await loadMeetingDetails()

        if (
          meetingRole === 'trainer' &&
          details?.status === 'scheduled' &&
          details?.canInitiate
        ) {
          try {
            await meetingAPIService.initiateMeeting(meetingId)
          } catch (initiateError) {
            const expectedAlreadyActive =
              initiateError?.error === 'MEETING_ALREADY_ACTIVE' ||
              initiateError?.error === 'ALREADY_JOINED' ||
              initiateError?.httpStatus === 409
            if (!expectedAlreadyActive) {
              throw initiateError
            }
          }
        }

        // Then get room URL for Daily from API
        setRoomUrlLoading(true)
        let roomUrlResponse
        try {
          roomUrlResponse = await meetingAPIService.getMeetingRoomUrl(meetingId)
          console.log(
            '[ClientMeetingContent] Got API response:',
            roomUrlResponse,
          )
        } catch (roomUrlError) {
          console.error(
            '[ClientMeetingContent] Failed to get room URL:',
            roomUrlError,
          )
          console.error(
            '[ClientMeetingContent] Status Code:',
            roomUrlError.httpStatus,
          )
          console.error('[ClientMeetingContent] Error Details:', {
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
              errorMessage = `Access Denied: You do not have permission to access meeting #${meetingId}. This may be because you are not enrolled in this program or the meeting is not available yet. Please contact support for assistance.`
              break
            case 404:
              errorMessage = `Meeting #${meetingId} not found. It may have been cancelled or deleted.`
              break
            case 409:
              errorMessage = `You appear to already be in this meeting. This usually happens when you try to join a meeting that you're already connected to from another tab or device.`
              break
            default:
              errorMessage = `Failed to load meeting room: ${roomUrlError.message || 'Unknown error'}`
          }

          // Save the error to state
          setRoomUrlError(errorMessage)
          setRoomUrlLoading(false)
          return
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

          console.log('[ClientMeetingContent] Parsed room URL:', dailyRoomUrl)
          console.log(
            '[ClientMeetingContent] Extracted token:',
            dailyToken?.substring(0, 20) + '...',
          )
        } catch (err) {
          console.error('[ClientMeetingContent] Error parsing URL:', err)
        }

        setRoomUrl(dailyRoomUrl)
        setToken(dailyToken)
      } catch (err) {
        console.error('Error setting up meeting:', err)
      } finally {
        setRoomUrlLoading(false)
      }
    }

    setupMeeting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, meetingRole]) // Keep setup tied to the meeting and host/client mode.

  // Load program details to surface chapters/videos
  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!meetingDetails?.programId) return
      try {
        setChapterLoading(true)
        const data = await clientAPIService.getServiceDetails(
          meetingDetails.programId,
        )
        setServiceData(data)
        const firstChapterId = data?.chapters?.[0]?.id || null
        setActiveChapterId(firstChapterId)
      } catch (err) {
        console.error('Failed to load program details for meeting:', err)
      } finally {
        setChapterLoading(false)
      }
    }
    fetchProgramDetails()
  }, [meetingDetails?.programId])

  const programId = meetingDetails?.programId
  const programTitle = meetingDetails?.programTitle
  const chapters = useMemo(() => serviceData?.chapters || [], [serviceData])
  const currentChapter =
    chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0]
  const currentVideoUrl = currentChapter?.video
    ? getAssetUrl(currentChapter.video)
    : null
  const currentDescription =
    currentChapter?.description ||
    serviceData?.description ||
    'No description available for this session yet.'

  const overallProgress = useMemo(() => {
    if (!chapters.length) return null
    const sum = chapters.reduce((acc, chapter) => {
      const value = Number(chapter?.progress)
      return acc + (Number.isFinite(value) ? value : 0)
    }, 0)
    return Math.round(sum / chapters.length)
  }, [chapters])

  const scheduledAtLabel = useMemo(() => {
    const raw = meetingDetails?.scheduledStartTime
    if (!raw) return null
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString()
  }, [meetingDetails?.scheduledStartTime])

  if (meetingLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (roomUrlLoading) {
    return (
      <div className='flex flex-col justify-center items-center h-64 gap-3'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        <p className='text-sm text-gray-600 font-exo'>
          Preparing video meeting room...
        </p>
      </div>
    )
  }

  if (meetingError) {
    return (
      <div className='text-center text-red-500 p-4'>
        Error loading meeting: {meetingError}
      </div>
    )
  }

  if (roomUrlError) {
    return (
      <div className='flex flex-col items-center justify-center py-10 px-4'>
        <div className='bg-red-50 border-l-4 border-red-500 p-6 rounded-md max-w-2xl w-full'>
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
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
            </div>
            <div className='ml-3'>
              <h3 className='text-lg font-medium text-red-800'>
                Unable to Join Meeting
              </h3>
              <div className='mt-2 text-md text-red-700'>{roomUrlError}</div>
              <div className='mt-4'>
                <p className='text-sm text-red-600'>
                  If you believe this is an error, please try:
                </p>
                <ul className='list-disc pl-5 mt-1 text-sm text-red-600'>
                  <li>Refreshing the page</li>
                  <li>Checking that you're enrolled in this program</li>
                  <li>Contacting support if the issue persists</li>
                </ul>
              </div>
              <div className='mt-6'>
                <button
                  onClick={() => window.location.reload()}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
        Meeting:{' '}
        <span className='opacity-50 ml-3'>
          {meetingDetails?.title || 'PROGRAM 1 Live learning module'}: session{' '}
          {meetingId}
        </span>
      </h2>

      <div className='max-w-7xl mx-auto mb-6'>
        <div className='border-2 border-[#F6B72D] rounded-xl bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div>
            <p className='text-xs text-gray-500 uppercase font-semibold'>
              Linked Program
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-sm font-semibold text-gray-900'>
                {programTitle || 'Not linked yet'}
              </p>
              {scheduledAtLabel && (
                <span className='text-xs text-gray-600'>
                  • {scheduledAtLabel}
                </span>
              )}
            </div>
            {overallProgress !== null && (
              <div className='mt-2'>
                <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
                  <span>Overall progress</span>
                  <span className='font-semibold text-gray-900'>
                    {overallProgress}%
                  </span>
                </div>
                <div className='h-2 rounded-full bg-gray-100 overflow-hidden'>
                  <div
                    className='h-full bg-[#F6B72D]'
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {programId && (
            <Link
              to={`/client-dashboard/service/${programId}`}
              className='inline-flex items-center justify-center px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors'
            >
              Open Program
            </Link>
          )}
        </div>
      </div>

      <div className='grid grid-cols-12 gap-6 max-w-7xl mx-auto'>
        <div className='col-span-12 xl:col-span-8 flex flex-col gap-6'>
          <DailyMeetingRoom
            meetingId={meetingId}
            roomUrl={roomUrl}
            token={token}
          />

          {serviceData && (
            <div className='border-2 border-[#F6B72D] rounded-xl bg-white p-4'>
              <div className='flex items-center justify-between flex-wrap gap-2 mb-3'>
                <div>
                  <p className='text-xs text-gray-500 uppercase font-semibold'>
                    Program Session
                  </p>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {currentChapter?.title || serviceData.title}
                  </h3>
                </div>
                {chapterLoading && (
                  <span className='text-xs text-gray-600'>
                    Loading content...
                  </span>
                )}
              </div>

              {currentVideoUrl ? (
                <div className='w-full aspect-video rounded-lg overflow-hidden bg-black mb-4'>
                  <video
                    src={currentVideoUrl}
                    controls
                    className='w-full h-full object-contain'
                  />
                </div>
              ) : (
                <div className='w-full aspect-video rounded-lg bg-gray-100 flex items-center justify-center mb-4'>
                  <p className='text-sm text-gray-600'>
                    No video for this chapter.
                  </p>
                </div>
              )}

              <div
                className='text-sm text-gray-700 leading-relaxed font-exo space-y-2'
                dangerouslySetInnerHTML={{ __html: currentDescription }}
              />
            </div>
          )}
        </div>

        <div className='col-span-12 xl:col-span-4 flex flex-col gap-6'>
          <div className='xl:sticky xl:top-6 flex flex-col gap-6'>
            <MeetingResources
              programId={programId}
              programTitle={programTitle}
              serviceDetails={serviceData}
              allowUpload
              showModules={false}
            />

            {isSalesUser && <SalesCallTools meetingDetails={meetingDetails} />}

            {serviceData && (
              <div className='border-2 border-[#F6B72D] rounded-xl bg-white p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-md font-semibold text-gray-900'>
                    Program Learning Sessions
                  </h4>
                  <span className='text-xs text-gray-500'>
                    {chapters.length} items
                  </span>
                </div>
                <div className='space-y-2 max-h-[480px] overflow-auto pr-1'>
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        chapter.id === currentChapter?.id
                          ? 'border-[#F6B72D] bg-[#FFF9EB]'
                          : 'border-gray-200 hover:border-[#F6B72D]'
                      }`}
                      onClick={() => setActiveChapterId(chapter.id)}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <p className='text-xs text-gray-500 uppercase font-semibold'>
                            Week {chapter.week || '-'}
                          </p>
                          <p className='text-sm font-semibold text-gray-900'>
                            {chapter.title}
                          </p>
                        </div>
                        {typeof chapter.progress === 'number' && (
                          <span className='text-xs font-semibold text-gray-700'>
                            {chapter.progress}%
                          </span>
                        )}
                      </div>
                      {chapter.description && (
                        <div
                          className='text-xs text-gray-600 mt-1 line-clamp-2 font-exo'
                          dangerouslySetInnerHTML={{
                            __html: chapter.description,
                          }}
                        />
                      )}
                    </button>
                  ))}
                  {chapters.length === 0 && (
                    <p className='text-sm text-gray-600'>
                      No learning sessions available yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            <PrivateNotes title={'Meeting Notes'} />
          </div>
        </div>
      </div>
    </div>
  )
}

const SalesCallTools = ({ meetingDetails }) => {
  const clientParticipant = useMemo(
    () =>
      meetingDetails?.participants?.find(
        (participant) => participant.role === 'client',
      ) || null,
    [meetingDetails?.participants],
  )
  const [programs, setPrograms] = useState([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true)
      try {
        const response = await authService.getSalesAllPrograms()
        setPrograms(response?.programs || [])
      } catch (error) {
        console.error('Failed to load sales programs:', error)
        toast.error('Failed to load programs')
        setPrograms([])
      } finally {
        setLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [])

  const clientLead = useMemo(() => {
    if (!clientParticipant) return null
    return {
      id: clientParticipant.userId,
      uuid: clientParticipant.userId,
      clientName: clientParticipant.name,
      clientEmail: clientParticipant.email,
      email: clientParticipant.email,
    }
  }, [clientParticipant])

  return (
    <div className='border-2 border-[#F6B72D] rounded-xl bg-white p-4'>
      <div className='mb-4'>
        <p className='text-xs text-gray-500 uppercase font-semibold'>
          Sales Tools
        </p>
        <h4 className='text-md font-semibold text-gray-900'>
          {clientParticipant?.name || 'Client'}
        </h4>
      </div>

      <div className='space-y-3'>
        <select
          value={selectedProgramId}
          onChange={(event) => setSelectedProgramId(event.target.value)}
          disabled={loadingPrograms}
          className='w-full border border-gray-300 rounded-md px-3 py-2 font-exo focus:outline-none focus:ring-2 focus:ring-[#F6B72D] disabled:opacity-60'
        >
          <option value=''>
            {loadingPrograms ? 'Loading programs...' : 'Select program'}
          </option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>

        <div className='grid grid-cols-1 gap-2'>
          <Button
            type='button'
            onClick={() => setPaymentModalOpen(true)}
            disabled={!clientLead}
            className='bg-[#F6B72D] text-black hover:bg-[#e6a02a] font-exo'
          >
            <CreditCard className='w-4 h-4 mr-2' />
            Payment Link
          </Button>
        </div>
      </div>

      <CreatePaymentLinkModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        lead={clientLead}
        initialProgramId={selectedProgramId}
      />
    </div>
  )
}

export default ClientMeeting
