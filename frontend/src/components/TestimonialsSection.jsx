import { useState } from 'react'
import { Button } from './ui/button'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import mapBg2 from '@/assets/map bg 2.png'

export default function TestimonialsSection() {
  const { t } = useTranslation()
  const [activeMentor, setActiveMentor] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const testimonialGroups = [
    {
      mentor: 'JAMES ARMSTRONG',
      items: [
        {
          client: 'Robert McDonough',
          title: 'Retired Senior Executive',
          company: 'Multiple Industries',
          text: `“James is a very dynamic individual who has extensive knowledge of the executive business environment. He is a master mentor to all of his associates and has contributed to their great success and advancement. James has become a leader in his realm by his keen insights, strong dedication, and masterful knowledge of human nature. I trust James' judgement completely.”`,
        },
        {
          client: 'Sandy Priester',
          title: 'CEO/Founder',
          company: 'Lifespark Cancer Resources',
          text: `“James has advised LifeSpark on several occasions. As a non-profit organization, we have tapped James expertise in the area of corporate fundraising, and he has assisted us with training committee members, and counsel on overall fundraising strategy. James has extensive connections throughout the business community, and his skills related to organizational development, marketing and branding, and leadership development are excellent.”`,
        },
        {
          client: 'Jay Garcia',
          title: 'Executive AICP, LEEP AP',
          company: 'Multiple Industries',
          text: `“James Armstrong is an extremely well-rounded professional with a strong and diverse background in numerous industries on an international scale. More importantly, James is a good man and a nice person. He communicates well with all types of people at all different levels and while he is extremely good at providing valuable insight and guidance he is also open to taking advice and suggestions for possible solutions.”`,
        },
      ],
    },
    {
      mentor: 'THE CEO INFLUENCERS',
      items: [
        {
          client: 'The CEO Influencers',
          title: 'Client Testimonial',
          company: '',
          video: '/videos/testimonial-video-1.mp4',
        },
      ],
    },
    {
      mentor: 'DR. CLAIRE KEOGH',
      items: [
        {
          client: 'Helen Richardson',
          title: 'Professor',
          company: 'Sheffield Business School',
          text: `“Claire demonstrated exceptional research capabilities during her tenure at the University of Salford, where she led multiple research initiatives examining gender disparity within the Information Communication Technology sector. Her work garnered significant recognition, resulting in numerous peer-reviewed publications and high-profile presentations.”`,
        },
        {
          client: 'Dr. Sarina B.',
          title: 'Director- Nursing',
          company: 'NHS England',
          text: `“I have had the privilege of collaborating with Claire over several years across strategic research initiatives, leadership development programs, and innovative organizational transformation projects. Throughout this professional partnership, Claire has consistently demonstrated an exceptional capacity to bridge the gap between rigorous academic research and practical business application.”`,
        },
        {
          client: 'CEO Confidential',
          title: 'Kent County Council',
          company: 'British Government',
          text: `“Dr. Claire Keogh is a strategic analyst of exceptional caliber whose work has consistently delivered high-impact intelligence solutions to our C-Suite and board-level stakeholders. Claire possesses a rare ability to translate complex data into actionable insights that drive meaningful organizational performance across critical public services.”`,
        },
      ],
    },
  ]

  const currentGroup = testimonialGroups[activeMentor]
  const currentTestimonial = currentGroup.items[activeTestimonial]

  // Optional: Auto-rotate logic could be placed here if desired

  return (
    <section className='py-8 lg:py-10 min-h-[calc(100vh-140px)] flex flex-col justify-center relative overflow-hidden bg-white font-jakarta'>

      {/* Background Map Pattern */}
      <div
        className='absolute inset-0 z-0 pointer-events-none opacity-100'
        style={{
          backgroundImage: `url("${mapBg2}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full'>
        {/* Header */}
        <div className='text-center mb-6'>
          <div className='inline-block border border-gray-300 rounded-full px-5 py-[2px] mb-4 bg-white'>
            <span className='text-[#4B5563] font-bold tracking-widest text-[11px] uppercase'>
              TESTIMONIALS
            </span>
          </div>

          <h2 className='text-[30px] md:text-[38px] font-bold leading-tight tracking-tight'>
            <span className='text-black'>Our Client </span>
            <span className='text-[#F6B72D]'>Testimonials</span>
          </h2>
        </div>

        {/* Tab Selection */}
        <div className='flex flex-wrap items-center justify-center gap-3 mb-6'>
          {testimonialGroups.map((group, index) => {
            const isActive = activeMentor === index

            return (
              <button
                key={group.mentor}
                onClick={() => {
                  setActiveMentor(index)
                  setActiveTestimonial(0)
                }}
                className={`px-6 py-2.5 rounded-full font-bold text-[11px] tracking-wide transition-all duration-300 ${isActive
                  ? 'bg-[#0B132B] text-white border border-[#F6B72D] shadow-[0_0_15px_rgba(246,183,45,0.15)]'
                  : 'bg-white text-[#111827] border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {group.mentor}
              </button>
            )
          })}
        </div>

        {/* Testimonial Box */}
        <div className='bg-[#010125] rounded-[24px] lg:rounded-[32px] p-6 md:p-10 shadow-2xl relative flex flex-col md:flex-row gap-6 md:gap-10'>

          {/* Left Column: Quote Visuals */}
          <div className='flex flex-col items-center shrink-0'>
            {/* Quote Block */}
            <div className='w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-[#FDF5DF] rounded-[16px] flex items-center justify-center shadow-lg relative z-10'>
              <svg width="24" height="24" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 32V19.2C0 8.533 5.867 2.133 17.6 0L20.8 4.8C15.467 6.4 12.8 9.6 12.8 14.4V16H20.8V32H0ZM19.2 32V19.2C19.2 8.533 25.067 2.133 36.8 0L40 4.8C34.667 6.4 32 9.6 32 14.4V16H40V32H19.2Z" fill="#F6B72D" />
              </svg>
            </div>

            {/* Vertical Line */}
            <div className='w-px h-[40px] md:h-[60px] bg-gradient-to-b from-white/40 to-white/5 my-2'></div>

            {/* Verified Badge */}
            <div className='border border-[#F6B72D]/50 bg-[#F6B72D]/10 rounded-full px-3 py-1 flex items-center'>
              <span className='text-[#F6B72D] text-[9px] font-bold tracking-widest uppercase'>VERIFIED</span>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className='flex-1 flex flex-col justify-center'>

            {/* Testimonial Video or Text */}
            {currentTestimonial.video ? (
              <div className='w-full'>
                <video
                  src={currentTestimonial.video}
                  controls
                  className='w-full h-auto aspect-video rounded-xl shadow-lg border border-white/10'
                  poster='/images/testimonial-placeholder.jpg'
                />
              </div>
            ) : (
              <div className='relative'>
                <p className='text-[#E2E8F0] font-jakarta text-[14px] md:text-[16px] xl:text-[17px] leading-[26px] md:leading-[32px] font-normal mb-8 max-h-[160px] md:max-h-[200px] overflow-y-auto pr-2'>
                  {currentTestimonial.text}
                </p>

                {/* Subtle Divider Line */}
                <div className='w-full h-px bg-gradient-to-r from-white/10 to-transparent mb-6'></div>

                {/* Author Block */}
                <div className='flex items-center gap-4'>
                  {/* Avatar */}
                  <div className='w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] rounded-full p-[2px] bg-gradient-to-tr from-[#F6B72D] to-[#F6B72D] shrink-0'>
                    <img
                      src={
                        currentGroup.mentor === 'DR. CLAIRE KEOGH'
                          ? '/images/claire.jpeg'
                          : '/images/james.jpg'
                      }
                      alt={currentTestimonial.client}
                      className='w-full h-full rounded-full object-cover border-2 border-[#010125]'
                      onError={(e) => { e.target.src = '/images/team2.svg' }} // Fallback
                    />
                  </div>

                  {/* Author Meta */}
                  <div>
                    <h4 className='text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-1'>
                      {currentTestimonial.client}
                    </h4>
                    <p className='text-[#9CA3AF] text-[12px] md:text-[13px] font-medium'>
                      {currentTestimonial.title} {currentTestimonial.company ? ` ${currentTestimonial.company}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Clear controls for moving between testimonials in the selected group */}
            {currentGroup.items.length > 1 && (
              <div className='mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4'>
                <button
                  type='button'
                  onClick={() => setActiveTestimonial((index) => Math.max(0, index - 1))}
                  disabled={activeTestimonial === 0}
                  className='inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#F6B72D] hover:text-[#F6B72D] disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label='Previous testimonial'
                >
                  <ChevronLeft className='h-4 w-4' aria-hidden='true' />
                  Previous
                </button>

                <div className='flex flex-col items-center gap-2' aria-label='Testimonial position'>
                  <span className='text-xs font-semibold tracking-wide text-white/80' aria-live='polite'>
                    Testimonial {activeTestimonial + 1} of {currentGroup.items.length}
                  </span>
                  <div className='flex items-center gap-2'>
                    {currentGroup.items.map((item, idx) => (
                      <button
                        key={`${item.client}-${idx}`}
                        type='button'
                        onClick={() => setActiveTestimonial(idx)}
                        aria-label={`Show testimonial ${idx + 1} of ${currentGroup.items.length}`}
                        aria-current={activeTestimonial === idx ? 'true' : undefined}
                        className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6B72D] ${activeTestimonial === idx
                          ? 'w-8 bg-[#F6B72D]'
                          : 'w-2.5 bg-white/45 hover:bg-white/75'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => setActiveTestimonial((index) => Math.min(currentGroup.items.length - 1, index + 1))}
                  disabled={activeTestimonial === currentGroup.items.length - 1}
                  className='inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#F6B72D] hover:text-[#F6B72D] disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label='Next testimonial'
                >
                  Next
                  <ChevronRight className='h-4 w-4' aria-hidden='true' />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  )
}
