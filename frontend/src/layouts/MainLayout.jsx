import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
// import PublicAIChatbot from '../components/PublicAIChatbot'
import PublicContactFormPopup from '../components/PublicContactFormPopup'
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className='min-h-screen'>
      <Header />
      <main>
        {' '}
        <Outlet />
      </main>
      <Footer />
      {/* <PublicAIChatbot /> */}
      <PublicContactFormPopup />
    </div>
  )
}

export default MainLayout
