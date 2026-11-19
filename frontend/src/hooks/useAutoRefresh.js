import { useEffect, useRef } from 'react'

/**
 * Re-run `refresh` every `intervalMs` while the tab is visible, and right away
 * when the user comes back to the tab. Keeps calendars in sync across staff and
 * clients without a page reload.
 */
export default function useAutoRefresh(refresh, intervalMs = 30000) {
  const refreshRef = useRef(refresh)

  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === 'visible') refreshRef.current?.()
    }
    const timer = setInterval(run, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
}
