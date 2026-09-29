import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import clientAPIService from '../services/clientAPIService'

export default function ProgramScheduleMeetingModal({
  isOpen,
  onClose,
  programId,
  programTitle,
}) {
  const [scheduleData, setScheduleData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await clientAPIService.getProgramSchedule(programId)
      setScheduleData(data)
    } catch (error) {
      console.error('Failed to fetch schedule data:', error)
      toast.error('Failed to load available schedule slots')
    } finally {
      setLoading(false)
    }
  }, [programId])

  // Fetch schedule data when modal opens
  useEffect(() => {
    if (isOpen && programId) {
      fetchScheduleData()
    }
  }, [isOpen, programId, fetchScheduleData])

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedTime('')

    // Get available times for selected date
    if (scheduleData?.freeDays && scheduleData.freeDays[date]) {
      setAvailableTimes(scheduleData.freeDays[date])
    } else {
      setAvailableTimes([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time')
      return
    }

    setIsSubmitting(true)

    try {
      await clientAPIService.scheduleProgramMeeting(programId, {
        date: selectedDate,
        time: selectedTime,
      })

      toast.success('Meeting scheduled successfully!')
      onClose()
    } catch (error) {
      console.error('Failed to schedule meeting:', error)
      toast.error(error.message || 'Failed to schedule meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === 'modal-overlay') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      id='modal-overlay'
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    >
      <div className='bg-white rounded-[10px] border-2 border-[#F6B72D] w-full max-w-2xl mx-auto relative shadow-2xl overflow-auto max-h-[90vh]'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-bold text-black font-gt'>
            Schedule Meeting for {programTitle}
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {loading ? (
            <div className='flex justify-center items-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6B72D]'></div>
              <span className='ml-3 text-gray-600'>
                Loading available slots...
              </span>
            </div>
          ) : scheduleData?.freeDays ? (
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Date Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3 font-exo'>
                  Select a Date
                </label>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                  {Object.keys(scheduleData.freeDays).map((date) => (
                    <button
                      key={date}
                      type='button'
                      onClick={() => handleDateSelect(date)}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        selectedDate === date
                          ? 'border-[#F6B72D] bg-[#F6B72D]/10 text-[#F6B72D] font-medium'
                          : 'border-gray-300 hover:border-[#F6B72D] hover:bg-gray-50'
                      }`}
                    >
                      <div className='text-sm font-medium'>
                        {new Date(
                          date.split('-').reverse().join('-'),
                        ).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {scheduleData.freeDays[date].length} slots
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-3 font-exo'>
                    Select a Time for{' '}
                    {new Date(
                      selectedDate.split('-').reverse().join('-'),
                    ).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </label>
                  {availableTimes.length > 0 ? (
                    <div className='grid grid-cols-3 md:grid-cols-4 gap-3'>
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          type='button'
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 border rounded-lg text-center transition-all ${
                            selectedTime === time
                              ? 'border-[#F6B72D] bg-[#F6B72D]/10 text-[#F6B72D] font-medium'
                              : 'border-gray-300 hover:border-[#F6B72D] hover:bg-gray-50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-4 text-gray-500'>
                      No available time slots for this date
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className='pt-4'>
                <Button
                  type='submit'
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No available schedule slots found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
