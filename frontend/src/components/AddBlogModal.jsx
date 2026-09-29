import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import authService from '@/services/authService'

const AddBlogModal = ({ blog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category: '',
    tags: '',
    featured_image_url: '',
    status: 'draft',
    published_date: '',
    is_featured: false,
    seo_title: '',
    seo_description: '',
    slug: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || '',
        author: blog.author || '',
        category: blog.category || '',
        tags: blog.tags ? blog.tags.join(', ') : '',
        featured_image_url: blog.featured_image_url || '',
        status: blog.status || 'draft',
        published_date: blog.published_date || '',
        is_featured: blog.is_featured || false,
        seo_title: blog.seo_title || '',
        seo_description: blog.seo_description || '',
        slug: blog.slug || '',
      })
    }
  }, [blog])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleTitleChange = (e) => {
    const title = e.target.value
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    setFormData((prev) => ({
      ...prev,
      title,
      slug,
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
        published_date:
          formData.published_date ||
          (formData.status === 'published' ? new Date().toISOString() : null),
      }

      if (blog) {
        await authService.updateBlogAdmin(blog.id, submitData)
      } else {
        await authService.createBlogAdmin(submitData)
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-xl font-bold mb-6'>
          {blog ? 'Edit Blog Post' : 'Create New Blog Post'}
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
                onChange={handleTitleChange}
                required
                placeholder='Enter blog title'
              />
            </div>

            <div>
              <Label htmlFor='slug'>Slug</Label>
              <Input
                id='slug'
                name='slug'
                value={formData.slug}
                onChange={handleInputChange}
                placeholder='URL slug (auto-generated)'
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
              <Label htmlFor='status'>Status</Label>
              <select
                id='status'
                name='status'
                value={formData.status}
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent'
              >
                <option value='draft'>Draft</option>
                <option value='published'>Published</option>
                <option value='archived'>Archived</option>
              </select>
            </div>

            <div>
              <Label htmlFor='published_date'>Published Date</Label>
              <Input
                id='published_date'
                name='published_date'
                type='datetime-local'
                value={formData.published_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='excerpt'>Excerpt</Label>
            <Textarea
              id='excerpt'
              name='excerpt'
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={3}
              placeholder='Brief summary of the blog post'
            />
          </div>

          <div>
            <Label htmlFor='content'>Content *</Label>
            <Textarea
              id='content'
              name='content'
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={10}
              placeholder='Enter blog content (HTML or Markdown)'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='featured_image_url'>Featured Image URL</Label>
              <Input
                id='featured_image_url'
                name='featured_image_url'
                value={formData.featured_image_url}
                onChange={handleInputChange}
                placeholder='Enter featured image URL'
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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='seo_title'>SEO Title</Label>
              <Input
                id='seo_title'
                name='seo_title'
                value={formData.seo_title}
                onChange={handleInputChange}
                placeholder='SEO title (optional)'
              />
            </div>

            <div>
              <Label htmlFor='seo_description'>SEO Description</Label>
              <Input
                id='seo_description'
                name='seo_description'
                value={formData.seo_description}
                onChange={handleInputChange}
                placeholder='SEO description (optional)'
              />
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='is_featured'
              name='is_featured'
              checked={formData.is_featured}
              onChange={handleInputChange}
              className='w-4 h-4 text-[#F6B72D] border-gray-300 rounded focus:ring-[#F6B72D]'
            />
            <Label htmlFor='is_featured'>Featured Post</Label>
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
              className='bg-[#F6B72D] hover:bg-[#e6b72a] text-white'
            >
              {saving ? 'Saving...' : blog ? 'Update Blog' : 'Create Blog'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBlogModal
