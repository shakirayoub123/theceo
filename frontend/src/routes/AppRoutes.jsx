import { ChatScreen } from '@/components/ChatScreen'
import ProtectedRoute from '@/components/ProtectedRoute'
import { URLS } from '@/config/urls'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import MainLayout from '@/layouts/MainLayout'
import ForgetPassword from '@/pages/auth/ForgetPassword'
import Logout from '@/pages/auth/Logout'
import SignIn from '@/pages/auth/SignIn'
import UserProfile from '@/pages/auth/UserProfile'
import ClaireBiography from '@/pages/ClaireBiography'
import ClientCalndar from '@/pages/dashboard/clientDashboard/ClientCalendar'
import ClientDashboard from '@/pages/dashboard/clientDashboard/ClientDashboard'
import ClientMeeting from '@/pages/dashboard/clientDashboard/ClientMeeting'
import ClientServices from '@/pages/dashboard/clientDashboard/ClientServices'
import Products from '@/pages/dashboard/clientDashboard/Products'
import ProgramDetails from '@/pages/dashboard/clientDashboard/ProgramDetails'
import Programs from '@/pages/dashboard/clientDashboard/Programs'
import CoachingCalendar from '@/pages/dashboard/coaching/CoachingCalendar'
import CoachingClientDetails from '@/pages/dashboard/coaching/CoachingClientDetails'
import CoachingClients from '@/pages/dashboard/coaching/CoachingClients'
import CoachingDashboard from '@/pages/dashboard/coaching/CoachingDashboard'
import CoachingMeeting from '@/pages/dashboard/coaching/CoachingMeeting'
import AddBlog from '@/pages/dashboard/master/AddBlog'
import AddEbook from '@/pages/dashboard/master/AddEbook'
import AddNewsletter from '@/pages/dashboard/master/AddNewsletter'
import AddService from '@/pages/dashboard/master/AddService'
import Blogs from '@/pages/dashboard/master/Blogs'
import Ebooks from '@/pages/dashboard/master/Ebooks'
import MasterDashboard from '@/pages/dashboard/master/MasterDashboard'
import Newsletter from '@/pages/dashboard/master/Newsletter'
import Referrals from '@/pages/dashboard/master/Referrals'
import Series from '@/pages/dashboard/master/Series'
import ServiceDetails from '@/pages/dashboard/master/ServiceDetails'
import Services from '@/pages/dashboard/master/Services'
import UserDetail from '@/pages/dashboard/master/UserDetail'
import Users from '@/pages/dashboard/master/Users'
import ExisitingClients from '@/pages/dashboard/sales/ExisitingClients'
import NewClients from '@/pages/dashboard/sales/NewClients'
import PotentialLeads from '@/pages/dashboard/sales/PotentialLeads'
import SalesCalendar from '@/pages/dashboard/sales/SalesCalendar'
import SalesClientDetails from '@/pages/dashboard/sales/SalesClientDetails'
import SalesDashboard from '@/pages/dashboard/sales/SalesDashboard'
import { Route, Routes } from 'react-router-dom'
import Blog from '../pages/Blog'
import Cart from '../pages/Cart'
import CaseStudies from '../pages/CaseStudies'
import CaseStudyDetail from '../pages/CaseStudyDetail'
import Checkout from '../pages/Checkout'
import EbookDetail from '../pages/EbookDetail'
import EbookSeries from '../pages/EbookSeries'
import SalientFeatureDetail from '../pages/SalientFeatureDetail'
import GDPR from '../pages/GDPR'
import Home from '../pages/Home'
import ServiceDetail from '../pages/ServiceDetail'
import TermsAndConditions from '../pages/TermsAndConditions'
import JamesBiography from '../pages/JamesBiography'
import Sitemap from '../pages/Sitemap'

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/biography/james-armstrong' element={<JamesBiography />} />
        <Route path='/biography/claire-keogh' element={<ClaireBiography />} />
        <Route path='/blog/:slug' element={<Blog />} />
        <Route path='/ebook-detail/:id' element={<EbookDetail />} />
        <Route path='/ebook-series' element={<EbookSeries />} />
        <Route path='/ebook-series/:seriesId' element={<EbookSeries />} />
        <Route
          path='/salient-features/:slug'
          element={<SalientFeatureDetail />}
        />
        <Route path='/service/:id' element={<ServiceDetail />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/order-success' element={<Home />} />
        <Route path='/gdpr' element={<GDPR />} />
        <Route path='/terms-and-conditions' element={<TermsAndConditions />} />
        <Route path='/sitemap' element={<Sitemap />} />
        <Route path='/case-studies' element={<CaseStudies />} />
        <Route path='/case-studies/:id' element={<CaseStudyDetail />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path={URLS.login} element={<SignIn />} />
        {/* <Route path='/register' element={<SignUp />} /> */}
        <Route path={URLS.forgetPassword} element={<ForgetPassword />} />
      </Route>
      <Route path={URLS.logout} element={<Logout />} />
      <Route element={<DashboardLayout />}>
        <Route
          path={URLS.chat}
          element={
            <ProtectedRoute requireFullDashboardAccess>
              <ChatScreen />
            </ProtectedRoute>
          }
        />
        {/* Master/Admin Routes */}
        <Route
          path={URLS.master.overview}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <MasterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.clients}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.clientDetails}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.services}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.addService}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddService />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.editService}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddService />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.serviceDetails}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <ServiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.ebooks}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Ebooks />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.series}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Series />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.addEbook}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddEbook />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.editEbook}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddEbook />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.blogs}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Blogs />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.addBlog}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.editBlog}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.newsletters}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Newsletter />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.addNewsletter}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddNewsletter />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.editNewsletter}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AddNewsletter />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.master.referrals}
          element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <Referrals />
            </ProtectedRoute>
          }
        />

        {/* Sales Routes */}
        <Route
          path={URLS.sales.overview}
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.sales.newClients}
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <NewClients />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.sales.existingClients}
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <ExisitingClients />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.sales.potentialLeads}
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <PotentialLeads />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.sales.clientDetails}
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <SalesClientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.sales.calendar}
          element={
            <ProtectedRoute allowedRoles={['sales']}>
              <SalesCalendar />
            </ProtectedRoute>
          }
        />

        {/* Coaching Routes */}
        <Route
          path={URLS.coaching.overview}
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <CoachingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.coaching.clients}
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <CoachingClients />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.coaching.clientDetails}
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <CoachingClientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.coaching.calendar}
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <CoachingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path='/coaching/meeting/:meetingId'
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <CoachingMeeting />
            </ProtectedRoute>
          }
        />

        {/* Client Routes */}
        <Route
          path={URLS.client.dashboard}
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.client.calendar}
          element={
            <ProtectedRoute
              allowedRoles={['client']}
              requireFullDashboardAccess
            >
              <ClientCalndar />
            </ProtectedRoute>
          }
        />
        <Route
          path='/client/meeting/:meetingId'
          element={
            <ProtectedRoute allowedRoles={['client', 'sales']}>
              <ClientMeeting />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.client.products}
          element={
            <ProtectedRoute
              allowedRoles={['client']}
              requireFullDashboardAccess
            >
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.client.programs}
          element={
            <ProtectedRoute
              allowedRoles={['client']}
              requireFullDashboardAccess
            >
              <Programs />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.client.programDetails}
          element={
            <ProtectedRoute
              allowedRoles={['client']}
              requireFullDashboardAccess
            >
              <ProgramDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={URLS.client.services}
          element={
            <ProtectedRoute
              allowedRoles={['client']}
              requireFullDashboardAccess
            >
              <ClientServices />
            </ProtectedRoute>
          }
        />

        {/* Profile Route - Available to all authenticated users */}
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default AppRoutes
