// src/services/masterAPIService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class MasterAPIService {
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

  // Get all series
  async getSeries() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook-series-get-all/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Create a new series (name in request body)
  async createSeries(seriesData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/series/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: seriesData.name,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // Update a series (name in request body)
  async updateSeries(seriesId, seriesData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/series/${seriesId}/`,
      {
        method: 'PUT', // Using PUT for updates
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: seriesData.name,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // Delete a series (if needed in the future)
  async deleteSeries(seriesId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/series/${seriesId}/`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get ebook details by ID
  async getEbookDetails(ebookId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook/${ebookId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Add more master/admin-related API methods here as needed
}

const masterAPIService = new MasterAPIService()
export default masterAPIService
