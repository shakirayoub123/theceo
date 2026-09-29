import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import authService from '@/services/authService'

const AddNewsletterModal = ({ newsletter, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    scheduled_date: '',
    status: 'draft',
    tags: '',
    is_featured: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (newsletter) {
      setFormData({
        title: newsletter.title || '',
        content: newsletter.content || '',
        subject: newsletter.subject || '',
        scheduled_date: newsletter.scheduled_date || '',
        status: newsletter.status || 'draft',
        tags: newsletter.tags ? newsletter.tags.join(', ') : '',
        is_featured: newsletter.is_featured || false,
      })
    }
  }, [newsletter])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')

      const submitData = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        scheduled_date: formData.scheduled_date || null,
      }

      if (newsletter) {
        await authService.updateNewsletterAdmin(newsletter.id, submitData)
      } else {
        await authService.createNewsletterAdmin(submitData)
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save newsletter')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-xl font-bold mb-6'>
          {newsletter ? 'Edit Newsletter' : 'Create New Newsletter'}
        </h3>

        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                name='title'
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder='Enter newsletter title'
              />
            </div>

            <div>
              <Label htmlFor='subject'>Subject Line *</Label>
              <Input
                id='subject'
                name='subject'
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder='Enter email subject line'
              />
            </div>

            <div>
              <Label htmlFor='status'>Status</Label>
              <select
                id='status'
                name='status'
                value={formData.status}
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent'
              >
                <option value='draft'>Draft</option>
                <option value='scheduled'>Scheduled</option>
                <option value='sent'>Sent</option>
                <option value='cancelled'>Cancelled</option>
              </select>
            </div>

            <div>
              <Label htmlFor='scheduled_date'>Scheduled Date</Label>
              <Input
                id='scheduled_date'
                name='scheduled_date'
                type='datetime-local'
                value={formData.scheduled_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='content'>Content *</Label>
            <Textarea
              id='content'
              name='content'
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={8}
              placeholder='Enter newsletter content (HTML or plain text)'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='tags'>Tags</Label>
              <Input
                id='tags'
                name='tags'
                value={formData.tags}
                onChange={handleInputChange}
                placeholder='Enter tags separated by commas'
              />
            </div>

            <div className='flex items-center space-x-2 pt-8'>
              <input
                type='checkbox'
                id='is_featured'
                name='is_featured'
                checked={formData.is_featured}
                onChange={handleInputChange}
                className='w-4 h-4 text-[#F6B72D] border-gray-300 rounded focus:ring-[#F6B72D]'
              />
              <Label htmlFor='is_featured'>Featured Newsletter</Label>
            </div>
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
              type='submit'
              disabled={saving}
              className='bg-[#F6B72D] hover:bg-[#e6b82a] text-white'
            >
              {saving
                ? 'Saving...'
                : newsletter
                  ? 'Update Newsletter'
                  : 'Create Newsletter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNewsletterModal
