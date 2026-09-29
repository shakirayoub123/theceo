import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import authService from '@/services/authService'

const AddEbookModal = ({ ebook, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    author: '',
    isbn: '',
    pages: '',
    language: 'English',
    published_date: '',
    cover_image_url: '',
    sample_pdf_url: '',
    full_pdf_url: '',
    tags: '',
    is_featured: false,
    is_available: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ebook) {
      setFormData({
        title: ebook.title || '',
        description: ebook.description || '',
        price: ebook.price || '',
        category: ebook.category || '',
        author: ebook.author || '',
        isbn: ebook.isbn || '',
        pages: ebook.pages || '',
        language: ebook.language || 'English',
        published_date: ebook.published_date || '',
        cover_image_url: ebook.cover_image_url || '',
        sample_pdf_url: ebook.sample_pdf_url || '',
        full_pdf_url: ebook.full_pdf_url || '',
        tags: ebook.tags ? ebook.tags.join(', ') : '',
        is_featured: ebook.is_featured || false,
        is_available: ebook.is_available !== false,
      })
    }
  }, [ebook])

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
        price: parseFloat(formData.price),
        pages: parseInt(formData.pages),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        published_date:
          formData.published_date || new Date().toISOString().split('T')[0],
      }

      if (ebook) {
        await authService.updateEbookAdmin(ebook.id, submitData)
      } else {
        await authService.createEbookAdmin(submitData)
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save ebook')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-xl font-bold mb-6'>
          {ebook ? 'Edit Ebook' : 'Add New Ebook'}
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
                placeholder='Enter ebook title'
              />
            </div>

            <div>
              <Label htmlFor='author'>Author *</Label>
              <Input
                id='author'
                name='author'
                value={formData.author}
                onChange={handleInputChange}
                required
                placeholder='Enter author name'
              />
            </div>

            <div>
              <Label htmlFor='category'>Category *</Label>
              <Input
                id='category'
                name='category'
                value={formData.category}
                onChange={handleInputChange}
                required
                placeholder='Enter category'
              />
            </div>

            <div>
              <Label htmlFor='price'>Price *</Label>
              <Input
                id='price'
                name='price'
                type='number'
                step='0.01'
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder='0.00'
              />
            </div>

            <div>
              <Label htmlFor='isbn'>ISBN</Label>
              <Input
                id='isbn'
                name='isbn'
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder='Enter ISBN'
              />
            </div>

            <div>
              <Label htmlFor='pages'>Pages</Label>
              <Input
                id='pages'
                name='pages'
                type='number'
                value={formData.pages}
                onChange={handleInputChange}
                placeholder='Enter number of pages'
              />
            </div>

            <div>
              <Label htmlFor='language'>Language</Label>
              <Input
                id='language'
                name='language'
                value={formData.language}
                onChange={handleInputChange}
                placeholder='Enter language'
              />
            </div>

            <div>
              <Label htmlFor='published_date'>Published Date</Label>
              <Input
                id='published_date'
                name='published_date'
                type='date'
                value={formData.published_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='description'>Description *</Label>
            <Textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder='Enter ebook description'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='cover_image_url'>Cover Image URL</Label>
              <Input
                id='cover_image_url'
                name='cover_image_url'
                value={formData.cover_image_url}
                onChange={handleInputChange}
                placeholder='Enter cover image URL'
              />
            </div>

            <div>
              <Label htmlFor='sample_pdf_url'>Sample PDF URL</Label>
              <Input
                id='sample_pdf_url'
                name='sample_pdf_url'
                value={formData.sample_pdf_url}
                onChange={handleInputChange}
                placeholder='Enter sample PDF URL'
              />
            </div>

            <div>
              <Label htmlFor='full_pdf_url'>Full PDF URL</Label>
              <Input
                id='full_pdf_url'
                name='full_pdf_url'
                value={formData.full_pdf_url}
                onChange={handleInputChange}
                placeholder='Enter full PDF URL'
              />
            </div>

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
          </div>

          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='is_featured'
                name='is_featured'
                checked={formData.is_featured}
                onChange={handleInputChange}
                className='w-4 h-4 text-[#F6B72D] border-gray-300 rounded focus:ring-[#F6B72D]'
              />
              <Label htmlFor='is_featured'>Featured Ebook</Label>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='is_available'
                name='is_available'
                checked={formData.is_available}
                onChange={handleInputChange}
                className='w-4 h-4 text-[#F6B72D] border-gray-300 rounded focus:ring-[#F6B72D]'
              />
              <Label htmlFor='is_available'>Available for Purchase</Label>
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
              {saving ? 'Saving...' : ebook ? 'Update Ebook' : 'Add Ebook'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEbookModal
