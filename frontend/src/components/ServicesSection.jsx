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
      className='py-16 md:py-24 relative overflow-hidden bg-[#FCFBF7] bg-repeat bg-top font-jakarta'
      style={{ backgroundImage: `url("${mapBg}")` }}
    >
      <div className='w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6'>
          <div className='flex-1'>
            <div className='inline-block border border-gray-400 rounded-full px-5 py-1 mb-5'>
              <span className='text-[#111827] font-semibold tracking-widest text-[9px] uppercase'>
                What We Provide
              </span>
            </div>
            <h2 className='text-[40px] leading-[51px] tracking-[-1.01px] font-bold text-[#111827] mb-2 uppercase font-jakarta'>
              Our <span className='text-[#F6B72D]'>Services</span>
            </h2>
            <p className='text-[16px] leading-[28px] tracking-[0px] font-normal text-[#4B5563] max-w-2xl'>
              We deliver tailored leadership and performance programs empowering leaders with clarity and confidence.
            </p>
          </div>

          {/* Top Right Arrows */}
          <div className='flex gap-4 items-center'>
            <button className='w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors'>
              <ChevronLeft className='w-5 h-5 text-[#111827]' />
            </button>
            <button className='w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center hover:bg-gray-900 transition-colors'>
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

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
          {displayPrograms.map((program, index) => {
            return (
              <div
                key={program.id}
                className='rounded-[20px] flex flex-col justify-between p-6 sm:p-7 relative group transition-all duration-500 ease-out transform bg-[#FBF9F5] border border-[#E7E6E2] shadow-sm hover:scale-[1.04] hover:-translate-y-1 hover:z-20 hover:bg-[#0B132B] hover:border-[#0B132B] hover:shadow-2xl'
              >
                {/* Arrow icon absolute positioned at top-right */}
                <Link to={program.id ? `/service/${program.id}` : '#'} className='absolute top-6 right-6 z-20 group-hover:scale-110 transition-transform duration-300'>
                  <div className='w-[38px] h-[38px] rounded-full border border-[#E7E6E2] bg-white flex items-center justify-center shadow-sm group-hover:border-white'>
                    <ArrowUpRight className="w-4 h-4 text-[#0B132B]" />
                  </div>
                </Link>

                {/* Top Content */}
                <div className='mb-8 pr-12 text-left'>
                  <h3 className='text-[20.72px] leading-[29px] tracking-[0px] font-bold font-jakarta mb-4 text-[#0B132B] group-hover:text-white transition-colors duration-300'>
                    {formatProgramTitle(program.title, index)}
                  </h3>
                  <p className='text-[14.44px] leading-[21.2px] tracking-[0px] font-medium font-jakarta pr-2 text-[#475569] group-hover:text-[#E7E6E2] transition-colors duration-300'>
                    {stripHtml(program.shortDesc || program.description) || 'Details coming soon.'}
                  </p>
                </div>

                {/* Cover Image at Bottom */}
                <div className='mt-auto relative w-full overflow-hidden rounded-[16px]'>
                  <img
                    src={getAssetUrl(program.thumbnailImage) || '/images/services.svg'}
                    alt={program.title}
                    className='w-full h-[220px] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]'
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
