// src/services/meetingWebSocketService.js

class MeetingWebSocketService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.eventListeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000 // Start with 1 second
    this.heartbeatInterval = null
    this.baseURL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
    this.connectPromise = null
    this.instanceId = Math.random().toString(36).slice(2, 8)
    console.log('[WebSocketService] Instance created', this.instanceId)
  }

  // Connect to WebSocket server
  connect(meetingId) {
    console.log(
      `[WebSocketService] connect called for meeting ${meetingId} (instance=${this.instanceId})`,
    )

    // Validate inputs
    if (!meetingId) {
      console.error('[WebSocketService] ERROR: meetingId is required')
      return Promise.reject(new Error('meetingId is required'))
    }

    // Check network connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.error('[WebSocketService] ERROR: Browser reports offline status')
      return Promise.reject(new Error('Browser is offline'))
    }

    // If already connecting, return same promise
    if (this.connectPromise) {
      console.log(
        '[WebSocketService] Existing connectPromise in-flight; returning it',
      )
      return this.connectPromise
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(
        '[WebSocketService] WebSocket already connected, reusing connection',
      )
      return Promise.resolve()
    }

    // If we have a websocket that's closing, log that
    if (this.ws) {
      console.log(
        `[WebSocketService] Existing WebSocket in state: ${this.ws.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`,
      )

      // If the socket is in connecting state, wait for it
      if (this.ws.readyState === WebSocket.CONNECTING) {
        console.log(
          '[WebSocketService] WebSocket is still connecting, waiting...',
        )
      }

      // If the socket is in closing state, wait for it to close
      if (this.ws.readyState === WebSocket.CLOSING) {
        console.log(
          '[WebSocketService] WebSocket is closing, will create new connection when closed',
        )
      }
    }

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        // Normalize protocol if page is https but baseURL is ws://
        let effectiveBase = this.baseURL
        if (typeof window !== 'undefined') {
          const pageIsSecure = window.location.protocol === 'https:'
          if (pageIsSecure && effectiveBase.startsWith('ws://')) {
            effectiveBase = effectiveBase.replace('ws://', 'wss://')
            console.log(
              '[WebSocketService] Upgraded WS base to secure protocol:',
              effectiveBase,
            )
          }
        }

        const attemptId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const wsUrl = `${effectiveBase}/ws/meeting/${meetingId}/`
        console.log('[WebSocketService] Connecting to WebSocket:', {
          wsUrl,
          attemptId,
        })

        this.ws = new WebSocket(wsUrl)
        console.log('[WebSocketService] WebSocket instance created', {
          attemptId,
        })

        // Store reject function for later use in event handlers
        let connectionReject = reject

        this.ws.onopen = (event) => {
          console.log('[WebSocketService] WebSocket connected successfully')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.emit('connected', { event })
          this.connectPromise = null
          connectionReject = null // Clear the reject function since we succeeded
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[WebSocketService] WebSocket message received:', data)
            this.handleMessage(data)
          } catch (error) {
            console.error(
              '[WebSocketService] Error parsing WebSocket message:',
              error,
            )
          }
        }

        this.ws.onclose = (event) => {
          console.log('[WebSocketService] WebSocket connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            attemptId,
          })
          this.isConnected = false
          this.stopHeartbeat()
          this.emit('disconnected', { event })

          // If this was the initial connection attempt and it failed, reject the promise
          if (this.connectPromise && event.code !== 1000 && connectionReject) {
            const rejectFn = connectionReject
            connectionReject = null // Prevent multiple calls
            this.connectPromise = null
            try {
              rejectFn(
                new Error(
                  `WebSocket connection closed: ${event.reason || event.code}`,
                ),
              )
            } catch (err) {
              console.error('[WebSocketService] Error rejecting promise:', err)
            }
          } else {
            this.connectPromise = null
          }

          // Attempt to reconnect if not intentionally closed
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            console.log(
              '[WebSocketService] Connection closed unexpectedly, will attempt to reconnect',
            )
            this.attemptReconnect(meetingId)
          } else if (event.code === 1000) {
            console.log(
              '[WebSocketService] Connection closed cleanly, no reconnect needed',
            )
          } else {
            console.log(
              '[WebSocketService] Max reconnect attempts reached, giving up',
            )
          }
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocketService] WebSocket error:', error)
          console.error('[WebSocketService] WebSocket URL:', wsUrl)
          console.error(
            '[WebSocketService] WebSocket readyState:',
            this.ws?.readyState,
          )
          this.isConnected = false
          this.stopHeartbeat()
          this.emit('error', { error })
          // Don't reject immediately - wait for onclose to handle reconnection
          // The error event is often followed by close event with more details
        }

        // Connection will succeed or fail naturally without timeout
      } catch (error) {
        console.error(
          '[WebSocketService] Error creating WebSocket connection:',
          error,
        )
        reject(error)
      }
    }).finally(() => {
      // If promise is still set but socket isn't open, allow new attempts
      if (!this.isConnected) {
        setTimeout(() => {
          if (!this.isConnected) {
            this.connectPromise = null
          }
        }, 50)
      }
    })

    return this.connectPromise
  }

  // Disconnect from WebSocket
  disconnect() {
    console.log('[WebSocketService] disconnect called')

    if (this.ws) {
      console.log(
        `[WebSocketService] WebSocket exists in state: ${this.ws.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`,
      )

      this.stopHeartbeat()
      console.log('[WebSocketService] Heartbeat stopped')

      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        console.log(
          '[WebSocketService] Closing WebSocket connection with code 1000 (normal closure)',
        )
        this.ws.close(1000, 'Client disconnecting')
      } else {
        console.log(
          `[WebSocketService] WebSocket already in state ${this.ws.readyState}, not attempting to close`,
        )
      }

      this.ws = null
      this.isConnected = false
      this.connectPromise = null
      console.log(
        '[WebSocketService] WebSocket connection reference removed and connection marked as disconnected',
      )
    } else {
      console.log('[WebSocketService] No WebSocket connection to disconnect')
    }
  }

  // Send message to WebSocket server
  send(messageType, data) {
    if (!this.isConnected || !this.ws) {
      console.error('WebSocket not connected. Cannot send message.')
      return false
    }

    try {
      const message = {
        type: messageType,
        ...data,
      }
      this.ws.send(JSON.stringify(message))
      console.log('WebSocket message sent:', message)
      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
      return false
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    // Handle both "event" and "type" formats for backward compatibility
    const eventType = message.event || message.type
    const data = message.data || message

    switch (eventType) {
      case 'participant_joined':
        this.emit('participant_joined', data)
        break
      case 'participant_left':
        this.emit('participant_left', data)
        break
      case 'meeting_ended':
        this.emit('meeting_ended', data)
        break
      case 'webrtc_offer':
        this.emit('webrtc_offer', data)
        break
      case 'webrtc_answer':
        this.emit('webrtc_answer', data)
        break
      case 'ice_candidate':
        this.emit('ice_candidate', data)
        break
      case 'media_state_changed':
        this.emit('media_state_changed', data)
        break
      case 'spotlight_changed':
        this.emit('spotlight_changed', data)
        break
      case 'pong':
        // Heartbeat response
        break
      case 'error':
        console.error('WebSocket error from server:', data)
        break
      default:
        console.log('Unknown WebSocket message event:', eventType, data)
        this.emit('unknown_message', { event: eventType, data })
    }
  }

  // WebRTC Signaling Methods
  sendWebRTCOffer(offer, targetUserId) {
    return this.send('webrtc_offer', {
      offer,
      targetUserId,
    })
  }

  sendWebRTCAnswer(answer, targetUserId) {
    return this.send('webrtc_answer', {
      answer,
      targetUserId,
    })
  }

  sendICECandidate(candidate, sdpMid, sdpMLineIndex, targetUserId) {
    return this.send('ice_candidate', {
      candidate,
      sdpMid,
      sdpMLineIndex,
      targetUserId,
    })
  }

  updateMediaState(audioMuted, videoEnabled) {
    return this.send('update_media_state', {
      audioMuted,
      videoEnabled,
    })
  }

  // Event listener management
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType).push(callback)
  }

  off(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      })
    }
  }

  // Heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', { timestamp: Date.now() })
      }
    }, 30000) // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Reconnection logic
  attemptReconnect(meetingId) {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`,
    )

    setTimeout(() => {
      // Don't return the promise here, just call connect and handle errors internally
      this.connect(meetingId).catch((error) => {
        console.error('Reconnection failed:', error)
        // Don't attempt further reconnections here - let the onclose handler decide
      })
    }, delay)
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts,
    }
  }

  // Clear all event listeners
  removeAllListeners() {
    this.eventListeners.clear()
  }
}

// Create singleton instance
const meetingWebSocketService = new MeetingWebSocketService()
export default meetingWebSocketService
