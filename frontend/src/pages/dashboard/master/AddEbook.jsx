import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import authService from '@/services/authService'
import masterAPIService from '@/services/masterAPIService'
import { getAssetUrl } from '@/lib/utils'

export default function AddEbook() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [file, setFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [seriesData, setSeriesData] = useState([])
  const [existingFile, setExistingFile] = useState(null)
  const [existingThumbnail, setExistingThumbnail] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    topic: 'business-critical',
    description: '',
    price: '',
    series: '',
  })

  useEffect(() => {
    if (isEditing) {
      const fetchEbook = async () => {
        try {
          setLoading(true)
          const ebook = await masterAPIService.getEbookDetails(id)
          if (ebook) {
            setFormData({
              title: ebook.title || '',
              topic: ebook.topic || 'business-critical',
              description: ebook.description || '',
              price: ebook.price || '',
              series: ebook.series?.id ? ebook.series.id.toString() : '',
            })
            // Set existing files for display
            if (ebook.fileName) {
              setExistingFile({
                name: ebook.fileName.split('/').pop(),
                url: ebook.file,
                size: ebook.fileSize,
              })
            }
            if (ebook.coverImage) {
              setExistingThumbnail({
                url: ebook.coverImage,
              })
            }
          }
        } catch (err) {
          console.error('Failed to fetch ebook:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchEbook()
    }
  }, [id, isEditing])

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const data = await masterAPIService.getSeries()
        setSeriesData(Array.isArray(data) ? data : data.series || [])
      } catch (err) {
        console.error('Failed to fetch series:', err)
      }
    }
    fetchSeries()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      // Create FormData for file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('topic', formData.topic)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      if (formData.series) {
        formDataToSend.append('seriesID', formData.series)
      }

      if (file) {
        formDataToSend.append('file', file)
      }
      if (thumbnail) {
        if (isEditing) {
          // For editing, align with backend field name used in EditEbookView
          formDataToSend.append('coverImage', thumbnail)
        } else {
          // For create, use the field expected by AddEbookSerializer
          formDataToSend.append('thumbnailImage', thumbnail)
        }
      }

      if (isEditing) {
        await authService.updateEbookAdmin(id, formDataToSend)
      } else {
        await authService.createEbookAdmin(formDataToSend)
      }

      navigate('/admin-dashboard/ebooks')
    } catch (err) {
      console.error('Failed to save ebook:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin-dashboard/ebooks')
  }

  const handleThumbnailSave = async () => {
    if (!isEditing || !thumbnail) {
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      // For the standalone thumbnail save, use coverImage to match EditEbookView
      formData.append('coverImage', thumbnail)
      await authService.updateEbookAdmin(id, formData)
    } catch (err) {
      console.error('Failed to save thumbnail:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType='multipart/form-data'
      className='max-w-[90%] '
    >
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
        {isEditing ? 'Edit Ebook' : 'Add an Ebook'}
      </h2>

      {/* Title */}
      <div className='mb-4 font-exo'>
        <Label htmlFor='title'>Title</Label>
        <Input
          id='title'
          placeholder='This is new chapter title'
          className='input-field bg-white'
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
        />
      </div>

      <div className='mb-4 font-exo'>
        <Label>Topic</Label>
        <Select
          value={formData.topic}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, topic: value }))
          }
        >
          <SelectTrigger className='w-full border-2 border-[#F6B72D] rounded-md focus:ring-2 focus:ring-[#F6B72D] focus:border-[#F6B72D] bg-white'>
            <SelectValue className='text-gray-400' />
          </SelectTrigger>
          <SelectContent className='z-10 bg-white border border-gray-200 rounded-md shadow-md font-exo'>
            <SelectItem value='business-critical' className='text-gray-400'>
              Business Critical
            </SelectItem>
            <SelectItem value='leadership'>Leadership</SelectItem>
            <SelectItem value='innovation'>Innovation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Series */}
      <div className='mb-4 font-exo'>
        <Label>Series</Label>
        <Select
          value={formData.series}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, series: value }))
          }
        >
          <SelectTrigger className='w-full border-2 border-[#F6B72D] rounded-md focus:ring-2 focus:ring-[#F6B72D] focus:border-[#F6B72D] bg-white'>
            <SelectValue
              className='text-gray-400'
              placeholder='Select a series'
            />
          </SelectTrigger>
          <SelectContent className='z-10 bg-white border border-gray-200 rounded-md shadow-md font-exo'>
            {seriesData.map((series) => (
              <SelectItem
                key={series.id}
                value={series.id.toString()}
                className='text-gray-700 cursor-pointer hover:bg-gray-50'
              >
                {series.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Short Description */}
      <div className='mb-4 font-exo'>
        <Label htmlFor='description'>Short Description</Label>
        <Textarea
          id='description'
          placeholder='This is the short description'
          className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg input-field bg-white'
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      {/* Price */}
      <div className='mb-4 font-exo'>
        <Label htmlFor='price'>Price</Label>
        <Input
          id='price'
          type='number'
          placeholder='4.00'
          className='input-field bg-white'
          value={formData.price}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, price: e.target.value }))
          }
        />
      </div>

      {/* File Upload */}
      <div className='mb-4 font-exo'>
        <Label>File</Label>
        <div className='flex items-center justify-between'>
          <div>
            {file ? (
              <span className='text-sm text-gray-700'>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                <button
                  type='button'
                  className='text-red-500 ml-2'
                  onClick={() => setFile(null)}
                >
                  Remove
                </button>
              </span>
            ) : existingFile ? (
              <span className='text-sm text-gray-700'>
                {existingFile.name} (
                {(existingFile.size / 1024 / 1024).toFixed(2)} MB)
                <span className='text-green-600 ml-2'>✓ Current file</span>
              </span>
            ) : (
              <span className='text-sm text-gray-500'>No file selected</span>
            )}
          </div>
          <div>
            <Input
              type='file'
              accept='.pdf'
              className='hidden'
              id='fileUpload'
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button
              type='button'
              variant='outline'
              className='flex items-center gap-2 b border-2 border-[#F6B72D] font-sans'
              onClick={() => document.getElementById('fileUpload')?.click()}
            >
              {existingFile ? 'Replace File' : 'Upload File'}
            </Button>
          </div>
        </div>
      </div>

      {/* Thumbnail Upload */}
      <div className='mb-6 font-exo'>
        <Label>Thumbnail</Label>
        <div className='border-2 border-[#F6B72D] rounded-lg p-4 bg-white'>
          <div className='flex items-center gap-6'>
            {/* Left: Thumbnail Preview */}
            <div className='w-20 h-20 border border-gray-300 rounded flex items-center justify-center overflow-hidden'>
              {thumbnail ? (
                <img
                  src={URL.createObjectURL(thumbnail)}
                  alt='New thumbnail'
                  className='w-full h-full object-cover'
                />
              ) : existingThumbnail ? (
                <img
                  src={getAssetUrl(existingThumbnail.url)}
                  alt='Current thumbnail'
                  className='w-full h-full object-cover'
                />
              ) : (
                <ImageIcon className='w-8 h-8 text-gray-400' />
              )}
            </div>

            {/* Right: Upload controls */}
            <div className='flex flex-col items-start space-y-2 w-full'>
              <p className='text-xs text-gray-500'>
                Please upload square image, size less than 100KB
              </p>

              {/* Hidden input */}
              <Input
                type='file'
                accept='image/*'
                className='hidden'
                id='thumbnailUpload'
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              />

              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  className='border border-[#34D399] text-[#34D399]'
                  onClick={() =>
                    document.getElementById('thumbnailUpload')?.click()
                  }
                >
                  {existingThumbnail ? 'Replace Image' : 'Choose File'}
                </Button>
                <span className='text-sm text-gray-500'>
                  {thumbnail
                    ? thumbnail.name
                    : existingThumbnail
                      ? 'Current image'
                      : 'No File Chosen'}
                </span>
              </div>
            </div>
          </div>
          <div className=' flex justify-end'>
            <Button
              type='button'
              className='bg-[#34D399] text-white font-medium px-6 rounded-md mt-2'
              onClick={handleThumbnailSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-4 pt-6'>
        <Button
          type='button'
          variant='outline'
          className='flex-1 bg-black text-white hover:bg-gray-800 border-black px-16'
          onClick={handleCancel}
        >
          CANCEL
        </Button>
        <Button
          type='submit'
          className='flex-1 bg-[#F6B72D] hover:bg-yellow-500 px-16'
          disabled={loading}
        >
          {loading ? 'SAVING...' : 'SUBMIT'}
        </Button>
      </div>
    </form>
  )
}
