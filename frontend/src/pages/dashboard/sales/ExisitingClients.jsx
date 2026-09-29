import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import authService from '@/services/authService'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ExisitingClients() {
  const [search, setSearch] = useState('')
  const [clientsData, setClientsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useNavigate()

  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        setLoading(true)
        const data = await authService.getExistingClients()
        console.log('Existing Clients Data:', data)
        setClientsData(data)
      } catch (err) {
        setError('Failed to load clients data')
        console.error('Clients error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClientsData()
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
          <p className='text-lg font-semibold'>Error Loading Clients</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  const metricsData = [
    {
      title: 'TOTAL EXISTING CLIENTS',
      value: clientsData?.totalExistingClients || 0,
    },
  ]

  const clients =
    clientsData?.clients?.map((client) => ({
      id: client.clientID,
      client: `${client.clientName} (${client.clientID.slice(-4)})`,
      status: client.status,
    })) || []

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Clients
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
            placeholder='Search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
          />
        </div>
        <DataTable
          title='Existing Clients'
          data={clients}
          columns={[
            { key: 'client', label: 'Client' },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : row.status === 'Completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {row.status.toUpperCase()}
                </span>
              ),
            },
          ]}
          actions={[
            {
              label: 'View',
              onClick: (row) => router(`/sales-dashboard/clients/${row.id}`),
            },
          ]}
          search={search}
        />
      </div>
    </div>
  )
}
