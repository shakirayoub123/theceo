// src/services/chatbotService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ChatbotService {
  constructor() {
    this.baseURL = API_BASE_URL
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

  // Start AI Chat Session
  async startAIChat(sessionName = null, isPublic = true) {
    const response = await fetch(`${this.baseURL}/chat/startAIChat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_name: sessionName,
        is_public: isPublic,
      }),
    })
    return this.handleResponse(response)
  }

  // Get AI Chat Messages
  async getAIChatMessages(sessionId) {
    const response = await fetch(
      `${this.baseURL}/chat/getAIChatMessages/${sessionId}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Build WebSocket URL for AI Chat
  buildWebSocketUrl(sessionId) {
    const rawWsBase = import.meta.env.VITE_WS_BASE_URL
    let base = rawWsBase

    if (!base) {
      const apiBase = import.meta.env.VITE_API_BASE_URL
      if (apiBase && apiBase.startsWith('http')) {
        const apiUrl = new URL(apiBase)
        base = `${apiUrl.protocol === 'https:' ? 'wss' : 'ws'}://${apiUrl.host}`
      } else if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        base = `${protocol}://${window.location.host}`
      } else {
        base = 'ws://localhost:8000'
      }
    }

    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
    let url = `${normalizedBase}/ai-chat/sessions/${sessionId}/`

    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:'
      if (isSecure && url.startsWith('ws://')) {
        url = url.replace('ws://', 'wss://')
      }
    }

    return url
  }
}

export default new ChatbotService()
