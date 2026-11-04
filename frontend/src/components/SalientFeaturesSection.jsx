import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppointmentModal from './AppointmentModal'
import {
  ArrowRight,
  Map,
  Building,
  Zap,
  Globe,
  BarChart3,
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react'
import vectorImg from '@/assets/Vector.png'
import groupBg from '@/assets/Group.png'
import yellowBackground from '@/assets/bg yellow.png'

export default function SalientFeaturesSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const features = [
    {
      title: 'Comprehensive Holistic 360° Leadership Development',
      icon: Lightbulb,
      slug: 'holistic-360-leadership-development',
      description: 'Our Two-To-One Advantage™ brings two expert mentors together with APO-aligned optimization, the LLM-Linear Leadership Model™, a six-part data-driven assessment, and full-cycle support.'
    },
    {
      title: 'Global Expertise, Local Impact',
      icon: Map,
      slug: 'global-expertise-local-impact',
      description: 'Claire and James have successfully served 7,500+ executive clients combined over 20+ years, bringing experience across more than 186 industries.'
    },
    {
      title: 'Long-Term Profitability',
      icon: Building,
      slug: 'long-term-profitability',
      description: 'Empathetic, ethical leadership builds stakeholder trust, resilient cultures, brand loyalty, and sustainable long-term profitability.'
    },
    {
      title: 'Empathy at the Core',
      icon: Zap,
      slug: 'empathy-at-the-core',
      description: 'Empathy strengthens inclusion, collaboration, and trust, helping leaders unlock engagement, innovation, resilience, and purposeful performance.'
    },
    {
      title: 'Building 21st Century Strategic Partnerships and Alliances',
      icon: Globe,
      slug: 'strategic-partnerships-alliances',
      description: 'We help leaders build values-aligned alliances that expand capabilities, open markets, mitigate risk, and create sustainable win/win outcomes.'
    },
    {
      title: 'Maximizing Comprehensive Technology Strategy',
      icon: BarChart3,
      slug: 'maximizing-ai-technology-strategy',
      description: 'We help leaders use human and technology-driven insights to optimize decisions, strengthen governance, and build lasting competitive advantage.'
    }
  ]

  return (
    <>
      <section className='relative bg-[#010125] font-jakarta overflow-hidden py-8 md:py-10 min-h-[calc(100svh-80px)] flex flex-col justify-center'>

        {/* Topographic Background Pattern Overlay */}
        <div
          className='absolute inset-0 z-0 opacity-100 pointer-events-none'
          style={{
            backgroundImage: `url("${groupBg}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>

        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full'>
          {/* Header Section */}
          <div className='text-center mb-7 lg:mb-8'>
            <div className='inline-block border border-white/40 rounded-full px-4 py-1 mb-3'>
              <span className='text-white tracking-widest text-[9px] uppercase'>
                SALIENT FEATURES
              </span>
            </div>
            <h2 className='text-[30px] md:text-[36px] font-bold text-white mb-3 tracking-tight uppercase leading-[1.1]'>
              Salient <span className='text-[#F6B72D]'>Features</span>
            </h2>
            <p className='text-[12px] md:text-[13px] leading-[19px] md:leading-[21px] text-gray-300 max-w-[820px] mx-auto'>
              Together, Claire and James have successfully served 7,500+ executive clients over 20+ years. We believe true leadership is about people, not power, and empower next-generation leaders with the skills, values, and mindset to create lasting business and social impact.
            </p>
          </div>

          {/* Six cards in a balanced 3-by-2 grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 lg:gap-5 w-full'>
            {features.map((feature) => (
              <Link
                to={`/salient-features/${feature.slug}`}
                key={feature.slug}
                aria-label={`Read more about ${feature.title}`}
                className='min-h-[210px] lg:min-h-[225px] w-full group rounded-[20px] p-6 relative flex flex-col cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6B72D] transition-all duration-300 border bg-[#010125]/90 border-[#CBD5E1]/40 hover:bg-white hover:shadow-xl hover:border-[#F6B72D]'
              >
                {/* The card and arrow share this link to the feature detail page. */}
                <div aria-hidden='true' className='absolute top-5 right-5'>
                  <div className='w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-300 border-white/10 bg-[#010125]/50 group-hover:border-gray-200 group-hover:bg-white'>
                    <ArrowUpRight className='w-3.5 h-3.5 text-white group-hover:text-black transition-colors duration-300' />
                  </div>
                </div>

                {/* Icon Container */}
                <div className='mb-4'>
                  <div className='w-[44px] h-[44px] rounded-[12px] border bg-[#11112F] border-[#312E81]/50 flex items-center justify-center group-hover:bg-[#FFF8EB] group-hover:border-[#FFF8EB] transition-colors duration-300'>
                    <feature.icon className='w-5 h-5 text-[#F6B72D]' />
                  </div>
                </div>

                {/* Content */}
                <h3 className='text-[16px] md:text-[17px] font-bold leading-[22px] mb-2 text-white group-hover:text-[#111827] transition-colors duration-300'>
                  {feature.title}
                </h3>

                <div className='text-[12px] lg:text-[12.5px] leading-[18px] text-gray-400 group-hover:text-[#4B5563] transition-colors duration-300'>
                  {Array.isArray(feature.description) ? (
                    <ul className='space-y-0.5'>
                      {feature.description.slice(0, 4).map((item, i) => (
                        <li key={i} className='flex items-start'>
                          <span className='mr-1.5 mt-[7px] w-1 h-1 rounded-full bg-current flex-shrink-0'></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='line-clamp-3'>{feature.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

      </section>

      {/* CTA — matches reference design */}
      <section className='w-full relative overflow-hidden font-jakarta rounded-b-[20px]'>

        {/* Gold chevron background image */}
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `url("${yellowBackground}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className='relative z-10 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8 px-6 sm:px-10 lg:px-16 max-w-[1300px] mx-auto'>

          {/* Left: text + buttons */}
          <div className='flex flex-col items-start'>
            <h2 className='text-[26px] md:text-[36px] lg:text-[40px] font-bold text-[#161616] leading-[1.15] tracking-tight mb-3'>
              Ready To Transform ?
            </h2>
            <p className='text-[13px] md:text-[14px] text-[#1C1C1D]/75 font-medium mb-7 leading-[22px]'>
              Strategic guidance. Executive insight. Measurable transformation.
            </p>
            <div className='flex gap-4 flex-wrap'>
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-[#1A2332] text-white flex items-center pl-1.5 pr-5 py-1.5 rounded-full font-semibold text-[13px] hover:bg-[#0f1828] transition-all duration-300 hover:scale-[1.03] shadow-md'
              >
                <div className='bg-white rounded-full p-2 mr-3'>
                  <ArrowRight className='w-3.5 h-3.5 text-[#1A2332]' />
                </div>
                Start Your Journey
              </button>
              <a href="#case-studies-section">
                <button className='bg-[#F6B72D] text-[#161616] flex items-center pl-1.5 pr-5 py-1.5 rounded-full font-semibold text-[13px] hover:bg-[#e6ab29] transition-all duration-300 hover:scale-[1.03] shadow-md'>
                  <div className='bg-white rounded-full p-2 mr-3'>
                    <ArrowRight className='w-3.5 h-3.5 text-[#F6B72D]' />
                  </div>
                  Client Case Studies
                </button>
              </a>
            </div>
          </div>

          {/* Right: icon */}
          <div className='hidden md:flex items-center justify-center shrink-0 mr-8'>
            <img src={vectorImg} alt="Handshake Icon" className="w-[150px] h-auto object-contain opacity-95" />
          </div>
        </div>
      </section>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
