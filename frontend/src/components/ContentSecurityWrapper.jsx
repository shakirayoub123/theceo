import { useEffect, useState } from 'react'
import '../styles/contentSecurity.css'

export function ContentSecurityWrapper({ children, disableDownloads = true }) {
  const [isBlurred, setIsBlurred] = useState(false)

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    // Disable keyboard shortcuts for saving, printing, developer tools
    const handleKeyDown = (e) => {
      // Disable Ctrl+S (save), Ctrl+P (print), Ctrl+Shift+I (dev tools), F12 (dev tools)
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'i') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'c') ||
        (e.ctrlKey && e.shiftKey && e.key === 'j') ||
        (e.ctrlKey && e.shiftKey && e.key === 'k')
      ) {
        e.preventDefault()
        return false
      }
    }

    // Disable drag and drop
    const handleDragStart = (e) => {
      e.preventDefault()
      return false
    }

    // Disable copy/paste/cut
    const handleCopy = (e) => {
      e.preventDefault()
      return false
    }

    const handlePaste = (e) => {
      e.preventDefault()
      return false
    }

    const handleCut = (e) => {
      e.preventDefault()
      return false
    }

    // Handle window blur to prevent screenshots (like Netflix)
    const handleWindowBlur = () => {
      setIsBlurred(true)
    }

    const handleWindowFocus = () => {
      setIsBlurred(false)
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('cut', handleCut)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    // Disable text selection
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.mozUserSelect = 'none'
    document.body.style.msUserSelect = 'none'

    // Disable image dragging
    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      img.setAttribute('draggable', 'false')
      img.addEventListener('dragstart', (e) => e.preventDefault())
    })

    // Disable video controls and right-click on videos
    const videos = document.querySelectorAll('video')
    videos.forEach((video) => {
      video.addEventListener('contextmenu', handleContextMenu)
      if (disableDownloads) {
        // Allow video playback but prevent download
        video.setAttribute('disablePictureInPicture', 'true')
        // Note: controlsList='nodownload' might prevent playback on some browsers, so removed
        // Attempt to enable DRM if supported (for encrypted content)
        if ('mediaKeys' in video && navigator.requestMediaKeySystemAccess) {
          // This would require encrypted video sources from backend
          console.log(
            'DRM support detected, but requires encrypted video streams',
          )
        }
      }
    })

    // Disable download links if requested
    if (disableDownloads) {
      // Note: Downloads are now handled via View modal, so no need to disable links
    }

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('cut', handleCut)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)

      // Restore text selection
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
      document.body.style.mozUserSelect = ''
      document.body.style.msUserSelect = ''

      // Re-enable image dragging
      images.forEach((img) => {
        img.removeAttribute('draggable')
        img.removeEventListener('dragstart', (e) => e.preventDefault())
      })

      // Re-enable video context menu
      videos.forEach((video) => {
        video.removeEventListener('contextmenu', handleContextMenu)
      })

      // Re-enable download links
      // No longer needed since we use View modal
    }
  }, [disableDownloads])

  return (
    <div
      style={{
        // CSS to prevent screenshots and make content harder to capture
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      className='content-security-wrapper'
    >
      {/* Invisible overlay to prevent screenshot tools */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          background: 'transparent', // Removed background to not interfere with videos
          zIndex: 9999,
        }}
        aria-hidden='true'
      />

      {/* Blur overlay when window loses focus (prevents screenshots) */}
      {isBlurred && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
          }}
          aria-hidden='true'
        >
          Content Protected - Screenshot Disabled
        </div>
      )}

      {/* Watermark overlay */}
      {/* <div className='content-security-watermark' aria-hidden='true'>
        CONFIDENTIAL
      </div> */}

      {children}
    </div>
  )
}
