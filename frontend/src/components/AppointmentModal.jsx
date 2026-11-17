import { useState, useEffect } from 'react'
import { X, Globe, Clock, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useTranslation } from 'react-i18next'
import authService from '../services/authService'

export const PROGRAMS_OF_INTEREST = [
  {
    id: 1,
    number: 1,
    name: 'Live Executive Leadership & Organizational Development Performance Optimization Program',
    shortName: 'Live Executive Leadership & Org Development',
  },
  {
    id: 2,
    number: 2,
    name: 'Virtual Self-Learning Executive Leadership & Organizational Development Performance Optimization Program',
    shortName: 'Virtual Self-Learning Executive Leadership',
  },
  {
    id: 3,
    number: 3,
    name: 'The Next Generation Executive Leadership Team Accelerator: Strategic 1-Week Client Site Organizational Mastermind Seminars',
    shortName: 'Next-Gen Executive Leadership Accelerator',
  },
  {
    id: 4,
    number: 4,
    name: 'Business Mastermind Networking Group 1-Week Intensive Events',
    shortName: 'Business Mastermind Networking Events',
  },
  {
    id: 5,
    number: 5,
    name: 'Business Mastermind Classes: Series I-II-III',
    shortName: 'Business Mastermind Classes: Series I-II-III',
  },
  {
    id: 6,
    number: 6,
    name: 'TRAIN-THE-TRAINER: LEADERSHIP TEAM PERFORMANCE ACCELERATOR',
    shortName: 'Train-the-Trainer: Leadership Accelerator',
  },
  {
    id: 7,
    number: 7,
    name: 'DUAL KEYNOTE SPEAKING TEAM PROGRAMS',
    shortName: 'Dual Keynote Speaking Team Programs',
  },
  {
    id: 8,
    number: 8,
    name: 'BUSINESS TO BUSINESS CONSULTING SERVICES',
    shortName: 'Business to Business Consulting Services',
  },
  {
    id: 9,
    number: 9,
    name: 'THE EXECUTIVE ASCENT CAREER COACHING PROGRAM',
    shortName: 'Executive Ascent Career Coaching Program',
  },
]

export default function AppointmentModal({ isOpen, onClose, initialProgram = '' }) {
  const { t } = useTranslation()

  const resolveInitialProgram = (input) => {
    if (!input) return ''
    const trimmed = String(input).trim().toLowerCase()
    const found = PROGRAMS_OF_INTEREST.find(
      (p) =>
        trimmed.includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(trimmed) ||
        (p.shortName && trimmed.includes(p.shortName.toLowerCase())) ||
        (p.shortName && p.shortName.toLowerCase().includes(trimmed)) ||
        trimmed.includes(`program ${p.number}`) ||
        trimmed === String(p.number)
    )
    return found ? `Program ${found.number}: ${found.shortName || found.name}` : input
  }

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    jobTitle: '',
    position: '',
    industry: '',
    country: '',
    referredBy: '',
    programOfInterest: '',
    date: '',
    time: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)
  const [submitError, setSubmitError] = useState(null)

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

  // Reset form and messages when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        jobTitle: '',
        position: '',
        industry: '',
        country: '',
        referredBy: '',
        programOfInterest: resolveInitialProgram(initialProgram),
        date: '',
        time: '',
      })
      setSubmitMessage(null)
      setSubmitError(null)
    }
  }, [isOpen, initialProgram])

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitMessage(null)

    try {
      const response = await authService.scheduleCall({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        jobTitle: formData.jobTitle,
        position: formData.position,
        industry: formData.industry,
        country: formData.country,
        referredBy: formData.referredBy,
        program_of_interest: formData.programOfInterest,
        programOfInterest: formData.programOfInterest,
        date: formData.date,
        time: formData.time,
      })

      console.log('Appointment scheduled successfully:', response)

      // Show success message
      setSubmitMessage({
        type: 'success',
        title: 'Appointment Scheduled!',
        message: `Your appointment has been scheduled for ${response.scheduled_for}. Check your email for login and meeting-join instructions.`,
        appointmentId: response.appointment_id,
        programOfInterest: response.program_of_interest || formData.programOfInterest,
        meetingUrl: response.meeting_url,
        directMeetingUrl: response.direct_meeting_url,
        loginUrl: response.login_url,
        forgotPasswordUrl: response.forgot_password_url,
        userCreated: response.user_created,
        assignedSalesperson: response.assigned_salesperson,
      })
    } catch (error) {
      console.error('Error scheduling appointment:', error)

      // Handle different types of errors
      if (error.message) {
        if (/^HTTP 400\b/i.test(error.message.trim())) {
          setSubmitError('Please complete all required fields and try again.')
        } else {
          setSubmitError(error.message)
        }
      } else if (error.response && error.response.data) {
        // Handle validation errors
        const validationErrors = Object.values(error.response.data).flat()
        setSubmitError(validationErrors.join(', '))
      } else {
        setSubmitError('Failed to schedule appointment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      id='modal-overlay'
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto'
    >
      <div className='bg-white rounded-xl w-full max-w-[700px] mx-auto relative shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden border-t-8 border-[#F6B72D]'>
        {/* Custom styles for phone input */}
        <style>{`
          .PhoneInput {
            width: 100% !important;
          }
          
          .PhoneInputInput {
            border: none !important;
            outline: none !important;
            background: transparent !important;
            font-family: 'Exo 2', sans-serif !important;
            font-size: 14px !important;
            color: #111827 !important;
            padding: 0 !important;
          }
          
          .PhoneInputInput::placeholder {
            color: #9ca3af !important;
          }
          
          .PhoneInputCountrySelect {
            background: transparent !important;
            border: none !important;
            color: #374151 !important;
            font-family: 'Exo 2', sans-serif !important;
            font-size: 14px !important;
            margin-right: 8px !important;
          }
          
          .PhoneInputCountrySelect:focus {
            outline: none !important;
          }
        `}</style>

        {/* Header */}
        <div className='relative px-6 md:px-8 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between'>
          <div className='flex gap-3'>
            {/* Orange Vertical Line */}
            <div className='w-1.5 rounded bg-[#F6B72D] flex-shrink-0 mt-1 mb-1'></div>
            <div className='flex flex-col'>
              <span className='text-[9px] md:text-[10px] font-bold text-[#F6B72D] tracking-widest uppercase mb-0.5 font-jakarta'>
                Private Advisory Session
              </span>
              <h2 className='text-[20px] md:text-[24px] font-extrabold text-[#111827] tracking-tight uppercase font-jakarta'>
                Schedule a Discovery Call
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              setSubmitMessage(null)
              setSubmitError(null)
              onClose()
            }}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors mt-1 flex-shrink-0'
          >
            <X className='h-5 w-5 text-gray-400' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-5 md:p-6 font-jakarta'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5'>

            {/* FULL NAME */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.fullName', 'Full Name')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <Input
                type='text'
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.fullNamePlaceholder', 'Enter your full name')}
              />
            </div>

            {/* EMAIL ADDRESS */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.email', 'Email Address')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <Input
                type='email'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.emailPlaceholder', 'Enter your email address')}
              />
            </div>

            {/* PHONE NUMBER */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.phone', 'Phone Number')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <div className='w-full h-[38px] px-3 py-1.5 border border-gray-200 rounded-lg focus-within:border-[#F6B72D] focus-within:ring-1 focus-within:ring-[#F6B72D] transition-all duration-200 bg-white flex items-center'>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry='US'
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  className='w-full'
                  inputClassName='w-full border-0 focus:ring-0 focus:outline-none bg-transparent font-jakarta text-[#111827] placeholder:text-gray-400 text-[13px]'
                  containerClassName='w-full flex items-center'
                  countrySelectProps={{
                    className: 'bg-transparent text-gray-700 font-jakarta border-0 focus:ring-0 text-[13px] mr-2',
                  }}
                  numberInputProps={{
                    className: 'bg-transparent font-jakarta flex-1 placeholder:text-gray-400 outline-none hover:outline-none focus:outline-none text-[13px]',
                  }}
                />
              </div>
            </div>

            {/* COUNTRY */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.country', 'Country')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <div className='relative'>
                <Input
                  type='text'
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 pr-10 placeholder:text-gray-400'
                  placeholder={t('appointment.countryPlaceholder', 'Country')}
                />
                <Globe className='absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
              </div>
            </div>

            {/* ADDRESS */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.address', 'Address')}
              </label>
              <Input
                type='text'
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.address', 'Address')}
              />
            </div>

            {/* JOB TITLE */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.jobTitle', 'Job Title')}
              </label>
              <Input
                type='text'
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.jobTitle', 'Job title')}
              />
            </div>

            {/* COMPANY NAME */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.companyName', 'Company Name')}
              </label>
              <Input
                type='text'
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.companyName', 'Company name')}
              />
            </div>

            {/* INDUSTRY */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.industry', 'Industry')}
              </label>
              <Input
                type='text'
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.industry', 'Industry')}
              />
            </div>

            {/* REFERRED BY */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.referredBy', 'Referred By')}
              </label>
              <Input
                type='text'
                value={formData.referredBy}
                onChange={(e) => handleInputChange('referredBy', e.target.value)}
                className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 placeholder:text-gray-400'
                placeholder={t('appointment.referredByPlaceholder', 'Referral source')}
              />
            </div>

            {/* PROGRAM OF INTEREST */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.programOfInterest', 'Program of Interest')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <div className='relative'>
                <select
                  value={formData.programOfInterest}
                  onChange={(e) => handleInputChange('programOfInterest', e.target.value)}
                  required
                  className='w-full h-[38px] px-3 py-1.5 border border-gray-200 rounded-lg focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] focus:outline-none font-jakarta text-[13px] appearance-none bg-white text-[#111827] pr-9 text-ellipsis overflow-hidden'
                >
                  <option value='' disabled hidden>
                    {t('appointment.selectProgram', 'Select a program')}
                  </option>
                  {PROGRAMS_OF_INTEREST.map((prog) => {
                    const label = `Program ${prog.number}: ${prog.shortName || prog.name}`
                    return (
                      <option key={prog.id} value={label}>
                        {label}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='border-t border-gray-100 my-4'></div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5'>
            {/* PREFERRED DATE */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.date', 'Preferred Date')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <div className='relative'>
                <Input
                  type='date'
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className='w-full h-[38px] border-gray-200 focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] rounded-lg font-jakarta text-[13px] px-3 pr-10 text-[#111827]'
                />
              </div>
            </div>

            {/* PREFERRED TIME */}
            <div>
              <label className='block text-[10px] font-bold text-[#111827] uppercase tracking-wide mb-1 font-jakarta'>
                {t('appointment.time', 'Preferred Time')} <span className='text-[#F6B72D]'>*</span>
              </label>
              <div className='relative'>
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                  className='w-full h-[38px] px-3 py-1.5 border border-gray-200 rounded-lg focus:border-[#F6B72D] focus:ring-1 focus:ring-[#F6B72D] focus:outline-none font-jakarta text-[13px] appearance-none bg-white text-[#111827]'
                >
                  <option value='' disabled hidden>
                    {t('appointment.selectTime', 'Select a time')}
                  </option>
                  <option value='09:00'>9:00 AM</option>
                  <option value='10:00'>10:00 AM</option>
                  <option value='11:00'>11:00 AM</option>
                  <option value='14:00'>2:00 PM</option>
                  <option value='15:00'>3:00 PM</option>
                  <option value='16:00'>4:00 PM</option>
                  <option value='17:00'>5:00 PM</option>
                </select>
                <Clock className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
              </div>
            </div>
          </div>

          <div className='pt-5'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-[#111827] font-extrabold font-jakarta uppercase tracking-wider py-4 md:py-5 px-6 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[12px] md:text-sm'
            >
              {isSubmitting
                ? t('appointment.submitting', 'Scheduling...')
                : t('appointment.submit', 'Schedule Appointment')}
              {!isSubmitting && <span>&rarr;</span>}
            </Button>
          </div>
        </form>

        {/* Success Message */}
        {submitMessage && (
          <div className='mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-green-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3 flex-1'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-medium text-green-800'>
                    {submitMessage.title}
                  </h3>
                  <button
                    onClick={() => setSubmitMessage(null)}
                    className='text-green-400 hover:text-green-600 transition-colors'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
                <div className='mt-2 text-sm text-green-700'>
                  <p>{submitMessage.message}</p>
                  {submitMessage.programOfInterest && (
                    <p className='mt-2 text-xs font-semibold text-green-900'>
                      Program of Interest:{' '}
                      <span className='text-green-800 font-medium'>
                        {submitMessage.programOfInterest}
                      </span>
                    </p>
                  )}
                  {submitMessage.userCreated && (
                    <div className='mt-3 p-3 bg-green-100 rounded-md'>
                      <p className='font-medium text-green-800 mb-2'>
                        Your account has been created!
                      </p>
                      <p className='text-sm text-green-700'>
                        Login credentials have been sent to your email address.
                      </p>
                    </div>
                  )}
                  {(submitMessage.directMeetingUrl || submitMessage.meetingUrl) && (
                    <div className='mt-3 p-3 bg-amber-50 rounded-md border border-amber-200'>
                      <p className='font-medium text-amber-800 mb-2'>
                        How to join your call
                      </p>
                      <p className='text-sm text-amber-700'>
                        Sign in with the same email address you used to book the
                        appointment, then open your call link at the scheduled
                        time.
                      </p>
                      <a
                        href={submitMessage.directMeetingUrl || submitMessage.meetingUrl}
                        className='mt-2 inline-flex text-sm font-medium text-amber-800 underline underline-offset-2'
                      >
                        Open meeting link
                      </a>
                      {submitMessage.loginUrl && (
                        <p className='text-xs text-amber-700 mt-2'>
                          Login page: {submitMessage.loginUrl}
                        </p>
                      )}
                      {submitMessage.forgotPasswordUrl && !submitMessage.userCreated && (
                        <p className='text-xs text-amber-700 mt-1'>
                          Forgot your password? Reset it here: {submitMessage.forgotPasswordUrl}
                        </p>
                      )}
                    </div>
                  )}
                  {submitMessage.assignedSalesperson && (
                    <div className='mt-3 p-3 bg-blue-50 rounded-md border border-blue-200'>
                      <p className='font-medium text-blue-800 mb-2'>
                        Your Assigned Salesperson
                      </p>
                      <p className='text-sm text-blue-700'>
                        <strong>Name:</strong>{' '}
                        {submitMessage.assignedSalesperson.name}
                      </p>
                      <p className='text-sm text-blue-700'>
                        <strong>Email:</strong>{' '}
                        {submitMessage.assignedSalesperson.email}
                      </p>
                      <p className='text-xs text-blue-600 mt-2'>
                        This person will be your point of contact.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className='mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3 flex-1'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Error Scheduling Appointment
                  </h3>
                  <button
                    onClick={() => setSubmitError(null)}
                    className='text-red-400 hover:text-red-600 transition-colors'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
