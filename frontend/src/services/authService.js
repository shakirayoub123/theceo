// src/services/authService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  clearStoredAuth() {
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
  }

  // Helper method to get headers for JSON requests
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    }
  }

  // Helper method to get headers for FormData requests
  getAuthHeadersForFormData() {
    return {}
  }

  // Always include cookies for cross-origin API requests
  async fetchWithCredentials(url, options = {}) {
    return fetch(url, {
      ...options,
      credentials: 'include',
    })
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      let errorData = null

      try {
        errorData = await response.json()
      } catch {
        errorData = null
      }

      if (errorData && typeof errorData === 'object') {
        const error = new Error(
          errorData.message ||
            errorData.detail ||
            errorData.error ||
            `HTTP ${response.status}`,
        )
        error.httpStatus = response.status
        Object.assign(error, errorData)
        throw error
      }

      let errorMessage = `HTTP ${response.status}`

      try {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }

      const error = new Error(errorMessage)
      error.httpStatus = response.status
      throw error
    }
    return response.json()
  }

  // User Registration
  async register(userData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      },
    )
    return this.handleResponse(response)
  }

  // User Login
  async login(credentials) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      },
    )
    const data = await this.handleResponse(response)

    if (data.user_id) {
      localStorage.setItem('userId', String(data.user_id))
    }

    return data
  }

  // Logout
  async logout(options = {}) {
    try {
      await this.fetchWithCredentials(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        keepalive: options.keepalive === true,
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearStoredAuth()
    }
  }

  // Refresh Token
  async refreshToken() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    )

    return this.handleResponse(response)
  }

  // Forgot Password - Send OTP
  async forgotPassword(email) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/forgot-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    )
    return this.handleResponse(response)
  }

  // Verify OTP
  async verifyOTP(email, otp) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/verify-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      },
    )
    return this.handleResponse(response)
  }

  // Reset Password
  async resetPassword(email, otp, newPassword) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/reset-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      },
    )
    return this.handleResponse(response)
  }

  // Change Password
  async changePassword(currentPassword, newPassword) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/change-password`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    )
    return this.handleResponse(response)
  }

  // Get Current User Profile
  async getCurrentUser() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/me`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    const userData = await this.handleResponse(response)

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
      if (userData.id) {
        localStorage.setItem('userId', String(userData.id))
      }
    }

    return userData
  }

  // Update User Profile
  async updateProfile(userData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/auth/profile`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      },
    )
    return this.handleResponse(response)
  }

  // Get All Users (Admin only)
  async getAdminClients(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString
      ? `${this.baseURL}/lms/admin/clients/?${queryString}`
      : `${this.baseURL}/lms/admin/clients/`
    const response = await this.fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/clients?${queryString}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get User by ID (Admin only)
  async getUserById(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/${userId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Update User (Admin only)
  async updateUser(userId, userData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      },
    )
    return this.handleResponse(response)
  }

  // Delete User (Admin only)
  async deleteUser(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get User Permissions
  async getUserPermissions(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/${userId}/permissions`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Update User Permissions (Admin only)
  async updateUserPermissions(userId, permissions) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/${userId}/permissions`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ permissions }),
      },
    )
    return this.handleResponse(response)
  }

  // Get User Activity Logs
  async getUserActivityLogs(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/${userId}/activity?${queryString}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Bulk User Operations
  async bulkUpdateUsers(userIds, updates) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/bulk-update`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userIds, updates }),
      },
    )
    return this.handleResponse(response)
  }

  async bulkDeleteUsers(userIds) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/admin/users/bulk-delete`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userIds }),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== ADMIN DASHBOARD APIs ====================

  // Admin Dashboard Overview
  async getAdminDashboard() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/admin/dashboard/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async getAdminCalendar({ year, month } = {}) {
    const params =
      year && month
        ? `?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
        : ''
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/scheduling/calendar/${params}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Modify User Permissions (Admin Dashboard)
  async getUserPermissionsAdmin(userId = null) {
    const url = userId
      ? `${this.baseURL}/accounts/modify_permissions/${userId}/`
      : `${this.baseURL}/accounts/modify_permissions/`
    const response = await this.fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async updateUserPermissionsAdmin(userId, permissions) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/modify_permissions/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ user_id: userId, permissions }),
      },
    )
    return this.handleResponse(response)
  }

  // Suspend User
  async suspendUser(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/suspend/${userId}/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Approve Trainer
  async approveTrainer(userId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/accounts/approve_trainer/${userId}/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== PUBLIC LMS APIs (No Authentication Required) ====================

  // Get All Ebooks
  async getAllEbooks() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/ebooks/all/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get Ebook Details
  async getEbookDetails(ebookUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/ebook/details/${ebookUuid}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get Ebooks by Series
  async getEbooksBySeries(seriesUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/ebook/series/${seriesUuid}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get All Ebooks with Series Information
  async getPeopleEbooks() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/ebooks/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get People Ebook Details by ID
  async getPeopleEbookDetails(ebookId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/ebook/${ebookId}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get Service Details for public website
  async getPeopleServiceDetails(serviceId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/service/${serviceId}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Checkout API
  async checkout(checkoutData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/checkout/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData),
      },
    )
    return this.handleResponse(response)
  }

  // Add to Cart
  async addToCart(ebookUuid, cartId = null) {
    const body = cartId ? { cart_id: cartId } : {}
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/cart/add/${ebookUuid}/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    return this.handleResponse(response)
  }

  // Get Cart Contents
  async getCartContents(cartId = null) {
    const queryString = cartId ? `?cart_id=${cartId}` : ''
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/cart/${queryString}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get All Blogs
  async getAllBlogs() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/blogs/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get Blog Details
  async getBlogDetails(slug) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/blog/${slug}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get All Newsletters
  async getAllNewsletters() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/newsletters/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get Newsletter Details
  async getNewsletterDetails(newsletterUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/newsletter/${newsletterUuid}/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Get All Programs
  async getAllPrograms() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/programs/`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    return this.handleResponse(response)
  }

  // Public Contact Form
  async submitPublicContactForm(payload) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/comms/contact/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    return this.handleResponse(response)
  }

  // Schedule Call Appointment
  async scheduleCall(appointmentData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/client/scheduleCall/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== LMS ADMIN APIs (Continued) ====================

  // Admin Services Management
  async getAdminServices() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/services/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Service Details (Admin)
  async getServiceDetails(serviceId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/serviceDetails/${serviceId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Trainers (Admin)
  async getTrainers() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/trainers/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Create Service (Admin)
  async createServiceAdmin(serviceData) {
    const isFormData = serviceData instanceof FormData
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/service/add/`,
      {
        method: 'POST',
        headers: isFormData
          ? this.getAuthHeadersForFormData()
          : this.getAuthHeaders(),
        body: isFormData ? serviceData : JSON.stringify(serviceData),
      },
    )
    return this.handleResponse(response)
  }

  // Update Service (Admin)
  async updateServiceAdmin(serviceId, serviceData) {
    const isFormData = serviceData instanceof FormData
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/editService/${serviceId}/`,
      {
        method: 'PUT',
        headers: isFormData
          ? this.getAuthHeadersForFormData()
          : this.getAuthHeaders(),
        body: isFormData ? serviceData : JSON.stringify(serviceData),
      },
    )
    return this.handleResponse(response)
  }

  // Delete Service File (Admin)
  async deleteServiceFile(fileId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/service-file/${fileId}/`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Delete Chapter (Admin)
  async deleteChapter(chapterId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/delete-chapter/${chapterId}/`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Admin Ebooks Management
  async getAdminEbooks() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebooks/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Ebook Details (Admin)
  async getAdminEbookDetails(ebookUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebooks/${ebookUuid}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Admin Blogs Management
  async getAdminBlogs() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/blogs/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Blog Details (Admin)
  async getAdminBlogDetails(blogUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/blog/${blogUuid}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Admin Newsletters Management
  async getAdminNewsletters() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/newsletters/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Newsletter Details (Admin)
  async getAdminNewsletterDetails(newsletterUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/newsletter/${newsletterUuid}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Admin Referrals Management
  async getAdminReferrals() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/referrals/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Referral Details (Admin)
  async getAdminReferralDetails(referralId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/referrals/${referralId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Admin Ebook Series Management
  async getAdminEbookSeries() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook-series/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async createEbookSeries(seriesData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook-series/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(seriesData),
      },
    )
    return this.handleResponse(response)
  }

  // Create Ebook (Admin)
  async createEbookAdmin(ebookData) {
    const isFormData = ebookData instanceof FormData
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook/add/`,
      {
        method: 'POST',
        headers: isFormData
          ? this.getAuthHeadersForFormData()
          : this.getAuthHeaders(),
        body: isFormData ? ebookData : JSON.stringify(ebookData),
      },
    )
    return this.handleResponse(response)
  }

  // Update Ebook (Admin)
  async updateEbookAdmin(ebookUuid, ebookData) {
    const isFormData = ebookData instanceof FormData
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook/edit/${ebookUuid}/`,
      {
        method: 'PUT',
        headers: isFormData
          ? this.getAuthHeadersForFormData()
          : this.getAuthHeaders(),
        body: isFormData ? ebookData : JSON.stringify(ebookData),
      },
    )
    return this.handleResponse(response)
  }

  // Toggle Ebook Status (Admin)
  async toggleEbookStatus(ebookUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook/toggle-status/${ebookUuid}/`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Ebook Purchase History (Admin)
  async getEbookPurchaseHistory(ebookUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/ebook/history/${ebookUuid}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Create Blog (Admin)
  async createBlogAdmin(blogData) {
    const isFormData = blogData instanceof FormData
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/blog/add/`,
      {
        method: 'POST',
        headers: isFormData
          ? this.getAuthHeadersForFormData()
          : this.getAuthHeaders(),
        body: isFormData ? blogData : JSON.stringify(blogData),
      },
    )
    return this.handleResponse(response)
  }

  // Update Blog (Admin)
  async updateBlogAdmin(blogUuid, blogData) {
    const isFormData = blogData instanceof FormData
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/blog/edit/${blogUuid}/`,
      {
        method: 'PUT',
        headers: isFormData
          ? this.getAuthHeadersForFormData()
          : this.getAuthHeaders(),
        body: isFormData ? blogData : JSON.stringify(blogData),
      },
    )
    return this.handleResponse(response)
  }

  // Toggle Blog Status (Admin)
  async toggleBlogStatus(blogUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/blog/toggle-status/${blogUuid}/`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Create Newsletter (Admin)
  async createNewsletterAdmin(newsletterData) {
    const isFormData = newsletterData instanceof FormData
    try {
      const url = `${this.baseURL}/lms/admin/newsletter/add/`
      const headers = isFormData
        ? this.getAuthHeadersForFormData()
        : this.getAuthHeaders()

      console.log('Newsletter API Request:')
      console.log('URL:', url)
      console.log('Method: POST')
      console.log('Headers:', headers)
      console.log('Is FormData:', isFormData)

      const response = await this.fetchWithCredentials(url, {
        method: 'POST',
        headers: headers,
        body: isFormData ? newsletterData : JSON.stringify(newsletterData),
      })

      console.log('Response status:', response.status)
      console.log(
        'Response headers:',
        Object.fromEntries(response.headers.entries()),
      )

      return this.handleResponse(response)
    } catch (error) {
      console.error('Network error in createNewsletterAdmin:', error)
      throw error
    }
  }

  // Update Newsletter (Admin)
  async updateNewsletterAdmin(newsletterUuid, newsletterData) {
    const isFormData = newsletterData instanceof FormData
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseURL}/lms/admin/newsletter/edit/${newsletterUuid}/`,
        {
          method: 'PUT',
          headers: isFormData
            ? this.getAuthHeadersForFormData()
            : this.getAuthHeaders(),
          body: isFormData ? newsletterData : JSON.stringify(newsletterData),
        },
      )
      return this.handleResponse(response)
    } catch (error) {
      console.error('Network error in updateNewsletterAdmin:', error)
      throw error
    }
  }

  // Toggle Newsletter Status (Admin)
  async toggleNewsletterStatus(newsletterUuid) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/admin/newsletter/toggle-status/${newsletterUuid}/`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('userId')
  }

  // Get stored user data
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  // Get user role
  getUserRole() {
    const user = this.getUser()
    return user?.role || null
  }

  // SALES DASHBOARD APIS -> START

  async getSalesDashboard() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/dashboard/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async getNewClients() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/clients/new/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  async createSalesClient(clientData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/clients/create/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(clientData),
      },
    )
    return this.handleResponse(response)
  }

  // Get Existing Clients Data
  async getExistingClients() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/clients/existing/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Leads Data
  async getLeads() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/clients/leads/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Sales Calendar Data
  async getSalesCalendar({ year, month } = {}) {
    const params =
      year && month
        ? `?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
        : ''
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/calendar/${params}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // SALES DASHBOARD APIS -> END

  // Assign lead to sales user
  async assignLeadToSelf(leadId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/assign-sales/${leadId}/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          sales_user_id: localStorage.getItem('userId'), // Will need to be set when logging in
        }),
      },
    )
    return this.handleResponse(response)
  }

  // Schedule meeting with a lead
  async scheduleMeetingWithLead(meetingData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/sales/schedule-meeting/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          date: meetingData.date,
          time: meetingData.time,
          client_id: meetingData.clientId,
          meeting_type: meetingData.meetingType,
          notes: meetingData.notes,
        }),
      },
    )
    return this.handleResponse(response)
  }

  async createSalesPaymentLink({
    leadId,
    amount,
    currency = 'usd',
    programId,
    leadEmail,
  }) {
    const body = {
      lead_id: leadId,
      amount,
      currency: String(currency || 'usd').toLowerCase(),
      program_id: programId,
    }

    if (leadEmail) {
      body.lead_email = leadEmail
    }

    const response = await this.fetchWithCredentials(
      `${this.baseURL}/people/sales/create-payment-link/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== NOTIFICATIONS APIs ====================

  // Get unread notification count
  async getNotificationCount() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/comms/notifications/count/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get all notifications with pagination
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString
      ? `${this.baseURL}/comms/notifications/?${queryString}`
      : `${this.baseURL}/comms/notifications/`

    const response = await this.fetchWithCredentials(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/comms/notifications/mark-all-read/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Mark single notification as read
  async markNotificationAsRead(notificationId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/comms/notifications/${notificationId}/mark-read/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== COACHING DASHBOARD APIs ====================

  // Get coaching dashboard data
  async getCoachingDashboard() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/dashboard/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get coaching clients data
  async getCoachingClients() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/clients/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get coaching client details
  async getCoachingClientDetails(clientId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/clients/${clientId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get coaching calendar data
  async getCoachingCalendar({ year, month } = {}) {
    const params =
      year && month
        ? `?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
        : ''
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/trainer/calendar/${params}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
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

  async getSalesAllPrograms() {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/sales/programs/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // ==================== STRIPE PAYMENT APIs ====================

  // Create Payment Intent (for Stripe)
  async createPaymentIntent(amount, items, metadata = {}) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/create-payment-intent/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount: amount, // Send amount in dollars, backend will convert to cents
          items,
          metadata,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // Confirm Payment (after Stripe confirmation)
  async confirmPayment(paymentIntentId, orderData) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/confirm-payment/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          stripe_payment_intent_id: paymentIntentId,
          ...orderData,
        }),
      },
    )
    return this.handleResponse(response)
  }

  // Get Payment History
  async getPaymentHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/payment-history/?${queryString}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Get Order Details
  async getOrderDetails(orderId) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}/lms/people/orders/${orderId}/`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }

  // Generic GET method for any API endpoint
  async get(endpoint) {
    const response = await this.fetchWithCredentials(
      `${this.baseURL}${endpoint}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    )
    return this.handleResponse(response)
  }
}

export default new AuthService()
