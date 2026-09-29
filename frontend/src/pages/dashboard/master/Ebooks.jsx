import { useState, useEffect } from 'react'
import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import authService from '@/services/authService'
import { useNavigate } from 'react-router-dom'
import EbookPurchaseHistoryModal from '@/components/EbookPurchaseHistoryModal'
import toast from 'react-hot-toast'

export default function Ebooks() {
  const [ebooksData, setEbooksData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedEbook, setSelectedEbook] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchEbooksData = async () => {
      try {
        setLoading(true)
        const data = await authService.getAdminEbooks()
        setEbooksData(data)
      } catch (err) {
        setError('Failed to load ebooks data')
        console.error('Ebooks error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEbooksData()
  }, [])

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

  // Prepare metrics data from API response
  const metricsData = [
    {
      title: 'TOTAL EBOOKS',
      value: ebooksData?.totalEbooks || 0,
    },
    {
      title: 'TOTAL EBOOKS SOLD',
      value: ebooksData?.totalEbooksSold || 0,
    },
    {
      title: 'ACTIVE EBOOKS',
      value:
        ebooksData?.ebooks?.filter((ebook) => ebook.status === 'active')
          .length || 0,
    },
  ]

  const ebooksTableData =
    ebooksData?.ebooks?.map((ebook) => ({
      id: ebook.id,
      title: ebook.title,
      price: `$${ebook.price}`,
      status: ebook.status.toUpperCase(),
      total_sold: ebook.total_sold || 0,
      created_at:
        new Date(ebook.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) || [],
    })) || []

  const handleViewEbook = (ebook) => {
    setSelectedEbook(ebook)
    setShowHistoryModal(true)
  }

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false)
    setSelectedEbook(null)
  }

  const handleAddEbook = () => {
    navigate('/admin-dashboard/add-ebook')
  }

  const handleEditEbook = (ebook) => {
    navigate(`/admin-dashboard/edit-ebook/${ebook.id}`)
  }

  const handleToggleStatus = async (ebook) => {
    try {
      await authService.toggleEbookStatus(ebook.id)
      // Refresh the data after toggling status
      const data = await authService.getAdminEbooks()
      setEbooksData(data)
      toast.success(ebook.status === 'ACTIVE' ? 'Ebook unpublished successfully!' : 'Ebook published successfully!')
    } catch (err) {
      console.error('Failed to toggle ebook status:', err)
      toast.error('Failed to update ebook status.')
    }
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Ebooks Management
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8'>
        {metricsData.map((metric, index) => (
          <MetricCard key={index} title={metric.title} value={metric.value} />
        ))}
      </div>

      <div>
        <div className='flex justify-between align-center my-2 gap-2'>
          <div className='relative w-full lg:w-[40%] bg-white'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
            <Input
              placeholder='Search ebooks...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
          <div>
            <Button
              className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
              onClick={handleAddEbook}
            >
              <Plus className='h-4 w-4' />
              Add Ebook
            </Button>
          </div>
        </div>

        <DataTable
          title='Ebooks'
          data={ebooksTableData}
          columns={[
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
            {
              label: 'View',
              onClick: handleViewEbook,
            },
            {
              label: 'Edit',
              onClick: handleEditEbook,
            },
            {
              label: (row) => row.status === 'ACTIVE' ? 'Unpublish' : 'Publish',
              onClick: handleToggleStatus,
            },
          ]}
          search={search}
        />
      </div>

      {/* Purchase History Modal */}
      {showHistoryModal && selectedEbook && (
        <EbookPurchaseHistoryModal
          ebook={selectedEbook}
          onClose={handleCloseHistoryModal}
        />
      )}
    </div>
  )
}
