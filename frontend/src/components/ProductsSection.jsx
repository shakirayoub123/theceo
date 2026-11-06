import { getAssetUrl } from '@/lib/utils'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import authService from '@/services/authService'
import mapBg2 from '@/assets/map bg 2.png'

export default function ProductsSection({ loading: externalLoading = false }) {
  const { t } = useTranslation()
  const [ebooks, setEbooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        setLoading(true)
        const ebooksData = await authService.getPeopleEbooks()
        setEbooks(ebooksData.ebooks || [])
      } catch (error) {
        console.error('Error fetching ebooks:', error)
        setEbooks([])
      } finally {
        setLoading(false)
      }
    }
    fetchEbooks()
  }, [])

  const isLoading = loading || externalLoading

  const fallbackEbooks = [
    {
      id: 'algorithmic-ceo',
      category: 'BUSINESS-CRITICAL',
      series: { title: 'FEATURED' },
      tagDesc: 'SERIES I / EBOOK 1',
      title: 'The Algorithmic CEO: Leading with Data, Not Just Guts',
      description: '"The Algorithmic CEO - Leading with Data, Not Just Guts" presents a framework for 21st-century leadership, arguing that the traditional intuition-driven model is insufficient for today\'s volatile business...',
      image: '/images/ebook2.png',
    },
    {
      id: 'executive-edge',
      category: 'BUSINESS-CRITICAL',
      series: { title: 'SERIES 2' },
      tagDesc: 'SERIES II / EBOOK 1',
      title: 'The Executive Edge: Cultivating Influence in the C-Suite',
      description: 'The eBook, "The Executive Edge: Cultivating Influence in the C-Suite," argues that modern leadership must shift from a hierarchical...',
      image: '/images/ebook3.svg',
    },
    {
      id: 'radical-ambiguity',
      category: 'BUSINESS-CRITICAL',
      series: { title: 'SERIES 1' },
      tagDesc: 'SERIES III / EBOOK 1',
      title: 'Leading Through Radical Ambiguity',
      description: 'This Ebook, "Leading Through Turbulence: Managing Economic Uncertainty to Drive Positive Change and Sustainable Growth," is an...',
      image: '/images/ebook4.svg',
    },
  ]

  let mappedEbooks = [...ebooks]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, 3)
    .map((item, index) => ({
      id: item.id,
      category: item.topic?.toUpperCase() || 'BUSINESS-CRITICAL',
      series: { title: item.series?.title?.toUpperCase() || (index === 0 ? 'FEATURED' : `SERIES ${index}`) },
      tagDesc: `SERIES ${['I', 'II', 'III'][index]} / EBOOK 1`,
      title: item.title,
      description: item.description || item.shortDescription || '',
      image: item.coverImage || item.image || '/images/ebook.svg',
    }))

  if (mappedEbooks.length === 0) mappedEbooks = fallbackEbooks

  const featuredEbook = mappedEbooks[0]
  const listEbooks = mappedEbooks.slice(1, 3)
  const featuredTitleParts = featuredEbook?.title?.startsWith('The Algorithmic CEO:')
    ? featuredEbook.title.split(/:\s*/, 2)
    : null
  const featuredSubtitleParts = featuredTitleParts?.[1]?.split(/,\s*/, 2)

  if (isLoading) {
    return (
      <section className='min-h-[calc(100vh-140px)] flex items-center justify-center bg-white font-jakarta'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </section>
    )
  }

  return (
    <section className='py-4 lg:py-5 min-h-[calc(100vh-140px)] flex flex-col justify-center bg-white font-jakarta overflow-hidden relative'>
      {/* Background Map Pattern */}
      <div
        className='absolute inset-0 z-0 opacity-100 pointer-events-none'
        style={{
          backgroundImage: `url("${mapBg2}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className='max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header Block */}
        <div className='flex flex-col items-center mb-4 lg:mb-5 gap-3'>
          <div className='max-w-3xl mx-auto text-center'>
            <div className='inline-block border border-gray-400 rounded-full px-4 py-[2px] mb-2'>
              <span className='text-[#4B5563] font-bold tracking-widest text-[9px] lg:text-[10px] uppercase'>
                WHAT WE PROVIDE
              </span>
            </div>
            <h2 className='text-[26px] lg:text-[32px] font-bold leading-none mb-2'>
              <span className='text-[#0B132B]'>OUR </span>
              <span className='text-[#F6B72D] font-sans text-[28px] lg:text-[36px]'>EBOOKS</span>
            </h2>
            <p className='text-[#6B7280] text-[12.5px] lg:text-[13.5px] leading-relaxed max-w-xl font-medium'>
              Explore our curated eBooks packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.
            </p>
          </div>

          {/* Stats Meta */}
          <div className='flex items-center justify-center gap-6 md:gap-8 pb-1 shrink-0'>
            <div className='flex flex-col'>
              <span className='text-[#9CA3AF] text-[9px] lg:text-[10px] font-bold uppercase tracking-wider mb-0.5'>CURATION</span>
              <span className='text-[#111827] text-[12px] lg:text-[13px] font-bold'>SERIES I-III / EBOOKS 1-12</span>
            </div>
            <div className='w-px h-8 bg-gray-200' />
            <div className='flex flex-col'>
              <span className='text-[#9CA3AF] text-[9px] lg:text-[10px] font-bold uppercase tracking-wider mb-0.5'>EDITIONS</span>
              <span className='text-[#111827] text-[12px] lg:text-[13px] font-bold'>III EXECUTIVE RELEASES / 2026 EDITION</span>
            </div>
          </div>
        </div>

        {/* Ebooks Layout Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch'>

          {/* Left Column: Featured Ebook */}
          {featuredEbook && (
            <div className='lg:col-span-7 h-full flex'>
              <div className='site-hover-highlight bg-[#F8F6F2] border border-[#C5C5C5] rounded-[14px] w-full p-4 lg:p-5 flex flex-col shadow-sm relative group overflow-hidden'>
                {/* Yellow left accent line */}
                <div className='absolute left-0 top-0 bottom-0 w-[4px] bg-[#F6B72D]' />

                {/* Top Tags */}
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <div className='bg-[#0B132B] text-white text-[8px] lg:text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm'>
                      {featuredEbook.category}
                    </div>
                    <div className='border border-[#F6B72D] text-[#F6B72D] text-[8px] lg:text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm'>
                      {featuredEbook.series?.title || 'FEATURED'}
                    </div>
                  </div>
                  <span className='max-w-[120px] shrink-0 text-right text-[#9CA3AF] text-[7px] sm:text-[8px] lg:text-[9px] font-medium tracking-wide leading-tight'>
                    {featuredEbook.tagDesc}
                  </span>
                </div>

                {/* Content Area */}
                <div className='flex flex-col sm:flex-row gap-4 lg:gap-5 flex-1'>
                  {/* Left: Book Cover */}
                  <div className='w-[110px] sm:w-[130px] lg:w-[150px] shrink-0 mx-auto sm:mx-0'>
                    <div className='w-full outline outline-1 outline-gray-200 shadow-2xl transition-transform duration-500 group-hover:-translate-y-1.5'>
                      <img
                        src={getAssetUrl(featuredEbook.image)}
                        alt={featuredEbook.title}
                        className='w-full h-auto object-cover'
                        onError={(e) => { e.target.src = '/images/ebook.svg' }}
                      />
                    </div>
                  </div>

                  {/* Right: Text & Actions */}
                  <div className='flex flex-col flex-1'>
                    <h3 className='text-[17px] lg:text-[20px] font-bold text-[#0B132B] leading-tight mb-2'>
                      {featuredTitleParts ? (
                        <>
                          <span className='block whitespace-nowrap'>{featuredTitleParts[0]}:</span>
                          {featuredSubtitleParts?.[1] ? (
                            <>
                              <span className='block'>{featuredSubtitleParts[0]},</span>
                              <span className='block'>{featuredSubtitleParts[1]}</span>
                            </>
                          ) : (
                            <span className='block'>{featuredTitleParts[1]}</span>
                          )}
                        </>
                      ) : featuredEbook.title}
                    </h3>
                    <div className='w-8 h-0.5 bg-[#F6B72D] rounded-full mb-2' />
                    <div className='bg-white/80 border border-[#E8E3D8] border-l-[3px] border-l-[#F6B72D] rounded-lg p-3 mb-3 flex h-[220px] sm:h-[240px] lg:h-[280px] min-h-0 flex-col'>
                      <p className='text-[#9CA3AF] text-[8px] font-bold uppercase tracking-[0.16em] mb-1'>Overview</p>
                      <div
                        className='scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6B72D]'
                        role='region'
                        aria-label={`Scrollable overview for ${featuredEbook.title}`}
                        tabIndex={0}
                      >
                        <p className='text-[#4B5563] text-[11.5px] lg:text-[12.5px] leading-relaxed font-medium'>
                          {featuredEbook.description || 'Explore the key ideas and practical insights in this eBook.'}
                        </p>
                      </div>
                    </div>
                    <div className='flex flex-col sm:flex-row items-center gap-2 mt-auto'>
                      <Link
                        to={`/ebook-detail/${featuredEbook.id}`}
                        className='w-full sm:w-auto bg-[#0B132B] hover:bg-[#1a2b5c] transition-colors text-white rounded-full flex items-center justify-center gap-2 px-4 py-2'
                      >
                        <div className='w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0'>
                          <ArrowRight className='w-2.5 h-2.5 text-[#0B132B]' />
                        </div>
                        <span className='font-bold text-[10px] tracking-wide'>PURCHASE NOW</span>
                      </Link>
                      <Link
                        to={`/ebook-detail/${featuredEbook.id}?preview=true`}
                        className='w-full sm:w-auto bg-[#F6B72D] hover:bg-[#e6a820] transition-colors text-black rounded-full flex items-center justify-center gap-2 px-4 py-2'
                      >
                        <div className='w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0'>
                          <ArrowRight className='w-2.5 h-2.5 text-[#F6B72D]' />
                        </div>
                        <span className='font-bold text-[10px] tracking-wide'>READ PREVIEW</span>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Right Column: Other Ebooks */}
          <div className='lg:col-span-5 flex flex-col gap-3 lg:gap-4'>
            {listEbooks.map((ebook, index) => (
              <div
                key={ebook.id || index}
                className='site-hover-highlight bg-[#FDFDFD] border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl p-3 lg:p-4 flex flex-col flex-1 group'
              >
                {/* Top Tags */}
                <div className='flex items-center justify-between mb-2.5'>
                  <div className='flex items-center gap-2'>
                    <div className='bg-[#0B132B] text-white text-[7.5px] lg:text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm'>
                      {ebook.category}
                    </div>
                    <div className='border border-gray-300 text-gray-500 text-[7.5px] lg:text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm'>
                      {ebook.series?.title || `SERIES ${index + 1}`}
                    </div>
                  </div>
                  <span className='max-w-[100px] shrink-0 text-right text-[#9CA3AF] text-[7px] lg:text-[8px] font-medium tracking-wide leading-tight'>
                    {ebook.tagDesc}
                  </span>
                </div>

                {/* Content */}
                <div className='flex gap-3 flex-1'>
                  {/* Thumbnail */}
                  <div className='w-[55px] lg:w-[65px] shrink-0'>
                    <div className='w-full outline outline-1 outline-gray-200 shadow-sm transition-transform duration-300 group-hover:-translate-y-1'>
                      <img
                        src={getAssetUrl(ebook.image)}
                        alt={ebook.title}
                        className='w-full h-auto object-cover'
                        onError={(e) => { e.target.src = '/images/ebook.svg' }}
                      />
                    </div>
                  </div>

                  {/* Text & Action */}
                  <div className='flex flex-col flex-1'>
                    <div className='pb-2 mb-2 border-b border-gray-100'>
                      <h4 className='text-[13px] lg:text-[14px] font-bold text-[#0B132B] leading-snug line-clamp-2'>
                        {ebook.title}
                      </h4>
                    </div>
                    <div className='bg-gray-50 border border-gray-100 border-l-2 border-l-[#F6B72D] rounded-md p-2 mb-2 flex-1'>
                      <p className='text-[#9CA3AF] text-[7px] font-bold uppercase tracking-[0.14em] mb-1'>Overview</p>
                      <p className='text-[#6B7280] text-[10.5px] lg:text-[11px] leading-relaxed line-clamp-2 font-medium'>
                        {ebook.description || 'Explore the key ideas and practical insights in this eBook.'}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Link
                        to={`/ebook-detail/${ebook.id}`}
                        className='bg-[#0B132B] hover:bg-[#1a2b5c] transition-colors text-white rounded-full flex items-center gap-1.5 px-3 py-1.5'
                      >
                        <div className='w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0'>
                          <ArrowRight className='w-2 h-2 text-[#0B132B]' />
                        </div>
                        <span className='font-bold text-[8.5px] tracking-wider whitespace-nowrap'>PURCHASE NOW</span>
                      </Link>
                      <Link
                        to={`/ebook-detail/${ebook.id}?preview=true`}
                        className='bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center justify-center rounded-md w-7 h-7 shrink-0 transition-colors'
                        title='Read Preview'
                      >
                        <BookOpen className='w-3.5 h-3.5 text-gray-600' />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
