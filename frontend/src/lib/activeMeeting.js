// Tracks whether a video call is in progress, so the rest of the app can avoid
// ending it by accident (idle/hidden-tab logout, navigating away, closing a
// document tab).
//
// - inThisTab: this tab is currently in a call.
// - heartbeat in localStorage: some tab is in a call (other tabs, e.g. a
//   document opened in a new tab, must not log the user out on close).

const STORAGE_KEY = 'tci_active_meeting_heartbeat'
const HEARTBEAT_MS = 10 * 1000
const STALE_AFTER_MS = 35 * 1000
export const MEETING_CHANGE_EVENT = 'tci-meeting-change'

let inThisTab = false
let heartbeatTimer = null

const writeHeartbeat = () => {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {
    // storage unavailable: in-tab flag still works
  }
}

const notify = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MEETING_CHANGE_EVENT, { detail: { inThisTab } }))
  }
}

export const startMeetingPresence = () => {
  inThisTab = true
  writeHeartbeat()
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(writeHeartbeat, HEARTBEAT_MS)
  notify()
}

export const stopMeetingPresence = () => {
  if (!inThisTab && !heartbeatTimer) return
  inThisTab = false
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  notify()
}

/** True while this tab is in a video call. */
export const isInMeetingThisTab = () => inThisTab

/** True while any tab of this browser is in a video call. */
export const isMeetingActiveAnywhere = () => {
  if (inThisTab) return true
  try {
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0)
    return Boolean(last) && Date.now() - last < STALE_AFTER_MS
  } catch {
    return false
  }
}

const LEAVE_MESSAGE =
  'You are in a video meeting. Leaving this page will end your call.\n\nLeave the meeting?'

/** Ask before in-app navigation would end the call in this tab. */
export const confirmLeaveMeeting = () => !inThisTab || window.confirm(LEAVE_MESSAGE)
