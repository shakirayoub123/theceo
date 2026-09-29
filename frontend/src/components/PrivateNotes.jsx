import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import MeetingContext from '@/contexts/MeetingContext'
import { Loader2 } from 'lucide-react'
import trainerAPIService from '@/services/trainerAPIService'
import clientAPIService from '@/services/clientAPIService'

export const PrivateNotes = ({ title }) => {
  const meetingCtx = useContext(MeetingContext)
  console.log(
    '[PrivateNotes] meetingCtx value:',
    meetingCtx,
    'isNull:',
    meetingCtx === null,
    'isUndefined:',
    meetingCtx === undefined,
  )
  const meetingDetails = meetingCtx?.meetingDetails ?? null
  const contextMeetingId =
    meetingDetails?.id || meetingDetails?.meetingId || meetingDetails?.meeting_id
  // Default role to 'trainer' when no MeetingContext is present (e.g., client details page)
  const role = meetingCtx?.role ?? 'trainer'

  console.log('[PrivateNotes] Component initialized:', {
    meetingCtx,
    meetingDetails,
    title,
  })
  console.log('[PrivateNotes] MeetingDetails object:', meetingDetails)

  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success', 'error', or null
  const [initialLoad, setInitialLoad] = useState(true)
  const saveTimerRef = useRef(null)
  const notesLoadedRef = useRef(false)

  // Get the appropriate API service based on role
  const apiService = role === 'trainer' ? trainerAPIService : clientAPIService

  // Generate a unique key for localStorage based on context
  const getLocalStorageKey = useCallback(() => {
    console.log('[PrivateNotes] getLocalStorageKey called:', {
      meetingDetails,
      hasId: !!contextMeetingId,
      id: contextMeetingId,
    })
    console.log(
      '[PrivateNotes] meetingDetails keys:',
      meetingDetails ? Object.keys(meetingDetails) : 'null',
    )

    // Check if we're in a meeting context by looking at the URL
    const pathname = window.location.pathname
    if (
      pathname.includes('/coaching/meeting/') ||
      pathname.includes('/client/meeting/')
    ) {
      // Extract meeting ID from URL
      const pathSegments = pathname.split('/')
      const meetingId = pathSegments[pathSegments.length - 1]
      console.log(
        '[PrivateNotes] Detected meeting context, using meeting ID from URL:',
        meetingId,
      )
      return `meeting_notes_${meetingId}`
    }

    if (contextMeetingId) {
      // For meeting-specific notes
      return `meeting_notes_${contextMeetingId}`
    } else {
      // For client-specific notes (when used in CoachingClientDetails)
      // Try to get client ID from URL or context
      const pathSegments = window.location.pathname.split('/')
      const clientId = pathSegments[pathSegments.length - 1] // Assuming URL ends with client ID
      console.log('[PrivateNotes] Generating localStorage key:', {
        pathname: window.location.pathname,
        pathSegments,
        clientId,
      })
      return `client_private_notes_${clientId}`
    }
  }, [meetingDetails, contextMeetingId])

  // Load notes from localStorage on component mount (for standalone mode)
  useEffect(() => {
    if (!meetingCtx && !notesLoadedRef.current) {
      console.warn(
        '[PrivateNotes] No MeetingContext available; loading from localStorage.',
      )
      const key = getLocalStorageKey()
      const stored = localStorage.getItem(key)
      console.log('[PrivateNotes] Loading from localStorage on mount:', {
        key,
        stored,
        exists: !!stored,
      })
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          console.log('[PrivateNotes] Parsed localStorage data:', parsed)
          setNotes(parsed.content || '')
          console.log(
            '[PrivateNotes] Set notes from localStorage:',
            parsed.content || '',
          )
          notesLoadedRef.current = true
        } catch (error) {
          console.warn('[PrivateNotes] Error parsing localStorage data:', error)
        }
      } else {
        console.log('[PrivateNotes] No localStorage data found for key:', key)
      }
      setInitialLoad(false)
    }
  }, [meetingCtx, getLocalStorageKey])

  // Save notes to localStorage
  const saveNotesToLocalStorage = useCallback(
    (content) => {
      try {
        const key = getLocalStorageKey()
        const data = {
          content: content || '',
          timestamp: Date.now(),
          meetingId: contextMeetingId,
        }
        localStorage.setItem(key, JSON.stringify(data))
        console.log('[PrivateNotes] Saved notes to localStorage:', key)
      } catch (error) {
        console.warn(
          '[PrivateNotes] Error saving notes to localStorage:',
          error,
        )
      }
    },
    [getLocalStorageKey, contextMeetingId],
  )

  // Add debug info to help troubleshooting
  console.log('[PrivateNotes] API Service:', {
    role,
    isTrainerService: apiService === trainerAPIService,
    serviceBaseUrl: apiService.baseURL,
    hasSaveMethod: typeof apiService.saveMeetingNotes === 'function',
  })

  // Function to fetch meeting notes separately
  const fetchMeetingNotes = useCallback(async () => {
    console.log('[PrivateNotes] fetchMeetingNotes called:', {
      meetingDetails,
      id: contextMeetingId,
    })

    // Try to get meeting ID from various possible properties
    let meetingId = contextMeetingId

    // If still no ID, try to extract from URL
    if (!meetingId) {
      const pathname = window.location.pathname
      if (pathname.includes('/coaching/meeting/')) {
        const pathSegments = pathname.split('/')
        meetingId = pathSegments[pathSegments.length - 1]
        console.log('[PrivateNotes] Extracted meeting ID from URL:', meetingId)
      }
    }

    if (meetingId && !notesLoadedRef.current) {
      try {
        console.log(
          '[PrivateNotes] Fetching notes separately for meeting:',
          meetingId,
        )
        const notesData = await apiService.getMeetingNotes(meetingId)
        if (notesData.content) {
          console.log('[PrivateNotes] Found notes via API:', notesData.content)
          setNotes(notesData.content)
          notesLoadedRef.current = true
        }
      } catch (error) {
        console.warn('[PrivateNotes] Error fetching meeting notes:', error)
      }
    } else {
      console.log('[PrivateNotes] Not fetching notes - conditions not met:', {
        meetingId,
        alreadyLoaded: notesLoadedRef.current,
      })
    }
    setInitialLoad(false)
  }, [meetingDetails, contextMeetingId, apiService])

  // Load notes from localStorage on component mount (for standalone mode)
  useEffect(() => {
    console.log(
      '[PrivateNotes] Loading useEffect triggered, meetingDetails:',
      meetingDetails,
    )
    if (!meetingDetails && !notesLoadedRef.current) {
      console.warn(
        '[PrivateNotes] No meeting details available; loading from localStorage.',
      )
      const key = getLocalStorageKey()
      const stored = localStorage.getItem(key)
      console.log('[PrivateNotes] Loading from localStorage:', {
        key,
        stored: stored ? 'exists' : 'null',
      })
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          console.log(
            '[PrivateNotes] Setting notes from localStorage:',
            parsed.content,
          )
          setNotes(parsed.content || '')
          notesLoadedRef.current = true
        } catch (error) {
          console.warn('[PrivateNotes] Error parsing localStorage:', error)
        }
      } else {
        console.log('[PrivateNotes] No localStorage data found')
      }
      setInitialLoad(false)
    } else {
      console.log(
        '[PrivateNotes] Skipping localStorage load - has meetingDetails or already loaded',
      )
      if (!notesLoadedRef.current) {
        setInitialLoad(false)
      }
    }
  }, [meetingDetails, getLocalStorageKey])

  // Initialize notes from meeting details (when MeetingContext is available)
  useEffect(() => {
    console.log(
      '[PrivateNotes] Meeting details useEffect triggered:',
      meetingDetails,
    )

    if (meetingDetails) {
      // Log all properties to help diagnose where notes might be stored
      const propKeys = Object.keys(meetingDetails)
      console.log('[PrivateNotes] Available properties:', propKeys)

      // Check for meeting_note property, notes property, or any property that might contain notes
      // The API might be returning notes under various property names
      const possibleNoteFields = [
        'meeting_note',
        'notes',
        'meetingNote',
        'note',
        'content',
        'user_notes',
      ]
      let meetingNotes = ''

      // Try each possible field
      for (const field of possibleNoteFields) {
        if (
          meetingDetails[field] &&
          typeof meetingDetails[field] === 'string'
        ) {
          meetingNotes = meetingDetails[field]
          console.log(`[PrivateNotes] Found notes in field "${field}"`)
          break
        }
      }

      // Also check if there's a nested notes object
      if (
        !meetingNotes &&
        meetingDetails.meeting &&
        meetingDetails.meeting.notes
      ) {
        meetingNotes = meetingDetails.meeting.notes
        console.log('[PrivateNotes] Found notes in meeting.notes')
      }

      console.log('[PrivateNotes] Meeting details loaded:', {
        hasNotes: !!meetingNotes,
        noteLength: meetingNotes?.length || 0,
        meetingId: contextMeetingId,
      })

      if (meetingNotes) {
        setNotes(meetingNotes)
        setInitialLoad(false)
        notesLoadedRef.current = true
      } else {
        // If no notes were found in meeting details, first try localStorage as fallback
        const key = getLocalStorageKey()
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            console.log(
              '[PrivateNotes] Found notes in localStorage as fallback:',
              parsed.content,
            )
            setNotes(parsed.content || '')
            notesLoadedRef.current = true
          } catch (error) {
            console.warn(
              '[PrivateNotes] Error parsing localStorage fallback:',
              error,
            )
          }
        }

        // Then try fetching from API (this won't override localStorage if it was found)
        console.log(
          '[PrivateNotes] Calling fetchMeetingNotes after localStorage check',
        )
        fetchMeetingNotes()
      }
    } else {
      console.log('[PrivateNotes] No meetingDetails available')
    }
  }, [meetingDetails, contextMeetingId, fetchMeetingNotes, getLocalStorageKey])

  // Handle notes change with debounced auto-save
  const handleNotesChange = (e) => {
    const newNotes = e.target.value
    setNotes(newNotes)

    // Save to localStorage immediately for instant persistence
    saveNotesToLocalStorage(newNotes)

    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set status to pending
    setSaving(true)
    setSaveStatus(null)

    // Set a new timer to save to server after 5 seconds of inactivity (only if meeting context exists)
    if (contextMeetingId) {
      saveTimerRef.current = setTimeout(() => {
        saveNotesToServer(newNotes)
      }, 5000)
    } else {
      // For standalone mode, just clear the saving state
      setTimeout(() => {
        setSaving(false)
      }, 1000)
    }
  }

  // Track the latest save operation with an ID to prevent race conditions
  const saveOperationRef = useRef(0)

  // Save notes to the server (only when MeetingContext is available)
  const saveNotesToServer = async (content) => {
    // Only save to server if we have meeting context
    if (!contextMeetingId) {
      console.log('[PrivateNotes] No meeting context - skipping server save')
      setSaving(false)
      return
    }

    // Generate a unique operation ID
    const operationId = Date.now()
    saveOperationRef.current = operationId

    try {
      setSaving(true)

      // Get user ID from various possible sources
      // First try localStorage
      let userId = localStorage.getItem('userId')

      // If not found, try to get from auth service or current user data
      if (!userId) {
        try {
          // Try to get from current user in localStorage
          const currentUserString = localStorage.getItem('currentUser')
          if (currentUserString) {
            const currentUser = JSON.parse(currentUserString)
            userId = currentUser.id || currentUser.userId
            console.log('[PrivateNotes] Found userId from currentUser:', userId)
          }
        } catch (e) {
          console.warn('[PrivateNotes] Error parsing currentUser:', e)
        }
      }

      // If still no userId, check if this is my participant ID in meetingDetails
      if (!userId && meetingDetails?.participants) {
        const myParticipant = meetingDetails.participants.find(
          (p) => p.isCurrentUser === true,
        )
        if (myParticipant) {
          userId = myParticipant.userId
          console.log(
            '[PrivateNotes] Found userId from meeting participants:',
            userId,
          )
        }
      }

      // Last resort - try to find any ID that might work
      if (!userId && window.currentUser?.id) {
        userId = window.currentUser.id
        console.log(
          '[PrivateNotes] Found userId from window.currentUser:',
          userId,
        )
      }

      // Validate meeting ID and user ID
      if (!userId) {
        console.warn('[PrivateNotes] Could not determine userId')
      }

      if (!contextMeetingId) {
        console.warn(
          '[PrivateNotes] Missing meetingId, current meetingDetails:',
          meetingDetails,
        )
      }

      // Use default values as fallback
      const meetingId = contextMeetingId || window.location.pathname.split('/').pop()

      // If no userId can be found, use a placeholder - better than failing completely
      // The API can still associate notes with the meeting even if user is unknown
      if (!userId) {
        userId = `anonymous-${Date.now()}`
        console.warn(
          '[PrivateNotes] Using anonymous userId as fallback:',
          userId,
        )
      }

      if (!meetingId) {
        throw new Error('Cannot save notes: Missing meetingId')
      }

      console.log('[PrivateNotes] Saving notes to server with:', {
        meetingId,
        userId,
        contentLength: content?.length || 0,
      })

      // Make sure content is a string
      const safeContent = content || ''

      // Call the API service method directly - no in-component API calls
      // The service implementation will handle the HTTP request
      const response = await apiService.saveMeetingNotes({
        meeting_id: meetingId,
        user_id: userId,
        content: safeContent,
      })

      // Only update UI state if this is still the latest save operation
      if (saveOperationRef.current === operationId) {
        console.log('Notes saved to server successfully:', response)
        setSaveStatus('success')

        // Reset status after 3 seconds
        setTimeout(() => {
          // Only clear if this is still the latest save operation
          if (saveOperationRef.current === operationId) {
            setSaveStatus(null)
          }
        }, 3000)
      }
    } catch (error) {
      // Detailed error logging
      console.error('Failed to save notes to server:', error)

      // Log detailed diagnostic information
      console.error('[PrivateNotes] Error context:', {
        meetingDetailsExists: !!meetingDetails,
        meetingId: contextMeetingId,
        userIdFromLocalStorage: localStorage.getItem('userId'),
        currentUserExists: !!localStorage.getItem('currentUser'),
        apiServiceType: role === 'trainer' ? 'trainer' : 'client',
        contentLength: content?.length,
        errorMessage: error.message,
        errorStack: error.stack,
      })

      // Only update UI state if this is still the latest save operation
      if (saveOperationRef.current === operationId) {
        setSaveStatus('error')

        // Reset error status after 5 seconds
        setTimeout(() => {
          // Only clear if this is still the latest save operation
          if (saveOperationRef.current === operationId) {
            setSaveStatus(null)
          }
        }, 5000)
      }
    } finally {
      // Only update UI state if this is still the latest save operation
      if (saveOperationRef.current === operationId) {
        setSaving(false)
      }
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-full'>
      <CardHeader className='pb-4'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-lg font-semibold text-foreground'>
            {title}
          </CardTitle>
          <div className='flex items-center'>
            {saving && (
              <Loader2 className='h-4 w-4 animate-spin text-gray-500 mr-2' />
            )}
            {saveStatus === 'success' && (
              <span className='text-xs text-green-500'>Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className='text-xs text-red-500'>Failed to save</span>
            )}
          </div>
        </div>
        <p className='text-sm text-gray-500 mb-4 font-exo'>
          Only visible to you
        </p>
      </CardHeader>
      <CardContent className='font-exo'>
        {initialLoad ? (
          <div className='flex justify-center items-center h-48'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
          </div>
        ) : (
          <textarea
            className='w-full h-64 p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
            value={notes}
            onChange={handleNotesChange}
            onBlur={() => {
              if (!contextMeetingId) return
              if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
              }
              saveNotesToServer(notes)
            }}
            placeholder='Add your private meeting notes here...'
          />
        )}

        {/* If we need to show rendered HTML content in the future, uncomment this
        {!initialLoad && notes && (
          <div className="mt-4 p-3 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-2">Rendered Preview:</h4>
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ __html: notes }}
            />
          </div>
        )}
        */}
      </CardContent>
    </Card>
  )
}
