import { CalendarComponent } from '@/components/CalendarComponent'
import { useState, useEffect, useCallback, useRef } from 'react'
import authService from '@/services/authService'
import { Calendar as CalendarIcon, Users, Clock, ShieldCheck } from 'lucide-react'

export default function MasterCalendar() {
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(new Date())
  const hasLoadedCalendarOnce = useRef(false)

  const fetchCalendarData = useCallback(async () => {
    try {
      if (!hasLoadedCalendarOnce.current) {
        setLoading(true)
      }
      const data = await authService.getAdminCalendar({
        year: visibleMonth.getFullYear(),
        month: visibleMonth.getMonth() + 1,
      })
      console.log('Master Calendar Data:', data)
      setCalendarData(data)
      hasLoadedCalendarOnce.current = true
    } catch (err) {
      setError('Failed to load master calendar data')
      console.error('Master calendar error:', err)
    } finally {
      setLoading(false)
    }
  }, [visibleMonth])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  if (loading && !hasLoadedCalendarOnce.current) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error && !calendarData) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Master Calendar</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header Banner */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 rounded-2xl text-white shadow-md'>
        <div>
          <div className='flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1'>
            <ShieldCheck className='w-4 h-4' />
            <span>Executive Staff Administration</span>
          </div>
          <h1 className='text-2xl md:text-3xl font-bold font-exo'>
            Organization Master Calendar
          </h1>
          <p className='text-gray-300 text-sm mt-1 max-w-2xl'>
            Unified view of all appointments across Sales (Yellow), Coaching (Green), and Administration (Red).
            Hover over any meeting to view client, program, and call details.
          </p>
        </div>

        {/* Quick legend highlight */}
        <div className='flex items-center gap-3 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium'>
          <div className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-[#F6B72D]' />
            <span>Sales</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-emerald-500' />
            <span>Coaching</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-red-500' />
            <span>Admin</span>
          </div>
        </div>
      </div>

      {/* Main Master Calendar */}
      <CalendarComponent
        meetings={calendarData}
        onMonthChange={(date) => setVisibleMonth(date)}
        title='Master Schedule'
        showRoleLegend={true}
        allowRoleFilter={true}
      />
    </div>
  )
}

