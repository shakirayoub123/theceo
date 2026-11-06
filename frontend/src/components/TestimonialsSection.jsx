import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import mapBg2 from '@/assets/map bg 2.png'

export default function TestimonialsSection() {
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
          text: `James is a very dynamic individual who has extensive knowledge of the executive business environment. He is a master mentor to all of his associates and has contributed to their great success and advancement. James has become a leader in his realm by his keen insights, strong dedication, and masterful knowledge of human nature. I trust James' judgement completely.`,
        },
        {
          client: 'Sandy Priester',
          title: 'CEO/Founder',
          company: 'Lifespark Cancer Resources',
          text: `James has advised LifeSpark on several occasions. As a non-profit organisation, we have tapped James expertise in the area of corporate fundraising, and he has assisted us with training committee members, and counsel on overall fundraising strategy. James has extensive connections throughout the business community, and his skills related to organisational development, marketing and branding, and leadership development are excellent.\n\nJames is smart, generous, talented, and very easy to work with. I would highly recommend James in any of these areas.`,
        },
        {
          client: 'Jay Garcia',
          title: 'Executive AICP, LEEP AP',
          company: 'Multiple Industries',
          text: `James Armstrong is an extremely well-rounded professional with a strong and diverse background in numerous industries on an international scale. More importantly, James is a good man and a nice person. He communicates well with all types of people at all different levels and while he is extremely good at providing valuable insight and guidance he is also open to taking advice and suggestions for possible solutions. He treats every relationship (personal and professional) with positive and meaningful success and I have seen him motivate others in dynamic and creative ways. This is the mark of a true leader. He is honest, has strong core values and his personal integrity is of the highest quality.\n\nJames has helped me to understand the nuisances of leadership and professional development. He has shown me how to articulate and explain my professional experience to people from other industries and he has exposed me to incredible networking opportunities and tactics for personal branding.\n\nI would strongly recommend James to anyone who is interested in developing or refining their professional brand/network/identity because his knowledge for all industries and his strategic approach to professional growth are top notch.`,
        },
      ],
    },
    {
      mentor: 'CLIENT TESTIMONIAL',
      items: [
        {
          client: 'Client Testimonial',
          title: 'The CEO Influencers Client',
          company: '',
          video: '/videos/testimonial-video-1.mp4',
        },
      ],
    },
    {
      mentor: 'DR. CLAIRE KEOGH',
      items: [
        {
          client: 'Professor Helen Richardson',
          title: 'Professor',
          company: 'Sheffield University Business School',
          text: `Claire demonstrated exceptional research capabilities during her tenure at the University of Salford, where she led multiple research initiatives examining gender disparity within the Information Communication Technology sector. Her work garnered significant recognition, resulting in numerous peer-reviewed publications and high-profile presentations to key stakeholders, including British parliamentary briefings at the House of Commons and strategic industry forums.\n\nClaire's research methodology and stakeholder engagement skills proved exemplary across all organisational levels, from C-suite executives to technical specialists. Her ability to extract meaningful insights and build immediate rapport with diverse audiences consistently yielded valuable, actionable research outcomes.`,
        },
        {
          client: 'Dr. Sarina S.',
          title: 'Director of Nursing',
          company: 'NHS – National Health Service',
          text: `I have had the privilege of collaborating with Claire over several years across strategic research initiatives, leadership development programs, and innovative organisational transformation projects. Throughout this professional partnership, Claire has consistently demonstrated an exceptional capacity to bridge the gap between rigorous academic research and practical business application.\n\nClaire's distinguishing strength lies in her systematic yet innovative approach to problem-solving. She possesses a rare ability to synthesise complex empirical evidence and translates theoretical frameworks into actionable strategies that deliver measurable impact. Her analytical rigor is matched by her visionary creative thinking, enabling her to develop solutions that are both evidence-informed and contextually relevant.\n\nWhat sets Claire apart is her empathetic holistic perspective on organisational development. She recognises that sustainable organisational improvement must address both individual capability and systemic organisational factors. This dual focus has enabled her to design customised business interventions that not only achieve immediate operational objectives but also build long-term organisational capacity and resilience.\n\nClaire's superior consulting performance consistently demonstrates global commercial awareness and a results-oriented mindset. She engages stakeholders effectively at all levels, ensuring that research insights are not merely documented, but actively embedded into strategic planning and operational practice across the organisation. Her contributions have generated tangible value for both leaders and all key internal and external stakeholders across the broader organisation.\n\nI highly recommend Claire without reservation for senior-level business advisory, research, and leadership development mentoring.`,
        },
        {
          client: 'CEO Confidential',
          title: 'Kent County Council',
          company: 'British Government',
          text: `Dr. Claire Keogh is a strategic analyst of exceptional caliber whose work has consistently delivered high-impact intelligence solutions to our C-Suite and board-level stakeholders. Claire possesses a rare ability to translate complex data into actionable insights that drive meaningful organisational performance across critical public services.\n\nThroughout her tenure, Claire provided executive-level strategic direction on mission-critical initiatives spanning Children's Services, Safeguarding, and Public Health portfolios. Her comprehensive analytical reporting informed senior executive leadership decision-making and shaped organisational priorities at the highest levels, demonstrating her sophisticated understanding of complex public sector challenges.\n\nClaire established and operationalised enterprise-wide standards for empirical research methodologies and survey designs, ensuring robust accurate evidence generation for service leadership teams. The frameworks she developed enhanced the quality and reliability of insights used to guide service delivery improvements and resource allocation decisions across the organisation. She orchestrated multi-stakeholder engagement initiatives with exceptional diplomatic skill, bridging internal service teams and external partners to develop evidence-based policy frameworks. Claire applied sophisticated models to optimise customer engagement strategies, redesign service delivery protocols, and elevate staff performance outcomes.\n\nClaire has consistently demonstrated the strategic acumen, analytical rigor, and stakeholder management capabilities essential for senior executive roles requiring advanced business intelligence leadership. I highly recommend her without reservation.`,
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
                  preload='metadata'
                  aria-label='Client testimonial video'
                  className='w-full h-auto max-h-[360px] aspect-video rounded-xl bg-black shadow-lg border border-white/10'
                />
              </div>
            ) : (
              <div className='relative'>
                <p
                  className='scrollbar-thin whitespace-pre-line text-[#E2E8F0] font-jakarta text-[14px] md:text-[16px] xl:text-[17px] leading-[26px] md:leading-[32px] font-normal mb-8 max-h-[220px] md:max-h-[280px] overflow-y-auto overscroll-contain pr-3'
                  role='region'
                  aria-label={`Scrollable testimonial from ${currentTestimonial.client}`}
                  tabIndex={0}
                >
                  {currentTestimonial.text}
                </p>

                {/* Subtle Divider Line */}
                <div className='w-full h-px bg-gradient-to-r from-white/10 to-transparent mb-6'></div>

                {/* Author Block */}
                <div className='flex items-center gap-4'>
                  {/* Initials badge (client photos are not available) */}
                  <div
                    aria-hidden='true'
                    className='w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] rounded-full border-2 border-[#F6B72D] bg-[#FDF5DF] text-[#0B132B] flex items-center justify-center shrink-0 font-bold text-sm'
                  >
                    {currentTestimonial.client
                      .split(/\s+/)
                      .filter((part) => /^[A-Za-z]/.test(part))
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
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
                  className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-[#F6B72D] hover:text-[#F6B72D] disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label='Previous testimonial'
                >
                  <ChevronLeft className='h-4 w-4' aria-hidden='true' />
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
                  className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-[#F6B72D] hover:text-[#F6B72D] disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label='Next testimonial'
                >
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
