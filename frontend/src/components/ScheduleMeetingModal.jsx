import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import authService from '../services/authService'
import { CalendarComponent } from './CalendarComponent'

export default function ScheduleMeetingModal({ isOpen, onClose, client }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
    meetingType: 'initial',
    customMeetingType: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMeetings, setSelectedMeetings] = useState([])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === 'modal-overlay') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        date: '',
        time: '',
        notes: '',
        meetingType: 'initial',
        customMeetingType: '',
      })
    }
  }, [isOpen, client])

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

  // Handle date selection from calendar
  const handleDateClick = (dateKey, meetings) => {
    setSelectedMeetings(meetings)
    setFormData((prev) => ({
      ...prev,
      date: dateKey,
    }))

    // Show a toast notification to confirm date selection
    toast.success(`Date selected: ${dateKey}`, {
      duration: 2000,
      position: 'bottom-right',
    })
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.date || !formData.time) {
      toast.error('Please select both date and time')
      return
    }

    if (
      formData.meetingType === 'custom' &&
      !formData.customMeetingType.trim()
    ) {
      toast.error('Please enter a custom meeting type')
      return
    }

    setIsSubmitting(true)

    try {
      // Format time to match the API's expected format (HH:MM)
      const formattedTime = formData.time.includes(':')
        ? formData.time
        : `${formData.time.substring(0, 2)}:${formData.time.substring(2) || '00'}`

      // Map the meeting type to the format expected by the API
      const formattedMeetingType =
        formData.meetingType === 'custom'
          ? formData.customMeetingType
          : {
              initial: 'Initial Consultation',
              'follow-up': 'Follow-up Meeting',
              contract: 'Contract Review',
              onboarding: 'Onboarding Session',
            }[formData.meetingType] || formData.meetingType

      await authService.scheduleMeetingWithLead({
        clientId: client.id,
        date: formData.date,
        time: formattedTime,
        notes: formData.notes,
        meetingType: formattedMeetingType,
      })

      toast.success('Meeting scheduled successfully')
      onClose()
    } catch (err) {
      console.error('Failed to schedule meeting:', err)
      toast.error(err.message || 'Failed to schedule meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !client) return null

  return (
    <div
      id='modal-overlay'
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    >
      <div className='bg-white rounded-[10px] border-2 border-[#F6B72D] w-full max-w-2xl mx-auto relative shadow-2xl overflow-auto max-h-[90vh]'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-bold text-black font-gt'>
            Schedule Meeting with {client.clientName}
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* Calendar */}
        <div className='p-6 border-b border-gray-200'>
          <h3 className='text-md font-bold mb-4'>Select a Date</h3>
          <CalendarComponent
            meetings={{}} // Pass actual meetings data here if available
            onDateClick={handleDateClick}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
              Selected Date
            </label>
            <div
              className={`relative ${formData.date ? 'bg-[#F6B72D]/10' : 'bg-gray-50'} rounded-lg`}
            >
              <Input
                type='text'
                value={
                  formData.date
                    ? new Date(formData.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Please select a date from the calendar'
                }
                readOnly
                className={`w-full border ${formData.date ? 'border-[#F6B72D]' : 'border-gray-300'} focus:border-[#F6B72D] focus:ring-[#F6B72D] rounded-lg font-exo`}
              />
              {formData.date && (
                <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                  <div className='w-2 h-2 bg-[#F6B72D] rounded-full'></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
              Meeting Time
            </label>
            <select
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#F6B72D] focus:ring-[#F6B72D] focus:outline-none font-exo'
            >
              <option value=''>Select a time</option>
              <option value='09:00'>9:00 AM</option>
              <option value='09:30'>9:30 AM</option>
              <option value='10:00'>10:00 AM</option>
              <option value='10:30'>10:30 AM</option>
              <option value='11:00'>11:00 AM</option>
              <option value='11:30'>11:30 AM</option>
              <option value='13:00'>1:00 PM</option>
              <option value='13:30'>1:30 PM</option>
              <option value='14:00'>2:00 PM</option>
              <option value='14:30'>2:30 PM</option>
              <option value='15:00'>3:00 PM</option>
              <option value='15:30'>3:30 PM</option>
              <option value='16:00'>4:00 PM</option>
              <option value='16:30'>4:30 PM</option>
              <option value='17:00'>5:00 PM</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
              Meeting Type
            </label>
            <select
              value={formData.meetingType}
              onChange={(e) => handleInputChange('meetingType', e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#F6B72D] focus:ring-[#F6B72D] focus:outline-none font-exo'
            >
              <option value='initial'>Initial Consultation</option>
              <option value='follow-up'>Follow-up Meeting</option>
              <option value='contract'>Contract Review</option>
              <option value='onboarding'>Onboarding Session</option>
              <option value='custom'>Custom Meeting</option>
            </select>
          </div>

          {formData.meetingType === 'custom' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
                Custom Meeting Type
              </label>
              <Input
                type='text'
                value={formData.customMeetingType}
                onChange={(e) =>
                  handleInputChange('customMeetingType', e.target.value)
                }
                required
                placeholder='Enter custom meeting type'
                className='w-full border-gray-300 focus:border-[#F6B72D] focus:ring-[#F6B72D] rounded-lg font-exo'
              />
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2 font-exo'>
              Meeting Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#F6B72D] focus:ring-[#F6B72D] focus:outline-none font-exo'
              placeholder='Add any notes or agenda items for the meeting'
            />
          </div>

          {/* Show any existing meetings for the selected date */}
          {selectedMeetings.length > 0 && (
            <div className='bg-amber-50 p-3 rounded-lg border border-amber-100'>
              <h4 className='text-sm font-medium text-amber-800 mb-2'>
                Existing meetings on this date:
              </h4>
              <ul className='text-xs space-y-1'>
                {selectedMeetings.map((meeting, index) => (
                  <li key={index} className='text-amber-700'>
                    {meeting.time} - {meeting.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className='pt-4'>
            <Button
              type='submit'
              disabled={
                isSubmitting ||
                !formData.date ||
                !formData.time ||
                (formData.meetingType === 'custom' &&
                  !formData.customMeetingType.trim())
              }
              className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
