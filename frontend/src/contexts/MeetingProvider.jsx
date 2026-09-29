import { default as MeetingContext } from './MeetingContext'
import useMeeting from '@/hooks/useMeeting'
import { memo } from 'react'

// Provider component
export const MeetingProvider = memo(
  ({ meetingId, role = 'client', children }) => {
    // Use the meeting hook only once
    const meetingValue = useMeeting(meetingId, { role })

    return (
      <MeetingContext.Provider value={meetingValue}>
        {children}
      </MeetingContext.Provider>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if meetingId or role changes, ignore children
    return (
      prevProps.meetingId === nextProps.meetingId &&
      prevProps.role === nextProps.role
    )
  },
)
