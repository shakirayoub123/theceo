import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageIcon, FileText } from 'lucide-react'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'

/**
 * AddNewsletter Component
 *
 * Backend API Requirements (Frontend Ready):
 * - title (required): Newsletter title
 * - short_description (optional): Brief description
 * - file (required): PDF file upload
 * - thumbnailImage (optional): Image file upload
 * - pages (optional): Number of pages
 * - schedule_on (optional): Schedule publication date
 *
 * MISSING BACKEND ENDPOINTS (Need Implementation):
 * - POST /api/lms/admin/newsletter/add/ - Create newsletter
 * - PUT /api/lms/admin/newsletter/edit/{id}/ - Update newsletter
 */

export default function AddNewsletter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [file, setFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [existingThumbnail, setExistingThumbnail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    pages: '',
    schedule_on: '',
  })

  useEffect(() => {
    if (isEditing) {
      const fetchNewsletter = async () => {
        try {
          setLoading(true)
          setError('')
          const newsletter = await authService.getAdminNewsletterDetails(id)
          if (newsletter) {
            setFormData({
              title: newsletter.title || '',
              short_description: newsletter.short_description || '',
              pages: newsletter.pages ? newsletter.pages.toString() : '',
              schedule_on: newsletter.schedule_on
                ? new Date(newsletter.schedule_on).toISOString().slice(0, 16)
                : '',
            })
            setExistingThumbnail(getAssetUrl(newsletter.thumbnail))
          }
        } catch (err) {
          console.error('Failed to fetch newsletter:', err)
          setError('Failed to load newsletter details. Please try again.')
        } finally {
          setLoading(false)
        }
      }
      fetchNewsletter()
    }
  }, [id, isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    if (!file) {
      setError('PDF file is required')
      return
    }

    try {
      setLoading(true)

      // Create FormData with exact field names backend expects
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title.trim())

      if (formData.short_description.trim()) {
        formDataToSend.append(
          'short_description',
          formData.short_description.trim(),
        )
      }

      formDataToSend.append('file', file)

      if (thumbnail) {
        formDataToSend.append('thumbnailImage', thumbnail)
      }

      if (formData.pages && formData.pages.trim()) {
        formDataToSend.append('pages', formData.pages.trim())
      }

      if (formData.schedule_on) {
        formDataToSend.append('schedule_on', formData.schedule_on)
      }

      // Log FormData contents for debugging
      console.log('FormData entries:')
      for (let [key, value] of formDataToSend.entries()) {
        console.log(
          `  ${key}:`,
          value instanceof File
            ? `File(${value.name}, ${value.size} bytes, type: ${value.type})`
            : `"${value}"`,
        )
      }

      console.log(
        'Submitting newsletter request with cookie-authenticated session',
      )

      if (isEditing) {
        await authService.updateNewsletterAdmin(id, formDataToSend)
        setSuccess('Newsletter updated successfully!')
      } else {
        await authService.createNewsletterAdmin(formDataToSend)
        setSuccess('Newsletter created successfully!')
      }

      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/admin-dashboard/newsletters')
      }, 1500)
    } catch (err) {
      console.error('Failed to save newsletter:', err)
      setError(err.message || 'Failed to save newsletter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin-dashboard/newsletters')
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType='multipart/form-data'
      className=' space-y-8 font-exo'
    >
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        {isEditing ? 'Edit Newsletter' : 'Add Newsletter'}
      </h2>

      {/* Error Message */}
      {error && (
        <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className='mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded'>
          {success}
        </div>
      )}

      {/* Title */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>Title</label>
        <Input
          placeholder='Enter newsletter title'
          className='input-field'
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>

      {/* Short Description */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>
          Short Description
        </label>
        <Input
          placeholder='Enter short description'
          className='input-field'
          value={formData.short_description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              short_description: e.target.value,
            }))
          }
        />
      </div>

      {/* Pages */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>
          Number of Pages
        </label>
        <Input
          type='number'
          placeholder='Enter number of pages'
          className='input-field'
          value={formData.pages}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, pages: e.target.value }))
          }
        />
      </div>

      {/* Schedule On */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>
          Schedule On
        </label>
        <Input
          type='datetime-local'
          className='input-field'
          value={formData.schedule_on}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, schedule_on: e.target.value }))
          }
        />
      </div>

      {/* File Upload */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>PDF File</label>
        <div className='border-2 border-[#F6B72D] rounded-xl p-6 text-center hover:border-[#F6B72D] transition'>
          <div className='w-20 h-20 border border-gray-300 rounded mx-auto mb-4 flex items-center justify-center'>
            <FileText className='w-8 h-8 text-gray-400' />
          </div>
          <p className='text-sm text-gray-500 mb-3'>Upload PDF file</p>
          <p className='text-xs text-gray-400 mb-3'>
            {file ? file.name : 'No file chosen'}
          </p>
          <Input
            type='file'
            accept='.pdf'
            className='hidden'
            id='file'
            onChange={(e) => {
              const selectedFile = e.target.files?.[0]
              if (selectedFile) {
                // Check file size (max 50MB)
                if (selectedFile.size > 50 * 1024 * 1024) {
                  alert('File size must be less than 50MB')
                  return
                }
                // Check file type
                if (selectedFile.type !== 'application/pdf') {
                  alert('Please select a valid PDF file')
                  return
                }
              }
              setFile(selectedFile || null)
            }}
            required={!isEditing}
          />
          <label
            htmlFor='file'
            className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block'
          >
            Choose File
          </label>
        </div>
      </div>

      {/* Thumbnail */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>Thumbnail</label>
        <div className='border-2 border-[#F6B72D] rounded-xl p-6 text-center hover:border-[#F6B72D] transition'>
          {existingThumbnail && !thumbnail ? (
            <div className='w-20 h-20 border border-gray-300 rounded mx-auto mb-4 flex items-center justify-center overflow-hidden'>
              <img
                src={existingThumbnail}
                alt='Current thumbnail'
                className='w-full h-full object-cover'
              />
            </div>
          ) : (
            <div className='w-20 h-20 border border-gray-300 rounded mx-auto mb-4 flex items-center justify-center'>
              <ImageIcon className='w-8 h-8 text-gray-400' />
            </div>
          )}
          <p className='text-sm text-gray-500 mb-3'>
            Upload square image (max 10MB)
          </p>
          <p className='text-xs text-gray-400 mb-3'>
            {thumbnail
              ? thumbnail.name
              : existingThumbnail
                ? 'Current thumbnail loaded'
                : 'No file chosen'}
          </p>
          <Input
            type='file'
            accept='image/*'
            className='hidden'
            id='thumbnail'
            onChange={(e) => {
              const selectedFile = e.target.files?.[0]
              if (selectedFile) {
                // Check file size (max 100KB as mentioned in UI)
                if (selectedFile.size > 10000 * 1024) {
                  alert('Thumbnail image must be less than 10MB')
                  return
                }
                // Check file type
                if (!selectedFile.type.startsWith('image/')) {
                  alert('Please select a valid image file')
                  return
                }
              }
              setThumbnail(selectedFile || null)
            }}
          />
          <label
            htmlFor='thumbnail'
            className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block'
          >
            {existingThumbnail ? 'Change File' : 'Choose File'}
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-4'>
        <Button
          type='button'
          onClick={handleCancel}
          className='rounded-lg px-20 py-2 bg-black hover:bg-black text-white'
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          className='rounded-lg px-20 py-2 bg-[#F6B72D] hover:bg-[#e6b82a]'
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Submit'}
        </Button>
      </div>
    </form>
  )
}
