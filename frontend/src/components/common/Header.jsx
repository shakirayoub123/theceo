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
        <div className='max-w-[1440px] w-full mx-auto px-3 sm:px-4 md:px-5 lg:px-6'>
          <header className='bg-[#000023] w-full h-[68px] md:h-[72px] flex items-center shadow-2xl font-jakarta rounded-[16px] md:rounded-[20px]'>
            <div className='w-full px-3 md:px-4 lg:px-5 flex items-center justify-between'>

              {/* Left: Logo */}
              <div className='flex items-center flex-shrink-0 z-10'>
                <Link to='/'>
                  <img
                    src={'/images/fullLogo.svg'}
                    alt={'Full Logo'}
                    className='h-7 sm:h-7.5 md:h-8 xl:h-8.5 w-auto'
                  />
                </Link>
              </div>

              {/* Center: Navigation Links with responsive gap and spacing */}
              <nav className='hidden lg:flex flex-1 items-center justify-center gap-1.5 lg:gap-2 xl:gap-3.5 2xl:gap-5 mx-1.5 lg:mx-2 xl:mx-3 min-w-0'>
                <Link to='/' className='text-[#F6B72D] text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D]/80 transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.home', 'Home')}
                </Link>
                <a href='/#services-section' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.services', 'Services')}
                </a>
                <a href='/#salient-features' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.salientFeatures', 'Salient Features')}
                </a>
                <a href='/#our-team' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.influencers', 'Influencers')}
                </a>
                <a href='/#testimonials-section' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.testimonials', 'Testimonials')}
                </a>
                <a href='/#blog' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.insights', 'Insights')}
                </a>
                <a href='/#case-studies-section' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.caseStudies', 'Case Studies')}
                </a>
                <a href='/#footer' className='text-white text-[12px] lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] font-medium leading-normal hover:text-[#F6B72D] transition-colors whitespace-nowrap px-0.5'>
                  {t('nav.connect', 'Connect')}
                </a>
              </nav>

              {/* Right Actions */}
              <div className='flex items-center space-x-1.5 sm:space-x-2 xl:space-x-3 flex-shrink-0 z-10'>
                {/* Shopping Cart */}
                <Link
                  to='/cart'
                  className='relative p-1.5 hover:bg-white/10 rounded-full transition-colors duration-300'
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
                      <Button className='bg-white hover:bg-gray-100 text-[#161616] rounded-full pl-1.5 pr-3 xl:pr-4 h-8.5 xl:h-9 flex items-center gap-1.5 xl:gap-2 transition-all duration-300'>
                        <div className='bg-[#F6B72D] h-6 w-6 rounded-full flex items-center justify-center shrink-0'>
                          <ArrowRight className='h-3 w-3 text-black' />
                        </div>
                        <span className='font-bold text-xs xl:text-sm whitespace-nowrap'>{t('nav.dashboard', 'Dashboard')}</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link to='/login'>
                      <Button className='bg-white hover:bg-gray-100 text-[#161616] rounded-full pl-1.5 pr-3 xl:pr-4 h-8.5 xl:h-9 flex items-center gap-1.5 xl:gap-2 transition-all duration-300'>
                        <div className='bg-[#F6B72D] h-6 w-6 rounded-full flex items-center justify-center shrink-0'>
                          <ArrowRight className='h-3 w-3 text-black' />
                        </div>
                        <span className='font-bold text-xs xl:text-sm whitespace-nowrap'>{t('nav.login')}</span>
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
