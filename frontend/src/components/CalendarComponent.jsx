import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

export function CalendarComponent({
  meetings = {},
  onDateClick,
  meetingRouteBase = '/client/meeting',
  onMonthChange,
}) {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })

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
    // Normalize to day 1 before shifting month to avoid month-skipping on dates like 29/30/31.
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
    setSelectedDay(null)
  }

  const handleMonthNavigation = (direction, event) => {
    event?.preventDefault()
    event?.stopPropagation()
    navigateMonth(direction)
  }

  const handleMeetingClick = (meeting, event) => {
    event.stopPropagation() // Prevent date click

    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = event.currentTarget
      .closest('.relative')
      .getBoundingClientRect()

    let x = rect.left - containerRect.left + rect.width / 2
    let y = rect.top - containerRect.top

    const viewportWidth = window.innerWidth
    const popoverWidth = 300
    const popoverHeight = 200

    let transform = 'translate(-50%, -100%)'

    if (y - popoverHeight < 0) {
      y = rect.bottom - containerRect.top
      transform = 'translate(-50%, 0)'
    }

    if (x - popoverWidth / 2 < 0) {
      x = popoverWidth / 2 + 10
    } else if (x + popoverWidth / 2 > viewportWidth) {
      x = viewportWidth - popoverWidth / 2 - 10
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
    const dayMeetings = meetings[dateKey] || []

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

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      days.push(
        <div
          key={`prev-${day}`}
          className='h-20 border border-gray-200 bg-gray-50 flex flex-col items-center justify-start p-1'
        >
          <span className='text-gray-400 text-sm'>{day}</span>
        </div>,
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      )
      const dayMeetings = meetings[dateKey] || []

      days.push(
        <div
          key={day}
          className={`h-20 border border-gray-200 flex flex-col items-center justify-start p-1 cursor-pointer hover:bg-gray-50 transition-colors font-exo ${
            selectedDay === day
              ? 'bg-[#F6B72D]/20 border-[#F6B72D]'
              : 'bg-white'
          }`}
          onClick={(e) => handleDateClick(day, e)}
        >
          <span
            className={`text-sm font-medium mb-1 ${
              selectedDay === day ? 'text-[#F6B72D]' : ''
            }`}
          >
            {String(day).padStart(2, '0')}
          </span>
          <div className='flex flex-wrap gap-1 justify-center'>
            {dayMeetings.map((meeting, index) => (
              <span
                key={index}
                className={`text-xs px-1.5 py-0.5 rounded text-white font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                  meeting.type === '01'
                    ? 'bg-orange-400'
                    : meeting.type === '02'
                      ? 'bg-orange-500'
                      : meeting.type === '03'
                        ? meeting.title.includes('Meeting No. 2')
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                        : ''
                }`}
                onClick={(e) => handleMeetingClick(meeting, e)}
              >
                {meeting.type}
              </span>
            ))}
          </div>
        </div>,
      )
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDay + daysInMonth)

    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className='h-20 border border-gray-200 bg-gray-50 flex flex-col items-center justify-start p-1'
        >
          <span className='text-gray-400 text-sm'>
            {String(day).padStart(2, '0')}
          </span>
        </div>,
      )
    }

    return days
  }

  return (
    <div className='relative'>
      <Card className='border-q border-[#232323]/10 bg-white'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-semibold'>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div>
              <Button
                variant='ghost'
                size='sm'
                type='button'
                onClick={(event) => handleMonthNavigation('prev', event)}
                className='p-2'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>

              <Button
                variant='ghost'
                size='sm'
                type='button'
                onClick={(event) => handleMonthNavigation('next', event)}
                className='p-2'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-7 bg-[#F5FBFB] rounded-lg mb-2 font-exo'>
            {DAYS.map((day) => (
              <div key={day} className='p-3 text-center font-medium'>
                {day}
              </div>
            ))}
          </div>
          <div className='border border-gray-200 rounded-lg overflow-hidden font-exo'>
            <div className='grid grid-cols-7'>{renderCalendarDays()}</div>
          </div>
        </div>
      </Card>

      {selectedMeeting && (
        <>
          <div
            className='fixed inset-0 z-10'
            onClick={() => setSelectedMeeting(null)}
          />
          <div
            className='absolute z-20 bg-white border-2 border-[#F6B72D] rounded-lg p-4 shadow-lg max-w-sm font-exo'
            style={{
              left: `${popoverPosition.x}px`,
              top: `${popoverPosition.y}px`,
              transform: popoverPosition.transform,
            }}
          >
            <h4 className='font-semibold text-lg mb-3'>
              {selectedMeeting.title ||
                selectedMeeting.meeting_title ||
                'Meeting'}
            </h4>
            <div className='space-y-2 text-sm text-black/60'>
              <div>
                <span className='font-semibold'>Advisor:</span>{' '}
                {selectedMeeting.advisor ||
                  selectedMeeting.advisor_name ||
                  'N/A'}
              </div>
              <div>
                <span className='font-semibold'>Program:</span>{' '}
                {selectedMeeting.program ||
                  selectedMeeting.program_name ||
                  'N/A'}
              </div>
              <div>
                <span className='font-semibold'>Meeting Type:</span>{' '}
                {selectedMeeting.meetingType ||
                  selectedMeeting.meeting_type ||
                  'N/A'}
              </div>
              <div>
                <span className='font-semibold'>Client Name:</span>{' '}
                {selectedMeeting.clientName ||
                  selectedMeeting.client_name ||
                  selectedMeeting.clientName ||
                  'N/A'}
              </div>
              <div>
                <span className='font-semibold'>Time:</span>{' '}
                {selectedMeeting.time || selectedMeeting.meeting_time || 'N/A'}
              </div>
              <div className='pt-3'>
                <Button
                  type='button'
                  onClick={() => {
                    navigate(`${meetingRouteBase}/${selectedMeeting.id}`)
                    setSelectedMeeting(null)
                  }}
                  className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black'
                >
                  Join Meeting
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
