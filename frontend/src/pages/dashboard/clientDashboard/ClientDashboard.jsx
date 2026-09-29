import { MetricCard } from '@/components/MetricCard'
import clientAPIService from '@/services/clientAPIService'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  CalendarDays,
  Clock,
  FileDown,
  FileUp,
  LogOut,
  MessageSquare,
  NotebookText,
  Play,
  Save,
  X,
} from 'lucide-react'
import { URLS } from '@/config/urls'

const PAGE_SIZE = 8
const HERO_TAGLINE_OUTLINE = {
  WebkitTextStroke: '1px rgba(0, 0, 0, 0.75)',
  paintOrder: 'stroke fill',
}

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const uniqueNames = (values) =>
  values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value, idx, arr) => arr.indexOf(value) === idx)

const extractPersonNames = (value) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractPersonNames(item))
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    const directName = value.name || value.full_name || value.fullName
    if (directName) return [String(directName).trim()]
    const joinedName = `${value.first_name || ''} ${value.last_name || ''}`.trim()
    if (joinedName) return [joinedName]
    if (value.username) return [String(value.username).trim()]
  }
  return []
}

const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const parseDashboardDate = (dateValue) => {
  if (!dateValue) return null
  if (
    typeof dateValue === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    const [year, month, day] = dateValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatMeetingDateTime = (dateValue, timeValue) => {
  if (!dateValue) return 'Time not scheduled yet'
  const date = parseDashboardDate(dateValue)
  if (!date) {
    return timeValue
      ? `${formatDate(dateValue)} · ${timeValue}`
      : formatDate(dateValue)
  }

  const dateText = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeText =
    timeValue ||
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

  return `${dateText} · ${timeText}`
}

const isSameLocalDay = (dateValue, referenceDate = new Date()) => {
  if (!dateValue) return false
  const date = parseDashboardDate(dateValue)
  if (!date) return false

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  )
}

const getMeetingScheduledValue = (meeting) =>
  meeting?.scheduledAt || meeting?.scheduled_at || meeting?.date

const getMeetingBookedValue = (meeting) =>
  meeting?.bookedAt || meeting?.createdAt || meeting?.created_at

const getMeetingTimestamp = (meeting) => {
  const date =
    meeting?.dateTime || parseDashboardDate(getMeetingScheduledValue(meeting))
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.getTime()
    : 0
}

const getMeetingBookedTimestamp = (meeting) => {
  const bookedDate =
    meeting?.bookedDateTime || parseDashboardDate(getMeetingBookedValue(meeting))
  if (bookedDate instanceof Date && !Number.isNaN(bookedDate.getTime())) {
    return bookedDate.getTime()
  }
  return getMeetingTimestamp(meeting)
}

const normalizeDashboardMeeting = (meeting) => {
  if (!meeting) return null
  const scheduledDate = parseDashboardDate(getMeetingScheduledValue(meeting))
  const bookedDate = parseDashboardDate(getMeetingBookedValue(meeting))

  return {
    ...meeting,
    dateTime: scheduledDate,
    bookedDateTime: bookedDate,
  }
}

export default function ClientDashboard() {
  const [overviewData, setOverviewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [enrolledPrograms, setEnrolledPrograms] = useState([])
  const [allPrograms, setAllPrograms] = useState([])
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [notes, setNotes] = useState('')
  const [notesSavedAt, setNotesSavedAt] = useState(null)
  const [activeProgramModules, setActiveProgramModules] = useState([])
  const [activeProgramDetails, setActiveProgramDetails] = useState(null)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)
  const [introModalTitle, setIntroModalTitle] = useState('')
  const [introModalVideoUrl, setIntroModalVideoUrl] = useState(null)
  const [introModalLoading, setIntroModalLoading] = useState(false)
  const [introModalError, setIntroModalError] = useState('')
  const [completedAssessments, setCompletedAssessments] = useState(null)

  const getStoredUser = () => {
    try {
      const rawUser =
        localStorage.getItem('user') || localStorage.getItem('currentUser')
      if (!rawUser) return null
      return JSON.parse(rawUser)
    } catch (err) {
      console.warn('Unable to parse stored user', err)
      return null
    }
  }

  const storedUser = getStoredUser()

  // Fetch completed assessment count
  useEffect(() => {
    const userEmail =
      storedUser?.email ||
      localStorage.getItem('userEmail') ||
      ''
    if (!userEmail) return
    clientAPIService.getAssessmentProgress(userEmail)
      .then((data) => {
        const count = Array.isArray(data?.questionnaires)
          ? data.questionnaires.length
          : (Array.isArray(data) ? data.length : 0)
        setCompletedAssessments(count)
      })
      .catch(() => setCompletedAssessments(0))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const hasFullDashboardAccess = !(
    overviewData?.hasFullDashboardAccess === false ||
    storedUser?.hasFullDashboardAccess === false
  )
  const dashboardAccessLevel =
    overviewData?.dashboardAccessLevel ||
    storedUser?.dashboardAccessLevel ||
    (hasFullDashboardAccess ? 'full' : 'overview_only')
  const clientProgramStatus =
    overviewData?.clientProgramStatus ||
    storedUser?.clientProgramStatus ||
    'unpaid'

  const downloadFile = useCallback(async (file) => {
    const fileUrl = getAssetUrl(file?.fileUrl || file?.url)
    if (!fileUrl) return

    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download =
        file?.title || file?.name || fileUrl.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Failed to download file directly:', error)
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleModuleDownload = useCallback(
    async (module) => {
      const moduleFiles = Array.isArray(module?.files) ? module.files : []
      if (!moduleFiles.length) return

      for (const file of moduleFiles) {
        await downloadFile(file)
      }
    },
    [downloadFile],
  )

  const mergeCalendarMonths = (...calendarResponses) => {
    return calendarResponses.reduce((merged, response) => {
      const calendar = response?.meetings || response
      if (!calendar || typeof calendar !== 'object') return merged

      Object.entries(calendar).forEach(([date, meetings]) => {
        const normalizedMeetings = Array.isArray(meetings) ? meetings : []
        merged[date] = [...(merged[date] || []), ...normalizedMeetings]
      })

      return merged
    }, {})
  }

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const [overview, allProgramsResponse] = await Promise.all([
          clientAPIService.getClientOverview(),
          authService.getAllPrograms(),
        ])

        setOverviewData(overview)
        const allProgramsList =
          allProgramsResponse?.programs ||
          allProgramsResponse?.results ||
          allProgramsResponse ||
          []
        setAllPrograms(allProgramsList)
        setCurrentPage(1)

        if (overview?.hasFullDashboardAccess === false) {
          setUpcomingMeetings([])
          setEnrolledPrograms([])
          setActiveProgramId(
            allProgramsList[0]?.id ?? allProgramsList[0]?.uuid ?? null,
          )
          return
        }

        const [calendarThisMonth, calendarNextMonth, programList] =
          await Promise.all([
            clientAPIService.getClientCalendar({
              year: now.getFullYear(),
              month: now.getMonth() + 1,
            }),
            clientAPIService.getClientCalendar({
              year: nextMonth.getFullYear(),
              month: nextMonth.getMonth() + 1,
            }),
            clientAPIService.getClientPrograms(),
          ])

        const mergedCalendar = mergeCalendarMonths(
          calendarThisMonth,
          calendarNextMonth,
        )
        const meetingsList = extractUpcomingMeetings(mergedCalendar)
        setUpcomingMeetings(meetingsList)
        const sortedPrograms = sortProgramsByEnrollment(programList || [])
        const fallbackPrograms = sortedPrograms.length
          ? sortedPrograms
          : allProgramsList
        setEnrolledPrograms(sortedPrograms)
        setActiveProgramId(
          fallbackPrograms[0]?.id ?? fallbackPrograms[0]?.uuid ?? null,
        )
      } catch (error) {
        console.error('Failed to fetch client overview:', error)
        setUpcomingMeetings([])
        setEnrolledPrograms([])
        setAllPrograms([])
        setActiveProgramId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  const extractUpcomingMeetings = (calendarData) => {
    const calendar = calendarData?.meetings || calendarData
    if (!calendar || typeof calendar !== 'object') return []

    const toDateTime = (dateString, timeString) => {
      if (!dateString) return null
      if (!timeString) return new Date(dateString)
      const [time, meridian] = timeString.split(' ')
      const [rawHours, rawMinutes] = (time || '').split(':')
      if (!rawHours) return new Date(dateString)
      let hours = parseInt(rawHours, 10)
      const minutes = parseInt(rawMinutes || '0', 10)
      const meridianLower = (meridian || '').toLowerCase()
      if (meridianLower === 'pm' && hours < 12) hours += 12
      if (meridianLower === 'am' && hours === 12) hours = 0
      const isoTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
      return new Date(`${dateString}T${isoTime}`)
    }

    const flattened = Object.entries(calendar).flatMap(([date, meetings]) =>
      (meetings || []).map((meeting) => ({
        ...meeting,
        date,
        dateTime: toDateTime(date, meeting.time),
        bookedDateTime: parseDashboardDate(getMeetingBookedValue(meeting)),
      })),
    )

    return flattened
      .filter((meeting) => meeting.dateTime)
      .sort((a, b) => b.dateTime - a.dateTime)
  }

  const sortProgramsByEnrollment = (programList) => {
    return [...(programList || [])].sort((a, b) => {
      const aDate = new Date(a?.enrolledOn || a?.enrolled_on || 0)
      const bDate = new Date(b?.enrolledOn || b?.enrolled_on || 0)
      return bDate - aDate
    })
  }

  const belongsToProgram = (meeting, program) => {
    if (!program) return false
    const programId = program.id?.toString()
    const programName = program.name
    const candidateIds = [
      meeting.programId,
      meeting.program_id,
      meeting.serviceId,
      meeting.service_id,
    ]
      .filter(Boolean)
      .map((id) => id.toString())

    if (programId && candidateIds.includes(programId)) return true

    const candidateNames = [
      meeting.program,
      meeting.programName,
      meeting.title,
      meeting.name,
    ].filter(Boolean)

    return programName && candidateNames.some((n) => n === programName)
  }

  const enrolledProgramIds = useMemo(
    () =>
      new Set(
        (enrolledPrograms || [])
          .map((program) => program?.id || program?.uuid)
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    [enrolledPrograms],
  )

  const selectablePrograms = useMemo(() => {
    const sourcePrograms = allPrograms.length ? allPrograms : enrolledPrograms
    const uniquePrograms = []
    const seen = new Set()

    sourcePrograms.forEach((program) => {
      const programId = program?.id || program?.uuid
      const programName = program?.name || program?.title || 'Program'
      const dedupeKey = programId
        ? `id-${String(programId)}`
        : `name-${normalizeText(programName)}`
      if (!dedupeKey || seen.has(dedupeKey)) return
      seen.add(dedupeKey)
      uniquePrograms.push({
        ...program,
        id: programId || dedupeKey,
        name: programName,
        isEnrolled: programId
          ? enrolledProgramIds.has(String(programId))
          : enrolledPrograms.length > 0,
      })
    })

    return uniquePrograms
  }, [allPrograms, enrolledProgramIds, enrolledPrograms])

  const activeProgram = useMemo(() => {
    if (!selectablePrograms.length) return null
    if (activeProgramId === null) return selectablePrograms[0]
    return (
      selectablePrograms.find(
        (program) => String(program.id) === String(activeProgramId),
      ) || selectablePrograms[0]
    )
  }, [activeProgramId, selectablePrograms])

  useEffect(() => {
    if (!selectablePrograms.length) {
      if (activeProgramId !== null) setActiveProgramId(null)
      return
    }
    const selectedExists = selectablePrograms.some(
      (program) => String(program.id) === String(activeProgramId),
    )
    if (!selectedExists) {
      setActiveProgramId(selectablePrograms[0].id)
    }
  }, [activeProgramId, selectablePrograms])

  // --- Notes persistence (localStorage per program) ---
  const loadNotes = (program) => {
    try {
      const raw = localStorage.getItem('client_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      return parsed[key] || ''
    } catch (err) {
      console.warn('Unable to read notes from storage', err)
      return ''
    }
  }

  const saveNotes = (program, value) => {
    try {
      const raw = localStorage.getItem('client_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      parsed[key] = value
      localStorage.setItem('client_notes_v1', JSON.stringify(parsed))
      setNotesSavedAt(new Date())
    } catch (err) {
      console.warn('Unable to save notes to storage', err)
    }
  }

  useEffect(() => {
    setNotes(loadNotes(activeProgram))
  }, [activeProgram])

  useEffect(() => {
    const fetchModules = async () => {
      if (
        !hasFullDashboardAccess ||
        !activeProgram?.id ||
        String(activeProgram.id).startsWith('name-')
      ) {
        setActiveProgramModules([])
        setActiveProgramDetails(null)
        return
      }
      try {
        const details = await clientAPIService.getServiceDetails(
          activeProgram.id,
        )
        setActiveProgramDetails(details || null)
        const modules =
          details?.modules ||
          details?.chapters ||
          details?.lessons ||
          details?.sections ||
          details?.program_chapters ||
          []
        setActiveProgramModules(Array.isArray(modules) ? modules : [])
      } catch (error) {
        console.error('Failed to fetch program details:', error)
        setActiveProgramDetails(null)
        setActiveProgramModules([])
      }
    }

    fetchModules()
  }, [activeProgram?.id, hasFullDashboardAccess])

  const sessionsForActiveProgram = useMemo(() => {
    if (!upcomingMeetings.length) return []
    if (!activeProgram) return upcomingMeetings
    const filtered = upcomingMeetings.filter((meeting) =>
      belongsToProgram(meeting, activeProgram),
    )
    return filtered.length ? filtered : upcomingMeetings
  }, [activeProgram, upcomingMeetings])

  const nextMeeting = useMemo(() => {
    const latestBookedMeeting = normalizeDashboardMeeting(
      overviewData?.latestBookedMeeting || overviewData?.latest_booked_meeting,
    )
    if (latestBookedMeeting?.id) return latestBookedMeeting

    const sorted = [...sessionsForActiveProgram].sort(
      (a, b) => getMeetingBookedTimestamp(b) - getMeetingBookedTimestamp(a),
    )
    if (sorted.length) return sorted[0]

    return [...upcomingMeetings].sort(
      (a, b) => getMeetingBookedTimestamp(b) - getMeetingBookedTimestamp(a),
    )[0]
  }, [overviewData, sessionsForActiveProgram, upcomingMeetings])

  const meetingBoxProgramName =
    nextMeeting?.programName ||
    nextMeeting?.program ||
    nextMeeting?.serviceTitle ||
    activeProgram?.name ||
    'Live 2:1 Executive Leadership Coaching Program'

  const discoveryCall = useMemo(() => {
    if (overviewData?.discoveryCall) {
      return overviewData.discoveryCall
    }

    return [...upcomingMeetings]
      .filter((meeting) => {
        const meetingType = normalizeText(meeting?.meetingType || meeting?.type)
        const title = normalizeText(meeting?.title || meeting?.name)
        return (
          meetingType.includes('discovery') ||
          meetingType.includes('initial') ||
          meetingType.includes('consultation') ||
          title.includes('discovery') ||
          title.includes('sales meeting')
        )
      })
      .sort((a, b) => a.dateTime - b.dateTime)[0]
  }, [overviewData, upcomingMeetings])

  const discoveryCallDateValue =
    discoveryCall?.scheduledAt ||
    discoveryCall?.scheduled_at ||
    discoveryCall?.date
  const canJoinDiscoveryCall =
    Boolean(discoveryCall?.id) && isSameLocalDay(discoveryCallDateValue)

  const totalPages = Math.max(1, Math.ceil(upcomingMeetings.length / PAGE_SIZE))
  const paginatedMeetings = upcomingMeetings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const getMeetingSubtext = () => {
    if (!overviewData?.latestMeetingOn) return ''

    const meetingTime = new Date(overviewData.latestMeetingOn)
    const now = new Date()
    const diffInHours = (meetingTime - now) / (1000 * 60 * 60)

    if (diffInHours > 0 && diffInHours <= 24) {
      const hours = Math.ceil(diffInHours)
      return `Your meeting starts in ${hours} hour${hours > 1 ? 's' : ''}.`
    } else if (diffInHours > -1 && diffInHours <= 0) {
      return 'Your meeting is starting now.'
    } else if (diffInHours < 0 && diffInHours > -24) {
      const hours = Math.floor(Math.abs(diffInHours))
      return `Your meeting was ${hours} hour${hours > 1 ? 's' : ''} ago.`
    }

    return ''
  }

  const coachingInfluencersDisplay = useMemo(() => {
    const merged = [
      ...extractPersonNames(activeProgramDetails?.trainer),
      ...extractPersonNames(activeProgramDetails?.assignedAdvisors),
      ...extractPersonNames(activeProgramDetails?.coachingInfluencers),
      ...extractPersonNames(activeProgram?.coachingInfluencers),
      ...extractPersonNames(activeProgram?.assignedAdvisors),
      ...extractPersonNames(overviewData?.coachingInfluencers),
      ...extractPersonNames(overviewData?.coaching_influencers),
      ...extractPersonNames(overviewData?.coaches),
      ...extractPersonNames(overviewData?.advisors),
      ...sessionsForActiveProgram.flatMap((meeting) => {
        const advisorNames = extractPersonNames(
          meeting?.advisor || meeting?.otherTrainers,
        )
        const salesNames = extractPersonNames(
          meeting?.salesAdvisor ||
          meeting?.salesInfluencer ||
          meeting?.sales_advisor ||
          meeting?.sales_influencer,
        )
        return advisorNames.filter((name) => !salesNames.includes(name))
      }),
    ]
    const normalized = uniqueNames(merged)
    return normalized.length ? normalized.join(' & ') : '—'
  }, [activeProgram, activeProgramDetails, overviewData, sessionsForActiveProgram])

  const salesInfluencerDisplay = useMemo(() => {
    const merged = [
      ...extractPersonNames(activeProgramDetails?.salesInfluencer),
      ...extractPersonNames(activeProgramDetails?.sales_influencer),
      ...extractPersonNames(activeProgramDetails?.salesAdvisor),
      ...extractPersonNames(activeProgramDetails?.sales_advisor),
      ...extractPersonNames(activeProgramDetails?.assignedSalesInfluencers),
      ...extractPersonNames(activeProgram?.salesInfluencer),
      ...extractPersonNames(activeProgram?.sales_influencer),
      ...extractPersonNames(activeProgram?.salesAdvisor),
      ...extractPersonNames(activeProgram?.sales_advisor),
      ...extractPersonNames(activeProgram?.assignedSalesInfluencers),
      ...extractPersonNames(overviewData?.salesInfluencer),
      ...extractPersonNames(overviewData?.sales_influencer),
      ...extractPersonNames(overviewData?.salesAdvisor),
      ...extractPersonNames(overviewData?.sales_advisor),
      ...extractPersonNames(overviewData?.salesInfluencers),
    ]
    const normalized = uniqueNames(merged)
    return normalized[0] || '—'
  }, [activeProgram, activeProgramDetails, overviewData])

  const clientNameText =
    overviewData?.clientName ||
    overviewData?.name ||
    storedUser?.name ||
    storedUser?.full_name ||
    (storedUser?.first_name || storedUser?.last_name
      ? `${storedUser?.first_name || ''} ${storedUser?.last_name || ''}`.trim()
      : '') ||
    storedUser?.username ||
    ''
  const clientIdText =
    overviewData?.clientId ||
    overviewData?.client_id ||
    overviewData?.id ||
    storedUser?.id ||
    localStorage.getItem('userId') ||
    ''
  const clientNameDisplay = clientNameText || '—'
  const clientIdDisplay = clientIdText || '—'

  const activeProgramContent = useMemo(() => {
    if (activeProgramModules.length) {
      return activeProgramModules.slice(0, 12).map((module, idx) => ({
        type: 'module',
        files: Array.isArray(module?.files) ? module.files : [],
        title:
          module?.title ||
          module?.name ||
          module?.chapter_title ||
          module?.subtitle ||
          `Module ${idx + 1}`,
        subtitle:
          module?.shortDescription ||
          module?.short_description ||
          module?.description ||
          module?.content ||
          null,
      }))
    }

    const details = [
      { label: 'Program', value: activeProgram?.name || activeProgram?.title },
      { label: 'Status', value: activeProgram?.status },
      {
        label: 'Enrollment',
        value: formatDate(activeProgram?.enrolledOn || activeProgram?.enrolled_on),
      },
      { label: 'Sales Influencer', value: salesInfluencerDisplay },
      { label: 'Coaching Influencers', value: coachingInfluencersDisplay },
      {
        label: 'Description',
        value:
          activeProgramDetails?.description ||
          activeProgram?.description ||
          activeProgram?.shortDesc ||
          activeProgram?.short_description,
      },
    ]

    return details
      .filter(
        (item) =>
          item.value !== undefined &&
          item.value !== null &&
          `${item.value}` !== '' &&
          `${item.value}` !== 'TBD',
      )
      .slice(0, 12)
      .map((item) => ({
        type: 'detail',
        title: item.label,
        subtitle: String(item.value),
      }))
  }, [
    activeProgram,
    activeProgramDetails,
    activeProgramModules,
    coachingInfluencersDisplay,
    salesInfluencerDisplay,
  ])

  const getProgramWorkspaceLink = (program) => {
    if (!hasFullDashboardAccess) return '#'
    if (!program?.id || String(program.id).startsWith('name-')) return '#'
    if (!program.isEnrolled) return '#'
    return `/client-dashboard/service/${program.id}`
  }

  const activeProgramWorkspaceLink = getProgramWorkspaceLink(activeProgram)
  const canAccessActiveProgramWorkspace = activeProgramWorkspaceLink !== '#'

  const closeIntroModal = () => {
    setIsIntroModalOpen(false)
    setIntroModalTitle('')
    setIntroModalVideoUrl(null)
    setIntroModalLoading(false)
    setIntroModalError('')
  }

  const openIntroModalForLockedProgram = (program) => {
    if (!program) return

    setActiveProgramId(program.id)
    setIntroModalTitle(program?.name || program?.title || 'Program')
    const listVideoUrl = getAssetUrl(program?.introVideo || program?.intro_video)
    setIntroModalVideoUrl(listVideoUrl || null)
    setIntroModalLoading(false)
    setIntroModalError(
      listVideoUrl ? '' : 'Demo video is not available for this program yet.',
    )
    setIsIntroModalOpen(true)
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto space-y-8'>
      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex-1 min-w-[220px]'>
            <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D] font-semibold'>
              <p style={HERO_TAGLINE_OUTLINE}>
                The CEO Influencers
              </p>
              <p style={HERO_TAGLINE_OUTLINE}>
                Building Better Leaders
              </p>
            </p>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900'>
              Client Dashboard
            </h1>
            <p className='text-lg font-exo text-gray-600'>
              Welcome back
              {overviewData?.clientName ? `, ${overviewData.clientName}` : ''} —
              {hasFullDashboardAccess
                ? ' your programs and sessions at a glance.'
                : ' your overview is active. Full workspace access unlocks after payment confirmation.'}
            </p>
          </div>
          <div className='w-full sm:w-auto self-center'>
            <div className='bg-[#0f172a] text-white rounded-lg px-4 py-3 text-sm sm:text-base font-semibold space-y-1'>
              <p className='text-sm sm:text-base font-semibold'>
                Program 1:{' '}
                {activeProgram?.name ||
                  'Live 2:1 Executive Leadership Coaching Program'}
              </p>
              {hasFullDashboardAccess ? (
                <>
                  <p className='text-xs sm:text-sm text-white/85'>
                    Sales Influencer: {salesInfluencerDisplay}
                  </p>
                  <p className='text-xs sm:text-sm text-white/80'>
                    Coaching Influencers: {coachingInfluencersDisplay}
                  </p>
                </>
              ) : (
                <>
                  <p className='text-xs sm:text-sm text-white/85'>
                    Sales Influencer: {salesInfluencerDisplay}
                  </p>
                  <p className='text-xs sm:text-sm text-white/85'>
                    Access: {dashboardAccessLevel === 'full' ? 'Full Dashboard' : 'Overview Only'}
                  </p>
                  <p className='text-xs sm:text-sm text-white/80'>
                    Status:{' '}
                    {clientProgramStatus === 'paid'
                      ? 'Paid'
                      : 'Awaiting payment confirmation'}
                  </p>
                </>
              )}
              <p className='text-xs sm:text-sm text-white/80'>
                Client: {clientNameDisplay} • ID: {clientIdDisplay}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment redirect banner — visible until all 6 assessments are complete */}
      {completedAssessments !== null && completedAssessments < 6 && (
        <div className='bg-[#0f172a] border-2 border-[#F6B72D] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D] font-semibold mb-1'>
              Action Required
            </p>
            <p className='text-white font-semibold text-sm sm:text-base'>
              Complete your {6 - completedAssessments} remaining assessment{6 - completedAssessments !== 1 ? 's' : ''} to unlock your full coaching experience.
            </p>
            <p className='text-white/60 text-xs mt-1'>
              {completedAssessments} of 6 completed
            </p>
          </div>
          <a
            href='https://assessment.theceoinfluencers.com'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 whitespace-nowrap bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-bold py-2.5 px-6 rounded-full text-sm transition-all duration-300 hover:scale-105'
          >
            Go to Assessments
          </a>
        </div>
      )}

      {hasFullDashboardAccess ? (
        <div className='grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12 gap-6'>
          {/* Learning sessions rail */}
          <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px] self-start'>
            <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm h-[744px] max-h-[744px] flex flex-col overflow-hidden'>
              <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D]'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                    Learning Modules
                  </span>
                  <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                    {activeProgramContent.length}
                  </span>
                </div>
              </div>
              <div className='flex-1 min-h-0 h-full overflow-y-auto divide-y divide-gray-100'>
                {activeProgramContent.length ? (
                  activeProgramContent.map((item, idx) => {
                    const content = (
                      <>
                        <p className='text-xs text-gray-500 uppercase'>
                          {item.type === 'module'
                            ? `Module ${idx + 1}`
                            : 'Program Detail'}
                        </p>
                        <p className='text-sm font-semibold text-gray-900 truncate'>
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className='text-xs text-gray-500 truncate mt-1'>
                            {item.subtitle}
                          </p>
                        )}
                      </>
                    )

                    if (item.type === 'module') {
                      return (
                        <button
                          key={`${item.title}-${idx}`}
                          type='button'
                          className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${item.files?.length ? '' : 'cursor-default'
                            }`}
                          onClick={() => handleModuleDownload(item)}
                        >
                          {content}
                        </button>
                      )
                    }

                    if (canAccessActiveProgramWorkspace) {
                      return (
                        <Link
                          key={`${item.title}-${idx}`}
                          to={activeProgramWorkspaceLink}
                          className='block px-4 py-3 hover:bg-gray-50'
                        >
                          {content}
                        </Link>
                      )
                    }

                    return (
                      <div
                        key={`${item.title}-${idx}`}
                        className='block px-4 py-3 cursor-not-allowed opacity-80'
                        title='Program details are available after enrollment.'
                      >
                        {content}
                      </div>
                    )
                  })
                ) : (
                  <div className='px-4 py-6 text-sm text-gray-500'>
                    No modules available yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className='col-span-12 lg:col-span-6 xl:col-span-6 min-w-[320px] flex flex-col gap-4 h-full'>
            <div className='bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg min-h-[240px] flex flex-col justify-between border-2 border-[#F6B72D]'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <h2 className='text-2xl sm:text-3xl font-extrabold leading-tight'>
                    Video Meeting
                  </h2>
                  <p className='text-sm sm:text-base font-semibold text-[#F6B72D] mt-1'>
                    Program 1: {meetingBoxProgramName}
                  </p>
                  <h3 className='text-base sm:text-lg font-semibold mt-3 leading-tight'>
                    {nextMeeting
                      ? nextMeeting.title || 'Upcoming Live Session'
                      : 'No live session scheduled'}
                  </h3>
                  <p className='text-sm text-white/70 mt-1'>
                    {nextMeeting
                      ? formatMeetingDateTime(
                          getMeetingScheduledValue(nextMeeting),
                          nextMeeting.time,
                        )
                      : 'We will notify you when a session is added.'}
                  </p>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-3 mt-4'>
                <Link
                  to={nextMeeting?.id ? `/client/meeting/${nextMeeting.id}` : '#'}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${nextMeeting?.id
                    ? 'bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                    : 'bg-white/10 text-white cursor-not-allowed'
                    }`}
                >
                  <Play className='w-4 h-4 mr-2' />
                  {nextMeeting?.id ? 'Join Meeting' : 'Awaiting Schedule'}
                </Link>
                {activeProgram &&
                  (canAccessActiveProgramWorkspace ? (
                    <Link
                      to={activeProgramWorkspaceLink}
                      className='text-sm text-white/80 hover:text-[#F6B72D]'
                    >
                      View Program Overview →
                    </Link>
                  ) : (
                    <span className='text-sm text-white/40 cursor-not-allowed'>
                      View Program Overview →
                    </span>
                  ))}
              </div>
            </div>

            <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-4 shadow-sm flex flex-col flex-1'>
              <div className='flex items-center gap-2 mb-3'>
                <NotebookText className='w-5 h-5 text-[#1a2332]' />
                <h3 className='text-base sm:text-lg font-extrabold uppercase tracking-wide text-gray-800'>
                  Notes
                </h3>
              </div>
              <p className='text-sm text-gray-600 leading-relaxed mb-3'>
                One place for all your thoughts, prep, and follow-ups. Saved
                locally per program.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className='w-full min-h-[160px] rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:border-[#F6B72D] focus:ring-2 focus:ring-[#F6B72D]/30 outline-none'
                placeholder='Type notes...'
              />
              <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
                <span>
                  {activeProgram
                    ? `Program: ${activeProgram.name}`
                    : 'No program selected'}
                </span>
                <span>
                  {notesSavedAt
                    ? `Saved ${notesSavedAt.toLocaleTimeString()}`
                    : 'Not saved yet'}
                </span>
              </div>
              <div className='mt-3 flex gap-3'>
                <button
                  onClick={() => saveNotes(activeProgram, notes)}
                  className='inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F6B72D] text-black text-sm font-semibold hover:bg-[#e6b82a]'
                >
                  <Save className='w-4 h-4' /> Save notes
                </button>
                {activeProgram &&
                  (canAccessActiveProgramWorkspace ? (
                    <Link
                      to={activeProgramWorkspaceLink}
                      className='text-sm text-[#1a2332] font-semibold hover:text-[#F6B72D]'
                    >
                      Open workspace →
                    </Link>
                  ) : (
                    <span className='text-sm text-gray-400 cursor-not-allowed font-semibold'>
                      Open workspace →
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Program quick access rail */}
          <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px]'>
            <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm h-full'>
              <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
                <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                  Programs
                </span>
                <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                  {selectablePrograms.length}
                </span>
              </div>
              <div className='max-h-[580px] overflow-y-auto divide-y divide-gray-100'>
                {selectablePrograms.length ? (
                  selectablePrograms.map((program, idx) => {
                    const isActive =
                      String(activeProgram?.id) === String(program.id)
                    const programWorkspaceLink = getProgramWorkspaceLink(program)
                    const cardClassName = `block w-full text-left px-4 py-3 transition-colors ${isActive
                      ? 'bg-[#F6B72D]/15 text-black border-l-4 border-[#F6B72D]'
                      : 'hover:bg-[#F6B72D]/10'
                      }`
                    const content = (
                      <>
                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                          Program {idx + 1}
                        </p>
                        <p className='text-sm font-semibold truncate'>
                          {program.name || program.title || 'Program'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {program.isEnrolled
                            ? `Enrolled ${formatDate(program.enrolledOn || program.enrolled_on)}`
                            : 'Not enrolled'}
                        </p>
                      </>
                    )

                    if (programWorkspaceLink !== '#') {
                      return (
                        <Link
                          key={program.id || `${program.name}-${idx}`}
                          to={programWorkspaceLink}
                          onClick={() => setActiveProgramId(program.id)}
                          className={cardClassName}
                        >
                          {content}
                        </Link>
                      )
                    }

                    return (
                      <button
                        type='button'
                        key={program.id || `${program.name}-${idx}`}
                        onClick={() => openIntroModalForLockedProgram(program)}
                        className={cardClassName}
                        title='Enroll to access this program overview.'
                      >
                        {content}
                      </button>
                    )
                  })
                ) : (
                  <div className='px-4 py-6 text-sm text-gray-500'>
                    No programs available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-stretch'>
          <div className='col-span-12 xl:col-span-8'>
            <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm space-y-6'>
              <div className='space-y-3'>
                <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D] font-semibold'>
                  Dashboard Access
                </p>
                <h2 className='text-2xl sm:text-3xl font-extrabold text-gray-900'>
                  Full program materials unlock after payment confirmation
                </h2>
                <p className='text-sm sm:text-base text-gray-600 font-exo'>
                  You can review demo videos here while your account remains in
                  overview-only mode. Scheduling, workspace files, products, and
                  chat unlock after payment and confirmation are complete.
                </p>
              </div>

              <div className='rounded-2xl border-2 border-[#F6B72D] bg-[#0f172a] text-white p-6 shadow-lg space-y-4'>
                <div>
                  <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D]'>
                    Selected Demo
                  </p>
                  <h3 className='text-2xl font-extrabold mt-2'>
                    {activeProgram?.name || activeProgram?.title || 'Program demo'}
                  </h3>
                  <p
                    className='text-sm text-white/75 mt-2'
                    dangerouslySetInnerHTML={{
                      __html:
                        activeProgram?.shortDescription ||
                        activeProgram?.short_description ||
                        activeProgram?.description ||
                        'Preview the introduction video for this program.',
                    }}
                  />
                </div>
                <div className='flex flex-wrap gap-3'>
                  <button
                    type='button'
                    onClick={() => openIntroModalForLockedProgram(activeProgram)}
                    disabled={!activeProgram}
                    className='inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-[#F6B72D] text-black hover:bg-[#e6b82a] disabled:opacity-60 disabled:cursor-not-allowed'
                  >
                    <Play className='w-4 h-4 mr-2' />
                    Watch Demo Video
                  </button>
                  <span className='inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 text-white/85'>
                    Access Level: Overview Only
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='rounded-xl border border-gray-200 p-4 bg-gray-50'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>
                    Current Status
                  </p>
                  <p className='text-lg font-semibold text-gray-900 mt-2'>
                    {clientProgramStatus === 'paid'
                      ? 'Paid'
                      : 'Awaiting Payment Confirmation'}
                  </p>
                  <p className='text-sm text-gray-600 mt-2'>
                    Your account can review overview content only until payment
                    confirmation is complete.
                  </p>
                </div>
                <div className='rounded-xl border border-gray-200 p-4 bg-gray-50'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>
                    Next Step
                  </p>
                  <p className='text-lg font-semibold text-gray-900 mt-2'>
                    Complete payment and watch for confirmation
                  </p>
                  <p className='text-sm text-gray-600 mt-2'>
                    Once payment is confirmed, the full client workspace and
                    schedule tools will unlock automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='col-span-12 xl:col-span-4 flex flex-col gap-6 xl:self-stretch xl:min-h-0'>
            <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-5 shadow-sm'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-xs uppercase tracking-[0.18em] text-gray-500 font-semibold'>
                    Discovery Call
                  </p>
                  <h3 className='text-lg font-extrabold text-gray-900 mt-1'>
                    {discoveryCall?.title || 'No discovery call scheduled'}
                  </h3>
                </div>
                <CalendarDays className='w-5 h-5 text-[#1a2332] shrink-0' />
              </div>
              <div className='mt-4 flex items-center gap-2 text-sm text-gray-700'>
                <Clock className='w-4 h-4 text-[#F6B72D] shrink-0' />
                <span className='font-semibold'>
                  {discoveryCall
                    ? formatMeetingDateTime(
                        discoveryCallDateValue,
                        discoveryCall?.time,
                      )
                    : 'Time not scheduled yet'}
                </span>
              </div>
              {discoveryCall?.salesAdvisor && (
                <p className='mt-2 text-sm text-gray-600'>
                  Sales Influencer: {discoveryCall.salesAdvisor}
                </p>
              )}
              <div className='mt-4'>
                {canJoinDiscoveryCall ? (
                  <Link
                    to={`/client/meeting/${discoveryCall.id}`}
                    className='inline-flex w-full items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                  >
                    <Play className='w-4 h-4 mr-2' />
                    Join Discovery Call
                  </Link>
                ) : (
                  <span className='inline-flex w-full items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed'>
                    <Play className='w-4 h-4 mr-2' />
                    {discoveryCall?.id
                      ? 'Available on Meeting Day'
                      : 'Awaiting Schedule'}
                  </span>
                )}
              </div>
            </div>

            <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm overflow-hidden flex flex-col xl:flex-1 xl:min-h-0'>
              <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
                <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                  Program Demos
                </span>
                <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                  {selectablePrograms.length}
                </span>
              </div>
              <div className='max-h-[420px] xl:max-h-none xl:flex-1 xl:min-h-0 overflow-y-auto divide-y divide-gray-100'>
                {selectablePrograms.length ? (
                  selectablePrograms.map((program, idx) => {
                    const isActive =
                      String(activeProgram?.id) === String(program.id)

                    return (
                      <button
                        type='button'
                        key={program.id || `${program.name}-${idx}`}
                        onClick={() => openIntroModalForLockedProgram(program)}
                        className={`block w-full text-left px-4 py-3 transition-colors ${isActive
                          ? 'bg-[#F6B72D]/15 text-black border-l-4 border-[#F6B72D]'
                          : 'hover:bg-[#F6B72D]/10'
                          }`}
                        title='Open demo video.'
                      >
                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                          Program {idx + 1}
                        </p>
                        <p className='text-sm font-semibold truncate'>
                          {program.name || program.title || 'Program'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Demo video only
                        </p>
                      </button>
                    )
                  })
                ) : (
                  <div className='px-4 py-6 text-sm text-gray-500'>
                    No program demos available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics row */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <MetricCard
          title='PROGRAMS ENROLLED'
          value={overviewData?.programsEnrolled?.toString() || '0'}
        />
        <MetricCard
          title='EBOOKS BOUGHT'
          value={overviewData?.ebooksBought?.toString() || '0'}
        />
        <MetricCard
          title='MEETINGS TODAY'
          value={overviewData?.meetingsToday?.toString() || '0'}
          subtext={getMeetingSubtext()}
        />
      </div>

      {hasFullDashboardAccess && (
        <>
          {/* Upcoming meetings table */}
          <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-extrabold text-gray-900'>
                Upcoming Meetings
              </h3>
              <span className='text-sm text-gray-600'>
                Join your next session in one click
              </span>
            </div>
            {upcomingMeetings.length === 0 ? (
              <p className='text-sm text-gray-600'>
                No upcoming meetings scheduled. Check back soon.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 text-xs sm:text-sm'>
                  <thead className='bg-[#F6B72D]'>
                    <tr>
                      <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                        Date
                      </th>
                      <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                        Time
                      </th>
                      <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                        Title
                      </th>
                      <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                        Advisor
                      </th>
                      <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100 font-exo'>
                    {paginatedMeetings.map((meeting, index) => (
                      <tr key={`${meeting.date}-${meeting.id || index}`}>
                        <td className='px-3 sm:px-4 py-2 text-gray-900 font-medium'>
                          {new Date(meeting.date).toLocaleDateString()}
                        </td>
                        <td className='px-3 sm:px-4 py-2 text-gray-700'>
                          {meeting.time || 'TBD'}
                        </td>
                        <td className='px-3 sm:px-4 py-2 text-gray-900'>
                          {meeting.title || meeting.program || 'Scheduled Meeting'}
                        </td>
                        <td className='px-3 sm:px-4 py-2 text-gray-700'>
                          {meeting.advisor || meeting.salesAdvisor || '—'}
                        </td>
                        <td className='px-3 sm:px-4 py-2'>
                          <Link
                            to={meeting.id ? `/client/meeting/${meeting.id}` : '#'}
                            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${meeting.id
                              ? 'bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            Join
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className='flex items-center justify-end gap-3 mt-4 text-sm'>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <span className='text-gray-700'>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className='px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions row */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Link
              to={
                activeProgram && activeProgramWorkspaceLink !== '#'
                  ? activeProgramWorkspaceLink
                  : URLS.client.programs
              }
              className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
            >
              <div>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  File Sharing
                </p>
                <p className='text-base font-semibold text-gray-900'>
                  Upload / Download
                </p>
              </div>
              <div className='flex gap-2 text-[#1a2332]'>
                <FileUp className='w-5 h-5' />
                <FileDown className='w-5 h-5' />
              </div>
            </Link>

            <Link
              to={URLS.client.calendar}
              className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
            >
              <div>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Calendar
                </p>
                <p className='text-base font-semibold text-gray-900'>
                  View Schedule
                </p>
              </div>
              <CalendarDays className='w-6 h-6 text-[#1a2332]' />
            </Link>

            <Link
              to={URLS.client.chat}
              className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
            >
              <div>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Chat
                </p>
                <p className='text-base font-semibold text-gray-900'>
                  Message Coach
                </p>
              </div>
              <MessageSquare className='w-6 h-6 text-[#1a2332]' />
            </Link>

            <Link
              to={URLS.logout}
              className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
            >
              <div>
                <p className='text-xs uppercase tracking-wide text-gray-500'>
                  Account
                </p>
                <p className='text-base font-semibold text-gray-900'>Log out</p>
              </div>
              <LogOut className='w-6 h-6 text-[#1a2332]' />
            </Link>
          </div>
        </>
      )}

      {isIntroModalOpen && (
        <>
          <div
            className='fixed inset-0 z-40 bg-black/60'
            onClick={closeIntroModal}
          />
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='w-full max-w-4xl bg-white border-2 border-[#F6B72D] rounded-xl shadow-2xl overflow-hidden'>
              <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200'>
                <h3 className='text-base sm:text-lg font-bold text-gray-900'>
                  {introModalTitle} Demo Video
                </h3>
                <button
                  type='button'
                  onClick={closeIntroModal}
                  className='p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  aria-label='Close intro video'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>
              <div className='p-4 sm:p-6'>
                {introModalLoading ? (
                  <div className='flex justify-center items-center h-64'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
                  </div>
                ) : introModalVideoUrl ? (
                  <video
                    controls
                    className='w-full max-h-[70vh] rounded-lg bg-black'
                    src={introModalVideoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className='text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4'>
                    {introModalError ||
                      'Intro video is not available for this program yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
