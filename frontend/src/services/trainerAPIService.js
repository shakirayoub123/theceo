// src/services/trainerAPIService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class TrainerAPIService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    }
  }

  async fetchWithCredentials(url, options = {}) {
    return fetch(url, {
      ...options,
      credentials: 'include',
    })
  }

  async handleResponse(response) {
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
        console.log(`[TrainerAPIService] Received error response:`, {
          status: response.status,
          url: response.url,
          data: errorData,
        })

        const error = new Error(
          errorData.message ||
            errorData.detail ||
            errorData.error ||
            `HTTP ${response.status}`,
        )
        error.httpStatus = response.status
        error.url = response.url
        error.endpoint = response.url.split('/api/')[1] || ''
        Object.assign(error, errorData)
        throw error
      } catch (jsonError) {
        if (jsonError !== errorData) {
          try {
            const errorText = await response.text()
            console.log(`[TrainerAPIService] Failed to parse JSON error:`, {
              status: response.status,
              url: response.url,
              text: errorText,
            })

            const genericError = new Error(
              errorText ||
                `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
            )
            genericError.httpStatus = response.status
            genericError.url = response.url
            genericError.endpoint = response.url.split('/api/')[1] || ''
            throw genericError
          } catch {
            const statusError = new Error(
              `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
            )
            statusError.httpStatus = response.status
            statusError.url = response.url
            statusError.endpoint = response.url.split('/api/')[1] || ''
            throw statusError
          }
        } else {
          throw jsonError
        }
      }
    }
    return response.json()
  }

  // Trainer specific meeting details (expected to include clientName, unencryptedPassword, clientEmail etc.)
  async getMeetingDetails(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async initiateMeeting(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/initiate/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async joinMeeting(
    meetingId,
    mediaPreferences = { audioEnabled: true, videoEnabled: true },
  ) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/join/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ mediaPreferences }),
      },
    )
    return this.handleResponse(response)
  }

  async leaveMeeting(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/leave/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async closeMeeting(meetingId, reason = 'Meeting completed') {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/close/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      },
    )
    return this.handleResponse(response)
  }

  async toggleAudio(meetingId, muted = null) {
    const body = muted !== null ? JSON.stringify({ muted }) : undefined
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/media/audio/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
      },
    )
    return this.handleResponse(response)
  }

  async toggleVideo(meetingId, enabled = null) {
    const body = enabled !== null ? JSON.stringify({ enabled }) : undefined
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/media/video/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
      },
    )
    return this.handleResponse(response)
  }

  async setSpotlight(meetingId, spotlightUserId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/spotlight/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ spotlightUserId }),
      },
    )
    return this.handleResponse(response)
  }

  async getMeetingParticipants(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/participants/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async getMeetingEvents(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/events/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Daily.co room URL for meeting
  async getMeetingRoomUrl(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/room-url/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Resume an existing meeting session (for handling 409 conflicts)
  async resumeMeeting(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/meeting/${meetingId}/room-url/?resume=true`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Diagnostic method to check trainer permissions
  async checkTrainerPermissions(meetingId) {
    try {
      // 1. Check if trainer profile is accessible
      const profileResponse = await this.fetchWithCredentials(
        `${this.baseURL}/lms/trainer/profile/`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        },
      )

      const profileResult = {
        endpoint: 'trainer/profile',
        status: profileResponse.status,
        ok: profileResponse.ok,
        data: profileResponse.ok ? await profileResponse.json() : null,
      }

      // 2. Check if meeting details are accessible
      const meetingResponse = await this.fetchWithCredentials(
        `${this.baseURL}/lms/trainer/meeting/${meetingId}/`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        },
      )

      const meetingResult = {
        endpoint: `trainer/meeting/${meetingId}`,
        status: meetingResponse.status,
        ok: meetingResponse.ok,
        data: meetingResponse.ok ? await meetingResponse.json() : null,
      }

      // 3. Try to get room URL
      const roomUrlResponse = await this.fetchWithCredentials(
        `${this.baseURL}/lms/trainer/meeting/${meetingId}/room-url/`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        },
      )

      const roomUrlResult = {
        endpoint: `trainer/meeting/${meetingId}/room-url`,
        status: roomUrlResponse.status,
        ok: roomUrlResponse.ok,
        data: roomUrlResponse.ok ? await roomUrlResponse.json() : null,
      }

      // Return diagnostic info
      return {
        timestamp: new Date().toISOString(),
        cookieAuth: true,
        endpoints: {
          profile: profileResult,
          meeting: meetingResult,
          roomUrl: roomUrlResult,
        },
      }
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        cookieAuth: true,
      }
    }
  }

  // Save meeting notes
  async saveMeetingNotes(data) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/meeting-note/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      },
    )
    return this.handleResponse(response)
  }

  // Get meeting notes
  async getMeetingNotes(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/meeting-note/${meetingId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }
}

const trainerAPIService = new TrainerAPIService()
export default trainerAPIService
