import React from 'react'
import DailyPrebuiltMeeting from './DailyPrebuiltMeeting'

// This is a simple test component to verify the DailyPrebuiltMeeting component works
const DailyPrebuiltMeetingTest = () => {
  const testRoomUrl = 'https://your-domain.daily.co/test-room'
  const testToken = 'your-test-token'

  return (
    <div>
      <h1>DailyPrebuiltMeeting Test</h1>
      <div style={{ height: '600px', width: '800px' }}>
        <DailyPrebuiltMeeting roomUrl={testRoomUrl} token={testToken} />
      </div>
    </div>
  )
}

export default DailyPrebuiltMeetingTest
