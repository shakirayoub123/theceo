import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a given date into a human-readable string with the day, month, and year,
 * including the appropriate ordinal suffix for the day (e.g., "1st", "2nd", "3rd").
 * @param {Date|string|number} date - The date to format. Can be a Date object, a date string, or a timestamp.
 * @returns {string} The formatted date string in the format "DDth Month, YYYY" (e.g., "1st Jan, 2023").
 */
export const formatDate = (date) => {
  const d = new Date(date)
  const day = d.getDate()
  const month = d.toLocaleString('default', { month: 'short' })
  const year = d.getFullYear()
  const suffix = (day) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }
  return `${day}${suffix(day)} ${month}, ${year}`
}

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

/**
 * Ensures that asset URLs from the backend have the proper BACKEND_URL prefix.
 * If the URL is already absolute (starts with http:// or https://), returns it as-is.
 * If the URL is relative, prepends the BACKEND_URL.
 * @param {string} url - The asset URL from the backend
 * @returns {string} The properly prefixed URL
 */
export const getAssetUrl = (url) => {
  if (!url) return url
  if (typeof url !== 'string') return ''

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return ''

  // Keep site-local/static assets untouched.
  if (
    trimmedUrl.startsWith('/images/') ||
    trimmedUrl.startsWith('/videos/') ||
    trimmedUrl.startsWith('/placeholder') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('blob:')
  ) {
    return trimmedUrl
  }

  // If URL is already absolute, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      trimmedUrl.startsWith('http://')
    ) {
      // Prevent mixed-content fetch/image failures on secure pages.
      return `https://${trimmedUrl.slice('http://'.length)}`
    }
    return trimmedUrl
  }

  // Remove leading slash if present to avoid double slashes
  const cleanUrl = trimmedUrl.startsWith('/') ? trimmedUrl.slice(1) : trimmedUrl

  // Prepend BACKEND_URL
  return `${BACKEND_URL}/${cleanUrl}`
}
