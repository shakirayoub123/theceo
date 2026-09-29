import { createContext, useContext } from 'react'
import {
  useCallObject,
  useParticipantIds,
  useMeetingState,
} from '@daily-co/daily-react'
import useDailyMeeting from '@/hooks/useDailyMeeting'

// Create context
const MeetingContext = createContext(null)

// Provider component
export function MeetingProvider({ meetingId, children, role = 'client' }) {
  // Use Daily React hooks
  const callObject = useCallObject()
  const participantIds = useParticipantIds()
  const meetingState = useMeetingState()

  // Use the Daily.co meeting hook for additional logic
  const meetingValue = useDailyMeeting(meetingId, callObject, { role })

  const contextValue = {
    ...meetingValue,
    callObject,
    participantIds,
    meetingState,
  }

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  )
}

// Hook for consuming the context
export const useMeetingContext = () => {
  const context = useContext(MeetingContext)
  if (!context) {
    throw new Error('useMeetingContext must be used within a MeetingProvider')
  }
  return context
}
