import { useState, useEffect } from 'react'
import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import authService from '@/services/authService'
import UserPermissionsManager from '@/components/UserPermissionsManager'
import { useNavigate } from 'react-router-dom'

export default function Users() {
  const [usersData, setUsersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await authService.getAdminClients()
      console.log('API Response:', response) // Debug log to see actual response

      // Handle different API response formats
      let users = []
      if (Array.isArray(response)) {
        users = response
      } else if (response && Array.isArray(response.data)) {
        users = response.data
      } else if (response && Array.isArray(response.results)) {
        users = response.results
      } else if (response && Array.isArray(response.users)) {
        users = response.users
      } else if (response && Array.isArray(response.clients)) {
        users = response.clients
      } else if (response && typeof response === 'object') {
        // If it's an object, try to extract users array from common keys
        users = response.users || response.clients || response.items || []
      }

      console.log('Processed users array:', users) // Debug log
      setUsersData(users)
    } catch (err) {
      console.error('Clients error:', err)
      setError('Failed to load clients')
      setUsersData([]) // Ensure it's always an array
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
          <p className='text-lg font-semibold'>Error Loading Users</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  // Prepare metrics data - safely handle non-array data
  const safeUsersData = Array.isArray(usersData) ? usersData : []

  const metricsData = [
    {
      title: 'TOTAL CLIENTS',
      value: safeUsersData.length,
    },
    {
      title: 'ACTIVE CLIENTS',
      value: safeUsersData.filter((user) => user && user.is_active !== false)
        .length,
    },
    {
      title: 'INACTIVE CLIENTS',
      value: safeUsersData.filter((user) => user && user.is_active === false)
        .length,
    },
  ]

  // Prepare users data for the table - safely handle non-array data
  const usersTableData = safeUsersData.map((user) => ({
    id: user?.id,
    client: user.clientName,
    programs: user?.programsEnrolled,
    status: user?.is_active !== false ? 'ACTIVE' : 'INACTIVE',
    enrolled: user?.email || 'N/A',
    advisors: user?.lastLogin
      ? new Date(user.lastLogin).toLocaleDateString()
      : 'Never',
    program: user?.program, // Add program for actions
  }))

  // Filter users based on search - safely handle non-array data
  const safeUsersTableData = Array.isArray(usersTableData) ? usersTableData : []
  const filteredUsers = safeUsersTableData.filter(
    (user) =>
      user?.client?.toLowerCase().includes(search.toLowerCase()) ||
      user?.enrolled?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleViewUser = (user) => {
    navigate(`/admin-dashboard/clients/${user.id}`)
  }

  const handleSuspendUser = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          user.status === 'ACTIVE' ? 'suspend' : 'activate'
        } this user?`,
      )
    )
      return

    try {
      setLoading(true)
      if (user.status === 'ACTIVE') {
        await authService.suspendUser(user.id)
      } else {
        // TODO: Implement activate user API if available
        console.log('Activate user functionality to be implemented')
      }
      fetchUsers()
    } catch (err) {
      console.error('Failed to suspend user:', err)
      alert('Failed to update user status')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTrainer = async (user) => {
    if (user.program !== 'coaching') {
      alert('This user is not a trainer')
      return
    }

    if (!window.confirm('Are you sure you want to approve this trainer?'))
      return

    try {
      setLoading(true)
      await authService.approveTrainer(user.id)
      alert('Trainer approved successfully!')
      fetchUsers()
    } catch (err) {
      console.error('Failed to approve trainer:', err)
      alert('Failed to approve trainer')
    } finally {
      setLoading(false)
    }
  }

  const handleManagePermissions = (user) => {
    setSelectedUser(user)
    setShowPermissionsModal(true)
  }

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false)
    setSelectedUser(null)
  }

  // Define table columns
  const columns = [
    { key: 'client', label: 'Client' },
    {
      key: 'programs',
      label: 'Programs Enrolled',
      render: (row) =>
        row.programs?.map((program) => program?.name).join(', ') || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`px-4 py-1 rounded-full text-xs ${
            row.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ]

  // Define table actions
  const actions = [
    { label: 'View Details', onClick: handleViewUser },
    { label: 'Block', onClick: handleSuspendUser },
    {
      label: 'Approve Trainer',
      onClick: handleApproveTrainer,
      condition: (row) => row.program === 'coaching',
    },
  ]

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        User Management
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
            placeholder='Search users...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
          />
        </div>

        <DataTable
          title='Users'
          data={filteredUsers}
          columns={columns}
          actions={actions}
          search={search}
        />
      </div>

      {/* User Permissions Manager Modal */}
      {showPermissionsModal && selectedUser && (
        <UserPermissionsManager
          userId={selectedUser.id}
          onClose={handleClosePermissionsModal}
        />
      )}
    </div>
  )
}
