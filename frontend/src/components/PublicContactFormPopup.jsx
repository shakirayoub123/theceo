import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Mail, MessageCircle, Minimize2, Send, X } from 'lucide-react'
import authService from '@/services/authService'

const INITIAL_FORM = {
  name: '',
  email: '',
  message: '',
}

export default function PublicContactFormPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    setIsMinimized(false)
    setError('')
    setSuccess('')
  }

  const closePopup = () => {
    setIsOpen(false)
    setIsMinimized(false)
    setError('')
    setSuccess('')
    setLoading(false)
    setForm(INITIAL_FORM)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in name, email, and message.')
      return
    }

    setLoading(true)
    try {
      await authService.submitPublicContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      })
      setSuccess('Message sent. We will get back to you shortly.')
      setForm(INITIAL_FORM)
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className='fixed bottom-6 right-6 z-50'>
        <Button
          onClick={toggleChat}
          className='w-14 h-14 rounded-full bg-[#F6B72D] hover:bg-[#F6B72D]/90 shadow-lg'
          size='icon'
          aria-label='Open contact form'
        >
          <MessageCircle className='w-6 h-6 text-white' />
        </Button>
      </div>
    )
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <Card
        className={`w-[calc(100vw-2rem)] max-w-sm h-[520px] bg-white shadow-xl border-2 border-[#F6B72D] flex flex-col transition-all duration-300 font-exo ${
          isMinimized ? 'h-14' : ''
        }`}
      >
        <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0 flex-shrink-0'>
          <CardTitle className='text-sm font-semibold text-gray-900'>
            Contact Us
          </CardTitle>
          <div className='flex gap-1'>
            <Button
              onClick={() => setIsMinimized((prev) => !prev)}
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0 hover:bg-gray-100'
              aria-label='Minimize contact form'
            >
              <Minimize2 className='w-3 h-3' />
            </Button>
            <Button
              onClick={closePopup}
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0 hover:bg-gray-100'
              aria-label='Close contact form'
            >
              <X className='w-3 h-3' />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className='flex-1 p-3 pt-0 flex flex-col overflow-hidden'>
            <div className='mb-3 p-2 rounded-md bg-[#F6B72D]/10 border border-[#F6B72D]/30 text-xs text-gray-700 flex items-start gap-2'>
              <Mail className='w-4 h-4 mt-0.5 text-[#1a2332]' />
              <span>
                Send us a message and we will reply to your email shortly.
              </span>
            </div>

            {(error || success) && (
              <div
                className={`mb-3 p-2 rounded-md text-xs ${
                  error
                    ? 'bg-red-100 border border-red-300 text-red-700'
                    : 'bg-green-100 border border-green-300 text-green-700'
                }`}
              >
                {error || success}
              </div>
            )}

            <form className='flex-1 flex flex-col gap-3' onSubmit={handleSubmit}>
              <Input
                type='text'
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder='Name'
                disabled={loading}
                className='border-[#F6B72D]/70 focus-visible:ring-[#F6B72D]'
              />
              <Input
                type='email'
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder='Email'
                disabled={loading}
                className='border-[#F6B72D]/70 focus-visible:ring-[#F6B72D]'
              />
              <textarea
                value={form.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder='Message'
                disabled={loading}
                className='flex-1 min-h-[180px] rounded-md border border-[#F6B72D]/70 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B72D]'
              />
              <Button
                type='submit'
                disabled={loading}
                className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-semibold'
              >
                <Send className='w-4 h-4 mr-2' />
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
