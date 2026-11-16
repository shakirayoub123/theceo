import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Breadcrumb({
  items = [],
  bg,
  showBack = false,
  fallbackUrl = '/',
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from)
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate(fallbackUrl)
    }
  }

  return (
    <nav className='py-4' style={{ backgroundColor: bg || '#ffff' }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center text-sm text-gray-600 font-exo flex-wrap gap-y-2'>
          {showBack && (
            <button
              type='button'
              onClick={handleBack}
              className='inline-flex items-center gap-1.5 mr-4 text-xs font-bold uppercase tracking-wider text-[#0B132B] hover:text-[#F6B72D] transition-colors py-1 px-3 rounded-full bg-gray-100 hover:bg-gray-200'
            >
              <ArrowLeft className='w-3.5 h-3.5' />
              <span>Back</span>
            </button>
          )}
          {items.map((item, index) => (
            <div key={index} className='flex items-center'>
              {item.href ? (
                <a
                  href={item.href}
                  className='hover:text-gray-800 transition-colors'
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={
                    index === items.length - 1 ? 'text-black font-medium' : ''
                  }
                >
                  {item.label}
                </span>
              )}
              {index < items.length - 1 && (
                <ChevronRight className='h-4 w-4 mx-2 text-gray-400' />
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
