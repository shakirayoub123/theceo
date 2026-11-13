import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import ScheduleMeetingModal from '@/components/ScheduleMeetingModal'
import authService from '@/services/authService'
import salesAPIService from '@/services/salesAPIService'
import {
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SIX_ASSESSMENTS_LIST = [
  { id: 1, name: 'MBTI – Meyers-Briggs Personality Profile Assessment' },
  { id: 2, name: 'Senior Executive Leader Soft & Hard Skills Assessment' },
  { id: 3, name: 'Executive Leader: Client Personal & Professional Assessment' },
  { id: 4, name: 'Senior Executive Leadership Core Competencies Assessment' },
  { id: 5, name: 'Global Industry Experience Assessment' },
  { id: 6, name: 'The Senior Leader\'s Big 5 Personality Profile Assessment (OCEAN)' },
]

export default function NewClients() {
  const [search, setSearch] = useState('')
  const [clientsData, setClientsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [assignModalClient, setAssignModalClient] = useState(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState('')
  const [assignError, setAssignError] = useState('')
  const router = useNavigate()

  useEffect(() => {
    fetchClientsData()
  }, [])

  const fetchClientsData = async () => {
    try {
      setLoading(true)
      const data = await authService.getNewClients()
      setClientsData(data)
    } catch (err) {
      setError('Failed to load clients data')
      console.error('Clients error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleMeeting = (client) => {
    setSelectedClient(client)
    setShowMeetingModal(true)
  }

  const handleOpenAssignModal = (client) => {
    setAssignModalClient(client)
    setAssignSuccess('')
    setAssignError('')
  }

  const handleConfirmAssignment = async () => {
    if (!assignModalClient?.id) return
    try {
      setIsAssigning(true)
      setAssignError('')
      const response = await salesAPIService.assignClientAssessments(assignModalClient.id)
      setAssignSuccess(response?.message || '6 TCI Assessments assigned successfully!')
      // Refresh clients list after a short delay
      setTimeout(() => {
        fetchClientsData()
        setAssignModalClient(null)
        setAssignSuccess('')
      }, 1400)
    } catch (err) {
      setAssignError(err.message || 'Failed to assign assessments.')
    } finally {
      setIsAssigning(false)
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

  const clients =
    clientsData?.clients?.map((client) => ({
      id: client.clientID,
      clientName: client.clientName,
      client: `${client.clientName} (${client.clientID.slice(-4)})`,
      meetingStatus: client.meetingStatus,
      serviceStatus: client.serviceStatus,
      contractStatus: client.contractStatus,
      assessmentsAssigned: Boolean(client.assessmentsAssigned),
      assessmentsAssignedAt: client.assessmentsAssignedAt,
      completedAssessmentsCount: client.completedAssessmentsCount || 0,
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
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <Input
              placeholder='Search clients...'
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
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    row.serviceStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-200'
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
            {
              key: 'assessmentsStatus',
              label: '6 TCI Assessments',
              render: (row) => {
                if (row.assessmentsAssigned) {
                  return (
                    <div className='flex items-center gap-1.5'>
                      <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300'>
                        <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600' />
                        Assigned ({row.completedAssessmentsCount}/6)
                      </span>
                    </div>
                  )
                }
                if (row.serviceStatus === 'paid') {
                  return (
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenAssignModal(row)
                      }}
                      className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#F6B72D] hover:bg-[#e6b82a] text-black shadow-sm transition-transform active:scale-95'
                    >
                      <Sparkles className='w-3.5 h-3.5' />
                      Assign 6 Assessments
                    </button>
                  )
                }
                return (
                  <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500'>
                    <Clock className='w-3 h-3' />
                    Awaiting Payment
                  </span>
                )
              },
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
            {
              label: 'Assign 6 Assessments',
              onClick: (row) => handleOpenAssignModal(row),
              disabled: (row) => row.serviceStatus !== 'paid',
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

        {/* Modal: Assign 6 TCI Assessments to New Paid Client */}
        {assignModalClient && (
          <div
            className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto'
            onClick={() => !isAssigning && setAssignModalClient(null)}
          >
            <div
              className='bg-white rounded-2xl w-full max-w-2xl shadow-2xl border-2 border-[#F6B72D] overflow-hidden text-gray-900 font-exo'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className='bg-[#0f172a] text-white p-5 border-b border-[#F6B72D]/40 flex items-center justify-between'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F6B72D] text-black uppercase tracking-wider'>
                      Sales Dashboard Action
                    </span>
                    <span className='text-xs text-white/70'>
                      Client: <strong className='text-white'>{assignModalClient.clientName}</strong>
                    </span>
                  </div>
                  <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                    <Sparkles className='w-5 h-5 text-[#F6B72D]' />
                    Assign 6 TCI Executive Assessments
                  </h3>
                </div>
                <button
                  type='button'
                  disabled={isAssigning}
                  onClick={() => setAssignModalClient(null)}
                  className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Modal Body */}
              <div className='p-6 space-y-5'>
                {/* Client Payment Verification */}
                <div className='bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold'>
                      ✓
                    </div>
                    <div>
                      <p className='text-xs font-bold uppercase tracking-wider text-emerald-900'>
                        Paid Client Status Verified
                      </p>
                      <p className='text-sm font-semibold text-emerald-950'>
                        {assignModalClient.clientName} has confirmed paid enrollment.
                      </p>
                    </div>
                  </div>
                  <span className='px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-extrabold tracking-wider uppercase shadow-sm'>
                    Paid
                  </span>
                </div>

                {/* 6 Assessments List */}
                <div>
                  <h4 className='text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2.5'>
                    The 6 TCI Executive Assessments to be assigned:
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs'>
                    {SIX_ASSESSMENTS_LIST.map((item) => (
                      <div
                        key={item.id}
                        className='p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2'
                      >
                        <span className='w-5 h-5 rounded-full bg-[#F6B72D] text-black font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5'>
                          {item.id}
                        </span>
                        <span className='font-semibold text-gray-800 leading-snug'>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role & Confidentiality Notice */}
                <div className='bg-amber-50/80 border-l-4 border-[#F6B72D] p-4 rounded-r-xl text-xs space-y-1.5'>
                  <div className='flex items-center gap-2 font-bold text-gray-900'>
                    <ShieldCheck className='w-4 h-4 text-amber-600' />
                    <span>Executive Confidentiality & Workflow Protocol</span>
                  </div>
                  <p className='text-gray-700 leading-relaxed'>
                    Assigning these assessments notifies <strong>{assignModalClient.clientName}</strong> to complete them on their Client Dashboard before their initial <strong>2-hour new Client Discovery meeting</strong>.
                  </p>
                  <p className='text-gray-600 italic'>
                    * Note: Detailed assessment responses and diagnostic results are exclusively reviewed by Executive Coaches with the client during the 2-hour discovery meeting. Sales Executives monitor assignment and completion milestones.
                  </p>
                </div>

                {/* Status Messages */}
                {assignSuccess && (
                  <div className='p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-sm font-semibold flex items-center gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                    <span>{assignSuccess}</span>
                  </div>
                )}
                {assignError && (
                  <div className='p-3 bg-red-100 text-red-900 border border-red-300 rounded-lg text-sm font-semibold flex items-center gap-2'>
                    <AlertCircle className='w-4 h-4 text-red-600' />
                    <span>{assignError}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className='bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3'>
                <button
                  type='button'
                  disabled={isAssigning}
                  onClick={() => setAssignModalClient(null)}
                  className='px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>

                <button
                  type='button'
                  disabled={isAssigning}
                  onClick={handleConfirmAssignment}
                  className='inline-flex items-center gap-2 px-6 py-2.5 bg-[#F6B72D] hover:bg-[#e6b82a] text-black rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50'
                >
                  {isAssigning ? (
                    <>
                      <div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
                      Assigning Assessments...
                    </>
                  ) : (
                    <>
                      <FileCheck className='w-4 h-4' />
                      Confirm & Assign 6 TCI Assessments
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
