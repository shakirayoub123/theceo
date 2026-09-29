import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import authService from '@/services/authService'

const UserPermissionsManager = ({ userId, onClose }) => {
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true)
        const data = await authService.getUserPermissionsAdmin(userId)
        setPermissions(data)
      } catch (err) {
        setError('Failed to load user permissions')
        console.error('Permissions error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchPermissions()
    }
  }, [userId])

  const handlePermissionChange = (permission, value) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      await authService.updateUserPermissionsAdmin(userId, permissions)
      alert('Permissions updated successfully!')
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  const permissionOptions = [
    { key: 'can_view_reports', label: 'Can View Reports' },
    { key: 'can_manage_users', label: 'Can Manage Users' },
    { key: 'can_access_admin', label: 'Can Access Admin Panel' },
    { key: 'can_create_content', label: 'Can Create Content' },
    { key: 'can_edit_content', label: 'Can Edit Content' },
    { key: 'can_delete_content', label: 'Can Delete Content' },
    { key: 'can_manage_services', label: 'Can Manage Services' },
    { key: 'can_view_analytics', label: 'Can View Analytics' },
    { key: 'can_export_data', label: 'Can Export Data' },
    { key: 'can_manage_permissions', label: 'Can Manage Permissions' },
  ]

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 h-full'>
      <div className='h-full bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-xl font-bold mb-6'>Manage User Permissions</h3>

        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        <div className='space-y-4 mb-6'>
          {permissionOptions.map((option) => (
            <div key={option.key} className='flex items-center space-x-3'>
              <input
                type='checkbox'
                id={option.key}
                checked={permissions[option.key] || false}
                onChange={(e) =>
                  handlePermissionChange(option.key, e.target.checked)
                }
                className='w-4 h-4 text-[#F6B72D] border-gray-300 rounded focus:ring-[#F6B72D]'
              />
              <Label htmlFor={option.key} className='text-sm font-medium'>
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        <div className='flex justify-end space-x-3 pt-4 border-t'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className='bg-[#F6B72D] hover:bg-[#e6b82a] text-white'
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UserPermissionsManager
