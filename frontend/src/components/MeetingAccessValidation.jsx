import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  UserX,
  FileQuestion,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react'

/**
 * High-visibility, executive-styled validation component for meeting access errors
 * (HTTP 403 Forbidden / NOT_PARTICIPANT, 404 NOT_FOUND, 409 CONFLICT, 401 UNAUTHORIZED)
 */
export const MeetingAccessValidation = ({
  error,
  meetingId,
  role = 'trainer', // 'trainer' | 'client' | 'sales'
  onRetry,
  onResume,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  // Extract structured properties from string or object error
  const rawMessage =
    typeof error === 'object' && error !== null
      ? error.message || error.detail || error.error || ''
      : typeof error === 'string'
        ? error
        : ''

  const errorStatus =
    typeof error === 'object' && error !== null
      ? error.httpStatus || error.status || null
      : rawMessage.includes('403')
        ? 403
        : rawMessage.includes('404')
          ? 404
          : rawMessage.includes('409')
            ? 409
            : rawMessage.includes('401')
              ? 401
              : null

  const errorCode =
    typeof error === 'object' && error !== null
      ? error.code || error.error || null
      : null

  const meetingTitle =
    typeof error === 'object' && error !== null ? error.meetingTitle : null

  // Categorize error type
  const isForbidden =
    errorStatus === 403 ||
    errorCode === 'NOT_PARTICIPANT' ||
    rawMessage.toLowerCase().includes('not a participant') ||
    rawMessage.toLowerCase().includes('forbidden') ||
    rawMessage.toLowerCase().includes('access denied')

  const isNotFound =
    errorStatus === 404 ||
    errorCode === 'NOT_FOUND' ||
    rawMessage.toLowerCase().includes('not found')

  const isConflict =
    errorStatus === 409 ||
    errorCode === 'ALREADY_JOINED' ||
    rawMessage.toLowerCase().includes('already') ||
    rawMessage.toLowerCase().includes('conflict')

  const isUnauthorized =
    errorStatus === 401 ||
    errorCode === 'UNAUTHORIZED' ||
    rawMessage.toLowerCase().includes('unauthorized') ||
    rawMessage.toLowerCase().includes('authentication')

  // Appropriate routes based on role
  const dashboardRoute =
    role === 'trainer'
      ? '/coaching'
      : role === 'sales'
        ? '/sales/dashboard'
        : '/client'

  const calendarRoute =
    role === 'trainer'
      ? '/coaching/calendar'
      : role === 'sales'
        ? '/sales/calendar'
        : '/client/calendar'

  const dashboardLabel =
    role === 'trainer'
      ? 'Return to Coaching Dashboard'
      : role === 'sales'
        ? 'Return to Sales Dashboard'
        : 'Return to Client Dashboard'

  const calendarLabel =
    role === 'trainer'
      ? 'View Coaching Calendar'
      : role === 'sales'
        ? 'View Sales Calendar'
        : 'View My Calendar'

  // Header & Styling selection
  let theme = {
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    title: 'Meeting Access Restricted',
    badgeText: 'HTTP 403 • Forbidden',
    icon: <ShieldAlert className='w-8 h-8 text-rose-600' />,
  }

  if (isConflict) {
    theme = {
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      title: 'Meeting Already Active',
      badgeText: 'HTTP 409 • Session Active',
      icon: <AlertTriangle className='w-8 h-8 text-amber-600' />,
    }
  } else if (isNotFound) {
    theme = {
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      iconBg: 'bg-slate-50 text-slate-600 border-slate-200',
      title: 'Meeting Not Found',
      badgeText: 'HTTP 404 • Not Found',
      icon: <FileQuestion className='w-8 h-8 text-slate-600' />,
    }
  } else if (isUnauthorized) {
    theme = {
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
      title: 'Authentication Required',
      badgeText: 'HTTP 401 • Unauthorized',
      icon: <Lock className='w-8 h-8 text-orange-600' />,
    }
  }

  return (
    <div className='min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-gray-50/50 to-white'>
      <div className='max-w-2xl w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden'>
        {/* Top Accent Bar */}
        <div
          className={`h-2.5 w-full ${
            isConflict
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : isNotFound
                ? 'bg-gradient-to-r from-slate-400 to-slate-600'
                : 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600'
          }`}
        />

        <div className='p-8 md:p-10'>
          {/* Header Section */}
          <div className='flex items-start justify-between gap-4 mb-6'>
            <div className='flex items-center gap-4'>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${theme.iconBg}`}
              >
                {theme.icon}
              </div>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.badgeBg}`}
                  >
                    {theme.badgeText}
                  </span>
                  {errorCode && (
                    <span className='inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono bg-gray-100 text-gray-700 border border-gray-200'>
                      {errorCode}
                    </span>
                  )}
                </div>
                <h2 className='text-2xl font-bold text-gray-900 tracking-tight'>
                  {theme.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Meeting Target Information Pill */}
          <div className='mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
                Target Session:
              </span>
              <span className='font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200'>
                Meeting #{meetingId}
              </span>
              {meetingTitle && (
                <span className='font-medium text-slate-700 truncate max-w-xs'>
                  "{meetingTitle}"
                </span>
              )}
            </div>
            <div className='flex items-center gap-1.5 text-xs text-slate-600'>
              <span className='w-2 h-2 rounded-full bg-slate-400'></span>
              <span>
                Role: <strong className='capitalize'>{role}</strong>
              </span>
            </div>
          </div>

          {/* Core Validation Message */}
          <div className='mb-6'>
            {isForbidden ? (
              <div className='space-y-3 text-gray-700'>
                <p className='text-base font-medium text-gray-900'>
                  You are not a registered participant in this meeting.
                </p>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  This session is private and confidential. Only the client and
                  their specifically designated coach or sales representative
                  are permitted to enter the live video room.
                </p>

                <div className='p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2 mt-4'>
                  <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900'>
                    <HelpCircle className='w-4 h-4 text-amber-600' />
                    Why am I seeing this validation?
                  </div>
                  <ul className='text-xs text-amber-950 space-y-1.5 list-disc pl-5'>
                    <li>
                      Your current user account is not listed on the attendee
                      roster for <strong>Meeting #{meetingId}</strong>.
                    </li>
                    <li>
                      If this is an assessment review or client discovery
                      meeting, check your assigned clients list to access the
                      meetings scheduled for you.
                    </li>
                    <li>
                      If you need observer access or should be the assigned
                      coach for this client, please contact your platform
                      administrator.
                    </li>
                  </ul>
                </div>
              </div>
            ) : isConflict ? (
              <div className='space-y-3 text-gray-700'>
                <p className='text-base font-medium text-gray-900'>
                  You appear to already have an active connection to this
                  meeting.
                </p>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  This can occur if you opened the meeting room in another browser
                  tab or recently refreshed. Click "Resume Meeting" below to
                  reconnect to your existing room session.
                </p>
              </div>
            ) : isNotFound ? (
              <div className='space-y-3 text-gray-700'>
                <p className='text-base font-medium text-gray-900'>
                  Meeting #{meetingId} could not be located.
                </p>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  The meeting ID you requested does not exist or may have been
                  cancelled, completed, or removed from the system.
                </p>
              </div>
            ) : (
              <div className='space-y-3 text-gray-700'>
                <p className='text-base font-medium text-gray-900'>
                  Unable to connect to Meeting #{meetingId}.
                </p>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  {rawMessage ||
                    'An error occurred while establishing your meeting credentials.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3'>
            {isConflict && onResume ? (
              <button
                type='button'
                onClick={onResume}
                className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm'
              >
                <RefreshCw className='w-4 h-4' />
                Resume Meeting Session
              </button>
            ) : null}

            <Link
              to={dashboardRoute}
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#172554] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#172554] transition shadow-sm'
            >
              <ArrowLeft className='w-4 h-4' />
              {dashboardLabel}
            </Link>

            <Link
              to={calendarRoute}
              className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition border border-gray-200'
            >
              <Calendar className='w-4 h-4 text-gray-500' />
              {calendarLabel}
            </Link>

            {onRetry && (
              <button
                type='button'
                onClick={onRetry}
                className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition border border-gray-200'
              >
                <RefreshCw className='w-4 h-4' />
                Retry
              </button>
            )}
          </div>

          {/* Collapsible Technical Diagnostics for Admin / Developers */}
          <div className='mt-8 pt-4 border-t border-dashed border-gray-200'>
            <button
              type='button'
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className='w-full flex items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-800 transition py-1'
            >
              <span>Technical Diagnostic Information</span>
              <div className='flex items-center gap-1'>
                <span>{showTechnicalDetails ? 'Hide' : 'Show Details'}</span>
                {showTechnicalDetails ? (
                  <ChevronUp className='w-3.5 h-3.5' />
                ) : (
                  <ChevronDown className='w-3.5 h-3.5' />
                )}
              </div>
            </button>

            {showTechnicalDetails && (
              <div className='mt-3 p-4 rounded-xl bg-gray-900 text-gray-200 font-mono text-xs overflow-x-auto space-y-1.5'>
                <div>
                  <span className='text-gray-400'>Request URL: </span>
                  <span className='text-amber-300'>
                    {window.location.origin}/api/lms/{role === 'trainer' ? 'trainer' : 'client'}/meeting/{meetingId}/
                  </span>
                </div>
                <div>
                  <span className='text-gray-400'>HTTP Status: </span>
                  <span
                    className={
                      errorStatus === 403
                        ? 'text-rose-400 font-bold'
                        : 'text-amber-400'
                    }
                  >
                    {errorStatus || '403'} {errorStatus === 403 ? 'Forbidden' : ''}
                  </span>
                </div>
                {errorCode && (
                  <div>
                    <span className='text-gray-400'>Error Code: </span>
                    <span className='text-cyan-300 font-bold'>"{errorCode}"</span>
                  </div>
                )}
                <div>
                  <span className='text-gray-400'>Server Message: </span>
                  <span className='text-emerald-300'>"{rawMessage}"</span>
                </div>
                <div>
                  <span className='text-gray-400'>Timestamp: </span>
                  <span className='text-gray-400'>
                    {new Date().toISOString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeetingAccessValidation

