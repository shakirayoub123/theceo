import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import authService from '@/services/authService'
import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Blogs() {
  const [blogsData, setBlogsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const fetchBlogsData = async () => {
      try {
        setLoading(true)
        const data = await authService.getAdminBlogs()
        setBlogsData(data)
      } catch (err) {
        setError('Failed to load blogs data')
        console.error('Blogs error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBlogsData()
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
          <p className='text-lg font-semibold'>Error Loading Blogs</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  // Prepare metrics data from API response
  const metricsData = [
    {
      title: 'TOTAL BLOGS',
      value: blogsData?.blogs?.length || 0,
    },
    {
      title: 'TOTAL BLOGS VIEWS',
      value: blogsData?.totalBlogsSold || 0,
    },
    {
      title: 'PUBLISHED BLOGS',
      value:
        blogsData?.blogs?.filter((blog) => blog.status === 'published')
          .length || 0,
    },
  ]

  // Prepare blogs data for the table
  const blogsTableData =
    blogsData?.blogs?.map((blog) => ({
      id: blog.id,
      title: blog.title,
      status: blog.status.toUpperCase(),
      views_count: blog.views_count || 0,
      published_at: blog.published_at
        ? new Date(blog.published_at).toLocaleDateString()
        : 'Not published',
    })) || []

  const handleViewBlog = (blog) => {
    console.log('View blog:', blog)
    // TODO: Open blog details modal or navigate to blog detail page
  }

  const handleEditBlog = (blog) => {
    navigate(`/admin-dashboard/blogs/edit-blog/${blog.id}`)
  }

  const handleToggleStatus = async (blog) => {
    try {
      await authService.toggleBlogStatus(blog.id)
      // Refresh the blogs data after toggling status
      const data = await authService.getAdminBlogs()
      setBlogsData(data)
    } catch (err) {
      console.error('Failed to toggle blog status:', err)
      setError('Failed to toggle blog status')
    }
  }

  const handleAddBlog = () => {
    navigate('/admin-dashboard/blogs/add-blog')
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Blogs Management
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
              placeholder='Search blogs...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
          <div>
            <Button
              className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
              onClick={handleAddBlog}
            >
              <Plus className='h-4 w-4' />
              Add A Blog
            </Button>
          </div>
        </div>

        <DataTable
          title='Blogs'
          data={blogsTableData}
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
            { key: 'views_count', label: 'Views' },
            { key: 'published_at', label: 'Published At' },
          ]}
          actions={[
            {
              label: 'View',
              onClick: handleViewBlog,
            },
            {
              label: 'Edit',
              onClick: handleEditBlog,
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
