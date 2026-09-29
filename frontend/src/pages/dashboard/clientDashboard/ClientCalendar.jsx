import { CalendarComponent } from '@/components/CalendarComponent'
import { useState, useEffect, useCallback, useRef } from 'react'
import clientAPIService from '@/services/clientAPIService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientCalendar() {
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(new Date())
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [selectedDateMeetings, setSelectedDateMeetings] = useState([])
  const [programs, setPrograms] = useState([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)
  const hasLoadedCalendarOnce = useRef(false)

  const normalizeTimeTo24Hour = (rawTime) => {
    const value = String(rawTime || '').trim()
    if (!value) return ''

    if (/^\d{2}:\d{2}$/.test(value)) {
      return value
    }

    const match = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
    if (!match) return ''

    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const meridian = match[3].toUpperCase()

    if (meridian === 'PM' && hours < 12) hours += 12
    if (meridian === 'AM' && hours === 12) hours = 0

    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  const bookedTimeSet = new Set(
    (selectedDateMeetings || [])
      .map((meeting) =>
        normalizeTimeTo24Hour(meeting?.time || meeting?.meeting_time),
      )
      .filter(Boolean),
  )
  const hasProgramsAvailable = programs.length > 0
  const selectedTimeIsBooked =
    !!meetingTime && bookedTimeSet.has(normalizeTimeTo24Hour(meetingTime))

  const fetchCalendarData = useCallback(async () => {
    try {
      if (!hasLoadedCalendarOnce.current) {
        setLoading(true)
      }
      const data = await clientAPIService.getClientCalendar({
        year: visibleMonth.getFullYear(),
        month: visibleMonth.getMonth() + 1,
      })
      console.log('Client Calendar Data:', data)
      setCalendarData(data)
      hasLoadedCalendarOnce.current = true
    } catch (err) {
      setError('Failed to load calendar data')
      console.error('Calendar error:', err)
    } finally {
      setLoading(false)
    }
  }, [visibleMonth])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const data = await clientAPIService.getClientPrograms()
        const mappedPrograms = Array.isArray(data)
          ? data.map((program) => ({
              id: program.id,
              name: program.name,
            }))
          : []
        setPrograms(mappedPrograms)
      } catch (err) {
        console.error('Failed to load programs:', err)
        setPrograms([])
      }
    }

    fetchPrograms()
  }, [])

  const handleDateClick = (date, dayMeetings = []) => {
    setSelectedDate(date)
    setMeetingTime('')
    setSelectedProgramId('')
    setSelectedDateMeetings(Array.isArray(dayMeetings) ? dayMeetings : [])
    setIsScheduleOpen(true)
  }

  const handleScheduleSubmit = async (event) => {
    event.preventDefault()

    if (!hasProgramsAvailable) {
      toast.error('No program is available for scheduling yet.')
      return
    }

    if (!selectedProgramId || !selectedDate || !meetingTime) {
      toast.error('Please select a program, date, and time.')
      return
    }

    if (selectedTimeIsBooked) {
      toast.error('This time slot is already booked for the selected date.')
      return
    }

    setIsScheduling(true)
    try {
      await clientAPIService.scheduleProgramMeeting(selectedProgramId, {
        date: selectedDate,
        time: meetingTime,
      })
      toast.success('Meeting scheduled successfully!')
      setIsScheduleOpen(false)
      await fetchCalendarData()
    } catch (err) {
      console.error('Failed to schedule meeting:', err)
      toast.error(err.message || 'Failed to schedule meeting')
    } finally {
      setIsScheduling(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Calendar</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold uppercase text-gray-900  tracking-wide'>
          CALENDAR
        </h2>
        <p className=' font-exo'>Tap on any date to view meetings</p>
      </div>
      <CalendarComponent
        meetings={calendarData}
        onDateClick={handleDateClick}
        onMonthChange={(date) => setVisibleMonth(date)}
      />
      {isScheduleOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-[10px] border-2 border-[#F6B72D] w-full max-w-lg mx-auto shadow-2xl overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h3 className='text-lg font-bold text-black'>Schedule Meeting</h3>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className='p-1 hover:bg-gray-100 rounded-full transition-colors'
              >
                <X className='h-5 w-5 text-gray-500' />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className='p-4 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
                  Program
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(event) => setSelectedProgramId(event.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#F6B72D] focus:ring-[#F6B72D] focus:outline-none font-exo'
                  required
                >
                  <option value=''>Select a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {!hasProgramsAvailable && (
                  <p className='mt-2 text-xs text-amber-700'>
                    Scheduling becomes available after a program is assigned to
                    your account.
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
                  Date
                </label>
                <Input
                  type='text'
                  value={selectedDate}
                  readOnly
                  className='w-full border-gray-300 font-exo'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
                  Time
                </label>
                <Input
                  type='time'
                  value={meetingTime}
                  onChange={(event) => setMeetingTime(event.target.value)}
                  className='w-full border-gray-300 font-exo'
                  step={1800}
                  required
                />
                {selectedTimeIsBooked && (
                  <p className='mt-2 text-xs text-red-600'>
                    Selected time is already booked. Choose another slot.
                  </p>
                )}
              </div>

              {selectedDateMeetings.length > 0 && (
                <div className='bg-amber-50 border border-amber-100 rounded-lg p-3'>
                  <p className='text-sm font-medium text-amber-800 mb-2'>
                    Existing meetings on this date:
                  </p>
                  <ul className='space-y-1 text-xs text-amber-700'>
                    {selectedDateMeetings.map((meeting, index) => (
                      <li
                        key={`${meeting.id || meeting.title || 'meeting'}-${index}`}
                      >
                        {meeting.time || meeting.meeting_time || 'Time TBD'} -{' '}
                        {meeting.title || meeting.meeting_title || 'Meeting'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsScheduleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={
                    isScheduling || selectedTimeIsBooked || !hasProgramsAvailable
                  }
                  className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black'
                >
                  {isScheduling ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
