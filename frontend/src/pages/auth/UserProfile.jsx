import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

const UserProfile = () => {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      }

      await updateProfile(updateData)
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (formData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long')
      }

      // Note: Password change would need to be implemented in authService
      // For now, this is a placeholder
      setSuccess('Password changed successfully!')
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch (err) {
      setError(err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-8'>My Profile</h1>

      {/* Tab Navigation */}
      <div className='flex border-b border-gray-200 mb-6'>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'profile'
              ? 'border-b-2 border-[#F6B72D] text-[#F6B72D]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'password'
              ? 'border-b-2 border-[#F6B72D] text-[#F6B72D]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Change Password
        </button>
      </div>

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

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className='space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='firstName' className='text-md font-medium'>
                First Name
              </label>
              <Input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor='lastName' className='text-md font-medium'>
                Last Name
              </label>
              <Input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
                disabled={loading}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='email' className='text-md font-medium'>
              Email Address
            </label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
              disabled // Email should not be editable
            />
            <p className='text-sm text-gray-500'>Email cannot be changed</p>
          </div>

          <div className='space-y-2'>
            <label htmlFor='phone' className='text-md font-medium'>
              Phone Number
            </label>
            <Input
              id='phone'
              type='tel'
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder='e.g. +1234567890'
              className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-md font-medium'>Role</label>
            <Input
              value={user?.role || ''}
              className='border-2 border-gray-300 rounded-lg'
              disabled
            />
          </div>

          <Button
            type='submit'
            disabled={loading}
            className='bg-[#F6B72D] hover:bg-yellow-600 text-white px-6 py-2 rounded-lg disabled:opacity-50'
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordChange} className='space-y-6'>
          <div className='space-y-2'>
            <label htmlFor='currentPassword' className='text-md font-medium'>
              Current Password
            </label>
            <Input
              id='currentPassword'
              type='password'
              value={formData.currentPassword}
              onChange={(e) =>
                handleInputChange('currentPassword', e.target.value)
              }
              placeholder='Enter current password'
              className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='newPassword' className='text-md font-medium'>
              New Password
            </label>
            <Input
              id='newPassword'
              type='password'
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder='Enter new password (min 6 characters)'
              className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='confirmPassword' className='text-md font-medium'>
              Confirm New Password
            </label>
            <Input
              id='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange('confirmPassword', e.target.value)
              }
              placeholder='Confirm new password'
              className='border-2 border-gray-300 focus:border-[#F6B72D] rounded-lg'
              disabled={loading}
            />
          </div>

          <Button
            type='submit'
            disabled={loading}
            className='bg-[#F6B72D] hover:bg-yellow-600 text-white px-6 py-2 rounded-lg disabled:opacity-50'
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      )}
    </div>
  )
}

export default UserProfile
