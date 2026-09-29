import { getAssetUrl } from '@/lib/utils'
import authService from '@/services/authService'
import { Button } from '@/components/ui/button'
import AppointmentModal from '@/components/AppointmentModal'
import Breadcrumb from '@/components/Breadcrumb'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, ArrowRight, Target } from 'lucide-react'

export default function ServiceDetail() {
  const { id } = useParams()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await authService.getPeopleServiceDetails(id)
        setService(data)
      } catch (err) {
        console.error('Error fetching service details:', err)
        setError(err.message || 'Failed to load service details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchService()
    }
  }, [id])

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-white'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-white'>
        <div className='max-w-lg bg-red-50 border border-red-200 text-red-700 rounded-lg p-6'>
          <h2 className='text-lg font-semibold mb-2'>
            Unable to load service details
          </h2>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-white'>
        <p className='text-gray-600'>Service not found.</p>
      </div>
    )
  }

  const {
    title,
    short_description,
    shortDesc,
    description,
    featuredImageUrl,
    introVideo,
    advisors = [],
    chapters = [],
  } = service

  const actualShortDesc = short_description || shortDesc || ''
  const backgroundImage = featuredImageUrl ? getAssetUrl(featuredImageUrl) : '/images/services.svg'
  const introVideoUrl = introVideo ? getAssetUrl(introVideo) : null
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services-section' },
    { label: title || 'Service' },
  ]
  const tickerItems = ['Microsoft', 'IBM', 'Apple', 'Google', 'U.S./UK Government Agencies', 'U.S. Congress', 'Northrop Grumman', 'ExxonMobil', 'JPMorgan Chase & Co.']

  return (
    <div className='min-h-screen bg-white font-jakarta'>

      {/* Hero Section */}
      <div className='relative w-full px-4 md:px-8 pt-6 pb-8'>
        <div
          className='max-w-[1400px] mx-auto w-full rounded-[16px] md:rounded-[20px] overflow-hidden relative flex flex-col items-center justify-center text-center shadow-2xl'
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '520px'
          }}
        >
          {/* Overlay mask */}
          <div className='absolute inset-0 bg-black/60 z-0' />

          <div className='relative z-10 max-w-4xl px-4 flex flex-col items-center mt-12'>
            {/* Pill */}
            <div className='inline-flex items-center px-4 py-1.5 rounded-full border border-white/40 mb-6'>
              <span className='text-[11px] font-medium tracking-[0.15em] text-white uppercase'>
                SERVICE DETAILS
              </span>
            </div>

            {/* Title */}
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6'>
              {title}
            </h1>

            {/* Subtitle */}
            {actualShortDesc && (
              <p className='text-[16px] leading-[26px] text-gray-200 max-w-2xl font-normal'>
                {actualShortDesc}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ticker Section */}
      <div className='w-full overflow-hidden bg-gradient-to-r from-[#F6B72D] via-[#8a7440] to-[#1A2332] py-4 mt-0'>
        <div className='ticker-track'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-center whitespace-nowrap'>
              {tickerItems.map((item, idx) => (
                <div key={idx} className='flex items-center gap-3 md:gap-4 pr-3 md:pr-4'>
                  <span className='text-white font-jakarta text-[17px] md:text-[19px] font-semibold tracking-wide'>
                    {item}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className='shrink-0'>
                    <path d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z" />
                  </svg>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @-webkit-keyframes tickerMove {
          0%   { -webkit-transform: translateX(0);     transform: translateX(0); }
          100% { -webkit-transform: translateX(-33.33%); transform: translateX(-33.33%); }
        }
        @keyframes tickerMove {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .ticker-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          padding-left: 1.5rem;
          -webkit-animation: tickerMove 60s linear infinite;
          animation: tickerMove 60s linear infinite;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
        }
      `}</style>

      {/* Main Content Layout */}
      <div className='max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-20'>

        {/* About This Service */}
        <div className='mb-16'>
          <div className='inline-block mb-8 relative'>
            <h2 className='text-[32px] font-bold text-[#0B132B] uppercase tracking-tight z-10 relative'>
              About This Service
            </h2>
            <div className='h-1.5 w-full bg-[#F6B72D] mt-2' />
          </div>

          <div className='bg-[#FCFCF9] border border-[#F6E5B8] rounded-[20px] p-8 md:p-10 mb-10 shadow-sm'>
            <h3 className='text-[20px] md:text-[22px] leading-[32px] font-bold text-[#0B132B] mb-2'>
              {actualShortDesc || "Optimize your leadership impact through tailored executive coaching"}
            </h3>
            <p className='text-[14px] text-[#F6B72D] font-semibold'>
              {title}
            </p>
          </div>

          {description && (
            <div
              className='prose prose-lg max-w-none text-gray-600 font-normal leading-[28px] marker:text-[#F6B72D]'
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>

        {/* Video Section */}
        {introVideoUrl && (
          <div className='mb-16'>
            <div className='rounded-[30px] overflow-hidden border border-gray-100 shadow-xl relative aspect-video bg-[#000] group'>
              <video
                controls
                className='w-full h-full object-cover'
                poster={backgroundImage}
              >
                <source src={introVideoUrl} type='video/mp4' />
              </video>
            </div>
          </div>
        )}

        {/* Core Methodology Pillars / Chapters */}
        {chapters && chapters.length > 0 && (
          <div className='mb-16'>
            <h2 className='text-[26px] font-bold text-[#0B132B] uppercase tracking-tight mb-8'>
              Core Methodology Pillars
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {chapters.map((chapter, idx) => (
                <div key={chapter.id || idx} className='border border-gray-200 rounded-[20px] p-6 hover:border-[#F6B72D] transition-colors bg-white flex flex-col'>
                  <div className='flex items-start mb-4 gap-4'>
                    <div className='w-[44px] h-[44px] rounded-xl bg-[#FFF6E3] border border-[#FCE1A5] flex items-center justify-center shrink-0'>
                      <span className='text-[#F6B72D] font-bold text-[18px]'>{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <h4 className='text-[16px] font-bold text-[#0B132B] leading-snug'>
                        {chapter.title}
                        {chapter.subtitle && <span className='block text-gray-500 font-normal mt-1'>({chapter.subtitle})</span>}
                      </h4>
                    </div>
                  </div>
                  <div className='text-[14px] text-gray-600 leading-relaxed font-normal flex-1 px-1'>
                    {chapter.shortDescription || chapter.content || chapter.description || 'No description provided.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ready to Begin Section */}
        <div className='w-full rounded-[24px] bg-[#0B132B] overflow-hidden p-8 md:p-12 mb-8 flex flex-col md:flex-row items-center justify-between'>
          <div className='max-w-2xl mb-6 md:mb-0'>
            <h3 className='text-3xl font-bold text-white mb-3 tracking-tight'>READY TO BEGIN?</h3>
            <p className='text-gray-300 text-[15px] leading-relaxed'>
              Step into high-impact executive transformation with world-class leadership influencers dedicated entirely to your roadmap.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className='bg-[#F6B72D] hover:bg-[#e6b82a] text-[#0B132B] font-bold h-14 px-8 rounded-xl shadow-lg border-b-4 border-[#D99A1A] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 group'
          >
            BOOK NOW
            <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
          </Button>
        </div>

        {/* Advisors Section */}
        {advisors && advisors.length > 0 && (
          <div className='mb-8'>
            <div className='bg-[#FCFCF9] border border-gray-200 rounded-[20px] p-8'>
              <h3 className='text-[20px] font-bold text-[#0B132B] uppercase tracking-tight mb-6'>ADVISORS</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                {advisors.map((advisor, idx) => (
                  <div key={advisor.id} className='bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-full overflow-hidden bg-[#F6B72D] text-white flex items-center justify-center font-bold text-lg'>
                        {advisor.first_name ? advisor.first_name[0] : 'E'}{(advisor.last_name && advisor.last_name[0]) || idx + 1}
                      </div>
                      <div>
                        <p className='font-bold text-[#0B132B]'>{advisor.first_name} {advisor.last_name}</p>
                        <p className='text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1'>EXECUTIVE INFLUENCER</p>
                      </div>
                    </div>
                    <div className='w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]' />
                  </div>
                ))}
              </div>
              <p className='text-xs text-gray-500'>Direct live pairing with two seasoned Fortune executive influencers tailored specifically to your sector.</p>
            </div>
          </div>
        )}

        {/* Tangible Outcomes Banner */}
        <div className='w-full rounded-[20px] border border-[#FCE1A5] bg-[#FFFCF6] p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm'>
          <div className='w-14 h-14 shrink-0 rounded-xl bg-[#F6B72D] flex items-center justify-center'>
            <Target className='w-7 h-7 text-white' />
          </div>
          <p className='text-[15px] font-bold text-[#0B132B] leading-snug'>
            We focus on tangible outcomes: Improved team performance, enhanced strategic clarity, and measurable impact on your organization's bottom line
          </p>
        </div>

      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

