import { useEffect, useState } from 'react'
import { Briefcase, Building2, Globe, Mail, Phone, Target, UserRound } from 'lucide-react'
import authService from '@/services/authService'

const Row = ({ icon, label, value }) => {
  const Icon = icon
  return (
  <div className='flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0'>
    <Icon className='mt-0.5 h-4 w-4 shrink-0 text-[#F6B72D]' />
    <div className='min-w-0'>
      <p className='text-[11px] uppercase tracking-wide text-gray-500'>{label}</p>
      <p className='text-sm font-semibold text-gray-900 break-words'>{value || 'Not provided'}</p>
    </div>
  </div>
  )
}

/**
 * "Who is on this call" panel for sales/coaches/admin inside the video
 * meeting window: name, company, industry, job title, program of interest...
 */
export default function MeetingClientInfo({ meetingId, className = '' }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    if (!meetingId) return undefined
    let cancelled = false
    setState({ loading: true, data: null, error: '' })
    authService
      .getMeetingClientInfo(meetingId)
      .then((data) => !cancelled && setState({ loading: false, data, error: '' }))
      .catch((err) => {
        console.error('Failed to load client info for meeting:', err)
        if (!cancelled) setState({ loading: false, data: null, error: 'Client details unavailable.' })
      })
    return () => {
      cancelled = true
    }
  }, [meetingId])

  const client = state.data?.client
  const meeting = state.data?.meeting

  return (
    <div className={`border-2 border-[#F6B72D] rounded-xl bg-white p-4 shadow-sm ${className}`}>
      <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
        <p className='text-sm font-extrabold uppercase tracking-wide text-gray-900'>
          Client on this call
        </p>
        {meeting?.callType && (
          <span className='rounded-full bg-[#0f172a] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#F6B72D]'>
            {meeting.callType}
          </span>
        )}
      </div>

      {state.loading ? (
        <p className='text-sm text-gray-500'>Loading client details…</p>
      ) : state.error ? (
        <p className='text-sm text-red-600'>{state.error}</p>
      ) : !client ? (
        <p className='text-sm text-gray-500'>No client is attached to this meeting.</p>
      ) : (
        <>
          <p className='text-lg font-extrabold text-gray-900 leading-tight'>{client.name}</p>
          {client.jobTitle || client.company ? (
            <p className='text-sm text-gray-600 mb-2'>
              {[client.jobTitle, client.company].filter(Boolean).join(' at ')}
            </p>
          ) : (
            <div className='mb-2' />
          )}
          <Row icon={Target} label='Program of interest' value={client.programOfInterest} />
          <Row icon={Building2} label='Company' value={client.company} />
          <Row icon={Briefcase} label='Industry' value={client.industry} />
          <Row icon={UserRound} label='Job title' value={client.jobTitle} />
          <Row icon={Globe} label='Country' value={client.country} />
          <Row icon={Mail} label='Email' value={client.email} />
          <Row icon={Phone} label='Phone' value={client.phone} />
          {client.enrolledPrograms?.length > 0 && (
            <p className='mt-2 text-xs text-gray-600'>
              Enrolled: <span className='font-semibold'>{client.enrolledPrograms.join(', ')}</span>
            </p>
          )}
          {client.referredBy && (
            <p className='mt-1 text-xs text-gray-600'>
              Referred by: <span className='font-semibold'>{client.referredBy}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
