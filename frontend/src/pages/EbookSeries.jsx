import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import EbookSeriesBooks from '@/components/EbookSeriesBooks'
import EbookSeriesHero from '@/components/EbookSeriesHero'
import authService from '@/services/authService'

export default function EbookSeries() {
  const { seriesId } = useParams()
  const [seriesData, setSeriesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        setLoading(true)
        setError('')

        if (seriesId) {
          const data = await authService.getEbooksBySeries(seriesId)
          setSeriesData(data)
          return
        }

        const allEbooks = await authService.getPeopleEbooks()
        setSeriesData({
          series: null,
          ebooks: allEbooks?.ebooks || [],
        })
      } catch (err) {
        setError('Failed to load ebook series')
        console.error('Series error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSeriesData()
  }, [seriesId])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error || !seriesData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Series</p>
          <p className='text-sm'>{error || 'Series not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>
          {seriesData.series?.title || 'Ebook Series'} - The CEO Influencers
        </title>
        <meta
          name='description'
          content={
            seriesData.series?.description
              ? seriesData.series.description.substring(0, 160)
              : 'Explore our ebook series on leadership and business.'
          }
        />
        <meta
          name='keywords'
          content='ebook series, leadership, business, CEO, ebooks'
        />
        <meta
          property='og:title'
          content={`${seriesData.series?.title || 'Ebook Series'} - The CEO Influencers`}
        />
        <meta
          property='og:description'
          content={
            seriesData.series?.description
              ? seriesData.series.description.substring(0, 160)
              : 'Discover our curated ebook series.'
          }
        />
        <meta
          property='og:image'
          content={
            seriesData.series?.cover_image || '/images/series-default.jpg'
          }
        />
        <meta property='og:url' content={window.location.href} />
        <meta name='twitter:card' content='summary_large_image' />
        <link rel='canonical' href={window.location.href} />
      </Helmet>
      <EbookSeriesHero seriesData={seriesData.series} />
      <EbookSeriesBooks ebooks={seriesData.ebooks} />
    </div>
  )
}
