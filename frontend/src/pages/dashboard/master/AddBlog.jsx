import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAssetUrl } from '@/lib/utils'
import authService from '@/services/authService'
import { ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DefaultEditor from 'react-simple-wysiwyg'

export default function AddBlog() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [thumbnail, setThumbnail] = useState(null)
  const [existingThumbnail, setExistingThumbnail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editorData, setEditorData] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    topic: 'business-critical',
    short_description: '',
    content: '',
    time_to_read: '',
  })

  useEffect(() => {
    if (isEditing) {
      const fetchBlog = async () => {
        try {
          setLoading(true)
          const blog = await authService.getAdminBlogDetails(id)
          if (blog) {
            setFormData({
              title: blog.title || '',
              topic: blog.topic || 'business-critical',
              short_description: blog.short_description || '',
              content: blog.content || '',
              time_to_read: blog.time_to_read || '',
            })
            console.log(blog)
            setExistingThumbnail(getAssetUrl(blog?.thumbnailImageUrl))
            setEditorData(blog.content || '')
          }
        } catch (err) {
          console.error('Failed to fetch blog:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchBlog()
    }
  }, [id, isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      // Create FormData for file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('topic', formData.topic)
      formDataToSend.append('short_description', formData.short_description)
      formDataToSend.append('content', editorData)
      formDataToSend.append('time_to_read', formData.time_to_read)

      if (thumbnail) {
        formDataToSend.append('thumbnailImage', thumbnail)
      }

      if (isEditing) {
        await authService.updateBlogAdmin(id, formDataToSend)
      } else {
        await authService.createBlogAdmin(formDataToSend)
      }

      navigate('/admin-dashboard/blogs')
    } catch (err) {
      console.error('Failed to save blog:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin-dashboard/blogs')
  }
  return (
    <form
      onSubmit={handleSubmit}
      encType='multipart/form-data'
      className=' space-y-8 font-exo'
    >
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        {isEditing ? 'Edit Blog' : 'Add Blog'}
      </h2>

      {/* Title */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>Title</label>
        <Input
          placeholder='Enter blog title'
          className='input-field'
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>

      {/* Topic */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>Topic</label>
        <Select
          value={formData.topic}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, topic: value }))
          }
        >
          <SelectTrigger className='border-2 border-[#F6B72D] focus:border-yellow-500 rounded-lg w-full placeholder:text-gray-400'>
            <SelectValue placeholder='Select a Topic' />
          </SelectTrigger>
          <SelectContent className='z-10 bg-white border border-gray-200 rounded-md shadow-md font-exo'>
            <SelectItem value='business-critical'>Business Critical</SelectItem>
            <SelectItem value='business-hot'>Business Hot</SelectItem>
            <SelectItem value='business-need-to-know'>
              Business Need To Know
            </SelectItem>
          </SelectContent>
        </Select>
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
          required
        />
      </div>

      {/* Time to Read */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>
          Time to Read (minutes)
        </label>
        <Input
          type='number'
          placeholder='5'
          className='input-field'
          value={formData.time_to_read}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, time_to_read: e.target.value }))
          }
          required
        />
      </div>

      {/* Content */}
      <div className='space-y-2'>
        <label className='text-sm font-semibold text-gray-700'>Content</label>
        <div className='border-2 border-[#F6B72D] rounded-lg overflow-hidden'>
          <DefaultEditor
            value={editorData}
            onChange={(e) => setEditorData(e.target.value)}
            style={{
              minHeight: '300px',
              border: 'none',
              borderRadius: '0.5rem',
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '14px',
              lineHeight: '1.6',
              padding: '1rem',
            }}
          />
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
            Upload square image (max 100KB)
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
            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
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
