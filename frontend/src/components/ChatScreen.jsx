import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import chatApiService from '@/services/chatApiService'

const WS_BASE_FALLBACK = 'ws://localhost:8000'
const MAX_RECONNECT_ATTEMPTS = 5

const normalizeId = (value) =>
  value === undefined || value === null ? null : String(value)

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const namesMatchLoosely = (a, b) => {
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

const buildWebSocketUrl = (chatId) => {
  const rawBase = import.meta.env.VITE_WS_BASE_URL || WS_BASE_FALLBACK
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  let url = `${base}/messaging/sessions/${chatId}`

  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:'
    if (isSecure && url.startsWith('ws://')) {
      url = url.replace('ws://', 'wss://')
    }
  }

  return url
}

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const formatTimestamp = (value) => {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    if (sameDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    })
  } catch {
    return value
  }
}

const sortContacts = (contacts) => {
  return [...contacts].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })
}

const mapContact = (chat, currentUserId) => {
  const participants = Array.isArray(chat.participants)
    ? chat.participants
    : chat.participants_list || []

  const normalizedCurrentId = normalizeId(currentUserId)

  const otherParticipant =
    participants.find((participant) => {
      const participantId = normalizeId(participant?.id)
      if (!participantId || !normalizedCurrentId) return true
      return participantId !== normalizedCurrentId
    }) ||
    participants[0] ||
    {}

  const lastMessage =
    chat.last_message ||
    chat.lastMessage ||
    chat.latest_message ||
    chat.latestMessage ||
    {}

  const chatId = chat.chatId || chat.id || otherParticipant.chatId || uniqueId()
  const participantName =
    otherParticipant?.name ||
    otherParticipant?.full_name ||
    otherParticipant?.email ||
    otherParticipant?.username ||
    null

  const chatTitle = participantName || chat.title || 'Conversation'

  const lastTimestamp =
    lastMessage.sentAt ||
    lastMessage.sent_at ||
    lastMessage.createdAt ||
    lastMessage.created_at ||
    lastMessage.timestamp ||
    chat.updated_at ||
    chat.updatedAt ||
    null

  return {
    id: chatId,
    chatId,
    name: chatTitle,
    avatar:
      otherParticipant.avatar ||
      otherParticipant.profileImage ||
      otherParticipant.profile_image ||
      null,
    isOnline:
      otherParticipant.is_online ||
      otherParticipant.isOnline ||
      otherParticipant.status === 'online' ||
      false,
    lastMessage: lastMessage.text || lastMessage.message || '',
    lastMessageAt: lastTimestamp,
    timestamp: formatTimestamp(lastTimestamp),
    raw: chat,
  }
}

const mapMessage = (message, currentUser) => {
  const id = message.messageId || message.message_id || message.id || uniqueId()
  const sender =
    message.sender ||
    message.sender_details ||
    message.senderInfo ||
    message.user ||
    null

  const senderId =
    message.senderId ??
    message.sender_id ??
    (typeof sender === 'object' ? sender?.id : sender)

  const senderNameRaw =
    message.senderName ??
    message.sender_name ??
    (typeof sender === 'object'
      ? sender?.name || sender?.full_name || sender?.username || sender?.email
      : sender)

  const senderEmailRaw =
    message.senderEmail ??
    message.sender_email ??
    (typeof sender === 'object' ? sender?.email : undefined)

  const rawTimestamp =
    message.sentAt ||
    message.sent_at ||
    message.createdAt ||
    message.created_at ||
    message.timestamp ||
    new Date().toISOString()

  const senderIdStr = normalizeId(senderId)
  const senderNameNormalized = normalizeText(senderNameRaw)
  const senderEmailNormalized = normalizeText(senderEmailRaw)

  const currentUserIds = [
    normalizeId(currentUser?.id),
    normalizeId(currentUser?.user_id),
    normalizeId(currentUser?.userId),
  ].filter(Boolean)

  const currentUserNames = [
    currentUser?.name,
    currentUser?.full_name,
    currentUser?.fullName,
    currentUser?.username,
    currentUser?.email,
    currentUser?.first_name && currentUser?.last_name
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : null,
  ]
    .filter(Boolean)
    .map(normalizeText)

  const currentUserEmails = [
    currentUser?.email,
    currentUser?.username,
    currentUser?.user_email,
  ]
    .filter(Boolean)
    .map(normalizeText)

  const isCurrentUser =
    (senderIdStr && currentUserIds.includes(senderIdStr)) ||
    (senderNameNormalized &&
      currentUserNames.some((name) =>
        namesMatchLoosely(name, senderNameNormalized),
      )) ||
    (senderEmailNormalized && currentUserEmails.includes(senderEmailNormalized))

  return {
    id,
    text: message.text || message.message || '',
    sender: isCurrentUser ? 'user' : 'contact',
    timestamp: rawTimestamp,
  }
}

export function ChatScreen({ onScheduleMeeting }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState('')
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('idle')

  const wsRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)
  const activeChatIdRef = useRef(null)

  const selectedContact = useMemo(
    () =>
      contacts.find((contact) => contact.chatId === selectedContactId) || null,
    [contacts, selectedContactId],
  )

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const contactsWithMessages = contacts.filter(
      (contact) => contact.lastMessage && contact.lastMessage.trim() !== '',
    )

    if (!query) return contactsWithMessages

    return contactsWithMessages.filter((contact) => {
      const name = contact.name?.toLowerCase() || ''
      const lastMessage = contact.lastMessage?.toLowerCase() || ''
      return name.includes(query) || lastMessage.includes(query)
    })
  }, [contacts, searchQuery])

  const resetWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Switching chat')
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    reconnectAttemptsRef.current = 0
    setConnectionStatus('idle')
  }, [])

  const addMessage = useCallback(
    (incomingMessage, chatId) => {
      const contactContext =
        contacts.find((contact) => contact.chatId === chatId) || null
      const normalized = mapMessage(incomingMessage, user, contactContext)

      setContacts((prev) => {
        const index = prev.findIndex((contact) => contact.chatId === chatId)
        if (index === -1) return prev
        const updated = [...prev]
        const contact = { ...updated[index] }
        const sentAt =
          incomingMessage.sentAt ||
          incomingMessage.sent_at ||
          incomingMessage.createdAt ||
          incomingMessage.created_at ||
          incomingMessage.timestamp ||
          normalized.timestamp

        contact.lastMessage = normalized.text
        contact.lastMessageAt = sentAt
        contact.timestamp = formatTimestamp(sentAt)
        contact.raw = {
          ...(contact.raw || {}),
          last_message: {
            ...(contact.raw?.last_message || {}),
            messageId: incomingMessage.messageId || normalized.id,
            text: normalized.text,
            senderId:
              incomingMessage.senderId || incomingMessage.sender_id || null,
            senderName:
              incomingMessage.senderName ||
              incomingMessage.sender_name ||
              (normalized.sender === 'user'
                ? user?.name || user?.full_name || user?.email
                : undefined),
            sentAt,
          },
          updatedAt: sentAt,
        }

        updated[index] = contact
        return sortContacts(updated)
      })

      if (chatId !== activeChatIdRef.current) {
        return
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === normalized.id)
        if (exists) return prev

        const optimisticIndex = prev.findIndex(
          (msg) =>
            msg.optimistic &&
            msg.sender === normalized.sender &&
            msg.text === normalized.text,
        )

        if (optimisticIndex !== -1) {
          const next = [...prev]
          next[optimisticIndex] = { ...normalized }
          return next
        }

        return [...prev, normalized]
      })
    },
    [user, contacts],
  )

  const fetchContacts = useCallback(async () => {
    if (!user?.id) return

    setContactsLoading(true)
    setContactsError('')

    try {
      const data = await chatApiService.getAllChats()
      const mapped = Array.isArray(data)
        ? sortContacts(data.map((chat) => mapContact(chat, user.id)))
        : []

      setContacts(mapped)

      const validChatIds = mapped
        .filter(
          (contact) => contact.lastMessage && contact.lastMessage.trim() !== '',
        )
        .map((contact) => contact.chatId)

      if (selectedContactId && !validChatIds.includes(selectedContactId)) {
        setSelectedContactId(null)
        setMessages([])
        activeChatIdRef.current = null
      }
    } catch (err) {
      setContactsError(err.message || 'Failed to load chats.')
    } finally {
      setContactsLoading(false)
    }
  }, [user?.id, selectedContactId])

  const fetchMessages = useCallback(
    async (chatId) => {
      if (!chatId) return

      setMessagesLoading(true)
      setMessagesError('')

      try {
        const data = await chatApiService.getChatMessages(chatId)
        const contactContext =
          contacts.find((contact) => contact.chatId === chatId) || null
        const mapped = Array.isArray(data)
          ? data.map((message) => mapMessage(message, user, contactContext))
          : []

        setMessages(mapped)
      } catch (err) {
        setMessages([])
        setMessagesError(err.message || 'Failed to load messages.')
      } finally {
        setMessagesLoading(false)
      }
    },
    [user, contacts],
  )

  const connectWebSocket = useCallback(
    (chatId) => {
      if (!chatId) return

      resetWebSocket()

      const wsUrl = buildWebSocketUrl(chatId)
      setConnectionStatus('connecting')

      try {
        wsRef.current = new WebSocket(wsUrl)
      } catch (err) {
        console.error('Failed to create WebSocket:', err)
        setConnectionStatus('error')
        return
      }

      wsRef.current.onopen = () => {
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload?.message && payload?.sender && payload?.message_id) {
            addMessage(
              {
                message: payload.message,
                sender: payload.sender,
                sent_at: payload.sent_at,
                message_id: payload.message_id,
              },
              chatId,
            )
          } else if (payload?.messageId || payload?.id) {
            addMessage(payload, chatId)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event)
        setConnectionStatus('error')
      }

      wsRef.current.onclose = (event) => {
        wsRef.current = null

        if (activeChatIdRef.current !== chatId) {
          return
        }

        if (event.code === 1000) {
          setConnectionStatus('idle')
          return
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionStatus('disconnected')
          return
        }

        reconnectAttemptsRef.current += 1
        setConnectionStatus('reconnecting')

        const attempt = reconnectAttemptsRef.current
        const delay = Math.min(1000 * attempt ** 2, 10000)

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(chatId)
        }, delay)
      }
    },
    [addMessage, resetWebSocket],
  )

  const handleContactSelect = useCallback(
    (contactId) => {
      if (contactId === selectedContactId) return
      setSelectedContactId(contactId)
      setMessages([])
      setMessagesError('')

      const contact = contacts.find((c) => c.chatId === contactId)
      const chatId = contact?.chatId || null
      activeChatIdRef.current = chatId

      if (chatId) {
        fetchMessages(chatId)
        connectWebSocket(chatId)
      } else {
        resetWebSocket()
      }
    },
    [
      contacts,
      connectWebSocket,
      fetchMessages,
      resetWebSocket,
      selectedContactId,
    ],
  )

  const handleSendMessage = useCallback(async () => {
    if (!selectedContact || !user?.id) return
    const trimmed = newMessage.trim()
    if (!trimmed) return

    const chatId = selectedContact.chatId
    const optimisticId = uniqueId()
    const timestamp = new Date().toISOString()
    const optimisticMessage = {
      id: optimisticId,
      text: trimmed,
      sender: 'user',
      timestamp,
      optimistic: true,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')
    setMessagesError('')

    try {
      const data = await chatApiService.sendChatMessage(chatId, {
        text: trimmed,
        senderId: user.id,
      })

      addMessage(
        {
          messageId: data?.messageId,
          text: data?.text || trimmed,
          senderId: user.id,
          senderName: user.name,
          sentAt: data?.sentAt || data?.timestamp || timestamp,
        },
        chatId,
      )
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      setMessagesError(err.message || 'Failed to send message.')
      setNewMessage(trimmed)
    }
  }, [addMessage, newMessage, selectedContact, user])

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  const handleScheduleMeeting = useCallback(() => {
    if (onScheduleMeeting && selectedContact) {
      onScheduleMeeting(selectedContact)
    }
  }, [onScheduleMeeting, selectedContact])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchContacts()
    }
  }, [authLoading, fetchContacts, isAuthenticated])

  useEffect(() => {
    if (!selectedContact) {
      activeChatIdRef.current = null
      setMessages([])
      setMessagesError('')
      resetWebSocket()
    } else {
      activeChatIdRef.current = selectedContact.chatId
    }
  }, [resetWebSocket, selectedContact])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-[650px] font-exo'>
      <CardContent className='p-0 h-full flex'>
        {/* Left Sidebar - Contacts */}
        <div className='w-80 border-r border-gray-200 flex flex-col'>
          {/* Search */}
          <div className='p-4'>
            <div className='relative bg-[#F3F3F3] rounded-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Search messages'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className='pl-10 border-none placeholder:text-black-400'
                disabled={contactsLoading}
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className='flex-1 overflow-y-auto'>
            {contactsLoading ? (
              <div className='p-4 text-sm text-gray-500'>Loading chats…</div>
            ) : filteredContacts.length === 0 ? (
              <div className='p-4 text-sm text-gray-500'>
                {contactsError || 'No chats found.'}
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.chatId}
                  onClick={() => handleContactSelect(contact.chatId)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedContactId === contact.chatId
                      ? 'bg-gray-900 text-white'
                      : ''
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <Avatar className='w-10 h-10'>
                      <AvatarImage src={contact.avatar || '/placeholder.svg'} />
                      <AvatarFallback>
                        {contact.name
                          .split(' ')
                          .map((namePart) => namePart[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <h3
                          className={`font-medium text-sm truncate ${
                            selectedContactId === contact.chatId
                              ? 'text-white'
                              : 'text-gray-900'
                          }`}
                        >
                          {contact.name}
                        </h3>
                        <span
                          className={`text-xs ${
                            selectedContactId === contact.chatId
                              ? 'text-gray-300'
                              : 'text-gray-500'
                          }`}
                        >
                          {contact.timestamp}
                        </span>
                      </div>
                      {contact.lastMessage && (
                        <p
                          className={`text-sm truncate ${
                            selectedContactId === contact.chatId
                              ? 'text-gray-300'
                              : 'text-gray-600'
                          }`}
                        >
                          {contact.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {contactsError && filteredContacts.length > 0 && (
            <div className='p-4 text-xs text-red-600 border-t border-gray-200'>
              {contactsError}
            </div>
          )}
        </div>

        {/* Right Side - Chat Area */}
        <div className='flex-1 flex flex-col'>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Avatar className='w-10 h-10'>
                    <AvatarImage
                      src={selectedContact.avatar || '/placeholder.svg'}
                    />
                    <AvatarFallback>
                      {selectedContact.name
                        .split(' ')
                        .map((namePart) => namePart[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className='font-semibold text-gray-900'>
                      {selectedContact.name}
                    </h2>
                    <div className='flex items-center gap-2 text-xs text-gray-600'>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          connectionStatus === 'connected'
                            ? 'bg-green-500'
                            : connectionStatus === 'reconnecting'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                        }`}
                      ></div>
                      <span className='capitalize'>{connectionStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {messagesLoading ? (
                  <div className='text-sm text-gray-500 text-center mt-8'>
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div className='text-sm text-gray-500 text-center mt-8'>
                    No messages in this conversation yet.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      {message.sender === 'contact' && (
                        <Avatar className='w-8 h-8 mr-3 flex-shrink-0'>
                          <AvatarImage
                            src={selectedContact.avatar || '/placeholder.svg'}
                          />
                          <AvatarFallback>
                            {selectedContact.name
                              .split(' ')
                              .map((namePart) => namePart[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                          message.sender === 'user'
                            ? 'bg-[#F6B72D] rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className='text-xs text-gray-700 mt-1 opacity-70'>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                      {message.sender === 'user' && (
                        <Avatar className='w-8 h-8 ml-3 flex-shrink-0'>
                          <AvatarFallback className='bg-[#F6B72D] text-white'>
                            You
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
              </div>

              {messagesError && (
                <div className='px-4 text-sm text-red-600'>{messagesError}</div>
              )}

              {/* Message Input */}
              <div className='p-4'>
                <div className='flex gap-2 items-center'>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='p-2 h-10 w-10 flex-shrink-0 hover:bg-gray-100'
                    disabled
                    title='Media attachments coming soon'
                  >
                    <img src='/images/media.svg' alt='media' />
                  </Button>

                  <div className='flex-1 relative'>
                    <Input
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder='Type a message'
                      className='pr-20 border-gray-300 rounded-md placeholder:text-gray-400'
                      disabled={
                        connectionStatus === 'reconnecting' ||
                        connectionStatus === 'error' ||
                        connectionStatus === 'disconnected'
                      }
                    />
                    <Button
                      onClick={handleSendMessage}
                      size='sm'
                      className='absolute right-1 top-1/2 transform -translate-y-1/2 text-[#F6B72D] p-1 h-8 w-8'
                      disabled={
                        !newMessage.trim() ||
                        connectionStatus === 'reconnecting' ||
                        connectionStatus === 'error' ||
                        connectionStatus === 'disconnected'
                      }
                    >
                      <Send className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className='flex-1 flex items-center justify-center text-gray-500 text-sm'>
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
