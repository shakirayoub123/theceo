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

export default function SalientFeaturesSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const features = [
    {
      title: 'Holistic 360° Leadership Development',
      icon: Lightbulb,
      slug: 'holistic-360-leadership-development',
      description: [
        'Holistic 360° Leadership Development',
        'Two-To-One Advantage™ with expert mentors',
        'APO-Aligned Performance Optimization',
        'LLM-Linear Leadership Model™'
      ]
    },
    {
      title: 'Global Expertise, Local Impact',
      icon: Map,
      slug: 'global-expertise-local-impact',
      description: 'We translate international insights into actionable, market-specific strategies. Mentoring 5,000+ executives across 186 industries...'
    },
    {
      title: 'Long-Term Profitability',
      icon: Building,
      slug: 'long-term-profitability',
      description: 'Sustainable growth stems from empathetic, ethical leadership. We prioritize transparency and responsibility to build resilient cultures and brand loyalty...'
    },
    {
      title: 'Empathy at the Core',
      icon: Zap,
      slug: 'empathy-at-the-core',
      description: 'Empathy is a strategic imperative that fosters inclusive cultures and inspires trust. We help executives unlock engagement and drive...'
    },
    {
      title: 'Building Strategic Partnerships & Alliances',
      icon: Globe,
      slug: 'strategic-partnerships-alliances',
      description: 'Strategic alliances are essential for resilience and growth. We coach leaders to develop partnerships that expand capabilities...'
    },
    {
      title: 'Maximizing AI Technology Strategy',
      icon: BarChart3,
      slug: 'maximizing-ai-technology-strategy',
      description: 'AI is a strategic enabler. We advise leaders on harnessing AI to optimize decision-making and uncover growth opportunities...'
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
              We believe true leadership is about people, not power. We empower next-gen leaders with the skills and mindset for long-term success. Our programs cultivate visionary leadership rooted in empathy, integrity, and purpose. We help leaders develop their moral compass to drive business success and social impact globally.
            </p>
          </div>

          {/* Six cards in a balanced 3-by-2 grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 lg:gap-5 w-full'>
            {features.map((feature) => (
              <Link
                to={`/salient-features/${feature.slug}`}
                key={feature.slug}
                className='min-h-[190px] lg:min-h-[205px] w-full group rounded-[20px] p-5 lg:p-5 relative flex flex-col transition-all duration-300 border bg-[#010125]/90 border-[#CBD5E1]/40 hover:bg-white hover:shadow-xl hover:border-[#F6B72D]'
              >
                {/* Optional Link Overlay / Arrow icon */}
                <div className='absolute top-5 right-5'>
                  <div className='w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-300 border-white/10 bg-[#010125]/50 group-hover:border-gray-200 group-hover:bg-white'>
                    <ArrowUpRight className='w-3.5 h-3.5 text-white group-hover:text-black transition-colors duration-300' />
                  </div>
                </div>

                {/* Icon Container */}
                <div className='mb-3'>
                  <div className='w-[40px] h-[40px] rounded-[12px] border bg-[#11112F] border-[#312E81]/50 flex items-center justify-center group-hover:bg-[#FFF8EB] group-hover:border-[#FFF8EB] transition-colors duration-300'>
                    <feature.icon className='w-5 h-5 text-[#F6B72D]' />
                  </div>
                </div>

                {/* Content */}
                <h3 className='text-[15px] md:text-[16px] font-bold leading-[21px] mb-2 text-white group-hover:text-[#111827] transition-colors duration-300'>
                  {feature.title}
                </h3>

                <div className='text-[11px] lg:text-[11.5px] leading-[17px] text-gray-400 group-hover:text-[#4B5563] transition-colors duration-300'>
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

        {/* Gold gradient background */}
        <div className='absolute inset-0' style={{
          background: 'linear-gradient(110deg, #D4B84A 0%, #CFA329 35%, #A8820F 100%)'
        }} />

        {/* Chevron / arrow shapes overlay */}
        <div className='absolute inset-0 overflow-hidden'>
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="rgba(255,255,255,0.12)" points="0,0 170,0 270,100 170,200 0,200" />
            <polygon fill="rgba(255,255,255,0.10)" points="140,0 310,0 410,100 310,200 140,200" />
            <polygon fill="rgba(255,255,255,0.08)" points="280,0 450,0 550,100 450,200 280,200" />
            <polygon fill="rgba(255,255,255,0.06)" points="420,0 580,0 680,100 580,200 420,200" />
          </svg>
        </div>

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
