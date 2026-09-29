import { useState, useEffect, useMemo, useCallback } from 'react'
import { MetricCard } from '@/components/MetricCard'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getAssetUrl } from '@/lib/utils'
import {
  CalendarDays,
  LogOut,
  MessageSquare,
  NotebookText,
  Play,
  Save,
  Users,
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

export default function CoachingDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [programs, setPrograms] = useState([])
  const [allPrograms, setAllPrograms] = useState([])
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [activeProgramModules, setActiveProgramModules] = useState([])
  const [notes, setNotes] = useState('')
  const [notesSavedAt, setNotesSavedAt] = useState(null)

  const downloadFile = useCallback(async (file) => {
    const fileUrl = getAssetUrl(file?.fileUrl || file?.url || file?.file)
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
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const [
          response,
          calendarThisMonth,
          calendarNextMonth,
          allProgramsResponse,
        ] = await Promise.all([
          authService.getCoachingDashboard(),
          authService.getCoachingCalendar({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
          authService.getCoachingCalendar({
            year: nextMonth.getFullYear(),
            month: nextMonth.getMonth() + 1,
          }),
          authService.getAllPrograms(),
        ])
        setDashboardData(response)
        const mergedCalendar = mergeCalendarMonths(
          calendarThisMonth,
          calendarNextMonth,
        )
        const meetingsList = extractUpcomingMeetings(mergedCalendar)
        setUpcomingMeetings(meetingsList)
        const allProgramsList =
          allProgramsResponse?.programs || allProgramsResponse || []
        setAllPrograms(allProgramsList)

        const mergedPrograms = mergePrograms(
          response?.programs,
          response?.clients,
          mergedCalendar,
        )
        const sortedPrograms = sortProgramsByEnrollment(mergedPrograms)
        setPrograms(sortedPrograms)
        const fallbackPrograms = sortedPrograms.length
          ? sortedPrograms
          : allProgramsList
        setActiveProgramId(
          fallbackPrograms[0]?.id ?? fallbackPrograms[0]?.uuid ?? null,
        )
        setCurrentPage(1)
      } catch (error) {
        console.error('Failed to fetch coaching dashboard data:', error)
        toast.error('Failed to load dashboard data')
        setPrograms([])
        setAllPrograms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      })),
    )

    return flattened
      .filter((meeting) => meeting.dateTime)
      .sort((a, b) => b.dateTime - a.dateTime)
  }

  const extractProgramsFromCalendar = (calendarData) => {
    const calendar = calendarData?.meetings || calendarData
    if (!calendar || typeof calendar !== 'object') return []

    return Object.values(calendar)
      .flatMap((list) => list || [])
      .map((meeting) => ({
        id:
          meeting.programId ||
          meeting.program_id ||
          meeting.serviceId ||
          meeting.service_id ||
          meeting.program ||
          meeting.title,
        name:
          meeting.program || meeting.programName || meeting.title || 'Program',
        clientName: meeting.clientName,
        enrolledOn: meeting.enrolledOn || meeting.enrolled_on,
      }))
      .filter((p) => p.id || p.name)
  }

  const mergePrograms = (programArray, clientsArray, calendarData) => {
    const fromPrograms = programArray || []
    const fromClients = (clientsArray || []).flatMap((client) =>
      (client.programs || []).map((program) => ({
        ...program,
        clientName:
          client.name ||
          `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      })),
    )
    const fromCalendar = extractProgramsFromCalendar(calendarData)
    const merged = [...fromPrograms, ...fromClients, ...fromCalendar]
    const unique = []
    const seen = new Set()

    merged.forEach((program) => {
      const key = program.id ? `id-${program.id}` : `name-${program.name}`
      if (!key || seen.has(key)) return
      seen.add(key)
      unique.push(program)
    })

    return unique
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

  const selectablePrograms = useMemo(() => {
    const sourcePrograms = programs.length ? programs : allPrograms
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
      })
    })

    return uniquePrograms
  }, [allPrograms, programs])

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

  const extractModulesFromProgram = (program) => {
    if (!program) return []
    const modules =
      program.modules ||
      program.chapters ||
      program.lessons ||
      program.sections ||
      program.program_chapters ||
      []
    return Array.isArray(modules) ? modules : []
  }

  useEffect(() => {
    setActiveProgramModules(extractModulesFromProgram(activeProgram))
  }, [activeProgram])

  const sessionsForActiveProgram = useMemo(() => {
    if (!upcomingMeetings.length) return []
    if (!activeProgram) return upcomingMeetings
    const filtered = upcomingMeetings.filter((meeting) =>
      belongsToProgram(meeting, activeProgram),
    )
    return filtered.length ? filtered : upcomingMeetings
  }, [activeProgram, upcomingMeetings])

  const nextMeeting = useMemo(() => {
    const sorted = [...sessionsForActiveProgram].sort(
      (a, b) => a.dateTime - b.dateTime,
    )
    if (sorted.length) return sorted[0]
    return [...upcomingMeetings].sort((a, b) => a.dateTime - b.dateTime)[0]
  }, [sessionsForActiveProgram, upcomingMeetings])

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

  const coachingInfluencersDisplay = useMemo(() => {
    const merged = [
      ...extractPersonNames(activeProgram?.assignedAdvisors),
      ...extractPersonNames(activeProgram?.coachingInfluencers),
      ...extractPersonNames(dashboardData?.coachingInfluencers),
      ...extractPersonNames(dashboardData?.coaching_influencers),
      ...extractPersonNames(dashboardData?.advisors),
      ...sessionsForActiveProgram.flatMap((meeting) =>
        extractPersonNames(meeting?.advisor || meeting?.otherTrainers),
      ),
    ]
    const normalized = uniqueNames(merged)
    return normalized.length ? normalized.join(' & ') : '—'
  }, [activeProgram, dashboardData, sessionsForActiveProgram])

  const salesInfluencerDisplay = useMemo(() => {
    const merged = [
      ...extractPersonNames(activeProgram?.salesInfluencer),
      ...extractPersonNames(activeProgram?.sales_influencer),
      ...extractPersonNames(activeProgram?.salesAdvisor),
      ...extractPersonNames(activeProgram?.sales_advisor),
      ...extractPersonNames(dashboardData?.salesInfluencer),
      ...extractPersonNames(dashboardData?.sales_influencer),
      ...extractPersonNames(dashboardData?.salesAdvisor),
      ...extractPersonNames(dashboardData?.sales_advisor),
      ...extractPersonNames(dashboardData?.salesInfluencers),
    ]
    const normalized = uniqueNames(merged)
    return normalized[0] || '—'
  }, [activeProgram, dashboardData])

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
      { label: 'Client', value: activeProgram?.clientName || activeProgram?.client },
      { label: 'Status', value: activeProgram?.status },
      {
        label: 'Enrollment',
        value: formatDate(activeProgram?.enrolledOn || activeProgram?.enrolled_on),
      },
      { label: 'Sales Influencer', value: salesInfluencerDisplay },
      { label: 'Coaching Influencers', value: coachingInfluencersDisplay },
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
    activeProgramModules,
    coachingInfluencersDisplay,
    salesInfluencerDisplay,
  ])

  const loadNotes = (program) => {
    try {
      const raw = localStorage.getItem('coaching_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      return parsed[key] || ''
    } catch (err) {
      console.warn('Unable to read coaching notes from storage', err)
      return ''
    }
  }

  const saveNotes = (program, value) => {
    try {
      const raw = localStorage.getItem('coaching_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      parsed[key] = value
      localStorage.setItem('coaching_notes_v1', JSON.stringify(parsed))
      setNotesSavedAt(new Date())
    } catch (err) {
      console.warn('Unable to save coaching notes', err)
    }
  }

  useEffect(() => {
    setNotes(loadNotes(activeProgram))
  }, [activeProgram])

  const clientsAssigned = dashboardData?.clientsAssigned ?? 24
  const clientsMeetingToday = dashboardData?.clientsMeetingToday ?? 1
  const activeClientId =
    activeProgram?.clientId || activeProgram?.client_id || null
  const activeClientLink = activeClientId
    ? `/coaching-dashboard/clients/${activeClientId}`
    : URLS.coaching.clients

  if (isLoading) {
    return (
      <div className='max-w-7xl mx-auto space-y-8'>
        <h1 className='text-3xl font-bold uppercase tracking-wide text-black'>
          OVERVIEW
        </h1>
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto space-y-8'>
      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex-1 min-w-[220px]'>
            <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D] font-semibold'>
              <span style={HERO_TAGLINE_OUTLINE}>
                The CEO Influencers • Building Better Leaders
              </span>
            </p>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900'>
              Coaching Dashboard
            </h1>
            <p className='text-lg font-exo text-gray-600'>
              Oversee programs, sessions, and client progress in one view.
            </p>
          </div>
          <div className='w-full sm:w-auto self-center'>
            <div className='bg-[#0f172a] text-white rounded-lg px-4 py-3 text-sm sm:text-base font-semibold space-y-1'>
              <p className='text-sm sm:text-base font-semibold'>
                Program 1:{' '}
                {activeProgram?.name || activeProgram?.title || 'Learning Sessions'}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Sales Influencer: {salesInfluencerDisplay}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Coaching Influencers: {coachingInfluencersDisplay}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Client: {activeProgram?.clientName || '—'}
              </p>
              {activeProgram && (
                <Link
                  to={activeClientLink}
                  className='inline-flex text-xs sm:text-sm font-semibold text-[#F6B72D] hover:text-[#e6b82a]'
                >
                  View Client →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12 gap-6'>
        {/* Learning sessions rail */}
        <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px] self-start'>
          <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm h-[744px] max-h-[744px] flex flex-col overflow-hidden'>
            <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
              <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                Learning Modules
              </span>
              <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                {activeProgramContent.length}
              </span>
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
                        className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${
                          item.files?.length ? '' : 'cursor-default'
                        }`}
                        onClick={() => handleModuleDownload(item)}
                      >
                        {content}
                      </button>
                    )
                  }

                  return (
                    <div
                      key={`${item.title}-${idx}`}
                      className='block px-4 py-3 hover:bg-gray-50'
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
                  Program 1:{' '}
                  {activeProgram?.name || activeProgram?.title || 'Learning Sessions'}
                </p>
                <h3 className='text-base sm:text-lg font-semibold mt-3 leading-tight'>
                  {nextMeeting
                    ? nextMeeting.title || 'Upcoming Live Session'
                    : 'No live session scheduled'}
                </h3>
                <p className='text-sm text-white/70 mt-1'>
                  {nextMeeting
                    ? `${formatDate(nextMeeting.date)} · ${nextMeeting.time || 'TBD'}`
                    : 'We will notify you when a session is added.'}
                </p>
                {nextMeeting?.clientName && (
                  <p className='text-xs text-white/60 mt-1'>
                    Client: {nextMeeting.clientName}
                  </p>
                )}
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3 mt-4'>
              <Link
                to={
                  nextMeeting?.id ? `/coaching/meeting/${nextMeeting.id}` : '#'
                }
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  nextMeeting?.id
                    ? 'bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                    : 'bg-white/10 text-white cursor-not-allowed'
                }`}
              >
                <Play className='w-4 h-4 mr-2' />
                {nextMeeting?.id ? 'Join Meeting' : 'Awaiting Schedule'}
              </Link>
              <Link
                to={activeClientLink}
                className='text-sm text-white/80 hover:text-[#F6B72D]'
              >
                Open Client Workspace →
              </Link>
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
              One place for coaching outcomes, prep, and follow-ups. Saved
              locally per program.
            </p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className='w-full min-h-[160px] rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:border-[#F6B72D] focus:ring-2 focus:ring-[#F6B72D]/30 outline-none'
              placeholder='Type notes...'
            />
            <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
              <span>
                {activeProgram
                  ? `Program: ${activeProgram.name || activeProgram.title}`
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
                type='button'
                onClick={() => saveNotes(activeProgram, notes)}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F6B72D] text-black text-sm font-semibold hover:bg-[#e6b82a]'
              >
                <Save className='w-4 h-4' /> Save notes
              </button>
              <Link
                to={activeClientLink}
                className='text-sm text-[#1a2332] font-semibold hover:text-[#F6B72D]'
              >
                Open client workspace →
              </Link>
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
            <div className='divide-y divide-gray-100'>
              {selectablePrograms.length ? (
                selectablePrograms.slice(0, 9).map((program, idx) => {
                  const isActive =
                    String(activeProgram?.id) === String(program.id)
                  return (
                    <button
                      type='button'
                      key={program.id || `${program.name}-${idx}`}
                      onClick={() => setActiveProgramId(program.id)}
                      className={`block w-full text-left px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-[#F6B72D]/15 text-black border-l-4 border-[#F6B72D]'
                          : 'hover:bg-[#F6B72D]/10'
                      }`}
                    >
                      <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Program {idx + 1}
                      </p>
                      <p className='text-sm font-semibold truncate'>
                        {program.name || program.title || 'Program'}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {program.clientName
                          ? `Client: ${program.clientName}`
                          : 'Assigned Program'}
                      </p>
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

      {/* Metrics row */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <MetricCard
          title='CLIENTS ASSIGNED'
          value={clientsAssigned.toString()}
        />
        <MetricCard
          title='CLIENT MEETINGS TODAY'
          value={clientsMeetingToday.toString()}
        />
        <MetricCard
          title='ACTIVE PROGRAMS'
          value={selectablePrograms.length.toString()}
        />
      </div>

      {/* Upcoming meetings table */}
      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-extrabold text-gray-900'>
            Upcoming Meetings
          </h3>
          <span className='text-sm text-gray-600'>
            Keep track of upcoming sessions
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
                    Client
                  </th>
                  <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                    Program
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
                      {meeting.clientName || meeting.client || '—'}
                    </td>
                    <td className='px-3 sm:px-4 py-2 text-gray-700'>
                      {meeting.program || meeting.title || '—'}
                    </td>
                    <td className='px-3 sm:px-4 py-2'>
                      <Link
                        to={
                          meeting.id ? `/coaching/meeting/${meeting.id}` : '#'
                        }
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${
                          meeting.id
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
          to={URLS.coaching.clients}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Clients
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Manage Assignments
            </p>
          </div>
          <Users className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.coaching.calendar}
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
          to={URLS.chat}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Chat
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Message Clients
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
    </div>
  )
}
