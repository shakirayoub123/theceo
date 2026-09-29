// src/services/clientAPIService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ClientAPIService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Helper method to get auth headers
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

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      let errorData

      try {
        errorData = await response.json()

        // Create a structured error that includes all the error details
        // This allows us to check for specific error types in the UI
        const error = new Error(
          errorData.message ||
            errorData.detail ||
            errorData.error ||
            `HTTP ${response.status}`,
        )
        error.httpStatus = response.status

        // Add all properties from the error response to our error object
        Object.assign(error, errorData)

        throw error
      } catch (jsonError) {
        if (jsonError !== errorData) {
          // If we couldn't parse JSON, try to get text
          try {
            const errorText = await response.text()
            const genericError = new Error(
              errorText ||
                `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
            )
            genericError.httpStatus = response.status
            throw genericError
          } catch {
            const statusError = new Error(
              `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
            )
            statusError.httpStatus = response.status
            throw statusError
          }
        } else {
          // If the error was thrown from our structured error, re-throw it
          throw jsonError
        }
      }
    }
    return response.json()
  }

  // Get assessment onboarding progress (count of completed questionnaires)
  async getAssessmentProgress(userEmail) {
    const params = new URLSearchParams({ user_email: userEmail })
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/onboarding/progress/?${params}`,
      { method: 'GET', headers: this.getAuthHeaders() },
    )
    return this.handleResponse(response)
  }

  // Get client overview data
  async getClientOverview() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/overview/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get client programs
  async getClientPrograms() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/enrolled-programs/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async getServiceDetails(serviceId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/serviceDetails/${serviceId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get client ebooks
  async getClientEbooks() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/ebooks/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get client calendar data
  async getClientCalendar({ year, month } = {}) {
    const params =
      year && month
        ? `?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
        : ''
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/calendar/${params}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Upload client file
  async uploadClientFile(programId, file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/uploadFile/${programId}/`,
      {
        method: 'POST',
        // Don't set Content-Type for FormData, let browser set it with boundary
        headers: {},
        body: formData,
      },
    )
    return this.handleResponse(response)
  }

  // Get program schedule (free days and time slots)
  async getProgramSchedule(programId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/schedule/${programId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Schedule a meeting for a program
  async scheduleProgramMeeting(programId, meetingData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/scheduleMeeting/${programId}/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(meetingData),
      },
    )
    return this.handleResponse(response)
  }

  // Get meeting details by meeting ID
  async getMeetingDetails(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
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

  // Initiate a meeting
  async initiateMeeting(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/initiate/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Join a meeting
  async joinMeeting(
    meetingId,
    mediaPreferences = { audioEnabled: true, videoEnabled: true },
  ) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/join/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ mediaPreferences }),
      },
    )
    return this.handleResponse(response)
  }

  // Leave a meeting
  async leaveMeeting(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/leave/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Close meeting (end for all participants)
  async closeMeeting(meetingId, reason = 'Meeting completed') {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/close/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      },
    )
    return this.handleResponse(response)
  }

  // Toggle audio (mute/unmute)
  async toggleAudio(meetingId, muted = null) {
    const body = muted !== null ? JSON.stringify({ muted }) : undefined
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/media/audio/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
      },
    )
    return this.handleResponse(response)
  }

  // Toggle video
  async toggleVideo(meetingId, enabled = null) {
    const body = enabled !== null ? JSON.stringify({ enabled }) : undefined
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/media/video/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
      },
    )
    return this.handleResponse(response)
  }

  // Set spotlight participant
  async setSpotlight(meetingId, spotlightUserId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/spotlight/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ spotlightUserId }),
      },
    )
    return this.handleResponse(response)
  }

  // Get meeting participants
  async getMeetingParticipants(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/participants/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get meeting events
  async getMeetingEvents(meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/meeting/${meetingId}/events/`,
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
      `${this.baseURL}/lms/client/meeting/${meetingId}/room-url/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Add more client-related API methods here as needed

  // Update chapter progress
  async updateChapterProgress(chapterId, progress) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/chapter-progress/${chapterId}/progress/${progress}/`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }
}

const clientAPIService = new ClientAPIService()
export default clientAPIService
