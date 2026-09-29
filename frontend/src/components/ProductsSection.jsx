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

  // Fallback data matching the beautiful new layout
  const fallbackEbooks = [
    {
      id: 'algorithmic-ceo',
      category: 'BUSINESS-CRITICAL',
      series: { title: 'FEATURED' },
      tagDesc: '01 // FLAGSHIP MONOGRAPH',
      title: 'The Algorithmic CEO: Leading with Data, Not Just Guts',
      description: '"The Algorithmic CEO - Leading with Data, Not Just Guts" presents a framework for 21st-century leadership, arguing that the traditional intuition-driven model is insufficient for today\'s volatile business...',
      image: '/images/ebook2.png',
    },
    {
      id: 'executive-edge',
      category: 'BUSINESS-CRITICAL',
      series: { title: 'SERIES 2' },
      tagDesc: '02 // MONOGRAPH',
      title: 'The Executive Edge: Cultivating Influence in the C-Suite',
      description: 'The eBook, "The Executive Edge: Cultivating Influence in the C-Suite," argues that modern leadership must shift from a hierarchical...',
      image: '/images/ebook3.svg',
    },
    {
      id: 'radical-ambiguity',
      category: 'BUSINESS-CRITICAL',
      series: { title: 'SERIES 1' },
      tagDesc: '03 // MONOGRAPH',
      title: 'Leading Through Radical Ambiguity',
      description: 'This Ebook, "Leading Through Turbulence: Managing Economic Uncertainty to Drive Positive Change and Sustainable Growth," is an...',
      image: '/images/ebook4.svg',
    },
  ]

  // Map real data if needed, or fallback. Make sure to only take top 3.
  let mappedEbooks = ebooks.slice(0, 3).map((item, index) => {
    return {
      id: item.id,
      category: item.topic?.toUpperCase() || item.category?.toUpperCase() || 'BUSINESS-CRITICAL',
      series: { title: item.series?.title?.toUpperCase() || (index === 0 ? 'FEATURED' : `SERIES ${index}`) },
      tagDesc: `0${index + 1} // ${index === 0 ? 'FLAGSHIP MONOGRAPH' : 'MONOGRAPH'}`,
      title: item.title,
      description: item.description || item.shortDescription || '',
      image: item.coverImage || item.image || '/images/ebook.svg',
    }
  })

  if (mappedEbooks.length === 0) {
    mappedEbooks = fallbackEbooks
  }

  const featuredEbook = mappedEbooks[0]
  const listEbooks = mappedEbooks.slice(1, 4)

  if (isLoading) {
    return (
      <section className='py-16 md:py-24 bg-white flex items-center justify-center font-jakarta min-h-[50vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </section>
    )
  }

  return (
    <section className='py-16 md:py-24 bg-white font-jakarta overflow-hidden relative'>
      {/* Background Map Pattern */}
      <div
        className='absolute inset-0 z-0 opacity-100 pointer-events-none'
        style={{
          backgroundImage: `url("${mapBg2}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className='max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header Block */}
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-8'>
          <div className='max-w-3xl'>
            <div className='inline-block border border-gray-400 rounded-full px-5 py-[3px] mb-5 lg:mb-6'>
              <span className='text-[#4B5563] font-bold tracking-widest text-[10px] lg:text-[11px] uppercase'>
                WHAT WE PROVIDE
              </span>
            </div>
            <h2 className='text-[36px] lg:text-[44px] font-bold leading-none mb-4'>
              <span className='text-[#0B132B]'>OUR </span>
              <span className='text-[#F6B72D] font-sans text-[38px] lg:text-[48px]'>EBOOKS</span>
            </h2>
            <p className='text-[#6B7280] text-[15px] lg:text-[16px] leading-relaxed max-w-2xl font-medium'>
              Explore our curated eBooks packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.
            </p>
          </div>

          {/* Header Stats Meta */}
          <div className='flex items-center gap-6 md:gap-10 pb-2'>
            <div className='flex flex-col'>
              <span className='text-[#9CA3AF] text-[10px] lg:text-[11px] font-bold uppercase tracking-wider mb-1'>CURATION</span>
              <span className='text-[#111827] text-[13px] lg:text-[15px] font-bold'>Volume IV // 2024</span>
            </div>
            <div className='w-px h-10 bg-gray-200'></div>
            <div className='flex flex-col'>
              <span className='text-[#9CA3AF] text-[10px] lg:text-[11px] font-bold uppercase tracking-wider mb-1'>EDITIONS</span>
              <span className='text-[#111827] text-[13px] lg:text-[15px] font-bold'>3 Executive Releases</span>
            </div>
          </div>
        </div>

        {/* Ebooks Layout Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch'>

          {/* Left Column: Featured Ebook */}
          {featuredEbook && (
            <div className='lg:col-span-7 h-full flex'>
              <div className='bg-[#F7F7F7] border border-[#3B82F6] rounded-xl lg:rounded-2xl w-full p-6 lg:p-10 flex flex-col shadow-sm relative group'>

                {/* Top Tags */}
                <div className='flex items-center justify-between mb-8'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-[#0B132B] text-white text-[10px] lg:text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm'>
                      {featuredEbook.category}
                    </div>
                    <div className='border border-[#F6B72D] text-[#F6B72D] text-[10px] lg:text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm'>
                      {featuredEbook.series?.title || 'FEATURED'}
                    </div>
                  </div>
                  <div className='text-[#9CA3AF] text-[11px] lg:text-[12px] font-medium tracking-widest hidden sm:block'>
                    {featuredEbook.tagDesc}
                  </div>
                </div>

                {/* Content Area */}
                <div className='flex flex-col sm:flex-row gap-8 lg:gap-12 flex-1'>
                  {/* Left: Ebook Cover Floating */}
                  <div className='w-[180px] sm:w-[220px] lg:w-[260px] shrink-0 mx-auto sm:mx-0'>
                    <div className='w-full outline outline-1 outline-gray-200 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]'>
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
                    <h3 className='text-[26px] lg:text-[34px] font-bold text-[#0B132B] leading-tight mb-4'>
                      {featuredEbook.title}
                    </h3>

                    <div className='w-12 h-1 bg-[#F6B72D] rounded-full mb-6'></div>

                    <p className='text-[#4B5563] text-[15px] lg:text-[16px] leading-relaxed font-medium mb-10 flex-1 line-clamp-6'>
                      {featuredEbook.description}
                    </p>

                    <div className='flex flex-col sm:flex-row items-center gap-4 mt-auto'>
                      <Link
                        to={`/ebook-detail/${featuredEbook.id}`}
                        className='w-full sm:w-auto bg-[#0B132B] hover:bg-[#1a2b5c] transition-colors text-white rounded-full flex items-center justify-center gap-3 px-6 lg:px-8 py-3.5'
                      >
                        <div className='w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0'>
                          <ArrowRight className='w-3 h-3 text-[#0B132B]' />
                        </div>
                        <span className='font-bold text-[13px] tracking-wide'>PURCHASE NOW</span>
                      </Link>

                      <Link
                        to={`/ebook-detail/${featuredEbook.id}?preview=true`}
                        className='w-full sm:w-auto bg-[#F6B72D] hover:bg-[#e6a820] transition-colors text-black rounded-full flex items-center justify-center gap-3 px-6 lg:px-8 py-3.5'
                      >
                        <div className='w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0'>
                          <ArrowRight className='w-3 h-3 text-[#F6B72D]' />
                        </div>
                        <span className='font-bold text-[13px] tracking-wide'>READ PREVIEW</span>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Right Column: Other Ebooks List */}
          <div className='lg:col-span-5 flex flex-col gap-6 lg:gap-8'>
            {listEbooks.map((ebook, index) => (
              <div
                key={ebook.id || index}
                className='bg-[#FDFDFD] border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl lg:rounded-2xl p-5 lg:p-6 flex flex-col flex-1 group'
              >
                {/* Top Tags */}
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-2'>
                    <div className='bg-[#0B132B] text-white text-[9px] lg:text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm'>
                      {ebook.category}
                    </div>
                    <div className='border border-gray-300 text-gray-500 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm'>
                      {ebook.series?.title || `SERIES ${index + 1}`}
                    </div>
                  </div>
                  <div className='text-[#9CA3AF] text-[10px] lg:text-[11px] font-medium tracking-widest hidden sm:block'>
                    {ebook.tagDesc}
                  </div>
                </div>

                {/* Content */}
                <div className='flex gap-5 lg:gap-6 flex-1'>
                  {/* Left: Thumbnail Ebook */}
                  <div className='w-[100px] lg:w-[130px] shrink-0'>
                    <div className='w-full outline outline-1 outline-gray-200 shadow-lg transition-transform duration-300 group-hover:-translate-y-1'>
                      <img
                        src={getAssetUrl(ebook.image)}
                        alt={ebook.title}
                        className='w-full h-auto object-cover'
                        onError={(e) => { e.target.src = '/images/ebook.svg' }}
                      />
                    </div>
                  </div>

                  {/* Right: Text & Action */}
                  <div className='flex flex-col flex-1'>
                    <h4 className='text-[18px] lg:text-[22px] font-bold text-[#0B132B] leading-snug mb-3 line-clamp-2 lg:line-clamp-3'>
                      {ebook.title}
                    </h4>
                    <p className='text-[#6B7280] text-[13px] lg:text-[14px] leading-relaxed flex-1 line-clamp-3 lg:line-clamp-4 font-medium'>
                      {ebook.description}
                    </p>

                    {/* Action Block Buttons inside minor cards */}
                    <div className='flex items-center gap-3 mt-4'>
                      <Link
                        to={`/ebook-detail/${ebook.id}`}
                        className='bg-[#0B132B] hover:bg-[#1a2b5c] transition-colors text-white rounded-full flex items-center justify-center gap-2 px-5 py-2.5 flex-1 max-w-[200px]'
                      >
                        <div className='w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0'>
                          <ArrowRight className='w-3 h-3 text-[#0B132B]' />
                        </div>
                        <span className='font-bold text-[11px] tracking-wider whitespace-nowrap'>PURCHASE NOW</span>
                      </Link>

                      <Link
                        to={`/ebook-detail/${ebook.id}?preview=true`}
                        className='bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center justify-center rounded-md w-11 h-11 shrink-0 transition-colors'
                        title='Read Preview'
                      >
                        <BookOpen className='w-5 h-5 text-gray-600' />
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
