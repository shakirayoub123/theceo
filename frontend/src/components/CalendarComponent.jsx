import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, User, Briefcase, Calendar as CalendarIcon, Tag, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Determine meeting role and color coding:
 * - Sales is Yellow (#F6B72D)
 * - Coaching is Green (#10B981)
 * - Administrator is Red (#EF4444)
 */
export function getMeetingRoleDetails(meeting) {
  const staffRole = (
    meeting?.staff_role ||
    meeting?.role ||
    meeting?.my_role ||
    ''
  ).toLowerCase()

  const meetingType = (
    meeting?.meetingType ||
    meeting?.meeting_type ||
    ''
  ).toLowerCase()

  const title = (
    meeting?.title ||
    meeting?.meeting_title ||
    ''
  ).toLowerCase()

  const advisor = (
    meeting?.advisor ||
    meeting?.advisor_name ||
    meeting?.otherTrainers ||
    ''
  ).toLowerCase()

  const combined = `${staffRole} ${meetingType} ${title} ${advisor}`

  // 1. Check Administrator (Red)
  if (
    staffRole === 'admin' ||
    staffRole === 'administrator' ||
    staffRole === 'master' ||
    combined.includes('admin') ||
    combined.includes('executive') ||
    combined.includes('board') ||
    combined.includes('operations')
  ) {
    return {
      role: 'admin',
      label: 'Administrator',
      colorHex: '#EF4444',
      pillBg: 'bg-red-500 hover:bg-red-600 text-white border-red-600',
      badgeBg: 'bg-red-100 text-red-800 border-red-200',
      dotBg: 'bg-red-500',
      ringColor: 'ring-red-400',
    }
  }

  // 2. Check Coaching (Green)
  if (
    staffRole === 'coaching' ||
    staffRole === 'trainer' ||
    combined.includes('coaching') ||
    combined.includes('trainer') ||
    combined.includes('training') ||
    combined.includes('workout') ||
    combined.includes('session') ||
    combined.includes('1:1') ||
    combined.includes('assessment') ||
    combined.includes('review')
  ) {
    return {
      role: 'coaching',
      label: 'Coaching',
      colorHex: '#10B981',
      pillBg: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dotBg: 'bg-emerald-500',
      ringColor: 'ring-emerald-400',
    }
  }

  // 3. Sales (Yellow) - Default for sales, discovery, consultation
  return {
    role: 'sales',
    label: 'Sales',
    colorHex: '#F6B72D',
    pillBg: 'bg-[#F6B72D] hover:bg-[#e5a825] text-slate-950 font-semibold border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    dotBg: 'bg-amber-500',
    ringColor: 'ring-amber-400',
  }
}

export function CalendarComponent({
  meetings = {},
  onDateClick,
  meetingRouteBase = '/client/meeting',
  onMonthChange,
  showRoleLegend = true,
  allowRoleFilter = true,
  title = '',
}) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0, transform: '' })

  // Hover state for meeting appointments
  const [hoveredMeeting, setHoveredMeeting] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0, alignRight: false, showBelow: false })

  // Role filter: 'all' | 'sales' | 'coaching' | 'admin'
  const [activeRoleFilter, setActiveRoleFilter] = useState('all')

  // Normalize meetings input into { 'YYYY-MM-DD': [meetings...] }
  const normalizedMeetings = useMemo(() => {
    if (!meetings) return {}

    // Case 1: meetings is { meetings: [ { date: '...', meetings: [...] } ] }
    if (Array.isArray(meetings?.meetings)) {
      const map = {}
      meetings.meetings.forEach((day) => {
        if (day?.date) {
          map[day.date] = Array.isArray(day.meetings) ? day.meetings : []
        }
      })
      return map
    }

    // Case 2: meetings is [ { date: '...', meetings: [...] } ]
    if (Array.isArray(meetings)) {
      const map = {}
      meetings.forEach((day) => {
        if (day?.date) {
          map[day.date] = Array.isArray(day.meetings) ? day.meetings : []
        }
      })
      return map
    }

    // Case 3: meetings is { meetings_by_date: { ... } }
    if (meetings?.meetings_by_date && typeof meetings.meetings_by_date === 'object') {
      return meetings.meetings_by_date
    }

    // Case 4: meetings is { meetings: { ... } }
    if (meetings?.meetings && typeof meetings.meetings === 'object') {
      return meetings.meetings
    }

    // Case 5: meetings is directly { '2026-11-15': [ ... ] }
    if (typeof meetings === 'object') {
      return meetings
    }

    return {}
  }, [meetings])

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day,
    ).padStart(2, '0')}`
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    )
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    onMonthChange?.(newDate)
    setSelectedMeeting(null)
    setHoveredMeeting(null)
    setSelectedDay(null)
  }

  const handleMonthNavigation = (direction, event) => {
    event?.preventDefault()
    event?.stopPropagation()
    navigateMonth(direction)
  }

  // Handle hover on an appointment chip
  const handleMeetingMouseEnter = (meeting, event) => {
    if (!containerRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()

    const x = rect.left - containerRect.left + rect.width / 2
    const y = rect.top - containerRect.top

    // Check bounds: flip horizontally if close to right edge
    const alignRight = x + 160 > containerRect.width
    // Check vertical space: show below if too close to top
    const showBelow = y < 140

    setHoverPosition({
      x,
      y: showBelow ? rect.bottom - containerRect.top + 8 : y - 8,
      alignRight,
      showBelow,
    })
    setHoveredMeeting(meeting)
  }

  const handleMeetingMouseLeave = () => {
    setHoveredMeeting(null)
  }

  // Handle click on appointment to open persistent modal
  const handleMeetingClick = (meeting, event) => {
    event.stopPropagation()
    setHoveredMeeting(null)

    if (!containerRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()

    let x = rect.left - containerRect.left + rect.width / 2
    let y = rect.top - containerRect.top

    const popoverWidth = 320
    const popoverHeight = 260
    let transform = 'translate(-50%, -100%)'

    if (y - popoverHeight < 0) {
      y = rect.bottom - containerRect.top + 8
      transform = 'translate(-50%, 0)'
    }

    if (x - popoverWidth / 2 < 10) {
      x = popoverWidth / 2 + 10
    } else if (x + popoverWidth / 2 > containerRect.width - 10) {
      x = containerRect.width - popoverWidth / 2 - 10
    }

    setPopoverPosition({ x, y, transform })
    setSelectedMeeting(meeting)
  }

  const handleDateClick = (day) => {
    const dateKey = formatDateKey(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    )
    const dayMeetings = normalizedMeetings[dateKey] || []
    setSelectedDay(day)
    onDateClick?.(dateKey, dayMeetings)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
    )
    const daysInPrevMonth = getDaysInMonth(prevMonth)

    // Previous month filler cells
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      days.push(
        <div
          key={`prev-${day}`}
          className='min-h-[96px] border border-gray-200 bg-gray-50/70 flex flex-col items-center justify-start p-1.5 opacity-50'
        >
          <span className='text-gray-400 text-xs font-medium'>{day}</span>
        </div>,
      )
    }

    // Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      )
      let dayMeetings = normalizedMeetings[dateKey] || []

      // Apply active role filter if selected
      if (activeRoleFilter !== 'all') {
        dayMeetings = dayMeetings.filter(
          (m) => getMeetingRoleDetails(m).role === activeRoleFilter,
        )
      }

      const isToday =
        new Date().toDateString() ===
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

      days.push(
        <div
          key={day}
          className={`min-h-[105px] border border-gray-200 flex flex-col justify-start p-1.5 cursor-pointer hover:bg-slate-50 transition-colors font-exo relative group ${
            selectedDay === day
              ? 'bg-[#F6B72D]/15 border-[#F6B72D] ring-2 ring-[#F6B72D]/40'
              : isToday
                ? 'bg-amber-50/40 font-semibold'
                : 'bg-white'
          }`}
          onClick={() => handleDateClick(day)}
        >
          {/* Day number header */}
          <div className='flex items-center justify-between w-full mb-1'>
            <span
              className={`text-xs font-semibold px-1 rounded ${
                isToday
                  ? 'bg-slate-900 text-white'
                  : selectedDay === day
                    ? 'text-[#F6B72D] font-bold'
                    : 'text-gray-700'
              }`}
            >
              {String(day).padStart(2, '0')}
            </span>
            {dayMeetings.length > 0 && (
              <span className='text-[10px] text-gray-500 font-medium px-1 bg-gray-100 rounded-full'>
                {dayMeetings.length}
              </span>
            )}
          </div>

          {/* Meeting Appointment Chips */}
          <div className='flex flex-col gap-1 w-full overflow-hidden'>
            {dayMeetings.slice(0, 3).map((meeting, index) => {
              const roleInfo = getMeetingRoleDetails(meeting)
              const meetingType =
                meeting.meetingType ||
                meeting.meeting_type ||
                meeting.title ||
                'Meeting'
              const client = meeting.clientName || meeting.client_name || ''
              const time = meeting.time || meeting.time_display || ''

              return (
                <div
                  key={meeting.id || index}
                  className={`text-[11px] leading-tight px-1.5 py-1 rounded border shadow-xs cursor-pointer transition-all duration-150 flex items-center justify-between gap-1 overflow-hidden ${roleInfo.pillBg}`}
                  onMouseEnter={(e) => handleMeetingMouseEnter(meeting, e)}
                  onMouseLeave={handleMeetingMouseLeave}
                  onClick={(e) => handleMeetingClick(meeting, e)}
                  title={`${roleInfo.label}: ${meetingType}${client ? ` - ${client}` : ''}`}
                >
                  <div className='flex items-center gap-1 min-w-0 flex-1 truncate'>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${roleInfo.dotBg} border border-white/60`}
                    />
                    <span className='truncate font-medium'>
                      {time ? `${time} ` : ''}
                      {meetingType}
                    </span>
                  </div>
                  {client && (
                    <span className='shrink-0 text-[10px] opacity-85 truncate max-w-[60px] hidden sm:inline'>
                      {client.split(' ')[0]}
                    </span>
                  )}
                </div>
              )
            })}

            {/* Overflow indicator if > 3 meetings */}
            {dayMeetings.length > 3 && (
              <div
                className='text-[10px] text-center font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 py-0.5 rounded transition-colors'
                onClick={(e) => {
                  e.stopPropagation()
                  handleDateClick(day)
                }}
              >
                +{dayMeetings.length - 3} more
              </div>
            )}
          </div>
        </div>,
      )
    }

    // Next month filler cells
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDay + daysInMonth)

    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className='min-h-[96px] border border-gray-200 bg-gray-50/70 flex flex-col items-center justify-start p-1.5 opacity-50'
        >
          <span className='text-gray-400 text-xs font-medium'>
            {String(day).padStart(2, '0')}
          </span>
        </div>,
      )
    }

    return days
  }

  return (
    <div className='relative select-none' ref={containerRef}>
      <Card className='border border-gray-200 shadow-sm bg-white overflow-hidden'>
        <div className='p-4 md:p-6'>
          {/* Header row: Title, Month Navigation & Role Filter */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-amber-50 rounded-lg text-amber-700'>
                <CalendarIcon className='h-5 w-5' />
              </div>
              <div>
                <h3 className='text-xl md:text-2xl font-bold text-gray-900 tracking-tight'>
                  {title || `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                </h3>
                {title && (
                  <p className='text-xs text-gray-500 font-medium'>
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()} • Organization Master Schedule
                  </p>
                )}
              </div>
            </div>

            {/* Navigation and Month controls */}
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                type='button'
                onClick={(e) => handleMonthNavigation('prev', e)}
                className='h-8 w-8 p-0 border-gray-300 hover:bg-gray-100'
                title='Previous Month'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>

              <Button
                variant='outline'
                size='sm'
                type='button'
                onClick={() => {
                  const now = new Date()
                  setCurrentDate(now)
                  onMonthChange?.(now)
                }}
                className='h-8 px-2.5 text-xs font-medium text-gray-700'
              >
                Today
              </Button>

              <Button
                variant='outline'
                size='sm'
                type='button'
                onClick={(e) => handleMonthNavigation('next', e)}
                className='h-8 w-8 p-0 border-gray-300 hover:bg-gray-100'
                title='Next Month'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Color Coding Legend & Filter Pills */}
          {showRoleLegend && (
            <div className='flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-slate-50/80 rounded-xl border border-gray-200/80'>
              <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
                <Tag className='h-3.5 w-3.5 text-gray-400' />
                <span>ROLE COLOR CODES:</span>
              </div>

              {/* Role Badges */}
              <div className='flex flex-wrap items-center gap-2'>
                {/* Sales = Yellow */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                    activeRoleFilter === 'sales'
                      ? 'bg-[#F6B72D] text-slate-950 border-amber-500 ring-2 ring-amber-300 shadow-xs'
                      : 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-200/80 cursor-pointer'
                  }`}
                  onClick={() =>
                    allowRoleFilter &&
                    setActiveRoleFilter((prev) => (prev === 'sales' ? 'all' : 'sales'))
                  }
                  title='Click to filter Sales appointments'
                >
                  <span className='w-2.5 h-2.5 rounded-full bg-[#F6B72D] border border-amber-600' />
                  <span>Sales</span>
                </div>

                {/* Coaching = Green */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                    activeRoleFilter === 'coaching'
                      ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300 shadow-xs'
                      : 'bg-emerald-100/80 text-emerald-900 border-emerald-300 hover:bg-emerald-200/80 cursor-pointer'
                  }`}
                  onClick={() =>
                    allowRoleFilter &&
                    setActiveRoleFilter((prev) => (prev === 'coaching' ? 'all' : 'coaching'))
                  }
                  title='Click to filter Coaching appointments'
                >
                  <span className='w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-700' />
                  <span>Coaching</span>
                </div>

                {/* Administrator = Red */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                    activeRoleFilter === 'admin'
                      ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-300 shadow-xs'
                      : 'bg-red-100/80 text-red-900 border-red-300 hover:bg-red-200/80 cursor-pointer'
                  }`}
                  onClick={() =>
                    allowRoleFilter &&
                    setActiveRoleFilter((prev) => (prev === 'admin' ? 'all' : 'admin'))
                  }
                  title='Click to filter Administrator appointments'
                >
                  <span className='w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700' />
                  <span>Administrator</span>
                </div>

                {/* Reset Filter Button if active */}
                {activeRoleFilter !== 'all' && (
                  <button
                    type='button'
                    onClick={() => setActiveRoleFilter('all')}
                    className='text-[11px] text-gray-500 hover:text-gray-900 underline ml-1 cursor-pointer'
                  >
                    Show All
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Days of week header */}
          <div className='grid grid-cols-7 bg-[#0f172a] text-white rounded-t-lg font-exo'>
            {DAYS.map((day) => (
              <div key={day} className='py-2.5 text-center text-xs font-bold tracking-wide uppercase'>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className='border-x border-b border-gray-200 rounded-b-lg overflow-hidden font-exo'>
            <div className='grid grid-cols-7'>{renderCalendarDays()}</div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* HOVER TOOLTIP CARD: Shows Client Name, Program, Meeting Type, Staff, etc. */}
      {/* ========================================================================= */}
      {hoveredMeeting && (
        <div
          className='absolute z-50 pointer-events-none transition-opacity duration-150'
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: hoverPosition.showBelow
              ? hoverPosition.alignRight
                ? 'translate(-90%, 0)'
                : 'translate(-10%, 0)'
              : hoverPosition.alignRight
                ? 'translate(-90%, -100%)'
                : 'translate(-10%, -100%)',
          }}
        >
          {(() => {
            const roleInfo = getMeetingRoleDetails(hoveredMeeting)
            const meetingType =
              hoveredMeeting.meetingType ||
              hoveredMeeting.meeting_type ||
              hoveredMeeting.title ||
              'Meeting'
            const clientName =
              hoveredMeeting.clientName ||
              hoveredMeeting.client_name ||
              'Prospective Client'
            const program =
              hoveredMeeting.program ||
              hoveredMeeting.program_name ||
              'CEO Influencers Program'
            const time =
              hoveredMeeting.time ||
              hoveredMeeting.time_display ||
              'Scheduled Time'
            const advisor =
              hoveredMeeting.advisor ||
              hoveredMeeting.advisor_name ||
              hoveredMeeting.otherTrainers ||
              'Assigned Staff'

            return (
              <div
                className='w-72 md:w-80 bg-white rounded-xl shadow-2xl border-2 p-3.5 text-gray-900 font-exo'
                style={{ borderColor: roleInfo.colorHex }}
              >
                {/* Header with Role Pill */}
                <div className='flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100'>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleInfo.badgeBg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dotBg}`} />
                    {roleInfo.label}
                  </span>
                  <span className='text-[11px] text-gray-500 font-mono font-medium flex items-center gap-1'>
                    <Clock className='w-3 h-3 text-gray-400' />
                    {time}
                  </span>
                </div>

                {/* Meeting Title */}
                <h4 className='font-bold text-sm text-gray-900 mb-2 truncate'>
                  {hoveredMeeting.title || meetingType}
                </h4>

                {/* Key Details requested by user: Meeting Type, Client Name, Program */}
                <div className='space-y-1.5 text-xs'>
                  {/* Meeting Type */}
                  <div className='flex items-start justify-between gap-2 py-0.5 border-b border-gray-50'>
                    <span className='text-gray-500 font-medium shrink-0 flex items-center gap-1'>
                      <Info className='w-3 h-3 text-gray-400' />
                      Meeting Type:
                    </span>
                    <span className='font-bold text-gray-900 text-right truncate'>
                      {meetingType}
                    </span>
                  </div>

                  {/* Client Name */}
                  <div className='flex items-start justify-between gap-2 py-0.5 border-b border-gray-50'>
                    <span className='text-gray-500 font-medium shrink-0 flex items-center gap-1'>
                      <User className='w-3 h-3 text-gray-400' />
                      Client Name:
                    </span>
                    <span className='font-bold text-[#0f172a] text-right truncate'>
                      {clientName}
                    </span>
                  </div>

                  {/* Program Selected */}
                  <div className='flex items-start justify-between gap-2 py-0.5 border-b border-gray-50'>
                    <span className='text-gray-500 font-medium shrink-0 flex items-center gap-1'>
                      <Briefcase className='w-3 h-3 text-gray-400' />
                      Program:
                    </span>
                    <span className='font-semibold text-gray-900 text-right truncate max-w-[170px]'>
                      {program}
                    </span>
                  </div>

                  {/* Advisor / Staff */}
                  <div className='flex items-start justify-between gap-2 py-0.5'>
                    <span className='text-gray-500 font-medium shrink-0'>Staff / Advisor:</span>
                    <span className='font-medium text-gray-800 text-right truncate'>
                      {advisor}
                    </span>
                  </div>
                </div>

                <div className='mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-medium'>
                  <span>Click meeting to view actions</span>
                  <span className='text-amber-600 font-semibold'>• Master Calendar</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLICK POPOVER / MODAL: Allows joining meeting or viewing details           */}
      {/* ========================================================================= */}
      {selectedMeeting && (
        <>
          <div
            className='fixed inset-0 z-40 bg-black/20 backdrop-blur-xs'
            onClick={() => setSelectedMeeting(null)}
          />
          <div
            className='absolute z-50 bg-white border-2 rounded-xl p-5 shadow-2xl max-w-sm w-80 font-exo'
            style={{
              left: `${popoverPosition.x}px`,
              top: `${popoverPosition.y}px`,
              transform: popoverPosition.transform,
              borderColor: getMeetingRoleDetails(selectedMeeting).colorHex,
            }}
          >
            {(() => {
              const roleInfo = getMeetingRoleDetails(selectedMeeting)
              const meetingType =
                selectedMeeting.meetingType ||
                selectedMeeting.meeting_type ||
                selectedMeeting.title ||
                'Meeting'
              const clientName =
                selectedMeeting.clientName ||
                selectedMeeting.client_name ||
                'Prospective Client'
              const program =
                selectedMeeting.program ||
                selectedMeeting.program_name ||
                'CEO Influencers Program'
              const time =
                selectedMeeting.time ||
                selectedMeeting.time_display ||
                'Scheduled Time'
              const advisor =
                selectedMeeting.advisor ||
                selectedMeeting.advisor_name ||
                selectedMeeting.otherTrainers ||
                'Assigned Staff'

              return (
                <div>
                  <div className='flex items-center justify-between gap-2 mb-3'>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${roleInfo.badgeBg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${roleInfo.dotBg}`} />
                      {roleInfo.label}
                    </span>
                    <button
                      type='button'
                      onClick={() => setSelectedMeeting(null)}
                      className='text-gray-400 hover:text-gray-700 text-sm font-bold p-1'
                    >
                      ✕
                    </button>
                  </div>

                  <h4 className='font-bold text-base text-gray-900 mb-3'>
                    {selectedMeeting.title || meetingType}
                  </h4>

                  <div className='space-y-2 text-xs text-gray-700 mb-4 bg-gray-50/80 p-3 rounded-lg border border-gray-100'>
                    <div className='flex justify-between gap-2'>
                      <span className='font-semibold text-gray-500'>Meeting Type:</span>
                      <span className='font-bold text-gray-900'>{meetingType}</span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='font-semibold text-gray-500'>Client Name:</span>
                      <span className='font-bold text-[#0f172a]'>{clientName}</span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='font-semibold text-gray-500'>Program Selected:</span>
                      <span className='font-semibold text-gray-900 text-right truncate max-w-[160px]'>
                        {program}
                      </span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='font-semibold text-gray-500'>Time:</span>
                      <span className='font-bold text-gray-900'>{time}</span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='font-semibold text-gray-500'>Staff Member:</span>
                      <span className='font-medium text-gray-800'>{advisor}</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Button
                      type='button'
                      onClick={() => {
                        navigate(`${meetingRouteBase}/${selectedMeeting.id}`)
                        setSelectedMeeting(null)
                      }}
                      className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-semibold'
                    >
                      Join Meeting
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setSelectedMeeting(null)}
                      className='w-full border-gray-200 text-xs'
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
