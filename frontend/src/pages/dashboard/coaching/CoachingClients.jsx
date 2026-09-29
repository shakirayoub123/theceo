import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { URLS } from '@/config/urls'
import authService from '@/services/authService'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const clients = [
  {
    id: 1,
    client: 'John Riley (ID 0001)',
    program: 'Leadership Coaching 12-week Program',
    status: 'COMPLETED',
    enrolled: 12,
    advisors: 'Dr. Claire, James',
  },
  {
    id: 2,
    client: 'John Riley (ID 0001)',
    program: 'Leadership Coaching 12-week Program',
    status: 'ACTIVE',
    enrolled: 12,
    advisors: 'Dr. Claire, James',
  },
]

export default function CoachingClients() {
  const [search, setSearch] = useState('')
  const [clientsData, setClientsData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchClientsData()
  }, [])

  const fetchClientsData = async () => {
    try {
      setIsLoading(true)
      const response = await authService.getCoachingClients()

      // Transform API data to match DataTable format
      const transformedClients = response.clients.map((client, index) => ({
        id: index + 1,
        client: `${client.clientName} (ID ${client.clientID})`,
        program: 'Leadership Coaching 12-week Program', // Default value since not in API
        status: client.status.toUpperCase(),
        enrolled: 12, // Default value since not in API
        advisors: 'Dr. Claire, James', // Default value since not in API
      }))

      setClientsData({
        clientsAssigned: response.clientsAssigned,
        clientsMeetingsToday: response.clientsMeetingsToday,
        clients: transformedClients,
      })
    } catch (error) {
      console.error('Failed to fetch coaching clients data:', error)
      toast.error('Failed to load clients data')
    } finally {
      setIsLoading(false)
    }
  }

  // Use API data if available, otherwise fallback to defaults
  const clientsAssigned = clientsData?.clientsAssigned ?? 24
  const clientsToDisplay = clientsData?.clients ?? clients

  // Define table columns
  const tableColumns = [
    { key: 'client', label: 'CLIENT' },
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
          case 'completed':
            statusConfig = {
              bgColor: 'bg-blue-100',
              textColor: 'text-blue-800',
              borderColor: 'border-blue-200',
              label: 'Completed',
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
                    : status === 'completed'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
              }`}
            ></span>
            {statusConfig.label}
          </span>
        )
      },
    },
  ]

  // Define table actions
  const tableActions = [
    {
      label: 'View',
      onClick: (row) => {
        // Extract clientID from the client string or use row.id
        const clientID = row.client.match(/ID (\d+)/)?.[1] || row.id
        navigate(URLS.coaching.clientDetails.replace(':id', clientID))
      },
    },
  ]

  const metricsDataToUse = [
    { title: 'TOTAL CLIENTS', value: clientsAssigned.toString() },
  ]

  if (isLoading) {
    return (
      <div>
        <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
          Clients
        </h2>
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Clients
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8'>
        {metricsDataToUse.map((metric, index) => (
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
          title='Client Programs'
          data={clientsToDisplay}
          columns={tableColumns}
          actions={tableActions}
          search={search}
        />
      </div>
    </div>
  )
}
