import { Chat } from '@/components/Chat'
import { ClientDetails } from '@/components/Details'
import { QuestionnaireProgressCard } from '@/components/QuestionnaireProgressCard'
import { Meetings } from '@/components/Meetings'
import { PermissionCard } from '@/components/PermissionCard'
import { ProgramCard } from '@/components/ProgramCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import salesAPIService from '@/services/salesAPIService'
import { X } from 'lucide-react'

export default function SalesClientDetails() {
  const { id: userId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clientData, setClientData] = useState(null)
  const [meetingsData, setMeetingsData] = useState([])
  const [programsData, setProgramsData] = useState([])
  const [permissions, setPermissions] = useState([])
  const [permissionsFetched, setPermissionsFetched] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatId, setChatId] = useState(null)
  const [ws, setWs] = useState(null) // eslint-disable-line no-unused-vars
  const [chatInitiated, setChatInitiated] = useState(false)
  const [formAnswers, setFormAnswers] = useState([])
  const maxReconnectAttempts = 5
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTypeId, setMeetingTypeId] = useState('')
  const [meetingDuration, setMeetingDuration] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [notesModal, setNotesModal] = useState({
    open: false,
    meetingId: null,
    content: '',
    loading: false,
    error: '',
  })

  const getMeetingActions = useCallback((meetingStatus) => {
    const normalizedStatus = String(meetingStatus || '').toLowerCase()
    if (['scheduled', 'confirmed', 'active'].includes(normalizedStatus)) {
      return ['Join Call', 'View Notes']
    }
    if (['completed', 'ended'].includes(normalizedStatus)) {
      return ['View Notes', 'Download Transcript']
    }
    return ['View Notes']
  }, [])

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

  const fetchUserData = useCallback(async () => {
    console.log('fetchUserData called')
    try {
      setLoading(true)
      setError('')

      console.log('Fetching client details', `/api/auth/client/${userId}/`)
      const client = await salesAPIService.getClientDetails(userId)

      setClientData({
        name: client.name,
        joinedOn: new Date(client.joinedOn).toLocaleDateString(),
        email: client.email,
        salesInfluencer: client.sales_influencer_assigned,
        phone: client.phone,
        address: client.address,
        jobTitle: client.jobTitle,
        position: client.position,
        industry: client.industry,
      })

      const meetings = await salesAPIService.getClientMeetings(userId)

      if (Array.isArray(meetings)) {
        setMeetingsData(
          meetings.map((m) => ({
            id: m.meetingId,
            date: new Date(m.scheduledAt).toLocaleDateString(),
            status: m.status,
            actions: getMeetingActions(m.status),
          })),
        )
      } else {
        setMeetingsData([])
      }
      setProgramsData(client?.enrolledPrograms || [])

      // Set questionnaire responses
      setFormAnswers(
        Array.isArray(client.formAnswers) ? client.formAnswers : [],
      )
    } catch (err) {
      console.error('fetchUserData error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, getMeetingActions])

  const fetchPermissions = useCallback(async () => {
    if (permissionsFetched) return // Already fetched

    try {
      console.log('Fetching permissions')
      const perms = await salesAPIService.getClientPermissions(userId)
      console.log('Permissions data:', perms)
      setPermissions([
        // Client Management
        {
          name: 'View Clients',
          enabled: perms.view_clients,
          category: 'Client Management',
        },
        {
          name: 'Edit Clients',
          enabled: perms.edit_client_details,
          category: 'Client Management',
        },
        {
          name: 'Delete Clients',
          enabled: perms.delete_clients,
          category: 'Client Management',
        },
        {
          name: 'Meet Clients',
          enabled: perms.meet_clients,
          category: 'Client Management',
        },

        // Program Management
        {
          name: 'View Programs',
          enabled: perms.view_programs,
          category: 'Program Management',
        },
        {
          name: 'Create Programs',
          enabled: perms.create_programs,
          category: 'Program Management',
        },
        {
          name: 'Edit Programs',
          enabled: perms.edit_programs,
          category: 'Program Management',
        },
        {
          name: 'Delete Programs',
          enabled: perms.delete_programs,
          category: 'Program Management',
        },
        {
          name: 'Publish Programs',
          enabled: perms.publish_programs,
          category: 'Program Management',
        },

        // User Management
        {
          name: 'View Users',
          enabled: perms.view_users,
          category: 'User Management',
        },
        {
          name: 'Create Users',
          enabled: perms.create_users,
          category: 'User Management',
        },
        {
          name: 'Edit Users',
          enabled: perms.edit_users,
          category: 'User Management',
        },
        {
          name: 'Delete Users',
          enabled: perms.delete_users,
          category: 'User Management',
        },
        {
          name: 'Manage Roles',
          enabled: perms.manage_roles,
          category: 'User Management',
        },

        // Payment Management
        {
          name: 'View Payments',
          enabled: perms.view_payments,
          category: 'Payment Management',
        },
        {
          name: 'Process Payments',
          enabled: perms.process_payments,
          category: 'Payment Management',
        },
        {
          name: 'Refund Payments',
          enabled: perms.refund_payments,
          category: 'Payment Management',
        },

        // Scheduling
        {
          name: 'View Schedules',
          enabled: perms.view_schedules,
          category: 'Scheduling',
        },
        {
          name: 'Create Appointments',
          enabled: perms.create_appointments,
          category: 'Scheduling',
        },
        {
          name: 'Edit Appointments',
          enabled: perms.edit_appointments,
          category: 'Scheduling',
        },
        {
          name: 'Cancel Appointments',
          enabled: perms.cancel_appointments,
          category: 'Scheduling',
        },

        // Communications
        {
          name: 'View Communications',
          enabled: perms.view_communications,
          category: 'Communications',
        },
        {
          name: 'Send Notifications',
          enabled: perms.send_notifications,
          category: 'Communications',
        },
        {
          name: 'Send Broadcasts',
          enabled: perms.send_broadcasts,
          category: 'Communications',
        },

        // Analytics & Reporting
        {
          name: 'View Basic Stats',
          enabled: perms.view_basic_stats,
          category: 'Analytics & Reporting',
        },
        {
          name: 'View Critical Stats',
          enabled: perms.view_critical_stats,
          category: 'Analytics & Reporting',
        },
        {
          name: 'Export Data',
          enabled: perms.export_data,
          category: 'Analytics & Reporting',
        },

        // Compliance & Audit
        {
          name: 'View Consents',
          enabled: perms.view_consents,
          category: 'Compliance & Audit',
        },
        {
          name: 'Manage Consents',
          enabled: perms.manage_consents,
          category: 'Compliance & Audit',
        },
        {
          name: 'View Audit Logs',
          enabled: perms.view_audit_logs,
          category: 'Compliance & Audit',
        },

        // Chat & Support
        {
          name: 'Access Chat',
          enabled: perms.access_chat,
          category: 'Chat & Support',
        },
        {
          name: 'Moderate Chat',
          enabled: perms.moderate_chat,
          category: 'Chat & Support',
        },

        // System Administration
        {
          name: 'Manage Settings',
          enabled: perms.manage_settings,
          category: 'System Administration',
        },
        {
          name: 'View System Logs',
          enabled: perms.view_system_logs,
          category: 'System Administration',
        },
        {
          name: 'Backup Data',
          enabled: perms.backup_data,
          category: 'System Administration',
        },
      ])
      setPermissionsFetched(true)
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }, [userId, permissionsFetched])

  const loadExistingChat = useCallback(
    async (chatId) => {
      setChatId(chatId)
      setChatInitiated(true)

      // Connect to WebSocket using cookie-authenticated handshake
      connectWebSocket(chatId)

      // Fetch existing messages
      try {
        const msgs = await salesAPIService.getChatMessages(chatId)
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
    const stored = localStorage.getItem(`chat_${userId}`)
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
  }, [userId, loadExistingChat])

  useEffect(() => {
    console.log('UserDetail useEffect', { userId })
    if (!userId) {
      setError('User ID not found')
      setLoading(false)
      return
    }
    fetchUserData()
    checkExistingChat()
  }, [userId, fetchUserData, checkExistingChat])

  // Fetch permissions separately to avoid calling on every main data load
  useEffect(() => {
    if (userId && !permissionsFetched) {
      fetchPermissions()
    }
  }, [userId, permissionsFetched, fetchPermissions])

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
      await salesAPIService.sendChatMessage(chatId, message, userId)
      // Optionally update the message with the real ID from response
      // The service handles the response internally
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove the temporary message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
      alert('Failed to send message: ' + err.message)
    }
  }

  // eslint-disable-next-line no-unused-vars
  const handlePermissionChange = async (permissionName, enabled) => {
    try {
      // Comprehensive permission mapping
      const permMap = {
        // Client Management
        'View Clients': 'view_clients',
        'Edit Clients': 'edit_client_details',
        'Delete Clients': 'delete_clients',
        'Meet Clients': 'meet_clients',

        // Program Management
        'View Programs': 'view_programs',
        'Create Programs': 'create_programs',
        'Edit Programs': 'edit_programs',
        'Delete Programs': 'delete_programs',
        'Publish Programs': 'publish_programs',

        // User Management
        'View Users': 'view_users',
        'Create Users': 'create_users',
        'Edit Users': 'edit_users',
        'Delete Users': 'delete_users',
        'Manage Roles': 'manage_roles',

        // Payment Management
        'View Payments': 'view_payments',
        'Process Payments': 'process_payments',
        'Refund Payments': 'refund_payments',

        // Scheduling
        'View Schedules': 'view_schedules',
        'Create Appointments': 'create_appointments',
        'Edit Appointments': 'edit_appointments',
        'Cancel Appointments': 'cancel_appointments',

        // Communications
        'View Communications': 'view_communications',
        'Send Notifications': 'send_notifications',
        'Send Broadcasts': 'send_broadcasts',

        // Analytics & Reporting
        'View Basic Stats': 'view_basic_stats',
        'View Critical Stats': 'view_critical_stats',
        'Export Data': 'export_data',

        // Compliance & Audit
        'View Consents': 'view_consents',
        'Manage Consents': 'manage_consents',
        'View Audit Logs': 'view_audit_logs',

        // Chat & Support
        'Access Chat': 'access_chat',
        'Moderate Chat': 'moderate_chat',

        // System Administration
        'Manage Settings': 'manage_settings',
        'View System Logs': 'view_system_logs',
        'Backup Data': 'backup_data',
      }

      // Create permissions object with all current permissions plus the updated one
      const updatedPermissions = {}
      permissions.forEach((perm) => {
        const apiKey = permMap[perm.name]
        if (apiKey) {
          updatedPermissions[apiKey] =
            perm.name === permissionName ? enabled : perm.enabled
        }
      })

      await salesAPIService.updateClientPermissions(userId, updatedPermissions)
      setPermissions(
        permissions.map((p) =>
          p.name === permissionName ? { ...p, enabled } : p,
        ),
      )
    } catch (err) {
      alert(err.message)
    }
  }

  const handleMeetingAction = async (meetingId, action) => {
    if (action === 'Join Call') {
      navigate(`/client/meeting/${meetingId}`)
      return
    }

    if (action === 'View Notes') {
      setNotesModal({
        open: true,
        meetingId,
        content: '',
        loading: true,
        error: '',
      })
      try {
        const notesData = await salesAPIService.getMeetingNotes(meetingId)
        setNotesModal({
          open: true,
          meetingId,
          content: notesData?.content || '',
          loading: false,
          error: '',
        })
      } catch (err) {
        setNotesModal({
          open: true,
          meetingId,
          content: '',
          loading: false,
          error: err.message || 'Failed to load notes',
        })
      }
      return
    }

    if (action === 'Download Transcript') {
      try {
        const blob = await salesAPIService.downloadMeetingTranscript(
          userId,
          meetingId,
        )
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript-${meetingId}.txt`
        a.click()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const handleScheduleMeeting = () => {
    setShowScheduleModal(true)
  }

  const handleScheduleSubmit = async () => {
    if (
      !meetingTitle.trim() ||
      !meetingDate ||
      !meetingTypeId ||
      !meetingDuration
    ) {
      alert('Please fill in all fields')
      return
    }

    try {
      setScheduling(true)
      await salesAPIService.scheduleMeeting(
        meetingTitle,
        meetingTypeId,
        userId,
        meetingDate,
        meetingDuration,
      )
      alert('Meeting scheduled successfully')
      setShowScheduleModal(false)
      setMeetingTitle('')
      setMeetingDate('')
      setMeetingTypeId('')
      setMeetingDuration('')
      fetchUserData() // Refresh meetings
    } catch (err) {
      alert(err.message)
    } finally {
      setScheduling(false)
    }
  }

  const initiateChat = async () => {
    try {
      const data = await salesAPIService.initiateChat(
        userId,
        user?.id,
        'Client Support',
      )
      setChatId(data.chatId)
      setChatInitiated(true)

      // Store chat ID in localStorage for quick resume
      localStorage.setItem(
        `chat_${userId}`,
        JSON.stringify({
          chatId: data.chatId,
        }),
      )

      // Connect to WebSocket using cookie-authenticated handshake
      connectWebSocket(data.chatId)

      // Fetch existing messages
      const msgs = await salesAPIService.getChatMessages(data.chatId)
      setMessages(
        msgs.map((m) => ({
          id: m.messageId,
          text: m.text,
          sender: m.senderName === user?.name ? 'user' : 'other',
        })),
      )
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading User Details</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-6'>
      <div className='grid grid-cols-12 gap-6 max-w-7xl mx-auto'>
        {/* Left side (6 cols, 3 rows stacked) */}
        <div className='col-span-12 lg:col-span-6 flex flex-col gap-6'>
          {clientData && (
            <ClientDetails
              fields={[
                { label: 'Name', value: clientData.name },
                { label: 'Joined On', value: clientData.joinedOn },
                { label: 'Email', value: clientData.email },
                { label: 'Phone', value: clientData.phone },
                { label: 'Address', value: clientData.address },
                { label: 'Job Title', value: clientData.jobTitle },
                { label: 'Position', value: clientData.position },
                { label: 'Industry', value: clientData.industry },
                {
                  label: 'Sales Influencer',
                  value: clientData.salesInfluencer,
                },
              ]}
              title='CLIENT DETAILS'
            />
          )}
          <Meetings
            data={meetingsData}
            onAction={handleMeetingAction}
            onSchedule={handleScheduleMeeting}
          />
          <ProgramCard
            data={programsData}
            isShown={false}
          />
        </div>

        {/* Right side (6 cols, Chat takes full height of left side) */}
        <div className='col-span-12 lg:col-span-6'>
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
        <div className='col-span-12'>
          <QuestionnaireProgressCard formAnswers={formAnswers} />
        </div>
        {/* <div className='col-span-12 lg:col-span-6'>
          <ModifyDetails
            programStatus={{
              value: 'Completed',
              options: ['Completed', 'In Progress', 'Not Started'],
            }}
            onUpdate={handleUpdate}
          />
        </div> */}
      </div>

      {notesModal.open && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-xl w-full border-2 border-[#F6B72D] shadow-xl'>
            <div className='flex items-center justify-between p-5 border-b border-gray-200'>
              <div>
                <h3 className='text-lg font-bold'>Meeting Notes</h3>
                <p className='text-sm text-gray-600 font-exo'>
                  Meeting #{notesModal.meetingId}
                </p>
              </div>
              <button
                type='button'
                onClick={() =>
                  setNotesModal({
                    open: false,
                    meetingId: null,
                    content: '',
                    loading: false,
                    error: '',
                  })
                }
                className='p-1.5 hover:bg-gray-100 rounded-full transition-colors'
                aria-label='Close notes'
              >
                <X className='h-5 w-5 text-gray-500' />
              </button>
            </div>
            <div className='p-5 font-exo'>
              {notesModal.loading ? (
                <div className='flex items-center justify-center h-32'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6B72D]'></div>
                </div>
              ) : notesModal.error ? (
                <p className='text-sm text-red-600'>{notesModal.error}</p>
              ) : notesModal.content ? (
                <div className='whitespace-pre-wrap text-sm text-gray-800 border border-gray-200 rounded-md p-3 max-h-80 overflow-auto'>
                  {notesModal.content}
                </div>
              ) : (
                <p className='text-sm text-gray-600'>
                  No private notes have been saved for this meeting.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>Schedule Meeting</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Meeting Title
                </label>
                <input
                  type='text'
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder='Enter meeting title...'
                  className='font-exo w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Meeting Type
                </label>
                <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder='Select meeting type...'
                      className='font-exo'
                    />
                  </SelectTrigger>
                  <SelectContent className='font-exo bg-white cursor-pointer'>
                    <SelectItem value='1'>Initial Sales Meeting</SelectItem>
                    <SelectItem value='2'>Program Review Meeting</SelectItem>
                    <SelectItem value='3'>Initial Consultation</SelectItem>
                    <SelectItem value='4'>Program Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Scheduled Date & Time
                </label>
                <input
                  type='datetime-local'
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className='font-exo w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Duration (minutes)
                </label>
                <input
                  type='number'
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  placeholder='Enter duration in minutes...'
                  min='15'
                  max='480'
                  className='font-exo w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent'
                />
              </div>

              <div className='flex space-x-2 pt-4'>
                <Button
                  onClick={handleScheduleSubmit}
                  disabled={
                    scheduling ||
                    !meetingTitle.trim() ||
                    !meetingDate ||
                    !meetingTypeId ||
                    !meetingDuration
                  }
                  className='bg-[#F6B72D] hover:bg-[#e6a02a] text-white'
                >
                  {scheduling ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setShowScheduleModal(false)
                    setMeetingTitle('')
                    setMeetingDate('')
                    setMeetingTypeId('')
                    setMeetingDuration('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
