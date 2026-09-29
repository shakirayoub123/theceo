import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { URLS } from '@/config/urls'
import authService from '@/services/authService'
import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Services() {
  const [servicesData, setServicesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setLoading(true)
        const data = await authService.getAdminServices()
        setServicesData(data)
      } catch (err) {
        setError('Failed to load services data')
        console.error('Services error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServicesData()
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
          <p className='text-lg font-semibold'>Error Loading Services</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  // Prepare metrics data from API response
  const metricsData = [
    {
      title: 'TOTAL SERVICES',
      value: servicesData?.totalServices || 0,
    },
    {
      title: 'ACTIVE SERVICES',
      value: servicesData?.activeServices || 0,
    },
    {
      title: 'ARCHIVED SERVICES',
      value: servicesData?.archivedServices || 0,
    },
  ]

  // Prepare services data for the table
  const servicesTableData =
    servicesData?.services?.map((service) => ({
      id: service.id,
      client: service.title,
      program: service.title,
      status: service.status.toUpperCase(),
      enrolled: service.enrolledClients || 0,
      advisors:
        service.assignedAdvisors
          ?.map((adv) => `${adv.first_name} ${adv.last_name}`)
          .join(', ') || 'N/A',
      created_at: service.createdAt,
      order: service.order || 0,
      comingSoon: service.comingSoon || false,
    })) || []

  // Filter services based on search
  const filteredServices = servicesTableData.filter(
    (service) =>
      service.client.toLowerCase().includes(search.toLowerCase()) ||
      service.program.toLowerCase().includes(search.toLowerCase()) ||
      service.advisors.toLowerCase().includes(search.toLowerCase()),
  )

  const handleViewService = async (service) => {
    try {
      const details = await authService.getServiceDetails(service.id)
      navigate(`${URLS.master.serviceDetails.replace(':id', service.id)}`, {
        state: { service: details },
      })
    } catch (err) {
      console.error('Failed to load service details:', err)
    }
  }

  const handleEditService = (service) => {
    navigate(`${URLS.master.editService.replace(':id', service.id)}`)
  }

  // Define table columns
  const tableColumns = [
    { key: 'client', label: 'SERVICE TITLE' },
    { key: 'program', label: 'PROGRAM' },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const status = row.status?.toLowerCase()
        let statusConfig = {}

        switch (status) {
          case 'active':
            statusConfig = {
              bgColor: 'bg-green-100',
              textColor: 'text-green-800',
              borderColor: 'border-green-200',
              label: 'Active',
            }
            break
          case 'inactive':
            statusConfig = {
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-800',
              borderColor: 'border-gray-200',
              label: 'Inactive',
            }
            break
          case 'draft':
            statusConfig = {
              bgColor: 'bg-yellow-100',
              textColor: 'text-yellow-800',
              borderColor: 'border-yellow-200',
              label: 'Draft',
            }
            break
          case 'archived':
            statusConfig = {
              bgColor: 'bg-red-100',
              textColor: 'text-red-800',
              borderColor: 'border-red-200',
              label: 'Archived',
            }
            break
          case 'pending':
            statusConfig = {
              bgColor: 'bg-blue-100',
              textColor: 'text-blue-800',
              borderColor: 'border-blue-200',
              label: 'Pending',
            }
            break
          default:
            statusConfig = {
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-800',
              borderColor: 'border-gray-200',
              label: row.status || 'Unknown',
            }
        }

        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                status === 'active'
                  ? 'bg-green-500'
                  : status === 'inactive'
                    ? 'bg-gray-500'
                    : status === 'draft'
                      ? 'bg-yellow-500'
                      : status === 'archived'
                        ? 'bg-red-500'
                        : status === 'pending'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
              }`}
            ></span>
            {statusConfig.label}
          </span>
        )
      },
    },
    { key: 'enrolled', label: 'ENROLLED CLIENTS' },
    { key: 'advisors', label: 'TRAINER' },
    { key: 'order', label: 'ORDER' },
    {
      key: 'comingSoon',
      label: 'COMING SOON',
      render: (row) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            row.comingSoon
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          {row.comingSoon ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'CREATED DATE',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ]

  // Define table actions
  const tableActions = [
    {
      label: 'View',
      onClick: handleViewService,
    },
    {
      label: 'Edit',
      onClick: handleEditService,
    },
  ]

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Services Management
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8'>
        {metricsData.map((metric, index) => (
          <MetricCard key={index} title={metric.title} value={metric.value} />
        ))}
      </div>
      <div>
        <div className='flex justify-between align-center my-2 gap-2'>
          <div className='relative max-w-full lg:max-w-[40%] my-2 bg-white'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
            <Input
              placeholder='Search services...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
          <div>
            <Link
              to={URLS.master.addService}
              className='flex p-3 items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
            >
              <Plus className='h-4 w-4' />
              Add a Service
            </Link>
          </div>
        </div>
        <DataTable
          title='Services'
          data={filteredServices}
          columns={tableColumns}
          actions={tableActions}
          search={search}
        />
      </div>
    </div>
  )
}
