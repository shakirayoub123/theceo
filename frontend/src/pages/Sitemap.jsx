import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import authService from '@/services/authService'

export default function Sitemap() {
  const [sitemapData, setSitemapData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        setLoading(true)
        const response = await authService.get('/lms/sitemap/')
        setSitemapData(response.sitemap || [])
      } catch (err) {
        console.error('Error fetching sitemap:', err)
        setError('Failed to load sitemap')
      } finally {
        setLoading(false)
      }
    }

    fetchSitemap()
  }, [])

  const groupByType = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = []
      }
      acc[item.type].push(item)
      return acc
    }, {})
  }

  const groupedData = groupByType(sitemapData)

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-red-600 text-center'>
          <p className='text-xl font-semibold mb-2'>Error Loading Sitemap</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Sitemap - The CEO Influencers</title>
        <meta
          name='description'
          content='Explore the complete sitemap of The CEO Influencers website. Find all our pages, ebooks, blogs, services, and newsletters in one place.'
        />
        <meta
          name='keywords'
          content='sitemap, CEO influencers, ebooks, blogs, services, newsletters'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-black mb-4'>Sitemap</h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            Navigate through all pages and content on The CEO Influencers
            platform. Find ebooks, blogs, services, and more.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {Object.entries(groupedData).map(([type, items]) => (
            <div key={type} className='bg-gray-50 rounded-lg p-6'>
              <h2 className='text-2xl font-bold text-black mb-4 capitalize'>
                {type === 'static' ? 'Main Pages' : type}
              </h2>
              <ul className='space-y-2'>
                {items.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={item.url}
                      className='text-[#F6B72D] hover:text-[#e6b82a] transition-colors duration-200 block'
                    >
                      {item.url === '/'
                        ? 'Home'
                        : item.url
                            .replace('/', '')
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Link>
                    {item.lastmod && (
                      <span className='text-sm text-gray-500 block'>
                        Last updated:{' '}
                        {new Date(item.lastmod).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='mt-12 text-center'>
          <p className='text-gray-600 mb-4'>
            This sitemap is automatically generated and updated as new content
            is added.
          </p>
          <Link
            to='/'
            className='inline-block bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-bold py-3 px-6 rounded-full transition-colors duration-200'
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
