import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import authService from '@/services/authService'

const AdminUserManagement = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    page: 1,
    limit: 10,
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authService.getAllUsers({
        role: filters.role || undefined,
        search: filters.search || undefined,
        page: filters.page,
        limit: filters.limit,
      })
      setUsers(response.users || [])
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleUserUpdate = async (userId, updateData) => {
    try {
      setLoading(true)
      await authService.updateUser(userId, updateData)
      setSuccess('User updated successfully!')
      setShowEditModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      setLoading(true)
      await authService.deleteUser(userId)
      setSuccess('User deleted successfully!')
      loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const UserEditModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      isActive: user.isActive !== false,
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSave(user.id, formData)
    }

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
          <h3 className='text-lg font-bold mb-4'>Edit User</h3>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Email</label>
              <Input
                type='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Role</label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='client'>Client</SelectItem>
                  <SelectItem value='sales'>Sales</SelectItem>
                  <SelectItem value='coaching'>Coaching</SelectItem>
                  <SelectItem value='master'>Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='isActive'
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
              <label htmlFor='isActive' className='text-sm'>
                Active User
              </label>
            </div>

            <div className='flex space-x-2 pt-4'>
              <Button type='submit' disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>User Management</h1>
        <div className='text-sm text-gray-600'>Total Users: {users.length}</div>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg shadow mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Search</label>
            <Input
              placeholder='Search by name or email'
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Role</label>
            <Select
              value={filters.role}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='All Roles' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>All Roles</SelectItem>
                <SelectItem value='client'>Client</SelectItem>
                <SelectItem value='sales'>Sales</SelectItem>
                <SelectItem value='coaching'>Coaching</SelectItem>
                <SelectItem value='master'>Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Limit</label>
            <Select
              value={filters.limit.toString()}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, limit: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10 per page</SelectItem>
                <SelectItem value='25'>25 per page</SelectItem>
                <SelectItem value='50'>50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-end'>
            <Button onClick={loadUsers} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div
          className={`p-4 mb-6 border rounded-lg ${
            error
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'bg-green-100 border-green-400 text-green-700'
          }`}
        >
          {error || success}
        </div>
      )}

      {/* Users Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Created
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {user.firstName} {user.lastName}
                      </div>
                      <div className='text-sm text-gray-500'>{user.email}</div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'master'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'sales'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'coaching'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setSelectedUser(user)
                        setShowEditModal(true)
                      }}
                    >
                      Edit
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleUserDelete(user.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className='text-center py-8 text-gray-500'>No users found</div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSave={handleUserUpdate}
        />
      )}
    </div>
  )
}

export default AdminUserManagement
