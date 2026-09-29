import AppRoutes from './routes/AppRoutes'
import ScrollToTop from './components/common/ScrollToTop'
import SessionGuard from './components/SessionGuard'
import { Toaster } from 'react-hot-toast'
import UnderConstruction from './pages/UnderConstruction'

function App() {
  const isUnderConstruction =
    String(import.meta.env.VITE_UNDER_CONSTRUCTION || '').toLowerCase() ===
    'true'

  if (isUnderConstruction) {
    return <UnderConstruction />
  }

  return (
    <>
      <ScrollToTop />
      <SessionGuard />
      <AppRoutes />
      <Toaster position='top-right' />
    </>
  )
}

export default App
