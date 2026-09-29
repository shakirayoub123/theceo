const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ChatAPIService {
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
      let message = `HTTP ${response.status}`
      try {
        const data = await response.json()
        message = data.message || data.detail || data.error || message
      } catch {
        try {
          const text = await response.text()
          message = text || message
        } catch {
          message = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
        }
      }
      throw new Error(message)
    }
    return response.json()
  }

  async getAllChats() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/all-chats/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

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

  async sendChatMessage(chatId, payload) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/chats/${chatId}/messages/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    )
    return this.handleResponse(response)
  }
}

const chatApiService = new ChatAPIService()
export default chatApiService
