import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import authService from '@/services/authService'

const EbookPurchaseHistoryModal = ({ ebook, onClose }) => {
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      try {
        setLoading(true)
        const data = await authService.getEbookPurchaseHistory(ebook.id)
        setHistoryData(data)
      } catch (err) {
        setError('Failed to load purchase history')
        console.error('Purchase history error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (ebook?.id) {
      fetchPurchaseHistory()
    }
  }, [ebook])

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white p-6 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-center min-h-[200px]'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white p-6 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-center min-h-[200px]'>
            <div className='text-red-600 text-center'>
              <p className='text-lg font-semibold'>
                Error Loading Purchase History
              </p>
              <p className='text-sm'>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare purchase history data for the table
  const purchaseHistoryData =
    historyData?.purchase_history?.map((purchase, index) => ({
      id: index + 1,
      clientName: purchase.clientName,
      clientEmail: purchase.clientEmail,
      purchaseDate: new Date(purchase.purchaseDate).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      ),
      pricePaid: `$${purchase.pricePaid}`,
    })) || []

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h3 className='text-xl font-bold text-gray-900'>
            Purchase History - {historyData?.ebook_title || ebook?.title}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Summary */}
          <div className='mb-6'>
            <div className='bg-gray-50 rounded-lg p-4'>
              <div className='text-sm text-gray-600'>
                <span className='font-medium'>Total Purchases:</span>{' '}
                {historyData?.total_purchases || 0}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className='mb-4'>
            <div className='relative w-full lg:w-[40%]'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search purchases...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
              />
            </div>
          </div>

          {/* Purchase History Table */}
          <div className='overflow-y-auto max-h-[400px]'>
            <DataTable
              data={purchaseHistoryData}
              columns={[
                { key: 'clientName', label: 'Client Name' },
                { key: 'clientEmail', label: 'Email' },
                { key: 'purchaseDate', label: 'Purchase Date' },
                { key: 'pricePaid', label: 'Price Paid' },
              ]}
              search={search}
              showActions={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EbookPurchaseHistoryModal
