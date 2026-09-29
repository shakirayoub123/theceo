import { ChatScreen } from '@/components/ChatScreen'

export default function ClientChat() {
  const handleScheduleMeeting = (contact) => {
    console.log('Scheduling meeting with:', contact?.name || 'Unknown contact')
    // Implement meeting scheduling flow here (modal, redirect, etc.)
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-4 tracking-wide'>
        Chat
      </h2>
      <ChatScreen onScheduleMeeting={handleScheduleMeeting} />
    </div>
  )
}
