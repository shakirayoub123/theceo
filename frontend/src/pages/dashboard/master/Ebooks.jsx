import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, BookOpen, ChevronRight, Layers, Plus, Search } from 'lucide-react'
import authService from '@/services/authService'
import masterAPIService from '@/services/masterAPIService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EbookPurchaseHistoryModal from '@/components/EbookPurchaseHistoryModal'
import { URLS } from '@/config/urls'
import toast from 'react-hot-toast'

const UNASSIGNED_ID = 'unassigned'

const ROMAN = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
const romanToInt = (value) => {
  const text = String(value || '').toUpperCase()
  if (!/^[IVXLCDM]+$/.test(text)) return null
  let total = 0
  for (let i = 0; i < text.length; i += 1) {
    const current = ROMAN[text[i]]
    const next = ROMAN[text[i + 1]] || 0
    total += current < next ? -current : current
  }
  return total
}

// "Series I" < "Series II" < "Series IX" < "Series X"; "Series 2" < "Series 10".
const seriesNumber = (name) => {
  const last = String(name || '').trim().split(/\s+/).pop()
  if (/^\d+$/.test(last)) return Number(last)
  return romanToInt(last)
}

const compareSeries = (a, b) => {
  const na = seriesNumber(a.name)
  const nb = seriesNumber(b.name)
  if (na !== null && nb !== null && na !== nb) return na - nb
  return String(a.name).localeCompare(String(b.name), undefined, { numeric: true })
}

// Natural title order so "eBook 2" comes before "eBook 10".
const compareEbooks = (a, b) =>
  String(a.title).localeCompare(String(b.title), undefined, {
    numeric: true,
    sensitivity: 'base',
  })

const formatDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? '-'
    : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Ebooks() {
  const [ebooksData, setEbooksData] = useState(null)
  const [seriesList, setSeriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedEbook, setSelectedEbook] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSeriesId = searchParams.get('series')

  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    const [ebooks, series] = await Promise.all([
      authService.getAdminEbooks(),
      masterAPIService.getSeries().catch((err) => {
        console.error('Failed to load series:', err)
        return { series: [] }
      }),
    ])
    setEbooksData(ebooks)
    setSeriesList(Array.isArray(series) ? series : series?.series || [])
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        await loadData()
      } catch (err) {
        setError('Failed to load ebooks data')
        console.error('Ebooks error:', err)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [loadData])

  const allEbooks = useMemo(() => ebooksData?.ebooks || [], [ebooksData])

  // Every series (including empty ones), plus a bucket for eBooks with no series.
  const seriesGroups = useMemo(() => {
    const groups = new Map()
    seriesList.forEach((series) => {
      groups.set(String(series.id), { id: String(series.id), name: series.name, ebooks: [] })
    })
    allEbooks.forEach((ebook) => {
      const key = ebook.seriesId ? String(ebook.seriesId) : UNASSIGNED_ID
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          name: key === UNASSIGNED_ID ? 'Not in a series' : ebook.seriesName || 'Series',
          ebooks: [],
        })
      }
      groups.get(key).ebooks.push(ebook)
    })

    const list = [...groups.values()].map((group) => ({
      ...group,
      ebooks: [...group.ebooks].sort(compareEbooks),
    }))
    const named = list.filter((g) => g.id !== UNASSIGNED_ID).sort(compareSeries)
    const unassigned = list.filter((g) => g.id === UNASSIGNED_ID && g.ebooks.length)
    return [...named, ...unassigned]
  }, [allEbooks, seriesList])

  const selectedSeries = selectedSeriesId
    ? seriesGroups.find((group) => group.id === selectedSeriesId) || null
    : null

  const openSeries = (seriesId) => {
    setSearch('')
    setSearchParams({ series: seriesId })
  }
  const backToSeries = () => {
    setSearch('')
    setSearchParams({})
  }

  const handleViewEbook = (ebook) => {
    setSelectedEbook(ebook)
    setShowHistoryModal(true)
  }

  const handleToggleStatus = async (ebook) => {
    try {
      await authService.toggleEbookStatus(ebook.id)
      await loadData()
      toast.success(
        ebook.status === 'ACTIVE' ? 'Ebook unpublished successfully!' : 'Ebook published successfully!',
      )
    } catch (err) {
      console.error('Failed to toggle ebook status:', err)
      toast.error('Failed to update ebook status.')
    }
  }

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
          <p className='text-lg font-semibold'>Error Loading Ebooks</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  const metricsData = [
    { title: 'TOTAL EBOOKS', value: ebooksData?.totalEbooks || allEbooks.length },
    { title: 'TOTAL EBOOKS SOLD', value: ebooksData?.totalEbooksSold || 0 },
    {
      title: 'ACTIVE EBOOKS',
      value: allEbooks.filter((ebook) => ebook.status === 'active').length,
    },
    { title: 'SERIES', value: seriesGroups.filter((g) => g.id !== UNASSIGNED_ID).length },
  ]

  const headerActions = (
    <div className='flex flex-wrap gap-2'>
      <Button
        variant='outline'
        className='flex items-center gap-2 rounded-lg border-2 border-[#F6B72D] uppercase'
        onClick={() => navigate(URLS.master.series)}
      >
        <Layers className='h-4 w-4' />
        Manage Series
      </Button>
      <Button
        className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
        onClick={() => navigate(URLS.master.addEbook)}
      >
        <Plus className='h-4 w-4' />
        Add Ebook
      </Button>
    </div>
  )

  const searchBox = (placeholder) => (
    <div className='relative w-full lg:w-[40%] bg-white'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
      <Input
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
      />
    </div>
  )

  // ---------- Level 2: eBooks in one series ----------
  if (selectedSeriesId) {
    if (!selectedSeries) {
      return (
        <div className='space-y-4'>
          <button
            type='button'
            onClick={backToSeries}
            className='inline-flex items-center gap-2 text-sm font-semibold text-[#1a2332] hover:text-[#F6B72D]'
          >
            <ArrowLeft className='h-4 w-4' /> All eBook Series
          </button>
          <p className='text-gray-600 font-exo'>This series could not be found.</p>
        </div>
      )
    }

    const tableData = selectedSeries.ebooks.map((ebook, idx) => ({
      id: ebook.id,
      number: `${idx + 1}`,
      title: ebook.title,
      price: `$${ebook.price}`,
      status: String(ebook.status || '').toUpperCase(),
      total_sold: ebook.totalSold ?? ebook.total_sold ?? 0,
      created_at: formatDate(ebook.created_at),
    }))

    return (
      <div>
        <button
          type='button'
          onClick={backToSeries}
          className='mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1a2332] hover:text-[#F6B72D]'
        >
          <ArrowLeft className='h-4 w-4' /> All eBook Series
        </button>
        <h2 className='text-xl font-semibold uppercase text-gray-900 mb-1 tracking-wide'>
          {selectedSeries.name}
        </h2>
        <p className='text-sm text-gray-600 mb-6 font-exo'>
          {selectedSeries.ebooks.length
            ? `${selectedSeries.name} - eBooks 1-${selectedSeries.ebooks.length}`
            : 'No eBooks in this series yet.'}
        </p>

        <div className='flex flex-wrap justify-between items-center my-2 gap-2'>
          {searchBox(`Search ${selectedSeries.name}...`)}
          {headerActions}
        </div>

        <DataTable
          data={tableData}
          columns={[
            { key: 'number', label: 'eBook #' },
            { key: 'title', label: 'Title' },
            { key: 'price', label: 'Price' },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}
                >
                  {row.status}
                </span>
              ),
            },
            { key: 'total_sold', label: 'Total Sold' },
            { key: 'created_at', label: 'Created At' },
          ]}
          actions={[
            { label: 'View', onClick: handleViewEbook },
            {
              label: 'Edit',
              onClick: (ebook) => navigate(`/admin-dashboard/edit-ebook/${ebook.id}`),
            },
            {
              label: (row) => (row.status === 'ACTIVE' ? 'Unpublish' : 'Publish'),
              onClick: handleToggleStatus,
            },
          ]}
          search={search}
        />

        {showHistoryModal && selectedEbook && (
          <EbookPurchaseHistoryModal
            ebook={selectedEbook}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedEbook(null)
            }}
          />
        )}
      </div>
    )
  }

  // ---------- Level 1: list of series ----------
  const term = search.trim().toLowerCase()
  const visibleGroups = term
    ? seriesGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(term) ||
        group.ebooks.some((ebook) => String(ebook.title).toLowerCase().includes(term)),
    )
    : seriesGroups

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        eBooks
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
        {metricsData.map((metric) => (
          <MetricCard key={metric.title} title={metric.title} value={metric.value} />
        ))}
      </div>

      <div className='flex flex-wrap justify-between items-center my-2 gap-2 mb-4'>
        {searchBox('Search series or eBook titles...')}
        {headerActions}
      </div>

      {visibleGroups.length ? (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {visibleGroups.map((group) => {
            const active = group.ebooks.filter((e) => e.status === 'active').length
            const sold = group.ebooks.reduce(
              (sum, e) => sum + Number(e.totalSold ?? e.total_sold ?? 0),
              0,
            )
            const matching = term
              ? group.ebooks.filter((e) => String(e.title).toLowerCase().includes(term))
              : []
            return (
              <button
                key={group.id}
                type='button'
                onClick={() => openSeries(group.id)}
                className={`group text-left bg-white border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${group.id === UNASSIGNED_ID
                  ? 'border-gray-300'
                  : 'border-[#F6B72D] hover:bg-[#F6B72D]/5'
                  }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='p-2 rounded-lg bg-[#F6B72D]/15 text-[#1a2332] shrink-0'>
                      <BookOpen className='h-5 w-5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-lg font-extrabold text-gray-900 truncate'>{group.name}</p>
                      <p className='text-sm text-gray-600 font-exo'>
                        {group.ebooks.length
                          ? `eBooks 1-${group.ebooks.length}`
                          : 'No eBooks yet'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400 group-hover:text-[#F6B72D] shrink-0' />
                </div>
                <div className='mt-4 flex gap-4 text-xs text-gray-600 font-exo'>
                  <span>
                    <strong className='text-gray-900'>{active}</strong> active
                  </span>
                  <span>
                    <strong className='text-gray-900'>{sold}</strong> sold
                  </span>
                </div>
                {matching.length > 0 && (
                  <p className='mt-2 text-xs text-[#1a2332] truncate'>
                    Matches: {matching.map((e) => e.title).join(', ')}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className='bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-600 font-exo'>
          {term ? (
            'No series or eBooks match your search.'
          ) : (
            <>
              No eBook series yet. Use <strong>Manage Series</strong> to create Series I, Series
              II and Series III, then assign eBooks to them when adding or editing an eBook.
            </>
          )}
        </div>
      )}
    </div>
  )
}
