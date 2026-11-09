import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import WebsiteQuestionChatbot from '../components/WebsiteQuestionChatbot'
import PublicContactFormPopup from '../components/PublicContactFormPopup'
import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import chatbotService from '@/services/chatbotService'

const MainLayout = () => {
  const [chatbotEnabled, setChatbotEnabled] = useState(null)

  useEffect(() => {
    let active = true
    chatbotService
      .getPublicSiteSettings()
      .then((settings) => {
        if (active) setChatbotEnabled(settings.chatbot_enabled !== false)
      })
      .catch(() => {
        if (active) setChatbotEnabled(true)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className='min-h-screen'>
      <Header />
      <main>
        {' '}
        <Outlet />
      </main>
      <Footer />
      {chatbotEnabled && <WebsiteQuestionChatbot />}
      <PublicContactFormPopup />
    </div>
  )
}

export default MainLayout
