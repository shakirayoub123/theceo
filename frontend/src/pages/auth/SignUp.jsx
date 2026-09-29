import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.role
    ) {
      throw new Error('Please fill in all required fields')
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match')
    }

    if (formData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      throw new Error('Please enter a valid email address')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      validateForm()

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
      }

      await register(userData)
      setSuccess(
        'Registration successful! Please check your email for verification instructions.',
      )

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        phone: '',
      })

      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <h2 className='text-2xl font-bold'>CREATE ACCOUNT</h2>
        <p className='text-sm font-exo'>
          Already have an account?{' '}
          <Link to='/login' className='font-bold underline'>
            Sign In
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6 font-exo'>
        {(error || success) && (
          <div
            className={`p-3 border rounded-lg ${
              error
                ? 'bg-red-100 border-red-400 text-red-700'
                : 'bg-green-100 border-green-400 text-green-700'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <label htmlFor='firstName' className='text-md font-medium'>
              First Name *
            </label>
            <Input
              id='firstName'
              type='text'
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder='First name'
              className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg input-field'
              required
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='lastName' className='text-md font-medium'>
              Last Name *
            </label>
            <Input
              id='lastName'
              type='text'
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder='Last name'
              className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg input-field'
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <label htmlFor='email' className='text-md font-medium'>
            Email Address *
          </label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder='e.g. email@example.com'
            className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg input-field'
            required
            disabled={loading}
          />
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
            className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg input-field'
            disabled={loading}
          />
        </div>

        <div className='space-y-2'>
          <label htmlFor='role' className='text-md font-medium'>
            Role *
          </label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleInputChange('role', value)}
            disabled={loading}
          >
            <SelectTrigger className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg '>
              <SelectValue placeholder='Select a Role' />
            </SelectTrigger>
            <SelectContent className='z-10 bg-white border border-gray-200 rounded-md shadow-md font-exo'>
              <SelectItem value='client'>Client</SelectItem>
              <SelectItem value='sales'>Sales</SelectItem>
              <SelectItem value='coaching'>Coaching</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <label htmlFor='password' className='text-md font-medium'>
            Password *
          </label>
          <Input
            id='password'
            type='password'
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder='Create a password (min 6 characters)'
            className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg input-field'
            required
            disabled={loading}
          />
        </div>

        <div className='space-y-2'>
          <label htmlFor='confirmPassword' className='text-md font-medium'>
            Confirm Password *
          </label>
          <Input
            id='confirmPassword'
            type='password'
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange('confirmPassword', e.target.value)
            }
            placeholder='Confirm your password'
            className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg input-field'
            required
            disabled={loading}
          />
        </div>

        <Button
          type='submit'
          disabled={loading}
          className='w-full bg-[#F6B72D] hover:bg-yellow-600 py-3 rounded-lg font-sans disabled:opacity-50'
        >
          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
        </Button>
      </form>
    </div>
  )
}

export default SignUp
