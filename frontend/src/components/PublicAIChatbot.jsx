import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { MessageCircle, Send, X, Minimize2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import chatbotService from '@/services/chatbotService'

const PublicAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [sessionError, setSessionError] = useState(null)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Load persisted data on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatbot_session_id')
    const savedMessages = localStorage.getItem('chatbot_messages')

    if (savedSessionId) {
      setSessionId(savedSessionId)
    }

    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      } catch (error) {
        console.error('Failed to parse saved messages:', error)
        localStorage.removeItem('chatbot_messages')
      }
    }
  }, [])

  // Save messages to localStorage whenever they change (limit to last 50 messages)
  useEffect(() => {
    if (messages.length > 0) {
      const messagesToSave = messages.slice(-50) // Keep only last 50 messages
      localStorage.setItem('chatbot_messages', JSON.stringify(messagesToSave))
    }
  }, [messages])

  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatbot_session_id', sessionId)
    } else {
      localStorage.removeItem('chatbot_session_id')
    }
  }, [sessionId])

  const connectWebSocket = useCallback(() => {
    if (!sessionId) return

    const wsUrl = chatbotService.buildWebSocketUrl(sessionId)
    setConnectionStatus('connecting')

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setConnectionStatus('connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle streaming deltas
          if (data.is_stream && data.sender_type === 'ai') {
            const streamId = data.message_id || `stream-${Date.now()}`
            const delta = data.delta || ''
            if (!delta) return

            setIsAiTyping(true)
            setMessages((prev) => {
              const existingIndex = prev.findIndex(
                (msg) => msg.streamId && msg.streamId === streamId,
              )
              if (existingIndex !== -1) {
                const updated = [...prev]
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  text: `${updated[existingIndex].text || ''}${delta}`,
                  isStreaming: true,
                }
                return updated
              }

              return [
                ...prev,
                {
                  id: streamId,
                  streamId,
                  text: delta,
                  sender: 'ai',
                  timestamp: new Date().toISOString(),
                  isStreaming: true,
                },
              ]
            })
            return
          }

          // Handle final AI messages
          if (data.sender_type === 'ai' && data.message) {
            const streamId = data.stream_id
            const newMessage = {
              id: data.message_id || Date.now() + Math.random(),
              streamId,
              text: data.message,
              sender: 'ai',
              timestamp: data.sent_at || new Date().toISOString(),
              isStreaming: false,
            }

            setMessages((prev) => {
              if (streamId) {
                const existingIndex = prev.findIndex(
                  (msg) => msg.streamId && msg.streamId === streamId,
                )
                if (existingIndex !== -1) {
                  const updated = [...prev]
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...newMessage,
                  }
                  return updated
                }
              }

              return [...prev, newMessage]
            })

            setIsAiTyping(false)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        setIsAiTyping(false)
      }

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected')
        setIsAiTyping(false)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setConnectionStatus('error')
      setIsAiTyping(false)
    }
  }, [sessionId])

  // Start session when chat opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      startSession()
    }
  }, [isOpen, sessionId])

  // Connect WebSocket when session starts
  useEffect(() => {
    if (sessionId && isOpen) {
      connectWebSocket()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [sessionId, isOpen, connectWebSocket])

  // Try to reconnect when chat opens with saved session
  useEffect(() => {
    if (isOpen && sessionId && !wsRef.current) {
      connectWebSocket()
    }
  }, [isOpen, sessionId, connectWebSocket])

  // Handle session invalidation when connection fails
  useEffect(() => {
    if (connectionStatus === 'error' && messages.length > 0) {
      // If we can't connect and have saved messages, the session might be invalid
      setMessages([])
      setSessionId(null)
      localStorage.removeItem('chatbot_messages')
      localStorage.removeItem('chatbot_session_id')
    }
  }, [connectionStatus, messages.length])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const startSession = async () => {
    try {
      setIsLoading(true)
      setSessionError(null)
      const response = await chatbotService.startAIChat(null, true)
      setSessionId(response.session_id)
    } catch (error) {
      console.error('Failed to start chat session:', error)
      setSessionError('Failed to start chat session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = () => {
    if (
      !inputMessage.trim() ||
      !wsRef.current ||
      connectionStatus !== 'connected'
    )
      return

    const message = inputMessage.trim()

    // Add user message to UI immediately
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Send via WebSocket
    wsRef.current.send(JSON.stringify({ message }))

    setIsAiTyping(true)
    setInputMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
    }
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
    // Clear session and messages
    setSessionId(null)
    setMessages([])
    setSessionError(null)
    setIsAiTyping(false)
    // Clear localStorage
    localStorage.removeItem('chatbot_session_id')
    localStorage.removeItem('chatbot_messages')
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const minimizeChat = () => {
    setIsMinimized(!isMinimized)
  }

  if (!isOpen) {
    return (
      <div className='fixed bottom-6 right-6 z-50'>
        <Button
          onClick={toggleChat}
          className='w-14 h-14 rounded-full bg-[#F6B72D] hover:bg-[#F6B72D]/90 shadow-lg'
          size='icon'
        >
          <MessageCircle className='w-6 h-6 text-white' />
        </Button>
      </div>
    )
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <Card
        className={`w-80 h-[500px] bg-white shadow-xl border-2 border-[#F6B72D] flex flex-col transition-all duration-300 font-exo ${isMinimized ? 'h-14' : ''}`}
      >
        <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0 flex-shrink-0'>
          <CardTitle className='text-sm font-semibold text-gray-900'>
            AI Assistant
          </CardTitle>
          <div className='flex gap-1'>
            <Button
              onClick={minimizeChat}
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0 hover:bg-gray-100'
            >
              <Minimize2 className='w-3 h-3' />
            </Button>
            <Button
              onClick={closeChat}
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0 hover:bg-gray-100'
            >
              <X className='w-3 h-3' />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className='flex-1 flex flex-col h-full p-3 pt-0 overflow-hidden'>
            {/* Connection Status */}
            <div className='mb-2 text-xs text-gray-500 flex items-center gap-1 flex-shrink-0'>
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
            </div>

            {/* Session Error */}
            {sessionError && (
              <div className='mb-2 p-2 bg-red-100 border border-red-300 rounded-md text-red-700 text-xs flex-shrink-0'>
                {sessionError}
                <Button
                  onClick={startSession}
                  size='sm'
                  variant='outline'
                  className='ml-2 h-6 text-xs'
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Messages */}
            <div className='flex-1 overflow-y-auto space-y-2 mb-3 min-h-0'>
              {isLoading ? (
                <div className='text-center text-gray-500 text-sm py-4'>
                  Starting chat session...
                </div>
              ) : sessionError ? (
                <div className='text-center text-gray-500 text-sm py-4'>
                  Unable to start chat. Please try again.
                </div>
              ) : messages.length === 0 ? (
                <div className='text-center text-gray-500 text-sm py-4'>
                  Hi! I'm your AI assistant. How can I help you today?
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-[#F6B72D] text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      {message.sender === 'user' ? (
                        message.text
                      ) : (
                        <ReactMarkdown
                          components={{
                            code({ inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(
                                className || '',
                              )
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag='div'
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            },
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isAiTyping && (
                <div className='flex justify-start'>
                  <div className='max-w-[80%] px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-900 rounded-bl-sm inline-flex items-center gap-2'>
                    <span className='text-xs text-gray-600'>AI is typing</span>
                    <div className='flex gap-1'>
                      <span className='w-2 h-2 bg-gray-500 rounded-full animate-bounce' />
                      <span
                        className='w-2 h-2 bg-gray-500 rounded-full animate-bounce'
                        style={{ animationDelay: '120ms' }}
                      />
                      <span
                        className='w-2 h-2 bg-gray-500 rounded-full animate-bounce'
                        style={{ animationDelay: '240ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className='flex gap-2 flex-shrink-0'>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Type your message...'
                className='flex-1 text-sm'
                disabled={connectionStatus !== 'connected' || !!sessionError}
              />
              <Button
                onClick={sendMessage}
                size='sm'
                className='bg-[#F6B72D] hover:bg-[#F6B72D]/90'
                disabled={
                  !inputMessage.trim() ||
                  connectionStatus !== 'connected' ||
                  !!sessionError
                }
              >
                <Send className='w-4 h-4' />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default PublicAIChatbot
