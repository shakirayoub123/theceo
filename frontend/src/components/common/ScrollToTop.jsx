import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      // If returning to home page and user previously came from a section
      const lastSection = sessionStorage.getItem('tci_last_home_section')
      if (pathname === '/' && lastSection) {
        sessionStorage.removeItem('tci_last_home_section')
        const headerOffset = 100
        const trySectionScroll = () => {
          const element = document.getElementById(lastSection)
          if (element) {
            const targetTop =
              element.getBoundingClientRect().top + window.scrollY - headerOffset
            window.scrollTo({
              top: Math.max(0, targetTop),
              left: 0,
              behavior: 'smooth',
            })
            return true
          }
          return false
        }

        if (trySectionScroll()) return
        let sectionAttempts = 0
        const sectionInterval = window.setInterval(() => {
          sectionAttempts += 1
          if (trySectionScroll() || sectionAttempts >= 10) {
            window.clearInterval(sectionInterval)
          }
        }, 150)
        return () => window.clearInterval(sectionInterval)
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: pathname.startsWith('/case-studies/') ? 'smooth' : 'auto',
      })
      return
    }

    const id = decodeURIComponent(hash.replace('#', ''))
    const headerOffset = 140
    const tryScroll = () => {
      const element = document.getElementById(id)
      if (element) {
        const targetTop =
          element.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({
          top: Math.max(0, targetTop),
          left: 0,
          behavior: 'smooth',
        })
        return true
      }
      return false
    }

    // Retry a few times in case async sections render after route transition.
    if (tryScroll()) return
    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      if (tryScroll() || attempts >= 10) {
        window.clearInterval(interval)
      }
    }, 150)

    return () => {
      window.clearInterval(interval)
    }
  }, [pathname, hash])

  return null
}
