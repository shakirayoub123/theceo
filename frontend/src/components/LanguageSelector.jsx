import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Globe } from 'lucide-react'

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '/images/usFlag.svg',
    nativeName: 'English',
  },
  {
    code: 'de',
    name: 'German',
    flag: '/images/deFlag.svg',
    nativeName: 'Deutsch',
  },
  {
    code: 'fr',
    name: 'French',
    flag: '/images/frFlag.svg',
    nativeName: 'Français',
  },
  {
    code: 'it',
    name: 'Italian',
    flag: '/images/itFlag.svg',
    nativeName: 'Italiano',
  },
  {
    code: 'es',
    name: 'Spanish',
    flag: '/images/esFlag.jpg',
    nativeName: 'Español',
  },
  {
    code: 'zh',
    name: 'Chinese',
    flag: '/images/cnFlag.svg',
    nativeName: '中文',
  },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isSelected = (code) => {
    if (!i18n.language) return code === 'en'
    return (
      i18n.language === code ||
      i18n.language.toLowerCase().startsWith(code.toLowerCase())
    )
  }

  const currentLanguage =
    languages.find((lang) => isSelected(lang.code)) || languages[0]

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode)
    try {
      localStorage.setItem('i18nextLng', languageCode)
    } catch (e) {
      console.warn('Could not save language to localStorage:', e)
    }
    setIsOpen(false)
  }

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        aria-label={`Select language, current language: ${currentLanguage.nativeName}`}
        title='Select language'
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-1 p-2 hover:bg-white/10 rounded-full transition-colors duration-300'
      >
        <Globe className='h-5 w-5 text-white' />
        <ChevronDown
          className={`h-4 w-4 text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 py-1 overflow-hidden animate-in fade-in-50 duration-150'>
          {languages.map((language) => {
            const active = isSelected(language.code)
            return (
              <button
                key={language.code}
                type='button'
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors duration-200 ${
                  active ? 'bg-amber-50 text-[#000023] font-semibold' : 'text-gray-700'
                }`}
              >
                <img
                  src={language.flag}
                  alt={`${language.name} flag`}
                  className='h-4 w-6 object-cover rounded shadow-sm border border-gray-100 shrink-0'
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <span className='text-sm font-medium'>{language.nativeName}</span>
                {active && (
                  <span className='ml-auto text-[#F6B72D] font-bold text-sm'>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
