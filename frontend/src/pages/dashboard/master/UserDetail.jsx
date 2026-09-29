import { Chat } from '@/components/Chat'
import { ClientDetails } from '@/components/Details'
import { FormAnswersCard } from '@/components/FormAnswersCard'
import { Meetings } from '@/components/Meetings'
import { ModifyDetails } from '@/components/ModifyDetails'
import { PermissionCard } from '@/components/PermissionCard'
import { ProgramCard } from '@/components/ProgramCard'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import salesAPIService from '@/services/salesAPIService'

export default function UserDetail() {
  const { id: userId } = useParams()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clientData, setClientData] = useState(null)
  const [meetingsData, setMeetingsData] = useState([])
  const [programsData, setProgramsData] = useState([])
  const [permissions, setPermissions] = useState([])
  const [messages, setMessages] = useState([])
  const [chatId, setChatId] = useState(null)
  const [ws, setWs] = useState(null) // eslint-disable-line no-unused-vars
  const [chatInitiated, setChatInitiated] = useState(false)
  const [formAnswers, setFormAnswers] = useState([])
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

  const fetchUserData = useCallback(async () => {
    console.log('fetchUserData called')
    try {
      setLoading(true)
      setError('')

      // Fetch all user data in single API call
      console.log('Fetching user details', `/api/accounts/client/${userId}/`)
      const data = await salesAPIService.getClientDetails(userId)
      console.log('User data:', data)

      // Set client data
      setClientData({
        name: data.name,
        joinedOn: new Date(data.joinedOn).toLocaleDateString(),
        email: data.email,
        salesInfluencer: data.sales_influencer_assigned,
      })

      // Set meetings data
      if (Array.isArray(data.meetings)) {
        setMeetingsData(
          data.meetings.map((m) => ({
            id: m.id || m.meetingId,
            date: new Date(m.scheduledAt || m.date).toLocaleDateString(),
            status: m.status,
            actions:
              m.status === 'completed' ? ['Download Transcript'] : ['PENDING'],
          })),
        )
      } else {
        setMeetingsData([])
      }

      // Set programs data
      if (Array.isArray(data.enrolledPrograms)) {
        setProgramsData(
          data.enrolledPrograms.map((p) => ({
            programId: p.programId,
            programName: p.programName,
            enrolledAt: p.enrolledAt,
            status: p.status,
            completed: p.completed,
          })),
        )
      } else {
        setProgramsData([])
      }

      // Set permissions data - map from array of strings to component format
      if (Array.isArray(data.permissions)) {
        // Define all possible permissions with their categories
        const allPermissions = [
          // Client Management
          {
            name: 'View Clients',
            key: 'view_clients',
            category: 'Client Management',
          },
          {
            name: 'Edit Clients',
            key: 'edit_client_details',
            category: 'Client Management',
          },
          {
            name: 'Delete Clients',
            key: 'delete_clients',
            category: 'Client Management',
          },
          {
            name: 'Meet Clients',
            key: 'meet_clients',
            category: 'Client Management',
          },

          // Program Management
          {
            name: 'View Programs',
            key: 'view_programs',
            category: 'Program Management',
          },
          {
            name: 'Create Programs',
            key: 'create_programs',
            category: 'Program Management',
          },
          {
            name: 'Edit Programs',
            key: 'edit_programs',
            category: 'Program Management',
          },
          {
            name: 'Delete Programs',
            key: 'delete_programs',
            category: 'Program Management',
          },
          {
            name: 'Publish Programs',
            key: 'publish_programs',
            category: 'Program Management',
          },

          // User Management
          {
            name: 'View Users',
            key: 'view_users',
            category: 'User Management',
          },
          {
            name: 'Create Users',
            key: 'create_users',
            category: 'User Management',
          },
          {
            name: 'Edit Users',
            key: 'edit_users',
            category: 'User Management',
          },
          {
            name: 'Delete Users',
            key: 'delete_users',
            category: 'User Management',
          },
          {
            name: 'Manage Roles',
            key: 'manage_roles',
            category: 'User Management',
          },

          // Payment Management
          {
            name: 'View Payments',
            key: 'view_payments',
            category: 'Payment Management',
          },
          {
            name: 'Process Payments',
            key: 'process_payments',
            category: 'Payment Management',
          },
          {
            name: 'Refund Payments',
            key: 'refund_payments',
            category: 'Payment Management',
          },

          // Scheduling
          {
            name: 'View Schedules',
            key: 'view_schedules',
            category: 'Scheduling',
          },
          {
            name: 'Create Appointments',
            key: 'create_appointments',
            category: 'Scheduling',
          },
          {
            name: 'Edit Appointments',
            key: 'edit_appointments',
            category: 'Scheduling',
          },
          {
            name: 'Cancel Appointments',
            key: 'cancel_appointments',
            category: 'Scheduling',
          },

          // Communications
          {
            name: 'View Communications',
            key: 'view_communications',
            category: 'Communications',
          },
          {
            name: 'Send Notifications',
            key: 'send_notifications',
            category: 'Communications',
          },
          {
            name: 'Send Broadcasts',
            key: 'send_broadcasts',
            category: 'Communications',
          },

          // Analytics & Reporting
          {
            name: 'View Basic Stats',
            key: 'view_basic_stats',
            category: 'Analytics & Reporting',
          },
          {
            name: 'View Critical Stats',
            key: 'view_critical_stats',
            category: 'Analytics & Reporting',
          },
          {
            name: 'Export Data',
            key: 'export_data',
            category: 'Analytics & Reporting',
          },

          // Compliance & Audit
          {
            name: 'View Consents',
            key: 'view_consents',
            category: 'Compliance & Audit',
          },
          {
            name: 'Manage Consents',
            key: 'manage_consents',
            category: 'Compliance & Audit',
          },
          {
            name: 'View Audit Logs',
            key: 'view_audit_logs',
            category: 'Compliance & Audit',
          },

          // Chat & Support
          {
            name: 'Access Chat',
            key: 'access_chat',
            category: 'Chat & Support',
          },
          {
            name: 'Moderate Chat',
            key: 'moderate_chat',
            category: 'Chat & Support',
          },

          // System Administration
          {
            name: 'Manage Settings',
            key: 'manage_settings',
            category: 'System Administration',
          },
          {
            name: 'View System Logs',
            key: 'view_system_logs',
            category: 'System Administration',
          },
          {
            name: 'Backup Data',
            key: 'backup_data',
            category: 'System Administration',
          },

          // Profile permissions from API
          {
            name: 'View Profile',
            key: 'view_profile',
            category: 'Profile Management',
          },
          {
            name: 'Edit Profile',
            key: 'edit_profile',
            category: 'Profile Management',
          },
          {
            name: 'View Enrolled Courses',
            key: 'view_enrolled_courses',
            category: 'Profile Management',
          },
          {
            name: 'Access Personal Data',
            key: 'access_personal_data',
            category: 'Profile Management',
          },
          {
            name: 'Book Appointments',
            key: 'book_appointments',
            category: 'Profile Management',
          },
        ]

        // Map permissions from API response
        const mappedPermissions = allPermissions.map((perm) => ({
          name: perm.name,
          enabled: data.permissions.includes(perm.key),
          category: perm.category,
        }))

        setPermissions(mappedPermissions)
      }

      // Set questionnaire responses
      setFormAnswers(Array.isArray(data.formAnswers) ? data.formAnswers : [])
    } catch (err) {
      console.error('fetchUserData error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadExistingChat = useCallback(
    async (chatId) => {
      setChatId(chatId)
      setChatInitiated(true)

      // Connect to WebSocket using cookie-authenticated handshake
      connectWebSocket(chatId)

      // Fetch existing messages
      try {
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const messagesResponse = await fetch(
          `${baseUrl}/messaging/sessions/${chatId}/messages/`,
          {
            credentials: 'include',
          },
        )
        if (messagesResponse.ok) {
          const msgs = await messagesResponse.json()
          setMessages(
            msgs.map((m) => ({
              id: m.messageId,
              text: m.text,
              sender: m.senderName === user?.name ? 'user' : 'other',
            })),
          )
        }
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
      const response = await fetch(`/api/people/chats/${chatId}/messages/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message, senderId: userId }),
      })
      if (!response.ok) throw new Error('Failed to send message')

      // Optionally update the message with the real ID from response
      const result = await response.json()
      if (result.messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id ? { ...msg, id: result.messageId } : msg,
          ),
        )
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove the temporary message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id))
      alert('Failed to send message: ' + err.message)
    }
  }

  const handlePermissionChange = async (permissionName, enabled) => {
    try {
      // Map permission names to API keys
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

        // Profile permissions
        'View Profile': 'view_profile',
        'Edit Profile': 'edit_profile',
        'View Enrolled Courses': 'view_enrolled_courses',
        'Access Personal Data': 'access_personal_data',
        'Book Appointments': 'book_appointments',
      }

      // Create updated permissions array
      const updatedPermissions = permissions.map((perm) => {
        if (perm.name === permissionName) {
          return { ...perm, enabled }
        }
        return perm
      })

      // Convert to API format (permission_key -> boolean)
      const apiPermissions = {}
      updatedPermissions.forEach((perm) => {
        const key = permMap[perm.name]
        if (key) {
          apiPermissions[key] = !!perm.enabled
        }
      })

      const response = await fetch(`/api/accounts/modify_permissions/`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          permissions: apiPermissions,
        }),
      })
      if (!response.ok) throw new Error('Failed to update permissions')

      // Update local state
      setPermissions(updatedPermissions)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleMeetingAction = async (meetingId, action) => {
    if (action === 'Download Transcript') {
      try {
        const response = await fetch(
          `/api/people/clients/${userId}/meetings/${meetingId}/transcript/`,
          {
            credentials: 'include',
          },
        )
        if (!response.ok) throw new Error('Failed to download transcript')
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript-${meetingId}.txt`
        a.click()
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const handleScheduleMeeting = async () => {
    // Simple prompt for date and time
    const date = prompt('Enter date (YYYY-MM-DD):')
    const time = prompt('Enter time (HH:MM):')
    if (!date || !time) return

    try {
      const response = await fetch('/api/scheduling/schedule/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          time,
          userId,
          trainerId: 'current-trainer-id', // Replace with actual
          title: 'Consultation',
        }),
      })
      if (!response.ok) throw new Error('Failed to schedule meeting')
      alert('Meeting scheduled successfully')
      fetchUserData() // Refresh meetings
    } catch (err) {
      alert(err.message)
    }
  }

  const initiateChat = async () => {
    try {
      const response = await fetch('/api/people/chats/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initiatorId: user?.id, // Use logged-in user's ID
          title: 'Client Support',
        }),
      })
      if (!response.ok) throw new Error('Failed to initiate chat')
      const data = await response.json()
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

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      // Fetch existing messages
      const messagesResponse = await fetch(
        `${baseUrl}/messaging/sessions/${data.chatId}/messages/`,
        {
          credentials: 'include',
        },
      )
      if (messagesResponse.ok) {
        const msgs = await messagesResponse.json()
        setMessages(
          msgs.map((m) => ({
            id: m.messageId,
            text: m.text,
            sender: m.senderName === user?.name ? 'user' : 'other',
          })),
        )
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdate = async (data) => {
    try {
      const response = await fetch(
        `/api/people/sales/updateUserDetails/${userId}/`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )
      if (!response.ok) throw new Error('Failed to update user')
      alert('User updated successfully')
      fetchUserData() // Refresh data
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
          {clientData && <ClientDetails data={clientData} />}
          <Meetings
            data={meetingsData}
            onAction={handleMeetingAction}
            onSchedule={handleScheduleMeeting}
          />
          <ProgramCard data={programsData} isShown={false} />
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
          <FormAnswersCard formAnswers={formAnswers} />
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
    </div>
  )
}
