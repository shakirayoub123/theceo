import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ScheduleMeetingModal from '@/components/ScheduleMeetingModal'
import { CreatePaymentLinkModal } from '@/components/CreatePaymentLinkModal'
import authService from '@/services/authService'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function PotentialLeads() {
  const [search, setSearch] = useState('')
  const [leadsData, setLeadsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assigningLead, setAssigningLead] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentLead, setSelectedPaymentLead] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newClientData, setNewClientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    job_title: '',
    position: '',
    industry: '',
  })
  const router = useNavigate()

  const fetchLeadsData = async () => {
    try {
      setLoading(true)
      const data = await authService.getLeads()
      console.log('Leads Data:', data.leads)
      setLeadsData(data.leads)
    } catch (err) {
      setError('Failed to load leads data')
      console.error('Leads error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadsData()
  }, [])

  // Function to handle assigning a lead to the current sales user
  const handleAssignToSelf = async (leadId) => {
    try {
      setAssigningLead(true)
      await authService.assignLeadToSelf(leadId)
      toast.success('Lead successfully assigned to you')
      // Refresh the leads data
      await fetchLeadsData()
    } catch (err) {
      toast.error(`Failed to assign lead: ${err.message}`)
      console.error('Assign lead error:', err)
    } finally {
      setAssigningLead(false)
    }
  }

  // Function to open the meeting scheduling modal
  const handleScheduleMeeting = (client) => {
    setSelectedClient(client)
    setShowMeetingModal(true)
  }

  const handleCreatePaymentLink = (row) => {
    const lead =
      leadsData?.find((item) => item.uuid === row.id || item.id === row.id) ||
      row.raw ||
      row
    setSelectedPaymentLead(lead)
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedPaymentLead(null)
  }

  const handleInputChange = (field, value) => {
    setNewClientData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddClientSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await authService.createSalesClient(newClientData)
      toast.success(
        response?.credentials_sent
          ? 'Client created and welcome email sent.'
          : 'Client created successfully!',
      )
      setIsAddModalOpen(false)
      setNewClientData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        job_title: '',
        position: '',
        industry: '',
      })
      await fetchLeadsData()
    } catch (err) {
      console.error('Failed to create client:', err)
      toast.error(err.message || 'Failed to create client')
    } finally {
      setIsSubmitting(false)
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
          <p className='text-lg font-semibold'>Error Loading Leads</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  const metricsData = [
    { title: 'TOTAL LEADS', value: leadsData?.length || 0 },
    {
      title: 'PENDING MEETINGS',
      value:
        leadsData?.filter((lead) => lead.meetingStatus === 'pending').length ||
        0,
    },
    {
      title: 'UNPAID PROGRAMS',
      value:
        leadsData?.filter((lead) => lead.programStatus === 'unpaid').length ||
        0,
    },
  ]

  const clients =
    leadsData?.map((client) => ({
      id: client.uuid,
      clientName: client.clientName,
      meetingStatus: client.meetingStatus || 'pending',
      programStatus: client.programStatus || 'unpaid',
      contractStatus: client.contractStatus || 'not_sent',
      salesInfluencer: client.salesInfluencer || '-',
      raw: client,
    })) || []

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Potential Leads
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
          <div>
            <Button
              className='flex items-center gap-2 rounded-lg shadow-sm bg-[#F6B72D] hover:bg-[#e6b82a] uppercase'
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className='h-4 w-4' />
              Add Client
            </Button>
          </div>
        </div>
        <DataTable
          title='Potential Leads'
          data={clients}
          columns={[
            { key: 'clientName', label: 'Client Name' },
            {
              key: 'meetingStatus',
              label: 'Meeting Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.meetingStatus === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : row.meetingStatus === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {row.meetingStatus === 'pending'
                    ? 'Pending'
                    : row.meetingStatus === 'scheduled'
                      ? 'Scheduled'
                      : row.meetingStatus === 'completed'
                        ? 'Completed'
                        : row.meetingStatus}
                </span>
              ),
            },
            {
              key: 'programStatus',
              label: 'Program Status',
              render: (row) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.programStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {row.programStatus === 'unpaid' ? 'Unpaid' : 'Paid'}
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
                      : row.contractStatus === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {row.contractStatus === 'not_sent'
                    ? 'Not Sent'
                    : row.contractStatus === 'sent'
                      ? 'Sent'
                      : row.contractStatus === 'signed'
                        ? 'Signed'
                        : row.contractStatus}
                </span>
              ),
            },
            { key: 'salesInfluencer', label: 'Sales Influencer' },
          ]}
          actions={[
            {
              label: 'View',
              onClick: (row) => router(`/sales-dashboard/clients/${row.id}`),
            },
            {
              label: 'Assign MySelf',
              onClick: (row) => handleAssignToSelf(row.id),
              condition: () => !assigningLead,
            },
            {
              label: 'Schedule Meeting',
              onClick: (row) => handleScheduleMeeting(row),
            },
            {
              label: 'Create Payment Link',
              onClick: (row) => handleCreatePaymentLink(row),
              condition: (row) => row.programStatus === 'unpaid',
            },
          ]}
          search={search}
        />

        {/* Schedule Meeting Modal */}
        <ScheduleMeetingModal
          isOpen={showMeetingModal}
          onClose={() => {
            setShowMeetingModal(false)
            fetchLeadsData() // Refresh the leads data after scheduling
          }}
          client={selectedClient}
        />
        <CreatePaymentLinkModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          lead={selectedPaymentLead}
          onSuccess={() => fetchLeadsData()}
        />
      </div>
      {isAddModalOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-[10px] border-2 border-[#F6B72D] w-full max-w-2xl mx-auto shadow-2xl overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h3 className='text-lg font-bold text-black'>Add New Client</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className='p-1 hover:bg-gray-100 rounded-full transition-colors'
              >
                <X className='h-5 w-5 text-gray-500' />
              </button>
            </div>
            <form onSubmit={handleAddClientSubmit} className='p-6 space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Input
                  placeholder='First name'
                  value={newClientData.first_name}
                  onChange={(e) =>
                    handleInputChange('first_name', e.target.value)
                  }
                  required
                  className='font-exo'
                />
                <Input
                  placeholder='Last name'
                  value={newClientData.last_name}
                  onChange={(e) =>
                    handleInputChange('last_name', e.target.value)
                  }
                  required
                  className='font-exo'
                />
                <Input
                  type='email'
                  placeholder='Email'
                  value={newClientData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className='font-exo'
                />
                <Input
                  placeholder='Phone'
                  value={newClientData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className='font-exo'
                />
                <Input
                  placeholder='Address'
                  value={newClientData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className='font-exo'
                />
                <Input
                  placeholder='Job Title'
                  value={newClientData.job_title}
                  onChange={(e) =>
                    handleInputChange('job_title', e.target.value)
                  }
                  className='font-exo'
                />
                <Input
                  placeholder='Company Name'
                  value={newClientData.position}
                  onChange={(e) =>
                    handleInputChange('position', e.target.value)
                  }
                  className='font-exo'
                />
                <Input
                  placeholder='Industry'
                  value={newClientData.industry}
                  onChange={(e) =>
                    handleInputChange('industry', e.target.value)
                  }
                  className='font-exo'
                />
              </div>
              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black'
                >
                  {isSubmitting ? 'Creating...' : 'Create Client'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
