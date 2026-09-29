import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '@/services/authService'

const OTP_LENGTH = 8
const sanitizeOtp = (value = '') => value.replace(/[^a-zA-Z0-9]/g, '')

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(() => Array(OTP_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const otpInputRefs = useRef([])
  const otpValue = otp.join('')
  const isOtpComplete = otp.every((char) => Boolean(char))

  useEffect(() => {
    if (step === 2 && !loading) {
      otpInputRefs.current[0]?.focus()
    }
  }, [step, loading])

  const focusOtpField = (index) => {
    const field = otpInputRefs.current[index]
    if (!field) {
      return
    }
    field.focus()
    field.select()
  }

  const applyOtpChars = (rawValue, startIndex) => {
    const chars = sanitizeOtp(rawValue)
      .slice(0, OTP_LENGTH - startIndex)
      .split('')

    if (!chars.length) {
      return
    }

    setOtp((prev) => {
      const next = [...prev]
      chars.forEach((char, offset) => {
        next[startIndex + offset] = char
      })
      return next
    })

    const targetIndex = Math.min(startIndex + chars.length, OTP_LENGTH - 1)
    requestAnimationFrame(() => {
      focusOtpField(targetIndex)
    })
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await authService.forgotPassword(email)
      setSuccess('OTP sent to your email successfully!')
      setOtp(Array(OTP_LENGTH).fill(''))
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()

    if (!isOtpComplete) {
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await authService.verifyOTP(email, otpValue)
      setSuccess('OTP verified successfully!')
      setStep(3)
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(email, otpValue, newPassword)
      setSuccess(
        'Password reset successfully! You can now login with your new password.',
      )
      // Reset form
      setEmail('')
      setOtp(Array(OTP_LENGTH).fill(''))
      setNewPassword('')
      setConfirmPassword('')
      setStep(1)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (value, index) => {
    const sanitizedValue = sanitizeOtp(value)
    if (!sanitizedValue) {
      setOtp((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }

    applyOtpChars(sanitizedValue, index)
  }

  const handleOtpPaste = (e, index) => {
    e.preventDefault()
    applyOtpChars(e.clipboardData.getData('text'), index)
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      setOtp((prev) => {
        const next = [...prev]
        if (next[index]) {
          next[index] = ''
          return next
        }
        if (index > 0) {
          next[index - 1] = ''
          requestAnimationFrame(() => {
            focusOtpField(index - 1)
          })
        }
        return next
      })
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusOtpField(index - 1)
    }

    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault()
      focusOtpField(index + 1)
    }
  }

  return (
    <div className='space-y-6 sm:space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-xl sm:text-2xl font-bold'>FORGOT PASSWORD</h1>
        <p className='text-sm font-exo'>
          Remembered your password?{' '}
          <Link to='/login' className=' font-bold underline'>
            Login
          </Link>
        </p>
      </div>

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

      {step === 1 && (
        <form onSubmit={handleEmailSubmit} className='space-y-5 sm:space-y-6 font-exo'>
          <div className='space-y-2'>
            <label htmlFor='email' className='text-sm sm:text-base font-medium'>
              Email Address
            </label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='e.g. email@example.com'
              className='w-full px-4 py-3 border-2 border-[#F6B72D] rounded-lg input-field  focus:border-yellow-500'
              required
              disabled={loading}
            />
          </div>
          <Button
            type='submit'
            disabled={loading}
            className='w-full bg-[#F6B72D] hover:bg-yellow-600 py-3 rounded-lg font-sans disabled:opacity-50'
          >
            {loading ? 'SENDING OTP...' : 'SEND OTP'}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit} className='space-y-5 sm:space-y-6 font-exo'>
          <div className='space-y-2'>
            <label htmlFor='otp-0' className='text-sm sm:text-base font-medium'>
              Enter OTP sent to {email}
            </label>
            <p className='text-xs text-gray-500'>
              Enter the 8-character code. You can paste the full OTP into any
              box.
            </p>
            <div className='grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-3'>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  id={`otp-${i}`}
                  type='text'
                  maxLength={OTP_LENGTH}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onPaste={(e) => handleOtpPaste(e, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  onFocus={(e) => e.target.select()}
                  autoComplete={i === 0 ? 'one-time-code' : undefined}
                  placeholder='-'
                  required
                  disabled={loading}
                  ref={(element) => {
                    otpInputRefs.current[i] = element
                  }}
                  className='w-full h-11 sm:w-12 sm:h-12 text-center text-base sm:text-lg border-2 border-[#F6B72D] rounded-lg focus:outline-none focus:border-yellow-500'
                />
              ))}
            </div>
          </div>

          <Button
            type='submit'
            disabled={loading || !isOtpComplete}
            className='w-full bg-[#F6B72D] hover:bg-yellow-600 py-3 rounded-lg font-sans disabled:opacity-50'
          >
            {loading ? 'VERIFYING...' : 'VERIFY OTP'}
          </Button>

          <Button
            type='button'
            onClick={() => setStep(1)}
            variant='outline'
            className='w-full border-[#F6B72D] text-[#F6B72D] hover:bg-[#F6B72D] hover:text-white py-3 rounded-lg font-sans'
          >
            Back
          </Button>
        </form>
      )}

      {step === 3 && (
        <form
          onSubmit={handlePasswordSubmit}
          className='space-y-5 sm:space-y-6 font-exo'
        >
          <div className='space-y-2'>
            <label htmlFor='newPassword' className='text-sm sm:text-base font-medium'>
              New Password
            </label>
            <Input
              id='newPassword'
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder='Enter new password'
              className='w-full px-4 py-3 border-2 border-[#F6B72D] rounded-lg input-field focus:border-yellow-500'
              required
              disabled={loading}
            />
          </div>
          <div className='space-y-2'>
            <label htmlFor='confirmPassword' className='text-sm font-medium'>
              Confirm New Password
            </label>
            <Input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Confirm new password'
              className='w-full px-4 py-3 border-2 border-[#F6B72D] rounded-lg input-field focus:border-yellow-500'
              required
              disabled={loading}
            />
          </div>
          <Button
            type='submit'
            disabled={loading}
            className='w-full bg-[#F6B72D] hover:bg-yellow-600 py-3 rounded-lg font-sans disabled:opacity-50'
          >
            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
          </Button>

          <Button
            type='button'
            onClick={() => setStep(2)}
            variant='outline'
            className='w-full border-[#F6B72D] text-[#F6B72D] hover:bg-[#F6B72D] hover:text-white py-3 rounded-lg font-sans'
          >
            Back
          </Button>
        </form>
      )}
    </div>
  )
}

export default ForgotPassword
