import { Chat } from '@/components/Chat'
import { ClientDetails } from '@/components/Details'
import { FormAnswersCard } from '@/components/FormAnswersCard'
import { Meetings } from '@/components/Meetings'
import { ProgramCard } from '@/components/ProgramCard'
import { PrivateNotes } from '@/components/PrivateNotes'
import { StudentProgress } from '@/components/StudentProgress'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const CoachingClientDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [chatId, setChatId] = useState(null)
  const [ws, setWs] = useState(null) // eslint-disable-line no-unused-vars
  const [chatInitiated, setChatInitiated] = useState(false)
  const [formAnswers, setFormAnswers] = useState([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [meetingFormData, setMeetingFormData] = useState({
    meeting_title: '',
    meeting_date: '',
    meeting_time: '',
    notes: '',
  })
  const [isScheduling, setIsScheduling] = useState(false)
  const maxReconnectAttempts = 5

  const connectWebSocket = useCallback(
    (chatId, attempt = 0) => {
      if (attempt >= maxReconnectAttempts) {
        console.error('Max WebSocket reconnection attempts reached')
        return
      }

      console.log(`Connecting to WebSocket (attempt ${attempt + 1})`)
      const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
      const effectiveBaseUrl =
        window.location.protocol === 'https:' && baseUrl.startsWith('ws://')
          ? baseUrl.replace('ws://', 'wss://')
          : baseUrl
      const websocket = new WebSocket(
        `${effectiveBaseUrl}/messaging/sessions/${chatId}`,
      )
      setWs(websocket)

      websocket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.event === 'message') {
            // Check if this message is already in our state (to avoid duplicates)
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === msg.data.messageId)
              if (exists) return prev

              return [
                ...prev,
                {
                  id: msg.data.messageId,
                  text: msg.data.text,
                  sender: msg.data.senderName === user?.name ? 'user' : 'other',
                },
              ]
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      websocket.onopen = () => {
        console.log('WebSocket connected')
      }

      websocket.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason)
        setWs(null)

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && attempt < maxReconnectAttempts) {
          setTimeout(
            () => {
              connectWebSocket(chatId, attempt + 1)
            },
            2000 * (attempt + 1),
          ) // Exponential backoff
        }
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      return websocket
    },
    [user?.name, maxReconnectAttempts],
  )

  const loadExistingChat = useCallback(
    async (chatId) => {
      setChatId(chatId)
      setChatInitiated(true)

      // Connect to WebSocket using cookie-authenticated handshake
      connectWebSocket(chatId)

      // Fetch existing messages
      try {
        const msgs = await authService.getChatMessages(chatId)
        setMessages(
          msgs.map((m) => ({
            id: m.messageId,
            text: m.text,
            sender: m.senderName === user?.name ? 'user' : 'other',
          })),
        )
      } catch (err) {
        console.error('Failed to fetch messages', err)
      }
    },
    [connectWebSocket, user?.name],
  )

  const checkExistingChat = useCallback(() => {
    const stored = localStorage.getItem(`chat_${id}`)
    if (stored) {
      try {
        const { chatId } = JSON.parse(stored)
        if (chatId) {
          loadExistingChat(chatId)
        }
      } catch (e) {
        console.error('Error parsing stored chat', e)
      }
    }
  }, [id, loadExistingChat])

  useEffect(() => {
    fetchClientDetails()
    checkExistingChat()
  }, [id])

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true)
      const response = await authService.getCoachingClientDetails(id)
      setClientData(response)
      setFormAnswers(response.formAnswers || [])
    } catch (error) {
      console.error('Failed to fetch client details:', error)
      toast.error('Failed to load client details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (message) => {
    if (!chatId) return

    // Immediately add the message to local state
    const tempMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      text: message,
      sender: 'user',
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      await authService.sendChatMessage(chatId, message, id)
      // Optionally update the message with the real ID from response
      // The service handles the response internally
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove the temporary message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
      alert('Failed to send message: ' + err.message)
    }
  }

  const initiateChat = async () => {
    try {
      const data = await authService.initiateChat(
        id,
        user?.id,
        'Client Support',
      )
      setChatId(data.chatId)
      setChatInitiated(true)

      // Store chat ID in localStorage for quick resume
      localStorage.setItem(
        `chat_${id}`,
        JSON.stringify({
          chatId: data.chatId,
        }),
      )

      // Connect to WebSocket using cookie-authenticated handshake
      connectWebSocket(data.chatId)

      // Fetch existing messages
      const msgs = await authService.getChatMessages(data.chatId)
      setMessages(
        msgs.map((m) => ({
          id: m.messageId,
          text: m.text,
          sender: m.senderName === user?.name ? 'user' : 'other',
        })),
      )
    } catch (err) {
      console.error('Failed to initiate chat:', err)
      alert('Failed to start chat: ' + err.message)
    }
  }

  const handleMeetingAction = (meetingId, action) => {
    console.log(`Meeting ${meetingId}: ${action}`)
  }

  const handleScheduleMeeting = () => {
    setShowScheduleModal(true)
  }

  const handleScheduleSubmit = async () => {
    if (
      !meetingFormData.meeting_title.trim() ||
      !meetingFormData.meeting_date ||
      !meetingFormData.meeting_time
    ) {
      alert('Please fill in all required fields')
      return
    }

    if (isScheduling) return

    try {
      setIsScheduling(true)
      const response = await fetch(
        `${API_BASE_URL}/scheduling/trainer/schedule-meeting/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_uuid: id,
            meeting_title: meetingFormData.meeting_title,
            meeting_date: meetingFormData.meeting_date,
            meeting_time: meetingFormData.meeting_time,
            notes: meetingFormData.notes,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to schedule meeting')
      }

      await response.json().catch(() => ({}))
      toast.success('Meeting scheduled successfully')
      setShowScheduleModal(false)
      setMeetingFormData({
        meeting_title: '',
        meeting_date: '',
        meeting_time: '',
        notes: '',
      })
      // Refresh client data to show new meeting
      fetchClientDetails()
    } catch (err) {
      console.error('Failed to schedule meeting:', err)
      toast.error(err.message || 'Failed to schedule meeting')
    } finally {
      setIsScheduling(false)
    }
  }

  // Prepare data for components
  const clientFields = clientData?.client
    ? [
        { label: 'Name', value: clientData.client.name },
        {
          label: 'Joined On',
          value: clientData.client.joinedOn
            ? new Date(clientData.client.joinedOn).toLocaleDateString()
            : 'N/A',
        },
        { label: 'Email', value: clientData.client.email },
        {
          label: 'Sales Influencer',
          value: clientData.client.sales_influencer_assigned || 'N/A',
        },
      ]
    : []

  const meetingsData = clientData?.meetings
    ? clientData.meetings.map((meeting) => ({
        id: meeting.meetingId,
        date: meeting.scheduledAt
          ? new Date(meeting.scheduledAt).toLocaleDateString()
          : 'N/A',
        status: meeting.status,
        actions:
          meeting.status === 'completed'
            ? ['Download Transcript']
            : ['PENDING'],
      }))
    : []

  const programsData = clientData?.programs
    ? clientData.programs.map((program) => ({
        id: program.programId,
        programName: program.programName,
        joinedOn: program.enrolledAt
          ? new Date(program.enrolledAt).toLocaleDateString()
          : 'N/A',
      }))
    : []

  if (isLoading) {
    return (
      <div>
        <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
          Client Details
        </h2>
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
        Client Details - ID: {id}
      </h2>

      <div className='grid grid-cols-12 gap-6 max-w-7xl mx-auto'>
        {/* Row 1: Client details & Chat */}
        <div className='col-span-12 lg:col-span-6 flex flex-col'>
          <ClientDetails fields={clientFields} />
        </div>
        <div className='col-span-12 lg:col-span-6 flex flex-col'>
          {!chatInitiated ? (
            <div className='flex items-center justify-center h-full'>
              <button
                onClick={initiateChat}
                className='bg-[#F6B72D] text-white px-6 py-3 rounded-lg font-semibold'
              >
                Initiate Chat
              </button>
            </div>
          ) : (
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              className='h-full'
            />
          )}
        </div>
        <div className='col-span-12 lg:col-span-6 flex flex-col gap-6'>
          <Meetings
            data={meetingsData}
            onAction={handleMeetingAction}
            onSchedule={handleScheduleMeeting}
          />
          <ProgramCard data={programsData} />
        </div>

        <div className='col-span-12 lg:col-span-6 lg:row-span-2'>
          <PrivateNotes title={'Private Notes'} />
        </div>

        {/* Row 4: Student Progress (full width bottom) */}
        <div className='col-span-12'>
          <StudentProgress data={clientData?.progress} />
        </div>

        {/* Row 5: Form Answers (full width bottom) */}
        <div className='col-span-12'>
          <FormAnswersCard
            formAnswers={formAnswers}
            clientName={clientData?.client?.name || 'Client'}
          />
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>Schedule Meeting</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Meeting Title *
                </label>
                <input
                  type='text'
                  value={meetingFormData.meeting_title}
                  onChange={(e) =>
                    setMeetingFormData((prev) => ({
                      ...prev,
                      meeting_title: e.target.value,
                    }))
                  }
                  className='w-full p-2 border border-gray-300 rounded-md'
                  placeholder='Enter meeting title'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Date *
                </label>
                <input
                  type='date'
                  value={meetingFormData.meeting_date}
                  onChange={(e) =>
                    setMeetingFormData((prev) => ({
                      ...prev,
                      meeting_date: e.target.value,
                    }))
                  }
                  className='w-full p-2 border border-gray-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Time *
                </label>
                <input
                  type='time'
                  value={meetingFormData.meeting_time}
                  onChange={(e) =>
                    setMeetingFormData((prev) => ({
                      ...prev,
                      meeting_time: e.target.value,
                    }))
                  }
                  className='w-full p-2 border border-gray-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Notes
                </label>
                <textarea
                  value={meetingFormData.notes}
                  onChange={(e) =>
                    setMeetingFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className='w-full p-2 border border-gray-300 rounded-md'
                  rows='3'
                  placeholder='Optional notes'
                />
              </div>
            </div>
            <div className='flex justify-end space-x-2 mt-6'>
              <button
                onClick={() => setShowScheduleModal(false)}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={isScheduling}
                className='px-4 py-2 bg-[#F6B72D] text-white rounded-md hover:bg-[#e5a529] disabled:opacity-50'
              >
                {isScheduling ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoachingClientDetails
