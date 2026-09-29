import Daily from '@daily-co/daily-js'

class DailyVideoService {
  constructor() {
    this.callObject = null
    this.roomUrl = null
    this.participants = new Map()
    this.eventListeners = new Map()

    // Enable session persistence by default
    localStorage.setItem('daily_preserve_session', 'true')
    console.log(
      '[DailyVideoService] Initialized with session persistence enabled',
    )
  }

  /**
   * Initialize Daily.co call object
   * @param {string} roomUrl - The Daily.co room URL
   * @param {Object} options - Additional options for the call
   * @returns {Promise<Object>} - The initialized call object
   */
  async initialize(roomUrl, options = {}) {
    try {
      console.log(
        '[DailyVideoService] Initializing Daily.co call for room:',
        roomUrl,
      )

      // Clean up any existing call
      if (this.callObject) {
        console.log(
          '[DailyVideoService] Cleaning up existing call object before creating new one',
        )
        await this.destroy()
      }

      if (!roomUrl) {
        throw new Error('Room URL is required to initialize Daily.co')
      }

      // Create new call object with a retry mechanism
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          console.log(
            `[DailyVideoService] Creating call object (attempt ${attempts + 1}/${maxAttempts})`,
          )

          this.callObject = Daily.createCallObject({
            url: roomUrl,
            dailyConfig: {
              experimentalChromeVideoMuteLightOff: true,
              camSimulcastEncodings: [
                {
                  maxBitrate: 600000,
                  maxFramerate: 30,
                  scaleResolutionDownBy: 1,
                },
                {
                  maxBitrate: 150000,
                  maxFramerate: 15,
                  scaleResolutionDownBy: 2,
                },
                {
                  maxBitrate: 80000,
                  maxFramerate: 10,
                  scaleResolutionDownBy: 4,
                },
              ],
            },
            ...options,
          })

          // Break if successful
          if (this.callObject) {
            break
          }
        } catch (e) {
          console.error(
            `[DailyVideoService] Failed to create call object on attempt ${attempts + 1}:`,
            e,
          )
          attempts++

          if (attempts >= maxAttempts) {
            throw e
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      if (!this.callObject) {
        throw new Error(
          'Failed to create Daily.co call object after multiple attempts',
        )
      }

      this.roomUrl = roomUrl

      // Set up event listeners
      this.setupEventListeners()

      console.log(
        '[DailyVideoService] Daily.co call initialized successfully:',
        !!this.callObject,
      )

      // Log call state right after initialization
      console.log('[DailyVideoService] Initial call state:', {
        meetingState: this.callObject.meetingState(),
        participants: Object.keys(this.callObject.participants() || {}).length,
        networkState: this.callObject.networkState(),
      })

      return this.callObject
    } catch (error) {
      console.error(
        '[DailyVideoService] Failed to initialize Daily.co call:',
        error,
      )
      this.callObject = null
      throw error
    }
  }

  /**
   * Join the Daily.co room
   * @param {Object} options - Join options (audio/video settings, etc.)
   * @returns {Promise<Object>} - Join result
   */
  async join(options = {}) {
    if (!this.callObject) {
      throw new Error('Call object not initialized. Call initialize() first.')
    }

    try {
      console.log('[DailyVideoService] Joining Daily.co room...')

      const joinOptions = {
        audio: options.audio !== false,
        video: options.video !== false,
        ...options,
      }

      console.log('[DailyVideoService] Join options:', joinOptions)

      const result = await this.callObject.join(joinOptions)

      console.log('[DailyVideoService] Join result:', result)

      // Wait a moment for tracks to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if we have video tracks after joining
      const participants = this.callObject.participants()
      const localParticipant = participants?.local

      console.log(
        '[DailyVideoService] Participants after join:',
        Object.keys(participants || {}).length,
      )
      console.log('[DailyVideoService] Local participant:', localParticipant)

      if (localParticipant?.tracks) {
        console.log(
          '[DailyVideoService] Local video track after join:',
          localParticipant.tracks.video?.state,
          'persistentTrack:',
          !!localParticipant.tracks.video?.persistentTrack,
        )
        console.log(
          '[DailyVideoService] Local audio track after join:',
          localParticipant.tracks.audio?.state,
          'persistentTrack:',
          !!localParticipant.tracks.audio?.persistentTrack,
        )
      }

      console.log('[DailyVideoService] Successfully joined Daily.co room')
      return result
    } catch (error) {
      console.error('[DailyVideoService] Failed to join Daily.co room:', error)
      throw error
    }
  }

  /**
   * Leave the Daily.co room
   * @returns {Promise<void>}
   */
  async leave() {
    if (!this.callObject) {
      console.log('[DailyVideoService] No call object to leave from')
      return
    }

    try {
      // Check if we should preserve the session
      const shouldPreserveSession =
        localStorage.getItem('daily_preserve_session') === 'true'

      if (shouldPreserveSession) {
        console.log(
          '[DailyVideoService] Preserving session - only removing event listeners',
        )
        // Instead of leaving, just remove event listeners but keep the session active
        this.eventListeners.clear()
        return
      }

      console.log('[DailyVideoService] Leaving Daily.co room...')
      await this.callObject.leave()
      console.log('[DailyVideoService] Successfully left Daily.co room')
    } catch (error) {
      console.error('[DailyVideoService] Failed to leave Daily.co room:', error)
      throw error
    }
  }

  /**
   * Set local audio enabled/disabled
   * @param {boolean} enabled - Whether audio should be enabled
   * @returns {Promise<Object>} - Update result
   */
  async setLocalAudio(enabled) {
    if (!this.callObject) {
      throw new Error('Call object not initialized')
    }

    try {
      const result = await this.callObject.setLocalAudio(enabled)
      console.log(
        `[DailyVideoService] Local audio ${enabled ? 'enabled' : 'muted'}`,
      )
      return result
    } catch (error) {
      console.error('[DailyVideoService] Failed to set local audio:', error)
      throw error
    }
  }

  /**
   * Set local video enabled/disabled
   * @param {boolean} enabled - Whether video should be enabled
   * @returns {Promise<Object>} - Update result
   */
  async setLocalVideo(enabled) {
    if (!this.callObject) {
      throw new Error('Call object not initialized')
    }

    try {
      const result = await this.callObject.setLocalVideo(enabled)
      console.log(
        `[DailyVideoService] Local video ${enabled ? 'enabled' : 'disabled'}`,
      )
      return result
    } catch (error) {
      console.error('[DailyVideoService] Failed to set local video:', error)
      throw error
    }
  }

  /**
   * Get current participants
   * @returns {Object} - Map of participant IDs to participant objects
   */
  getParticipants() {
    if (!this.callObject) {
      return {}
    }

    return this.callObject.participants()
  }

  /**
   * Get local participant
   * @returns {Object|null} - Local participant object or null
   */
  getLocalParticipant() {
    if (!this.callObject) {
      return null
    }

    const participants = this.callObject.participants()
    const localSessionId = this.callObject.participantsLocal().sessionId

    return participants[localSessionId] || null
  }

  /**
   * Get room info
   * @returns {Object|null} - Room information or null
   */
  getRoom() {
    if (!this.callObject) {
      return null
    }

    return this.callObject.room()
  }

  /**
   * Check if currently in a meeting
   * @returns {boolean} - Whether in a meeting
   */
  isInMeeting() {
    return (
      this.callObject && this.callObject.meetingState() === 'joined-meeting'
    )
  }

  /**
   * Set up event listeners for Daily.co events
   */
  setupEventListeners() {
    if (!this.callObject) return

    // Participant events
    this.callObject.on(
      'participant-joined',
      this.handleParticipantJoined.bind(this),
    )
    this.callObject.on(
      'participant-updated',
      this.handleParticipantUpdated.bind(this),
    )
    this.callObject.on(
      'participant-left',
      this.handleParticipantLeft.bind(this),
    )

    // Room events
    this.callObject.on('joined-meeting', this.handleJoinedMeeting.bind(this))
    this.callObject.on('left-meeting', this.handleLeftMeeting.bind(this))
    this.callObject.on('error', this.handleError.bind(this))

    // Media events
    this.callObject.on('track-started', this.handleTrackStarted.bind(this))
    this.callObject.on('track-stopped', this.handleTrackStopped.bind(this))

    console.log('[DailyVideoService] Event listeners set up')
  }

  /**
   * Handle participant joined event
   * @param {Object} event - The event object
   */
  handleParticipantJoined(event) {
    console.log('[DailyVideoService] Participant joined:', event.participant)
    this.emit('participant-joined', event.participant)
  }

  /**
   * Handle participant updated event
   * @param {Object} event - The event object
   */
  handleParticipantUpdated(event) {
    console.log('[DailyVideoService] Participant updated:', event.participant)
    this.emit('participant-updated', event.participant)
  }

  /**
   * Handle participant left event
   * @param {Object} event - The event object
   */
  handleParticipantLeft(event) {
    console.log('[DailyVideoService] Participant left:', event.participant)
    this.emit('participant-left', event.participant)
  }

  /**
   * Handle joined meeting event
   * @param {Object} event - The event object
   */
  handleJoinedMeeting(event) {
    console.log('[DailyVideoService] Joined meeting:', event)
    this.emit('joined-meeting', event)
  }

  /**
   * Handle left meeting event
   * @param {Object} event - The event object
   */
  handleLeftMeeting(event) {
    console.log('[DailyVideoService] Left meeting:', event)
    this.emit('left-meeting', event)
  }

  /**
   * Handle error event
   * @param {Object} event - The event object
   */
  handleError(event) {
    console.error('[DailyVideoService] Daily.co error:', event)
    this.emit('error', event)
  }

  /**
   * Handle track started event
   * @param {Object} event - The event object
   */
  handleTrackStarted(event) {
    console.log('[DailyVideoService] Track started:', event)
    this.emit('track-started', event)
  }

  /**
   * Handle track stopped event
   * @param {Object} event - The event object
   */
  handleTrackStopped(event) {
    console.log('[DailyVideoService] Track stopped:', event)
    this.emit('track-stopped', event)
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(
            `[DailyVideoService] Error in ${event} callback:`,
            error,
          )
        }
      })
    }
  }

  /**
   * Clean up resources
   */
  async destroy() {
    try {
      if (this.callObject) {
        // Check if we should preserve the session
        const shouldPreserveSession =
          localStorage.getItem('daily_preserve_session') === 'true'

        if (shouldPreserveSession) {
          console.log(
            '[DailyVideoService] Preserving session - skipping call object destruction',
          )

          // Just clear event listeners but don't destroy the call object
          this.eventListeners.clear()

          // Store session information for potential reuse
          if (this.roomUrl) {
            try {
              const urlObj = new URL(this.roomUrl)
              const roomName = urlObj.pathname.split('/').pop()
              if (roomName) {
                localStorage.setItem('daily_session_id', roomName)
                localStorage.setItem(
                  'daily_session_timestamp',
                  Date.now().toString(),
                )
                console.log(
                  `[DailyVideoService] Stored session info for room: ${roomName}`,
                )
              }
            } catch (e) {
              console.error(
                '[DailyVideoService] Error storing session info:',
                e,
              )
            }
          }

          return
        }

        console.log('[DailyVideoService] Destroying Daily.co call object')

        // Remove all event listeners
        this.eventListeners.clear()

        // Leave if joined
        if (this.isInMeeting()) {
          await this.leave()
        }

        // Destroy the call object
        this.callObject.destroy()
        this.callObject = null
        this.roomUrl = null
        this.participants.clear()

        console.log('[DailyVideoService] Daily.co call object destroyed')
      }
    } catch (error) {
      console.error(
        '[DailyVideoService] Error destroying Daily.co call:',
        error,
      )
      throw error
    }
  }

  /**
   * Get current meeting state
   * @returns {string|null} - Meeting state or null
   */
  getMeetingState() {
    return this.callObject ? this.callObject.meetingState() : null
  }

  /**
   * Start screen share
   * @param {Object} options - Screen share options
   * @returns {Promise<Object>} - Screen share result
   */
  async startScreenShare(options = {}) {
    if (!this.callObject) {
      throw new Error('Call object not initialized')
    }

    try {
      const result = await this.callObject.startScreenShare(options)
      console.log('[DailyVideoService] Screen share started')
      return result
    } catch (error) {
      console.error('[DailyVideoService] Failed to start screen share:', error)
      throw error
    }
  }

  /**
   * Stop screen share
   * @returns {Promise<Object>} - Stop screen share result
   */
  async stopScreenShare() {
    if (!this.callObject) {
      throw new Error('Call object not initialized')
    }

    try {
      const result = await this.callObject.stopScreenShare()
      console.log('[DailyVideoService] Screen share stopped')
      return result
    } catch (error) {
      console.error('[DailyVideoService] Failed to stop screen share:', error)
      throw error
    }
  }
}

// Create singleton instance
const dailyVideoService = new DailyVideoService()

export default dailyVideoService
