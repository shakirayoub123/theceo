// src/services/salesAPIService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class SalesAPIService {
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
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.detail ||
          errorData.error ||
          errorMessage
      } catch {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        } catch {
          // If we can't get any response body, use the status
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
        }
      }
      throw new Error(errorMessage)
    }
    return response.json()
  }

  // ==================== CLIENT DETAILS APIs ====================

  // Get client details
  async getClientDetails(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/client/${userId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get client meetings
  async getClientMeetings(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/clients/${userId}/meetings/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get client programs/services
  async getClientPrograms(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/clients/${userId}/services/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get client permissions
  async getClientPermissions(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/modify_permissions/${userId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Update client permissions
  async updateClientPermissions(userId, permissions) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/modify_permissions/`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          permissions,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== CHAT APIs ====================

  // Initiate chat
  async initiateChat(userId, initiatorId, title = 'Client Support') {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/chats/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          initiatorId,
          title,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // Get chat messages
  async getChatMessages(chatId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/messaging/sessions/${chatId}/messages/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Send chat message
  async sendChatMessage(chatId, text, senderId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/chats/${chatId}/messages/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ text, senderId }),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== MEETING APIs ====================

  // Download meeting transcript
  async downloadMeetingTranscript(userId, meetingId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/clients/${userId}/meetings/${meetingId}/transcript/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    if (!response.ok) {
      throw new Error('Failed to download transcript')
    }
    return response.blob()
  }

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

  async scheduleMeeting(
    meetingTitle,
    meetingTypeId,
    userId,
    meetingDate,
    meetingDuration,
  ) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/scheduling/schedule/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title: meetingTitle,
          meeting_type_id: meetingTypeId,
          client_id: userId,
          scheduled_at: meetingDate,
          duration: meetingDuration,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== PROGRAM ENROLLMENT APIs ====================

  // Enroll client in program
  async enrollProgram(clientId, programId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/sales/enroll-program/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          client_id: clientId,
          program_id: programId,
        }),
      },
    )
    return this.handleResponse(response)
  }
}

export default new SalesAPIService()
