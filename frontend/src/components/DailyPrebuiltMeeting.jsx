import React, { useEffect, useRef, useCallback, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DailyPrebuiltMeeting = ({ roomUrl, token }) => {
  const callFrameRef = useRef(null)
  const containerRef = useRef(null)
  const [joinError, setJoinError] = useState('')

  // Check for existing Daily instances
  const checkForExistingDaily = useCallback(() => {
    if (typeof window === 'undefined') return false

    // Check if window has existing Daily instances
    if (window._dailyCallObjectInstances) {
      console.log(
        '[DailyPrebuiltMeeting] Found existing Daily instance(s):',
        window._dailyCallObjectInstances?.length || 0,
      )
      return true
    }

    // Also check DailyIframe._callFrames if accessible
    if (
      DailyIframe._callFrames &&
      Object.keys(DailyIframe._callFrames).length > 0
    ) {
      console.log(
        '[DailyPrebuiltMeeting] Found existing Daily frames:',
        Object.keys(DailyIframe._callFrames).length,
      )
      return true
    }

    return false
  }, [])

  // Initialize Daily.co iframe when component mounts
  useEffect(() => {
    if (!roomUrl || !containerRef.current || callFrameRef.current) return

    console.log(
      '[DailyPrebuiltMeeting] Component mounted, checking for existing Daily instances',
    )

    const hasExistingInstance = checkForExistingDaily()

    if (hasExistingInstance) {
      console.warn(
        '[DailyPrebuiltMeeting] Detected existing Daily instance(s). ' +
          'Not creating another to avoid conflicts. You should use the existing Daily instance instead.',
      )

      // Add diagnostic message to container
      if (containerRef.current) {
        const warningDiv = document.createElement('div')
        warningDiv.style.position = 'absolute'
        warningDiv.style.top = '50%'
        warningDiv.style.left = '50%'
        warningDiv.style.transform = 'translate(-50%, -50%)'
        warningDiv.style.backgroundColor = 'rgba(255, 165, 0, 0.8)'
        warningDiv.style.color = 'white'
        warningDiv.style.padding = '20px'
        warningDiv.style.borderRadius = '8px'
        warningDiv.style.maxWidth = '80%'
        warningDiv.style.textAlign = 'center'
        warningDiv.style.zIndex = '10'
        warningDiv.textContent =
          'Multiple Daily.co instances detected. Avoiding creation of duplicates.'
        containerRef.current.appendChild(warningDiv)
      }

      return
    }

    console.log(
      '[DailyPrebuiltMeeting] No existing Daily instances found, initializing Daily.co frame',
    )

    // Configure Daily.co prebuilt UI options
    const dailyConfig = {
      showLeaveButton: true,
      showFullscreenButton: true,
      showParticipantsBar: true,
      showLocalVideo: true,
      activeSpeakerMode: false,
      showNamesOnTiles: true,
      showVideoControlsBar: true,
      // Use chat features from Daily
      showChat: true,
      enableChatScreensharing: true,
      // Add specific iframe styling
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '0.75rem',
      },
      // Theme configuration
      theme: {
        colors: {
          accent: '#3B82F6',
          accentText: '#FFFFFF',
          background: '#FFFFFF',
          backgroundAccent: '#F3F4F6',
          baseText: '#1F2937',
          border: '#E5E7EB',
          mainAreaBg: '#F9FAFB',
        },
      },
      // Advanced configuration for stability and performance
      dailyConfig: {
        // Session handling improvements
        experimentalLogLevel: 'debug',
        experimentalGetStatsOptions: { highFrequency: true },
        experimentalMediaReconnectCountdownMs: 60000, // 1 minute timeout for media reconnection
        enableNetworkSignalMetering: true,
        // Session persistence and stability options
        externalMeetingStatus: true, // Use our own meeting state management
        disableVP9Encoding: true, // More stable for cross-browser
        disableHardwareAcceleration: true, // Prevent hardware acceleration issues
        avoidEval: true, // Improve stability
        // Keep connections alive
        pingIntervalMs: 15000, // Send ping every 15s
        sessionRequiresActivePings: false, // Don't end session if client doesn't ping
        // Resilient media settings
        adaptiveMaxQuality: 'high', // Auto-adjust to balance quality with performance
        maxBandwidth: {
          ideal: 1200000, // 1.2Mbps target
          max: 2000000, // 2Mbps maximum
        },
        // These options help with session stability
        camSimulcastEncodings: [
          { maxBitrate: 600000, maxFramerate: 30, scaleResolutionDownBy: 1 },
          { maxBitrate: 150000, maxFramerate: 15, scaleResolutionDownBy: 2 },
          { maxBitrate: 80000, maxFramerate: 10, scaleResolutionDownBy: 4 },
        ],
      },
    }

    try {
      // Create the Daily.co iframe
      const callFrame = DailyIframe.createFrame(
        containerRef.current,
        dailyConfig,
      )

      // Add event listeners
      callFrame
        .on('loaded', () =>
          console.log('[DailyPrebuiltMeeting] Call frame loaded'),
        )
        .on('joining-meeting', () =>
          console.log('[DailyPrebuiltMeeting] Joining meeting'),
        )
        .on('joined-meeting', (event) =>
          console.log('[DailyPrebuiltMeeting] Joined meeting:', event),
        )
        .on('left-meeting', (event) =>
          console.log('[DailyPrebuiltMeeting] Left meeting:', event),
        )
        .on('error', (error) => {
          console.error('[DailyPrebuiltMeeting] Error:', error)
          setJoinError(
            error?.errorMsg || error?.message || 'Unable to join video room',
          )
        })

      // Join the meeting
      const joinOptions = { url: roomUrl }
      if (token) joinOptions.token = token

      callFrame.join(joinOptions).catch((error) => {
        console.error('[DailyPrebuiltMeeting] Join failed:', error)
        setJoinError(
          error?.errorMsg || error?.message || 'Unable to join video room',
        )
      })

      // Store reference to callFrame for cleanup
      callFrameRef.current = callFrame
    } catch (err) {
      console.error('[DailyPrebuiltMeeting] Error creating Daily iframe:', err)

      // Add diagnostic message to container
      if (containerRef.current) {
        const errorDiv = document.createElement('div')
        errorDiv.style.position = 'absolute'
        errorDiv.style.top = '50%'
        errorDiv.style.left = '50%'
        errorDiv.style.transform = 'translate(-50%, -50%)'
        errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)'
        errorDiv.style.color = 'white'
        errorDiv.style.padding = '20px'
        errorDiv.style.borderRadius = '8px'
        errorDiv.style.maxWidth = '80%'
        errorDiv.style.textAlign = 'center'
        errorDiv.style.zIndex = '10'
        errorDiv.textContent = `Error creating Daily.co instance: ${err.message}`
        containerRef.current.appendChild(errorDiv)
      }
    }

    // Cleanup when component unmounts
    return () => {
      console.log('[DailyPrebuiltMeeting] Component unmounting')
      if (callFrameRef.current) {
        try {
          callFrameRef.current.destroy()
        } catch (err) {
          console.error(
            '[DailyPrebuiltMeeting] Error destroying Daily iframe:',
            err,
          )
        }
      }
    }
  }, [roomUrl, token, checkForExistingDaily])

  if (!roomUrl) {
    return (
      <Card className='border-0 p-0'>
        <CardHeader className='pb-2 p-0'>
          <CardTitle className='text-xl font-semibold uppercase text-gray-900 mb-4 tracking-wide'>
            LIVE VIDEO MEETING
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-0'>
          <div className='relative aspect-video w-full overflow-hidden rounded-3xl bg-gray-100 flex items-center justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
            <p className='absolute mt-16'>Loading meeting room...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-0 p-0'>
      <CardHeader className='pb-2 p-0'>
        <CardTitle className='text-xl font-semibold uppercase text-gray-900 mb-4 tracking-wide'>
          LIVE VIDEO MEETING
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-0'>
        <div
          ref={containerRef}
          className='relative aspect-video w-full overflow-hidden rounded-3xl'
          style={{ minHeight: '500px' }}
        >
          {joinError && (
            <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 text-center'>
              <div className='max-w-md rounded-lg bg-white p-5 shadow-xl'>
                <h3 className='text-base font-semibold text-gray-900'>
                  Unable to Join Video Room
                </h3>
                <p className='mt-2 text-sm text-gray-700'>{joinError}</p>
              </div>
            </div>
          )}
          {/* Daily.co iframe will be inserted here */}
        </div>
      </CardContent>
    </Card>
  )
}

export default DailyPrebuiltMeeting
