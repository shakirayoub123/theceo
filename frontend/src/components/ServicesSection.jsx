import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'
import AppointmentModal from '@/components/AppointmentModal'
import mapBg from '@/assets/map bg 2.png'

export default function ServicesSection() {
  const { t } = useTranslation()
  const [programs, setPrograms] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const stripHtml = (text) => (text ? text.replace(/<[^>]*>/g, '') : '')
  const formatProgramTitle = (title, index) => {
    const cleanTitle = (title || 'Program').replace(/^P\.?\s*\d+\s*/i, '')
    return `P.${index + 1} ${cleanTitle}`
  }

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await authService.getAllPrograms()
        setPrograms(response.programs || [])
      } catch (err) {
        console.error('Error fetching programs:', err)
        setError(err.message || 'Failed to load programs')
        // Set fallback data if API fails
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  // Fallback data for when API is not available
  const fallbackPrograms = [
    {
      id: 'weight-loss-program',
      title: t('services.items.liveCoaching') || 'Weight Loss Program',
      shortDesc: '30-day weight loss program',
      description:
        t('services.items.liveCoachingDesc') ||
        'Comprehensive weight loss program with personalized meal plans and exercise routines',
      status: 'active',
      price: '199.99',
      duration: '30 days',
      difficulty: 'Beginner',
      category: 'Weight Loss',
      enrolledCount: 45,
      rating: 4.5,
      thumbnailImage: '/images/services.svg',
      chaptersCount: 12,
      assignedAdvisors: [
        {
          id: 1,
          username: 'trainer1',
          first_name: 'John',
          last_name: 'Doe',
        },
      ],
    },
    {
      id: 'muscle-gain-program',
      title: t('services.items.virtualCoaching') || 'Muscle Gain Program',
      shortDesc: 'Build muscle and strength',
      description:
        t('services.items.virtualCoachingDesc') ||
        'Professional muscle building program with expert guidance',
      status: 'active',
      price: '249.99',
      duration: '45 days',
      difficulty: 'Intermediate',
      category: 'Muscle Gain',
      enrolledCount: 32,
      rating: 4.7,
      thumbnailImage: '/images/services.svg',
      chaptersCount: 15,
      assignedAdvisors: [
        {
          id: 2,
          username: 'trainer2',
          first_name: 'Jane',
          last_name: 'Smith',
        },
      ],
    },
    {
      id: 'fitness-program',
      title: t('services.items.corporateTraining') || 'General Fitness Program',
      shortDesc: 'Overall fitness improvement',
      description:
        t('services.items.corporateTrainingDesc') ||
        'Complete fitness program for all levels',
      status: 'active',
      price: '149.99',
      duration: '60 days',
      difficulty: 'All Levels',
      category: 'General Fitness',
      enrolledCount: 78,
      rating: 4.3,
      thumbnailImage: '/images/services.svg',
      chaptersCount: 20,
      assignedAdvisors: [
        {
          id: 3,
          username: 'trainer3',
          first_name: 'Mike',
          last_name: 'Johnson',
        },
      ],
    },
  ]

  const displayPrograms = programs.length > 0 ? programs : fallbackPrograms
  const programsPerPage = 3
  const pageCount = Math.ceil(displayPrograms.length / programsPerPage)
  const visiblePrograms = displayPrograms.slice(
    currentPage * programsPerPage,
    (currentPage + 1) * programsPerPage,
  )

  if (loading) {
    return (
      <section className='py-16 relative overflow-hidden bg-[#FCFBF7] font-jakarta'>
        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id='services-section'
      className='py-8 lg:py-10 relative overflow-hidden bg-[#FCFBF7] font-jakarta min-h-[calc(100svh-72px)] flex flex-col justify-center'
    >
      <div
        aria-hidden='true'
        className='absolute inset-0 pointer-events-none bg-no-repeat bg-center bg-cover opacity-80'
        style={{ backgroundImage: `url("${mapBg}")` }}
      />
      <div className='w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4'>
          <div className='flex-1'>
            <div className='inline-block border border-[#334155]/60 rounded-full px-4 py-1 mb-3'>
              <span className='text-[#334155] font-semibold tracking-[0.08em] text-[10px] uppercase'>
                What We Provide
              </span>
            </div>
            <h2 className='text-[30px] lg:text-[40px] leading-[1.1] tracking-[-1.01px] font-bold text-[#000023] mb-2 uppercase font-jakarta'>
              Our <span className='text-[#F6B72D]'>Services</span>
            </h2>
            <p className='text-[13px] lg:text-[15px] leading-[24px] font-normal text-[#4B5563] max-w-2xl'>
              We deliver tailored leadership and performance programs empowering leaders with clarity and confidence.
            </p>
          </div>

          {/* Top Right Arrows */}
          <div className='flex gap-4 items-center'>
            <button
              aria-label='Previous services'
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={currentPage === 0}
              className='w-12 h-12 rounded-full border border-[#CBD5E1] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <ChevronLeft className='w-5 h-5 text-[#111827]' />
            </button>
            <button
              aria-label='Next services'
              onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))}
              disabled={currentPage >= pageCount - 1}
              className='w-12 h-12 rounded-full bg-[#000023] flex items-center justify-center hover:bg-[#11113A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <ChevronRight className='w-5 h-5 text-white' />
            </button>
          </div>
        </div>

        {error && (
          <div className='mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg'>
            <p className='font-medium'>Unable to load programs</p>
            <p className='text-sm mt-1'>{error}</p>
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 items-stretch gap-5 lg:gap-6'>
          {visiblePrograms.map((program, index) => {
            const programIndex = currentPage * programsPerPage + index
            return (
              <div
                key={program.id}
                className='h-full rounded-[20px] flex flex-col p-5 lg:p-6 relative group transition-all duration-300 ease-out bg-white/95 border border-[#E5E7EB] shadow-[0_12px_30px_rgba(0,0,35,0.06)] hover:scale-[1.02] hover:-translate-y-1 hover:z-20 hover:bg-[#000023] hover:border-[#312E81]/40 hover:shadow-[0_24px_48px_rgba(0,0,35,0.2)] focus-within:scale-[1.01] focus-within:-translate-y-1 focus-within:z-20 focus-within:bg-[#000023] focus-within:border-[#312E81]/40 focus-within:shadow-[0_24px_48px_rgba(0,0,35,0.2)]'
              >
                {/* Arrow icon absolute positioned at top-right */}
                <Link to={program.id ? `/service/${program.id}` : '#'} aria-label={`View ${formatProgramTitle(program.title, programIndex)}`} className='absolute top-5 right-5 z-20 group-hover:scale-110 transition-transform duration-300'>
                  <div className='w-[38px] h-[38px] rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center shadow-sm group-hover:border-white'>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0B132B]" />
                  </div>
                </Link>

                {/* Top Content */}
                <div className='mb-4 pr-10 text-left'>
                  <h3 className='min-h-[66px] lg:min-h-[75px] text-[16px] lg:text-[18px] leading-[22px] lg:leading-[25px] font-bold font-jakarta mb-2 text-[#000023] group-hover:text-white transition-colors duration-300 line-clamp-3'>
                    {formatProgramTitle(program.title, programIndex)}
                  </h3>
                  <p className='min-h-[57px] lg:min-h-[60px] text-[12px] lg:text-[13px] leading-[19px] lg:leading-[20px] font-normal font-jakarta pr-1 text-[#334155]/80 group-hover:text-[#CBD5E1] transition-colors duration-300 line-clamp-3'>
                    {stripHtml(program.shortDesc || program.description) || 'Details coming soon.'}
                  </p>
                </div>

                {/* Keep the image close to the text while reserving consistent text space across cards. */}
                <div className='relative w-full h-[155px] sm:h-[170px] lg:h-[175px] shrink-0 overflow-hidden rounded-[16px]'>
                  <img
                    src={getAssetUrl(program.thumbnailImage) || '/images/services.svg'}
                    alt={program.title}
                    className='w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]'
                    onError={(e) => { e.currentTarget.src = '/images/services.svg' }}
                  />
                  {/* Invisible interactive overlay trigger just in case */}
                  <Link to={program.id ? `/service/${program.id}` : '#'} className='absolute inset-0 z-10' />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  )
}
