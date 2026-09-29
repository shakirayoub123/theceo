import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Search, Edit, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import masterAPIService from '@/services/masterAPIService'

export default function Series() {
  const [seriesData, setSeriesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState(null)
  const [newSeriesName, setNewSeriesName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addSeriesName, setAddSeriesName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    try {
      setLoading(true)
      const data = await masterAPIService.getSeries()
      // Handle both direct array response and {series: [...]} response
      setSeriesData(Array.isArray(data) ? data : data.series || [])
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load series')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSeries = (series) => {
    setEditingSeries(series)
    setNewSeriesName(series.name)
    setIsEditModalOpen(true)
  }

  const handleUpdateSeries = async () => {
    if (!newSeriesName.trim()) {
      toast.error('Series name cannot be empty')
      return
    }

    try {
      setUpdating(true)
      await masterAPIService.updateSeries(editingSeries.id, {
        name: newSeriesName,
      })

      // Update local state
      setSeriesData((prev) =>
        prev.map((series) =>
          series.id === editingSeries.id
            ? { ...series, name: newSeriesName }
            : series,
        ),
      )

      toast.success('Series updated successfully!')
      setIsEditModalOpen(false)
      setEditingSeries(null)
      setNewSeriesName('')
    } catch (err) {
      toast.error('Failed to update series: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddSeries = async () => {
    if (!addSeriesName.trim()) {
      toast.error('Series name cannot be empty')
      return
    }

    try {
      setCreating(true)
      const newSeries = await masterAPIService.createSeries({
        name: addSeriesName,
      })

      // Add to local state
      setSeriesData((prev) => [...prev, newSeries])
      toast.success('Series created successfully!')
      setIsAddModalOpen(false)
      setAddSeriesName('')
    } catch (err) {
      toast.error('Failed to create series: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'ebooks',
      label: 'Ebooks',
      render: (row) => (Array.isArray(row.ebooks) ? row.ebooks.length : 0),
    },
    {
      key: 'createdOn',
      label: 'Created On',
      render: (row) => {
        if (!row.createdOn) return 'N/A'
        try {
          return new Date(row.createdOn).toLocaleDateString()
        } catch {
          return row.createdOn
        }
      },
    },
  ]

  const actions = [
    {
      label: 'Edit',
      onClick: (row) => handleEditSeries(row),
    },
  ]

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
        Error loading series: {error}
      </div>
    )
  }

  const metricsData = [{ title: 'TOTAL SERIES', value: seriesData.length }]

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Series
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
              placeholder='Search series...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
          >
            <Plus className='w-4 h-4' />
            Add Series
          </Button>
        </div>

        <DataTable
          data={seriesData}
          columns={columns}
          actions={actions}
          search={search}
        />
      </div>

      {/* Edit Series Modal */}
      {isEditModalOpen && (
        <>
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-40'
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-96 p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Edit Series</h3>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsEditModalOpen(false)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='font-exo block text-sm font-medium mb-2'>
                  Series Name
                </label>
                <input
                  type='text'
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  className='font-exo w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent'
                  placeholder='Enter series name'
                />
              </div>

              <div className='flex gap-3'>
                <Button
                  onClick={handleUpdateSeries}
                  disabled={!newSeriesName.trim() || updating}
                  className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
                >
                  {updating ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className='h-4 w-4 mr-2' />
                      Update
                    </>
                  )}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setIsEditModalOpen(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Series Modal */}
      {isAddModalOpen && (
        <>
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-40'
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-96 p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Add New Series</h3>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsAddModalOpen(false)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2 font-exo'>
                  Series Name
                </label>
                <input
                  type='text'
                  value={addSeriesName}
                  onChange={(e) => setAddSeriesName(e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent font-exo'
                  placeholder='Enter series name'
                />
              </div>

              <div className='flex gap-3'>
                <Button
                  onClick={handleAddSeries}
                  disabled={!addSeriesName.trim() || creating}
                  className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
                >
                  {creating ? (
                    <>
                      <div className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4 mr-2' />
                      Create
                    </>
                  )}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setIsAddModalOpen(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
