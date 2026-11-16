import { ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function PageBackButton({
  fallbackUrl = '/',
  label = 'Back',
  className = '',
  variant = 'light', // 'light' | 'dark' | 'glass'
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = (e) => {
    e.preventDefault()

    // 1. If explicit 'from' state was passed during navigation and is an internal route
    const fromUrl = location.state?.from
    if (fromUrl && typeof fromUrl === 'string' && fromUrl.startsWith('/')) {
      if (fromUrl.includes('#')) {
        const [, hash] = fromUrl.split('#')
        if (hash) sessionStorage.setItem('tci_last_home_section', hash)
      }
      navigate(fromUrl)
      return
    }

    // 2. Direct internal navigation to fallback URL
    if (fallbackUrl) {
      if (fallbackUrl.includes('#')) {
        const [, hash] = fallbackUrl.split('#')
        if (hash) sessionStorage.setItem('tci_last_home_section', hash)
      }
      navigate(fallbackUrl)
      return
    }

    sessionStorage.setItem('tci_last_home_section', 'blog')
    navigate('/#blog')
  }

  // Styles based on variant
  let variantStyles =
    'bg-white text-[#0B132B] border border-gray-300 shadow-sm hover:bg-[#F6B72D] hover:border-[#F6B72D] hover:text-black'
  if (variant === 'dark') {
    variantStyles =
      'bg-[#0B132B] text-white border border-[#2D2D4A] shadow-md hover:bg-[#F6B72D] hover:border-[#F6B72D] hover:text-black'
  } else if (variant === 'glass') {
    variantStyles =
      'bg-black/50 backdrop-blur-md text-white border border-white/30 shadow-lg hover:bg-[#F6B72D] hover:border-[#F6B72D] hover:text-black'
  }

  return (
    <button
      type='button'
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 group cursor-pointer ${variantStyles} ${className}`}
      aria-label={typeof label === 'string' ? label : 'Go back to previous page'}
    >
      <span className='w-5 h-5 rounded-full bg-black/10 group-hover:bg-black/20 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5'>
        <ArrowLeft className='w-3.5 h-3.5' />
      </span>
      <span>{label}</span>
    </button>
  )
}

