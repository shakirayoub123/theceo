import { Outlet, useLocation } from 'react-router-dom'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { useState } from 'react'
import { DashboardHeader } from '@/components/common/DashboardHeader'
import { sidebarConfigs } from '@/config/sidebarConfig'
import { URLS } from '@/config/urls'
import { useAuth } from '@/contexts/AuthContext'

// Dashboard title mappings
const dashboardTitles = {
  admin: 'ADMINISTRATIVE DASHBOARD',
  sales: 'SALES DASHBOARD',
  coaching: 'COACHING DASHBOARD',
  client: 'CLIENT DASHBOARD',
}

// Map user roles to dashboard/sidebar configuration keys
const roleToDashboardType = {
  admin: 'admin',
  master: 'admin',
  sales: 'sales',
  trainer: 'coaching',
  coaching: 'coaching',
  client: 'client',
}

const getDisplayName = (user) => {
  const joinedName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
  return (
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    joinedName ||
    user?.username ||
    user?.email ||
    ''
  )
}

const getUserInitials = (user) => {
  const displayName = getDisplayName(user)
  const nameParts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase()
  }

  return 'U'
}

export function DashboardLayout() {
  const location = useLocation()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const { user, logout } = useAuth()

  function getDashboardTypeFromPath(pathname) {
    if (pathname.includes('/admin-dashboard')) return 'admin'
    if (pathname.includes('/sales-dashboard')) return 'sales'
    if (pathname.includes('/coaching-dashboard')) return 'coaching'
    if (pathname.includes('/client-dashboard')) return 'client'
    return null
  }

  const dashboardTypeFromPath = getDashboardTypeFromPath(location.pathname)
  const dashboardType =
    dashboardTypeFromPath ||
    roleToDashboardType[user?.role] ||
    roleToDashboardType.admin
  const isOverviewOnlyClient =
    user?.role === 'client' && user?.hasFullDashboardAccess === false

  const items = (sidebarConfigs[dashboardType] || []).filter((item) => {
    if (!isOverviewOnlyClient || dashboardType !== 'client') {
      return true
    }
    return [URLS.client.dashboard, URLS.logout].includes(item.href)
  })
  const dashboardTitle = dashboardTitles[dashboardType] || dashboardTitles.admin
  const userName = getDisplayName(user)
  const userInitials = getUserInitials(user)

  const handleSidebarItemClick = () => {
    setIsMobileSidebarOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      // The logout function from useAuth will handle clearing the user state
      // You might want to redirect to login page here if needed
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  return (
    <div className='h-screen flex bg-gray-50'>
      {/* Sidebar */}
      {isMobileSidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto flex
          transform ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }
          lg:translate-x-0 transition-all duration-300 ease-in-out
          lg:block`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <DashboardSidebar
          items={items}
          onItemClick={handleSidebarItemClick}
          expanded={isSidebarExpanded || isMobileSidebarOpen}
          isMobile={isMobileSidebarOpen}
        />
      </div>

      <div className='flex-1 flex flex-col'>
        <DashboardHeader
          title={dashboardTitle}
          userName={userName}
          userInitials={userInitials}
          userEmail={user?.email}
          onLogoutClick={handleLogout}
          onMenuClick={toggleMobileSidebar}
        />

        <div className='flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
