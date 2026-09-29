import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from './ui/button'
import NotificationsPopup from './NotificationsPopup'
import authService from '@/services/authService'
import toast from 'react-hot-toast'

// Utility function for formatting timestamps
const formatTime = (timestamp) => {
  if (!timestamp) return 'Just now'

  const now = new Date()
  const notificationTime = new Date(timestamp)
  const diffInMs = now - notificationTime
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  if (diffInDays < 30)
    return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`
  if (diffInDays < 365)
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`
  return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCount, setIsLoadingCount] = useState(false)

  // Fetch notification count on mount and periodically
  useEffect(() => {
    fetchNotificationCount()

    // Poll for new notifications every 120 seconds
    const interval = setInterval(fetchNotificationCount, 120000)

    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when popup opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotificationCount = async () => {
    try {
      setIsLoadingCount(true)
      const response = await authService.getNotificationCount()
      // Handle different possible response formats
      const count = response?.count ?? response ?? 0
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
      // Don't show toast for count failures to avoid spam
    } finally {
      setIsLoadingCount(false)
    }
  }

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authService.getNotifications({ limit: 50 })
      // Transform API response to match component expectations
      const transformedNotifications = (response.results || response).map(
        (notification) => ({
          id: notification.id,
          message: notification.message,
          time: notification.time || formatTime(notification.created_at),
          isRead: notification.is_read || false,
          type: notification.type || 'system',
        }),
      )
      setNotifications(transformedNotifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleMarkAllAsRead = async () => {
    try {
      await authService.markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await authService.markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  return (
    <div className='relative'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        className='relative hover:bg-gray-100'
        disabled={isLoadingCount}
      >
        <Bell className={`h-5 w-5 ${isLoadingCount ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationsPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        isLoading={isLoading}
      />
    </div>
  )
}
