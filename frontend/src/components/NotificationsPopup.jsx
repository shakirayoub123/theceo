import { X, CheckCheck } from 'lucide-react'
import { Button } from './ui/button'

export default function NotificationsPopup({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  isLoading = false,
}) {
  if (!isOpen) return null

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  const readNotifications = notifications.filter((n) => n.isRead)

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-40'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='fixed top-16 right-4 w-96 bg-white rounded-lg shadow-2xl z-50 border border-gray-200'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>Notifications</h3>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='h-8 w-8 hover:bg-gray-100'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Content */}
        <div className='max-h-96 overflow-y-auto'>
          {isLoading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6B72D] mx-auto'></div>
              <p className='text-sm text-gray-500 mt-2'>
                Loading notifications...
              </p>
            </div>
          ) : (
            <>
              {/* Unread Section */}
              {unreadNotifications.length > 0 && (
                <div className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-sm font-medium text-gray-900'>
                      Unread
                    </h4>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={onMarkAllAsRead}
                      className='text-xs text-white bg-[#F6B72D] hover:text-[#F6B72D]/80 hover:bg-[#F6B72D]/10'
                    >
                      <CheckCheck className='h-3 w-3 mr-1' />
                      Mark all as read
                    </Button>
                  </div>
                  <div className='space-y-2'>
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => onMarkAsRead(notification.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Read Section */}
              {readNotifications.length > 0 && (
                <div className='p-4 border-t border-gray-100'>
                  <h4 className='text-sm font-medium text-gray-500 mb-3'>
                    Earlier
                  </h4>
                  <div className='space-y-2'>
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isRead={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {notifications.length === 0 && !isLoading && (
                <div className='p-8 text-center text-gray-500'>
                  <p>No notifications yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function NotificationItem({ notification, onMarkAsRead, isRead = false }) {
  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isRead
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-[#F6B72D]/20 hover:bg-[#F6B72D]/5'
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p
            className={`text-sm font-exo ${isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}
          >
            {notification.message}
          </p>
          <p className='text-xs font-exo text-gray-500 mt-1'>
            {notification.time}
          </p>
        </div>
        {!isRead && onMarkAsRead && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onMarkAsRead}
            className='ml-2 h-6 w-6 p-0 hover:bg-[#F6B72D]/10'
          >
            <CheckCheck className='h-3 w-3 text-[#F6B72D]' />
          </Button>
        )}
      </div>
    </div>
  )
}
