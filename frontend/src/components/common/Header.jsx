import { ShoppingCart, Menu, X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import Sidebar from '../Sidebar'
import LanguageSelector from '../LanguageSelector'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()

  // Get cart items from localStorage
  const getCartItems = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cartItems') || '[]')
      return cart
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error)
      return []
    }
  }

  // Update cart count
  const updateCartCount = () => {
    const cartItems = getCartItems()
    setCartCount(cartItems.length)
  }

  useEffect(() => {
    updateCartCount()

    // Listen for storage changes (when cart is updated in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'cartItems') {
        updateCartCount()
      }
    }

    // Listen for cart updates within the same tab
    const handleCartUpdate = () => {
      updateCartCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeSidebar = () => {
    setIsMenuOpen(false)
  }

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

  return (
    <>
      <div className='sticky top-2 md:top-4 w-full z-50 transition-all duration-300 pb-2 flex justify-center'>
        <div className='max-w-[1400px] w-full mx-auto px-4 md:px-6 lg:px-8'>
          <header className='bg-[#000023] w-full h-[72px] flex items-center shadow-2xl font-jakarta rounded-[16px] md:rounded-[20px]'>
            <div className='w-full px-4 md:px-8 flex items-center justify-between relative'>

              {/* Left: Logo */}
              <div className='flex items-center'>
                <Link to='/'>
                  <img
                    src={'/images/fullLogo.svg'}
                    alt={'Full Logo'}
                    className='h-8 md:h-10 w-auto'
                  />
                </Link>
              </div>

              {/* Center: Navigation Links — truly centred via absolute positioning */}
              <div className='hidden lg:flex items-center gap-4 xl:gap-6 absolute left-1/2 -translate-x-1/2'>
                <Link to='/' className='text-[#F6B72D] text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D]/80 transition-colors whitespace-nowrap'>
                  Home
                </Link>
                <a href='/#services-section' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Services
                </a>
                <a href='/#salient-features' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Salient Features
                </a>
                <a href='/#our-team' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Influencers
                </a>
                <a href='/#testimonials-section' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Testimonials
                </a>
                <a href='/#blog' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Insights
                </a>
                <a href='/#case-studies-section' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Case Studies
                </a>
                <a href='/#footer' className='text-white text-[13px] xl:text-[14px] font-normal leading-normal tracking-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap'>
                  Connect
                </a>
              </div>

              {/* Right Actions */}
              <div className='flex items-center space-x-4 lg:space-x-5'>
                {/* Shopping Cart */}
                <Link
                  to='/cart'
                  className='relative p-2 hover:bg-white/10 rounded-full transition-colors duration-300'
                >
                  <ShoppingCart className='h-5 w-5 text-white' />
                  {cartCount > 0 && (
                    <span className='absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center'>
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* Language Selector */}
                <LanguageSelector />

                {/* Login / Dashboard Button */}
                <div className='hidden md:block'>
                  {isAuthenticated ? (
                    <Link to={getDashboardRoute()}>
                      <Button className='bg-white hover:bg-gray-100 text-[#161616] rounded-full pl-1.5 pr-6 h-10 flex items-center gap-3 transition-all duration-300'>
                        <div className='bg-[#F6B72D] h-7 w-7 rounded-full flex items-center justify-center'>
                          <ArrowRight className='h-4 w-4 text-black' />
                        </div>
                        <span className='font-bold text-sm'>{t('nav.dashboard', 'Dashboard')}</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link to='/login'>
                      <Button className='bg-white hover:bg-gray-100 text-[#161616] rounded-full pl-1.5 pr-6 h-10 flex items-center gap-3 transition-all duration-300'>
                        <div className='bg-[#F6B72D] h-7 w-7 rounded-full flex items-center justify-center'>
                          <ArrowRight className='h-4 w-4 text-black' />
                        </div>
                        <span className='font-bold text-sm'>{t('nav.login')}</span>
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='lg:hidden text-white hover:bg-white/10 p-2 rounded-full'
                  onClick={toggleMenu}
                >
                  {isMenuOpen ? (
                    <X className='h-6 w-6' />
                  ) : (
                    <Menu className='h-6 w-6' />
                  )}
                </Button>
              </div>
            </div>
          </header>
        </div>
      </div>
      <Sidebar isOpen={isMenuOpen} onClose={closeSidebar} />
    </>
  )
}
