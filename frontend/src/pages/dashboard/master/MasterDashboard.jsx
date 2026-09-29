import { useState, useEffect } from 'react'
import { MetricCard } from '@/components/MetricCard'
import authService from '@/services/authService'
import { Link } from 'react-router-dom'
import { URLS } from '@/config/urls'
import { FilePenLine, LaptopMinimal, Newspaper, Users } from 'lucide-react'

const MasterDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const mergeAdminCalendarMonths = (...calendarResponses) => {
    const meetingsByDate = new Map()

    calendarResponses.forEach((response) => {
      const monthlyMeetings = Array.isArray(response?.meetings)
        ? response.meetings
        : []
      monthlyMeetings.forEach((day) => {
        if (!day?.date) return
        const dayMeetings = Array.isArray(day.meetings) ? day.meetings : []
        const existing = meetingsByDate.get(day.date) || []
        meetingsByDate.set(day.date, [...existing, ...dayMeetings])
      })
    })

    return {
      meetings: Array.from(meetingsByDate.entries()).map(
        ([date, meetings]) => ({
          date,
          meetings,
        }),
      ),
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const [data, calendarThisMonth, calendarNextMonth] = await Promise.all([
          authService.getAdminDashboard(),
          authService.getAdminCalendar({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
          authService.getAdminCalendar({
            year: nextMonth.getFullYear(),
            month: nextMonth.getMonth() + 1,
          }),
        ])
        const mergedCalendar = mergeAdminCalendarMonths(
          calendarThisMonth,
          calendarNextMonth,
        )
        setDashboardData(data)
        const meetingsList = extractUpcomingMeetings(mergedCalendar)
        setUpcomingMeetings(meetingsList)
        setCurrentPage(1)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const extractUpcomingMeetings = (calendarData) => {
    const calendarMeetings = Array.isArray(calendarData?.meetings)
      ? calendarData.meetings
      : []
    if (calendarMeetings.length === 0) return []

    const flattened = calendarMeetings.flatMap((day) =>
      (day.meetings || []).map((meeting) => ({
        ...meeting,
        date: day.date,
        dateTime: meeting.scheduled_at
          ? new Date(meeting.scheduled_at)
          : new Date(day.date),
      })),
    )

    return flattened
      .filter((meeting) => meeting.dateTime)
      .sort((a, b) => b.dateTime - a.dateTime)
  }

  const totalPages = Math.max(1, Math.ceil(upcomingMeetings.length / 8))
  const paginatedMeetings = upcomingMeetings.slice(
    (currentPage - 1) * 8,
    currentPage * 8,
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Dashboard</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  // Prepare metrics data from API response
  const metricsData = [
    {
      title: 'TOTAL CLIENTS',
      value: dashboardData?.totalClients || 0,
    },
    {
      title: 'ACTIVE CLIENTS',
      value: dashboardData?.activeClients || 0,
    },
    {
      title: 'CLIENTS AWAITING PURCHASE',
      value: dashboardData?.clientsAwaitingPurchase || 0,
    },
    {
      title: 'TOTAL USERS VIA REFERRALS',
      value: dashboardData?.totalUsersViaReferrals || 0,
    },
    {
      title: 'TOTAL EBOOKS SOLD',
      value: dashboardData?.totalEbooksSold || 0,
    },
    {
      title: 'TOTAL BLOGS VIEWS',
      value: dashboardData?.totalBlogsViews || 0,
    },
    {
      title: 'TOTAL NEWSLETTERS VIEWS',
      value: dashboardData?.totalNewslettersViews || 0,
    },
    {
      title: 'TOTAL SERVICES',
      value: dashboardData?.totalServices || 0,
    },
    {
      title: 'ACTIVE SERVICES',
      value: dashboardData?.activeServices || 0,
    },
    {
      title: 'ARCHIVED SERVICES',
      value: dashboardData?.archivedServices || 0,
    },
    {
      title: 'PRODUCTS REVENUE',
      value: `$${dashboardData?.productsRevenue || 0}`,
    },
    {
      title: 'SERVICES REVENUE',
      value: `$${dashboardData?.servicesRevenue || 0}`,
    },
  ]

  return (
    <div className='max-w-7xl mx-auto space-y-8'>
      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex-1 min-w-[220px]'>
            <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D] font-semibold'>
              The CEO Influencers • Building Better Leaders
            </p>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900'>
              Admin Dashboard
            </h1>
            <p className='text-lg font-exo text-gray-600'>
              Track platform performance, users, and operations in one view.
            </p>
          </div>
          <div className='w-full sm:w-auto self-center'>
            <div className='bg-[#0f172a] text-white rounded-lg px-4 py-3 text-sm sm:text-base font-semibold space-y-1'>
              <p className='text-sm sm:text-base font-semibold'>
                Total Clients: {dashboardData?.totalClients || 0}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Active Services: {dashboardData?.activeServices || 0}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Upcoming Meetings: {upcomingMeetings.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {metricsData.map((metric, index) => (
          <MetricCard key={index} title={metric.title} value={metric.value} />
        ))}
      </div>

      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-extrabold text-gray-900'>
            Upcoming Meetings
          </h3>
          <span className='text-sm text-gray-600'>
            Overview of upcoming sessions
          </span>
        </div>
        {upcomingMeetings.length === 0 ? (
          <p className='text-sm text-gray-600'>
            No upcoming meetings scheduled. Check back soon.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 text-xs sm:text-sm'>
              <thead className='bg-[#F6B72D]'>
                <tr>
                  <th className='px-4 py-2 text-left font-semibold text-black'>
                    Date
                  </th>
                  <th className='px-4 py-2 text-left font-semibold text-black'>
                    Time
                  </th>
                  <th className='px-4 py-2 text-left font-semibold text-black'>
                    Title
                  </th>
                  <th className='px-4 py-2 text-left font-semibold text-black'>
                    Type
                  </th>
                  <th className='px-4 py-2 text-left font-semibold text-black'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 font-exo'>
                {paginatedMeetings.map((meeting, index) => (
                  <tr key={`${meeting.date}-${meeting.id || index}`}>
                    <td className='px-4 py-2 text-gray-900 font-medium'>
                      {new Date(meeting.date).toLocaleDateString()}
                    </td>
                    <td className='px-4 py-2 text-gray-700'>
                      {meeting.time_display || 'TBD'}
                    </td>
                    <td className='px-4 py-2 text-gray-900'>
                      {meeting.title || 'Scheduled Meeting'}
                    </td>
                    <td className='px-4 py-2 text-gray-700'>
                      {meeting.meeting_type || '—'}
                    </td>
                    <td className='px-4 py-2 text-gray-700'>
                      {meeting.status || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className='flex items-center justify-end gap-3 mt-4 text-sm'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Previous
              </button>
              <span className='text-gray-700'>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className='px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Link
          to={URLS.master.clients}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Users
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Manage Clients
            </p>
          </div>
          <Users className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.master.services}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Programs
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Manage Services
            </p>
          </div>
          <LaptopMinimal className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.master.blogs}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Content
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Manage Blogs
            </p>
          </div>
          <FilePenLine className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.master.newsletters}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Comms
            </p>
            <p className='text-base font-semibold text-gray-900'>Newsletters</p>
          </div>
          <Newspaper className='w-6 h-6 text-[#1a2332]' />
        </Link>
      </div>
    </div>
  )
}

export default MasterDashboard
