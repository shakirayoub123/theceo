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
      <div className='mb-8 sm:mb-10'>
        <h2 className='text-[32px] sm:text-[36px] font-bold text-[#111827] tracking-tight mb-2'>
          Sign in
        </h2>
        <p className='text-[14px] text-gray-500 font-medium'>
          Please login to continue to your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && (
          <div className='p-3 bg-red-50 text-[13px] font-medium border border-red-200 text-red-600 rounded-lg'>
            {error}
          </div>
        )}

        <div className='relative mt-2'>
          <label
            htmlFor='email'
            className='absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold tracking-wide text-[#F59E0B] z-10'
          >
            Email
          </label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder='jonas_kahnwald@gmail.com'
            className='w-full h-[52px] sm:h-[56px] px-4 text-[14px] sm:text-[15px] font-medium text-[#111827] rounded-[8px] border-[1.5px] border-[#F59E0B] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#F59E0B] outline-none shadow-sm placeholder:text-gray-400 transition-colors bg-transparent relative z-0'
            required
            disabled={loading}
          />
        </div>

        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder='Password'
            className='w-full h-[52px] sm:h-[56px] px-4 text-[14px] sm:text-[15px] font-medium text-[#111827] rounded-[8px] border-[1.5px] border-[#E5E7EB] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-400 outline-none shadow-sm placeholder:text-gray-400 transition-colors pr-12'
            required
            disabled={loading}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none'
          >
            {showPassword ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
          </button>
        </div>

        <div className='flex justify-end pt-1 pb-3'>
          <Link to='/forget-password' className='text-[13px] font-bold text-[#111827] hover:text-[#F59E0B] transition-colors'>
            Forget password?
          </Link>
        </div>

        <Button
          type='submit'
          disabled={loading}
          className='w-full h-[50px] sm:h-[54px] bg-[#F59E0B] hover:bg-[#d98b09] text-white text-[15px] font-bold rounded-[8px] shadow-sm disabled:opacity-50 transition-colors'
        >
          {loading ? 'Logging in...' : 'Log in'}
        </Button>



        <div className='mt-8 pt-6 text-center'>
          <p className='text-[13.5px] text-gray-500 font-medium'>
            Need Help?{' '}
            <a
              href='mailto:info@theceoinfluencers.com'
              className='text-[#F59E0B] font-bold hover:underline transition-colors'
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
