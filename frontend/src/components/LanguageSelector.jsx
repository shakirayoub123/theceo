import { useState } from 'react'
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

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode)
    setIsOpen(false)
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center space-x-2 p-2 hover:bg-white/10 rounded-full transition-colors duration-300'
      >
        <Globe className='h-5 w-5 text-white' />
        <span className='text-white text-sm hidden sm:block'>
          Language
        </span>
        <ChevronDown className='h-4 w-4 text-white' />
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200'>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${i18n.language === language.code
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700'
                }`}
            >
              <img
                src={language.flag}
                alt={`${language.name} flag`}
                className='h-5 w-7 object-cover rounded-sm'
                onError={(e) => {
                  // Fallback to text representation
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <span className='text-sm font-medium'>{language.nativeName}</span>
              {i18n.language === language.code && (
                <span className='ml-auto text-blue-600'>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
