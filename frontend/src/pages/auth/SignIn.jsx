import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const formatRetryAfter = (seconds) => {
  const retryAfterSeconds = Number(seconds)

  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return 'a few minutes'
  }

  if (retryAfterSeconds < 60) {
    return `${retryAfterSeconds} seconds`
  }

  const minutes = Math.ceil(retryAfterSeconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loginSuccess && isAuthenticated && user) {
      const userRole = user?.role
      switch (userRole) {
        case 'admin':
          navigate('/admin-dashboard', { replace: true })
          break
        case 'sales':
          navigate('/sales-dashboard', { replace: true })
          break
        case 'trainer':
          navigate('/coaching-dashboard', { replace: true })
          break
        case 'client':
          navigate('/client-dashboard', { replace: true })
          break
        default:
          navigate('/', { replace: true })
      }
      setLoginSuccess(false)
    }
  }, [loginSuccess, isAuthenticated, user, navigate])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields')
      }

      await login({
        email: formData.email,
        password: formData.password,
      })

      setLoginSuccess(true)
    } catch (err) {
      const retryAfterMessage =
        err?.retryAfter != null
          ? ` Please wait ${formatRetryAfter(err.retryAfter)} before trying again.`
          : ''
      setError(
        `${err.message || 'Login failed. Please try again.'}${retryAfterMessage}`,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full'>
      <div className='mb-8 sm:mb-10 text-center'>
        <h2 className='text-[30px] sm:text-[34px] font-extrabold text-[#111827] tracking-tight uppercase mb-2'>
          SIGN IN
        </h2>
        <p className='text-[14px] text-gray-500 font-medium'>
          Please log in to continue to your executive workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && (
          <div className='p-3 bg-red-50 text-[13px] font-medium border border-red-200 text-red-600 rounded-lg'>
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor='email'
            className='block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2'
          >
            Email Address
          </label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder='executive@theceoinfluencers.com'
            className='w-full h-[52px] sm:h-[56px] px-4 text-[14px] sm:text-[15px] font-medium text-[#111827] rounded-[10px] border border-gray-300 focus-visible:ring-2 focus-visible:ring-[#F6B72D] focus-visible:border-[#F6B72D] outline-none shadow-sm placeholder:text-gray-400 transition-all bg-white'
            required
            disabled={loading}
          />
        </div>

        <div>
          <div className='flex items-center justify-between mb-2'>
            <label
              htmlFor='password'
              className='block text-xs font-bold uppercase tracking-wider text-gray-700'
            >
              Password
            </label>
            <Link
              to='/forget-password'
              className='text-xs font-bold text-[#0B132B] hover:text-[#F6B72D] transition-colors'
            >
              Forgot Password?
            </Link>
          </div>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder='Enter your password'
              className='w-full h-[52px] sm:h-[56px] px-4 text-[14px] sm:text-[15px] font-medium text-[#111827] rounded-[10px] border border-gray-300 focus-visible:ring-2 focus-visible:ring-[#F6B72D] focus-visible:border-[#F6B72D] outline-none shadow-sm placeholder:text-gray-400 transition-all pr-12 bg-white'
              required
              disabled={loading}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1'
            >
              {showPassword ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
            </button>
          </div>
        </div>

        <Button
          type='submit'
          disabled={loading}
          className='w-full h-[52px] sm:h-[56px] bg-[#F6B72D] hover:bg-[#e6b82a] text-black text-[15px] font-extrabold uppercase tracking-wider rounded-[10px] shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-300 mt-2'
        >
          {loading ? 'Logging in...' : 'Log In'}
        </Button>

        <div className='mt-8 pt-6 text-center'>
          <p className='text-[13.5px] text-gray-500 font-medium'>
            Need help?{' '}
            <a
              href='mailto:info@theceoinfluencers.com'
              className='text-[#0B132B] font-bold hover:text-[#F6B72D] underline transition-colors'
            >
              Contact Us
            </a>
          </p>
        </div>
      </form>
    </div>
  )
}

export default SignIn
