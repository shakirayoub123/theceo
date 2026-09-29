import { MetricCard } from '@/components/MetricCard'
import { URLS } from '@/config/urls'
import authService from '@/services/authService'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  NotebookText,
  Play,
  Save,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'

const PAGE_SIZE = 8
const HERO_TAGLINE_OUTLINE = {
  WebkitTextStroke: '1px rgba(0, 0, 0, 0.75)',
  paintOrder: 'stroke fill',
}

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return 'TBD'
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTrendMonth = (monthValue) => {
  if (monthValue == null || monthValue === '') return 'This Month'

  const monthAsNumber = Number(monthValue)
  if (Number.isInteger(monthAsNumber) && monthAsNumber >= 1 && monthAsNumber <= 12) {
    return new Date(2000, monthAsNumber - 1, 1).toLocaleString('en-US', {
      month: 'long',
    })
  }

  const normalizedMonth = String(monthValue).trim().replace(/\.$/, '')
  const parsed = new Date(`${normalizedMonth} 1, 2000`)
  if (Number.isNaN(parsed.getTime())) return String(monthValue)

  return parsed.toLocaleString('en-US', {
    month: 'long',
  })
}

const getShortPreview = (value, maxWords = 10) => {
  const plainText = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (!plainText) return ''
  const words = plainText.split(' ')
  if (words.length <= maxWords) return plainText
  return `${words.slice(0, maxWords).join(' ')}...`
}

const extractAdvisorNames = (advisors) => {
  if (!Array.isArray(advisors)) return []
  return advisors
    .map((advisor) => {
      if (!advisor) return ''
      if (typeof advisor === 'string') return advisor.trim()
      const fromName = advisor.name || advisor.full_name || advisor.fullName
      if (fromName) return String(fromName).trim()
      const assembled =
        `${advisor.first_name || ''} ${advisor.last_name || ''}`.trim()
      return assembled || advisor.username || ''
    })
    .map((name) => String(name || '').trim())
    .filter(Boolean)
}

const toDateTime = (dateString, timeString) => {
  if (!dateString) return null
  if (!timeString) return new Date(dateString)
  const [time, meridian] = String(timeString).split(' ')
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

const extractUpcomingMeetings = (calendarData) => {
  const calendar = calendarData?.meetings || calendarData
  if (!calendar || typeof calendar !== 'object') return []

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

const buildPrograms = (programResponse, meetings) => {
  const fromApiRaw = programResponse?.programs || programResponse || []
  const fromApi = (Array.isArray(fromApiRaw) ? fromApiRaw : []).map(
    (program) => ({
      id:
        program.id ||
        program.uuid ||
        `program-${program.title || program.name}`,
      name: program.title || program.name || 'Program',
      status: program.status || 'active',
      order: program.order,
      createdAt: program.createdAt || program.created_at,
      enrolledClients:
        program.enrolledClients ?? program.enrolled_clients_count,
      durationWeeks: program.duration_weeks,
      difficultyLevel: program.difficulty_level,
      category: program.category,
      price: program.price,
      assignedAdvisors: program.assignedAdvisors || program.advisors || [],
      comingSoon: program.comingSoon ?? program.coming_soon ?? false,
      shortDesc: program.shortDesc || program.short_description,
      modules:
        program.modules ||
        program.chapters ||
        program.lessons ||
        program.sections ||
        program.program_chapters ||
        [],
    }),
  )

  const seenNames = new Set(
    fromApi.map((program) => normalizeText(program.name)),
  )
  const fromMeetings = []

    ; (meetings || []).forEach((meeting) => {
      const programName =
        meeting.program ||
        meeting.programName ||
        meeting.title ||
        'General Consultation'
      const normalized = normalizeText(programName)
      if (!normalized || seenNames.has(normalized)) return
      seenNames.add(normalized)
      fromMeetings.push({
        id: `calendar-${normalized.replace(/[^a-z0-9]+/g, '-')}`,
        name: programName,
        status: 'scheduled',
        assignedAdvisors: [],
        modules: [],
      })
    })

  return [...fromApi, ...fromMeetings].sort((a, b) => {
    const aOrder = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
    const bOrder = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder

    const aDate = new Date(a.createdAt || 0)
    const bDate = new Date(b.createdAt || 0)
    return bDate - aDate
  })
}

const belongsToProgram = (meeting, program) => {
  if (!program) return false
  const programId = String(program.id || '')
  const programName = normalizeText(program.name)

  const candidateIds = [
    meeting.programId,
    meeting.program_id,
    meeting.serviceId,
    meeting.service_id,
  ]
    .filter(Boolean)
    .map((id) => String(id))

  if (programId && candidateIds.includes(programId)) return true

  const candidateNames = [
    meeting.program,
    meeting.programName,
    meeting.title,
    meeting.name,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value))

  return candidateNames.some((name) => {
    if (!name || !programName) return false
    return (
      name === programName ||
      name.includes(programName) ||
      programName.includes(name)
    )
  })
}

export default function SalesDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [programs, setPrograms] = useState([])
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [notes, setNotes] = useState('')
  const [notesSavedAt, setNotesSavedAt] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError('')
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const [
          dashboard,
          calendarThisMonth,
          calendarNextMonth,
          allProgramsResponse,
        ] = await Promise.all([
          authService.getSalesDashboard(),
          authService.getSalesCalendar({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
          authService.getSalesCalendar({
            year: nextMonth.getFullYear(),
            month: nextMonth.getMonth() + 1,
          }),
          authService.getSalesAllPrograms(),
        ])

        const mergedCalendar = {
          ...(calendarThisMonth || {}),
          ...(calendarNextMonth || {}),
        }
        const meetingsList = extractUpcomingMeetings(mergedCalendar)
        const mergedPrograms = buildPrograms(allProgramsResponse, meetingsList)

        setDashboardData(dashboard)
        setUpcomingMeetings(meetingsList)
        setPrograms(mergedPrograms)
        setActiveProgramId(mergedPrograms[0]?.id ?? null)
        setCurrentPage(1)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const activeProgram = useMemo(() => {
    if (!programs.length) return null
    if (activeProgramId == null) return programs[0]
    return (
      programs.find(
        (program) => String(program.id) === String(activeProgramId),
      ) || programs[0]
    )
  }, [activeProgramId, programs])

  const sessionsForActiveProgram = useMemo(() => {
    if (!upcomingMeetings.length) return []
    if (!activeProgram) return upcomingMeetings
    const filtered = upcomingMeetings.filter((meeting) =>
      belongsToProgram(meeting, activeProgram),
    )
    return filtered.length ? filtered : upcomingMeetings
  }, [activeProgram, upcomingMeetings])

  const nextMeeting = useMemo(() => {
    const now = new Date()
    const sortedActive = [...sessionsForActiveProgram].sort(
      (a, b) => a.dateTime - b.dateTime,
    )
    const nextFromActive = sortedActive.find(
      (meeting) => meeting.dateTime >= now,
    )
    if (nextFromActive) return nextFromActive
    if (sortedActive.length) return sortedActive[0]

    const sortedAll = [...upcomingMeetings].sort(
      (a, b) => a.dateTime - b.dateTime,
    )
    return sortedAll.find((meeting) => meeting.dateTime >= now) || sortedAll[0]
  }, [sessionsForActiveProgram, upcomingMeetings])

  const coachingInfluencersDisplay = useMemo(() => {
    const fromProgram = extractAdvisorNames(activeProgram?.assignedAdvisors)

    const fromMeetings = sessionsForActiveProgram
      .flatMap((meeting) =>
        String(meeting.advisor || '')
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean),
      )
      .filter((name, idx, arr) => arr.indexOf(name) === idx)

    const names = [...fromProgram, ...fromMeetings].filter(
      (name, idx, arr) => name && arr.indexOf(name) === idx,
    )

    return names.join(' & ') || '—'
  }, [activeProgram?.assignedAdvisors, sessionsForActiveProgram])

  const salesInfluencerDisplay = useMemo(() => {
    try {
      const rawStored =
        localStorage.getItem('user') || localStorage.getItem('currentUser')
      const stored = rawStored ? JSON.parse(rawStored) : null
      const fullName =
        stored?.full_name ||
        stored?.name ||
        `${stored?.first_name || ''} ${stored?.last_name || ''}`.trim()
      return (
        fullName ||
        stored?.username ||
        dashboardData?.salesInfluencer ||
        '—'
      )
    } catch {
      return dashboardData?.salesInfluencer || '—'
    }
  }, [dashboardData?.salesInfluencer])

  const activeProgramContent = useMemo(() => {
    if (!activeProgram) return []

    const modules =
      activeProgram.modules ||
      activeProgram.chapters ||
      activeProgram.lessons ||
      activeProgram.sections ||
      activeProgram.program_chapters ||
      []

    if (!Array.isArray(modules) || modules.length === 0) return []

    return modules.slice(0, 12).map((module, idx) => ({
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
        module?.subtitle ||
        module?.content ||
        null,
    }))
  }, [activeProgram])

  const loadNotes = (program) => {
    try {
      const raw = localStorage.getItem('sales_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      return parsed[key] || ''
    } catch (err) {
      console.warn('Unable to read sales notes from storage', err)
      return ''
    }
  }

  const saveNotes = (program, value) => {
    try {
      const raw = localStorage.getItem('sales_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      parsed[key] = value
      localStorage.setItem('sales_notes_v1', JSON.stringify(parsed))
      setNotesSavedAt(new Date())
    } catch (err) {
      console.warn('Unable to save sales notes', err)
    }
  }

  useEffect(() => {
    setNotes(loadNotes(activeProgram))
  }, [activeProgram])

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

  const totalClients = Number(dashboardData?.totalClients || 0)
  const activeClients = Number(dashboardData?.activeClients || 0)
  const awaitingPurchase = Number(dashboardData?.clientsAwaitingPurchase || 0)
  const activeRate =
    totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0
  const awaitingRate =
    totalClients > 0 ? Math.round((awaitingPurchase / totalClients) * 100) : 0
  const latestTrendPoint = Array.isArray(dashboardData?.clientTrend)
    ? dashboardData.clientTrend[dashboardData.clientTrend.length - 1]
    : null
  const latestTrendLabel = formatTrendMonth(latestTrendPoint?.month)
  const latestTrendClients = Number(latestTrendPoint?.clients || 0)

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Dashboard</p>
          <p className='text-sm'>{error}</p>
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
              Sales Dashboard
            </h1>
            <p className='text-lg font-exo text-gray-600'>
              Welcome back, {salesInfluencerDisplay} - your programs, meetings,
              and pipeline at a glance.
            </p>
          </div>
          <div className='w-full sm:w-auto self-center'>
            <div className='bg-[#0f172a] text-white rounded-lg px-4 py-3 text-sm sm:text-base font-semibold space-y-1'>
              <p className='text-sm sm:text-base font-semibold'>
                Program 1:{' '}
                {activeProgram?.name || 'Leadership Coaching Program'}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Sales Influencer: {salesInfluencerDisplay}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Coaching Influencers: {coachingInfluencersDisplay}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Pipeline: {totalClients} total - {activeClients} active -{' '}
                {awaitingPurchase} awaiting purchase
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12 gap-6'>
        <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px] self-start'>
          <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm'>
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
            <div className='max-h-[580px] overflow-y-auto divide-y divide-gray-100'>
              {activeProgramContent.length ? (
                activeProgramContent.map((item, idx) => {
                  const subtitlePreview = getShortPreview(item.subtitle, 10)
                  return (
                    <button
                      key={`${item.title}-${idx}`}
                      type='button'
                      onClick={(event) => event.preventDefault()}
                      className='block w-full px-4 py-3 text-left hover:bg-gray-50 cursor-default'
                    >
                      <p className='text-xs text-gray-500 uppercase'>
                        Module {idx + 1}
                      </p>
                      <p className='text-sm font-semibold text-gray-900 truncate'>
                        {item.title}
                      </p>
                      {subtitlePreview && (
                        <p className='text-xs text-gray-500 truncate mt-1'>
                          {subtitlePreview}
                        </p>
                      )}
                    </button>
                  )
                })
              ) : (
                <div className='px-4 py-6 text-sm text-gray-500'>
                  This program has no learning module.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='col-span-12 lg:col-span-6 xl:col-span-6 min-w-[320px] flex flex-col gap-4 h-full'>
          <div className='bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg min-h-[240px] flex flex-col justify-between border-2 border-[#F6B72D]'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl sm:text-3xl font-extrabold leading-tight'>
                  Video Meeting
                </h2>
                <p className='text-sm sm:text-base font-semibold text-[#F6B72D] mt-1'>
                  Program 1:{' '}
                  {activeProgram?.name || 'Leadership Coaching Program'}
                </p>
                <h3 className='text-base sm:text-lg font-semibold mt-3 leading-tight'>
                  {nextMeeting
                    ? nextMeeting.title || 'Upcoming Client Session'
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
                to={nextMeeting?.id ? `/client/meeting/${nextMeeting.id}` : '#'}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${nextMeeting?.id
                    ? 'bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                    : 'bg-white/10 text-white cursor-not-allowed'
                  }`}
              >
                <Play className='w-4 h-4 mr-2' />
                {nextMeeting?.id ? 'Join Meeting' : 'Awaiting Schedule'}
              </Link>
              <Link
                to={URLS.sales.calendar}
                className='text-sm text-white/80 hover:text-[#F6B72D]'
              >
                Open Calendar →
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
              One place for call prep, negotiation points, and follow-ups. Saved
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
              <Link
                to={URLS.sales.potentialLeads}
                className='text-sm text-[#1a2332] font-semibold hover:text-[#F6B72D]'
              >
                Open pipeline →
              </Link>
            </div>
          </div>
        </div>

        <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px]'>
          <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm h-full'>
            <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
              <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                Programs
              </span>
              <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                {programs.length}
              </span>
            </div>
            <div className='divide-y divide-gray-100'>
              {programs.length ? (
                programs.slice(0, 12).map((program, idx) => {
                  const isActive =
                    String(activeProgram?.id) === String(program.id)
                  return (
                    <button
                      key={program.id || `${program.name}-${idx}`}
                      onClick={() => setActiveProgramId(program.id)}
                      className={`block w-full text-left px-4 py-3 transition-colors ${isActive
                          ? 'bg-[#F6B72D]/15 text-black border-l-4 border-[#F6B72D]'
                          : 'hover:bg-[#F6B72D]/10'
                        }`}
                    >
                      <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Program {idx + 1}
                      </p>
                      <p className='text-sm font-semibold truncate'>
                        {program.name || 'Program'}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {program.createdAt
                          ? `Added ${formatDate(program.createdAt)}`
                          : 'Program selected'}
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

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <MetricCard title='TOTAL CLIENTS' value={totalClients.toString()} />
        <MetricCard title='ACTIVE CLIENTS' value={activeClients.toString()} />
        <MetricCard
          title='CLIENTS AWAITING PURCHASE'
          value={awaitingPurchase.toString()}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-4 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Active Client Rate
            </p>
            <p className='text-2xl font-extrabold text-gray-900'>
              {activeRate}%
            </p>
          </div>
          <Users className='w-6 h-6 text-[#1a2332]' />
        </div>

        <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-4 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Purchase-Ready Clients
            </p>
            <p className='text-2xl font-extrabold text-gray-900'>
              {awaitingRate}%
            </p>
          </div>
          <Target className='w-6 h-6 text-[#1a2332]' />
        </div>

        <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-4 shadow-sm flex items-center justify-between'>
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              {latestTrendLabel} New Clients
            </p>
            <p className='text-2xl font-extrabold text-gray-900'>
              {latestTrendClients}
            </p>
          </div>
          <UserPlus className='w-6 h-6 text-[#1a2332]' />
        </div>
      </div>

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
                    Client
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
                      {meeting.clientName || meeting.client_name || '—'}
                    </td>
                    <td className='px-3 sm:px-4 py-2 text-gray-700'>
                      {meeting.advisor || meeting.otherTrainers || '—'}
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
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
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

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Link
          to={URLS.sales.newClients}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Clients
            </p>
            <p className='text-base font-semibold text-gray-900'>New Clients</p>
          </div>
          <UserPlus className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.sales.existingClients}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Clients
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Existing Clients
            </p>
          </div>
          <Users className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.sales.potentialLeads}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Pipeline
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Potential Leads
            </p>
          </div>
          <Target className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.sales.calendar}
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
      </div>
    </div>
  )
}
