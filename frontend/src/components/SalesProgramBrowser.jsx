import { useEffect, useState } from 'react'
import authService from '@/services/authService'
import LearningMaterialsRail from '@/components/LearningMaterialsRail'

/**
 * Same Programs + Learning Sessions view as the sales dashboard, for use inside
 * a sales video call: pick Program 1-9 on the right, see its learning sessions
 * (key selling points, PDFs, toolkits) on the left. Files open in a new tab, so
 * the call keeps running.
 */
export default function SalesProgramBrowser({ className = '' }) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    let cancelled = false
    authService
      .getSalesAllPrograms()
      .then((response) => {
        if (cancelled) return
        const list = (response?.programs || []).slice().sort((a, b) => {
          const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
          const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
          return ao - bo || String(a.title).localeCompare(String(b.title))
        })
        setPrograms(list)
        setActiveId(list[0]?.id ?? null)
      })
      .catch((err) => {
        console.error('Failed to load programs:', err)
        if (!cancelled) setError('Could not load programs.')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const active = programs.find((p) => String(p.id) === String(activeId)) || null

  return (
    <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${className}`}>
      <div className='md:col-span-3 min-w-0'>
        <LearningMaterialsRail
          programId={active?.id}
          programName={active?.title}
          title='Program Content'
          className='h-[520px]'
        />
      </div>

      <div className='md:col-span-2 bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm flex flex-col overflow-hidden h-[520px]'>
        <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
          <span className='text-sm font-extrabold uppercase tracking-wide text-black'>Programs</span>
          <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
            {programs.length}
          </span>
        </div>
        <div className='flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100'>
          {loading ? (
            <p className='px-4 py-6 text-sm text-gray-500'>Loading programs…</p>
          ) : error ? (
            <p className='px-4 py-6 text-sm text-red-600'>{error}</p>
          ) : programs.length === 0 ? (
            <p className='px-4 py-6 text-sm text-gray-500'>No programs available yet.</p>
          ) : (
            programs.map((program, idx) => {
              const isActive = String(program.id) === String(activeId)
              return (
                <button
                  key={program.id}
                  type='button'
                  onClick={() => setActiveId(program.id)}
                  className={`block w-full text-left px-4 py-3 transition-colors ${isActive
                    ? 'bg-[#F6B72D]/15 border-l-4 border-[#F6B72D]'
                    : 'hover:bg-[#F6B72D]/10'
                    }`}
                >
                  <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                    Program {idx + 1}
                  </p>
                  <p className='text-sm font-semibold text-gray-900'>{program.title}</p>
                  {program.price != null && Number(program.price) > 0 && (
                    <p className='text-xs text-gray-500'>
                      ${Number(program.price).toLocaleString('en-US')}
                    </p>
                  )}
                </button>
              )
            })
          )}
          {!loading && !error && programs.length < 10 && (
            <div className='px-4 py-3 bg-gray-50 cursor-default select-none' title='This program is not available yet'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-400'>Program 10</p>
              <p className='text-sm font-extrabold uppercase tracking-wide text-gray-500'>Coming Soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
