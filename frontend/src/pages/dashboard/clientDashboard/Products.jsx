import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import clientAPIService from '@/services/clientAPIService'
import { getAssetUrl } from '@/lib/utils'

export default function Products() {
  const [ebooksData, setEbooksData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        setLoading(true)
        const data = await clientAPIService.getClientEbooks()
        setEbooksData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEbooks()
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center text-red-500 p-4'>
        Error loading ebooks: {error}
      </div>
    )
  }

  const metricsData = [
    { title: 'TOTAL EBOOKS PURCHASED', value: ebooksData?.count || 0 },
  ]

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div className='flex items-center space-x-3'>
          <img
            src={getAssetUrl(row.coverImage)}
            alt={row.title}
            className='w-12 h-16 object-cover rounded'
          />
          <div>
            <div className='font-medium'>{row.title}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'topic',
      label: 'Topic',
    },
    {
      key: 'series',
      label: 'Series',
      render: (row) => (row.series ? row.series.title : 'N/A'),
    },
    {
      key: 'pages',
      label: 'Pages',
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => `$${row.price}`,
    },
    {
      key: 'totalSold',
      label: 'Total Sold',
    },
    {
      key: 'isPurchased',
      label: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.isPurchased
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {row.isPurchased ? 'Purchased' : 'Available'}
        </span>
      ),
    },
  ]

  const actions = [
    {
      label: 'Download',
      onClick: (row) => {
        // Handle download action - trigger ebook download
        if (row.isPurchased && row.file) {
          // Create a temporary anchor element to trigger download
          const link = document.createElement('a')
          link.href = row.file
          link.download = row.fileName || `${row.title}.pdf`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      },
      condition: (row) => row.isPurchased, // Only show download if purchased
    },
  ]

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Products
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8'>
        {metricsData.map((metric, index) => (
          <MetricCard key={index} title={metric.title} value={metric.value} />
        ))}
      </div>
      <div>
        <div className='relative max-w-full lg:max-w-[40%] my-2 bg-white'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
          <Input
            placeholder='Search ebooks...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
          />
        </div>
        <DataTable
          data={ebooksData?.ebooks || []}
          columns={columns}
          actions={actions}
          search={search}
        />
      </div>
    </div>
  )
}
