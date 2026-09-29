import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import authService from '@/services/authService'
import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Newsletter() {
  const [newslettersData, setNewslettersData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const fetchNewslettersData = async () => {
      try {
        setLoading(true)
        const data = await authService.getAdminNewsletters()
        setNewslettersData(data)
      } catch (err) {
        setError('Failed to load newsletters data')
        console.error('Newsletters error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNewslettersData()
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
          <p className='text-lg font-semibold'>Error Loading Newsletters</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  // Prepare metrics data from API response
  const metricsData = [
    {
      title: 'TOTAL NEWSLETTERS',
      value: newslettersData?.totalNewsletters || 0,
    },
    {
      title: 'TOTAL NEWSLETTERS VIEWS',
      value: newslettersData?.totalViews || 0,
    },
    {
      title: 'PUBLISHED NEWSLETTERS',
      value:
        newslettersData?.newsletters?.filter(
          (newsletter) => newsletter.status === 'published',
        ).length || 0,
    },
  ]

  // Prepare newsletters data for the table
  const newslettersTableData =
    newslettersData?.newsletters?.map((newsletter) => ({
      id: newsletter.uuid,
      title: newsletter.name,
      status: newsletter.status.toUpperCase(),
      published_at: newsletter.uploadedOn
        ? new Date(newsletter.uploadedOn).toLocaleDateString()
        : 'Not published',
    })) || []

  // Filter newsletters based on search
  const filteredNewsletters = newslettersTableData.filter((newsletter) =>
    newsletter?.title?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleViewNewsletter = (newsletter) => {
    console.log('View newsletter:', newsletter)
    // TODO: Open newsletter details modal or navigate to newsletter detail page
  }

  const handleEditNewsletter = (newsletter) => {
    navigate(`/admin-dashboard/newsletters/edit-newsletter/${newsletter.id}`)
  }

  const handleAddNewsletter = () => {
    navigate('/admin-dashboard/newsletters/add-newsletter')
  }

  const handleToggleStatus = async (newsletter) => {
    try {
      await authService.toggleNewsletterStatus(newsletter.id)
      // Refresh the newsletters data after toggling status
      const data = await authService.getAdminNewsletters()
      setNewslettersData(data)
    } catch (err) {
      console.error('Failed to toggle newsletter status:', err)
      setError('Failed to toggle newsletter status')
    }
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Newsletters Management
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
              placeholder='Search newsletters...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
          <div>
            <Button
              className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
              onClick={handleAddNewsletter}
            >
              <Plus className='h-4 w-4' />
              Add Newsletter
            </Button>
          </div>
        </div>

        <DataTable
          title='Newsletters'
          data={filteredNewsletters}
          columns={[
            { key: 'title', label: 'Title' },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {row.status}
                </span>
              ),
            },
            { key: 'published_at', label: 'Published At' },
          ]}
          actions={[
            {
              label: 'View',
              onClick: handleViewNewsletter,
            },
            {
              label: 'Edit',
              onClick: handleEditNewsletter,
            },
            {
              label: 'Toggle Status',
              onClick: handleToggleStatus,
            },
          ]}
          search={search}
        />
      </div>
    </div>
  )
}
