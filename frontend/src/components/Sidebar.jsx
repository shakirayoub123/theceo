import { URLS } from '@/config/urls'
import {
  Home,
  LogIn,
  HelpCircle,
  X,
  ChartLine,
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquareQuote,
  Lightbulb,
  Mail,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar({ isOpen, onClose }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user?.role) return '/'

    const roleRoutes = {
      master: '/admin-dashboard',
      admin: '/admin-dashboard',
      sales: '/sales-dashboard',
      trainer: '/coaching-dashboard',
      client: '/client-dashboard',
    }

    return roleRoutes[user.role] || '/'
  }

  const navigationItems = [
    { icon: Home, label: 'Home', href: '/' },
    {
      icon: LayoutDashboard,
      label: 'Overview',
      href: '/#gallery-section',
      isAnchor: true,
    },
    { icon: Users, label: 'Influencers', href: '/#our-team', isAnchor: true },
    {
      icon: Briefcase,
      label: 'Services',
      href: '/#services-section',
      isAnchor: true,
    },
    {
      icon: MessageSquareQuote,
      label: 'Testimonials',
      href: '/#testimonials-section',
      isAnchor: true,
    },
    { icon: Lightbulb, label: 'Insights', href: '/#blog', isAnchor: true },
    {
      icon: Mail,
      label: 'Connect',
      href: '/#footer',
      isAnchor: true,
    },
    ...(isAuthenticated
      ? [{ icon: ChartLine, label: 'Dashboard', href: getDashboardRoute() }]
      : [{ icon: LogIn, label: 'Login', href: URLS.login }]),
  ]

  const handleAnchorNavigation = (href) => {
    const hash = href.split('#')[1]
    onClose?.()

    const scrollToSection = () => {
      const element = hash ? document.getElementById(hash) : null
      if (element) {
        const headerOffset = 140
        const targetTop =
          element.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({
          top: Math.max(0, targetTop),
          left: 0,
          behavior: 'smooth',
        })
      }
    }

    if (!hash) {
      navigate(href)
      return
    }

    if (location.pathname !== '/') {
      navigate(`/#${hash}`)
      setTimeout(scrollToSection, 100)
    } else {
      scrollToSection()
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out font-exo text-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo Section */}
        <div className=' pt-12 flex items-center justify-center'>
          <img src='/images/logo.svg' alt='Logo' className='text-white' />
        </div>

        {/* Navigation + Help */}
        <div className='flex flex-col flex-1'>
          <nav className='flex-1 py-6'>
            <div className='space-y-2 px-4 '>
              {navigationItems.map((item, index) =>
                item.isAnchor ? (
                  <button
                    key={index}
                    type='button'
                    className='w-full text-left flex items-center space-x-4 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors duration-200 group'
                    onClick={() => handleAnchorNavigation(item.href)}
                  >
                    <item.icon className='h-5 w-5 text-gray-600 group-hover:text-black' />
                    <span className='font-medium'>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={index}
                    to={item.href}
                    className='flex items-center space-x-4 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors duration-200 group'
                    onClick={onClose}
                  >
                    <item.icon className='h-5 w-5 text-gray-600 group-hover:text-black' />
                    <span className='font-medium'>{item.label}</span>
                  </Link>
                ),
              )}
            </div>
          </nav>

          {/* Help Section at Bottom */}
          <div className='px-4 pb-6'>
            <a
              href='/#footer'
              className='flex items-center space-x-4 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors duration-200 group'
              onClick={onClose}
            >
              <HelpCircle className='h-5 w-5 text-gray-600 group-hover:text-black' />
              <span className='font-medium'>Help</span>
            </a>
          </div>
        </div>

        {/* Yellow Left Border */}
        <div className='absolute right-0 top-0 bottom-0 w-1 bg-[#F6B72D]'></div>
        {isOpen && (
          <button
            onClick={onClose}
            className='absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 bg-white border-2 border-[#F6B72D] rounded-full p-2 shadow-md hover:bg-gray-100 transition'
          >
            <X className='h-5 w-5 text-black' />
          </button>
        )}
      </div>
    </>
  )
}
