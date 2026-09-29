import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import ScheduleMeetingModal from '@/components/ScheduleMeetingModal'
import authService from '@/services/authService'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NewClients() {
  const [search, setSearch] = useState('')
  const [clientsData, setClientsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const router = useNavigate()

  useEffect(() => {
    fetchClientsData()
  }, [])

  const fetchClientsData = async () => {
    try {
      setLoading(true)
      const data = await authService.getNewClients()
      console.log('New Clients Data:', data)
      setClientsData(data)
    } catch (err) {
      setError('Failed to load clients data')
      console.error('Clients error:', err)
    } finally {
      setLoading(false)
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
          <p className='text-lg font-semibold'>Error Loading Clients</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  const metricsData = [
    { title: 'MEETINGS PENDING', value: clientsData?.meetingsPending || 0 },
    { title: 'CALLS SCHEDULED', value: clientsData?.callsScheduled || 0 },
    {
      title: 'AWAITING PURCHASE',
      value: clientsData?.awaitingPurchaseClients || 0,
    },
  ]

  const handleScheduleMeeting = (client) => {
    setSelectedClient(client)
    setShowMeetingModal(true)
  }

  const clients =
    clientsData?.clients?.map((client) => ({
      id: client.clientID,
      clientName: client.clientName,
      client: `${client.clientName} (${client.clientID.slice(-4)})`,
      meetingStatus: client.meetingStatus,
      serviceStatus: client.serviceStatus,
      contractStatus: client.contractStatus,
      raw: client,
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
        <div className='flex justify-between align-center my-2 gap-2'>
          <div className='relative w-full lg:w-[40%] bg-white'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
            <Input
              placeholder='Search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
        </div>
        <DataTable
          title='New Clients'
          data={clients}
          columns={[
            { key: 'client', label: 'Client' },
            {
              key: 'meetingStatus',
              label: 'Meeting Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.meetingStatus === 'scheduled'
                      ? 'bg-green-100 text-green-800'
                      : row.meetingStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {row.meetingStatus.toUpperCase()}
                </span>
              ),
            },
            {
              key: 'serviceStatus',
              label: 'Service Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.serviceStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {row.serviceStatus.toUpperCase()}
                </span>
              ),
            },
            {
              key: 'contractStatus',
              label: 'Contract Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.contractStatus === 'signed'
                      ? 'bg-green-100 text-green-800'
                      : row.contractStatus === 'sent_signed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {row.contractStatus.replace('_', ' ').toUpperCase()}
                </span>
              ),
            },
          ]}
          actions={[
            {
              label: 'View',
              onClick: (row) => router(`/sales-dashboard/clients/${row.id}`),
            },
            {
              label: 'Schedule Meeting',
              onClick: (row) => handleScheduleMeeting(row),
            },
          ]}
          search={search}
        />

        <ScheduleMeetingModal
          isOpen={showMeetingModal}
          onClose={() => {
            setShowMeetingModal(false)
            fetchClientsData()
          }}
          client={selectedClient}
        />
      </div>
    </div>
  )
}
