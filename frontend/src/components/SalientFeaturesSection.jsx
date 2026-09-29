import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppointmentModal from './AppointmentModal'
import {
  ArrowRight,
  TrendingUp,
  Map,
  Building,
  Zap,
  Globe,
  BarChart3,
  Lightbulb,
  Handshake,
  ArrowUpRight
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
    <section className='relative bg-[#010125] font-jakarta overflow-hidden pt-16 md:pt-24'>

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

      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-16 md:pb-24'>
        {/* Header Section */}
        <div className='flex flex-col items-center text-center mb-16'>
          <div className='inline-block border border-white/20 rounded-full px-5 py-1 mb-5'>
            <span className='text-white tracking-widest text-[9px] uppercase'>
              SALIENT FEATURES
            </span>
          </div>
          <h2 className='text-[36px] md:text-[42px] font-bold text-white mb-6 tracking-tight uppercase'>
            Salient <span className='text-[#F6B72D]'>Features</span>
          </h2>
          <p className='text-[14.5px] leading-[26px] text-gray-300 max-w-3xl mx-auto'>
            We believe true leadership is about people, not power. We empower next-gen leaders with the skills and
            mindset for long-term success. Our programs cultivate visionary leadership rooted in empathy, integrity, and purpose.<br className="hidden md:block" />
            We help leaders develop their moral compass to drive business success and social impact globally.
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {features.map((feature, idx) => (
            <Link
              to={`/salient-features/${feature.slug}`}
              key={idx}
              className='group rounded-[24px] p-8 relative flex flex-col transition-all duration-300 hover:-translate-y-1 bg-[#010125] border-[2px] border-[#9CA3AF] hover:bg-white hover:shadow-xl hover:border-[#F6B72D]'
            >
              {/* Optional Link Overlay / Arrow icon */}
              <div className='absolute top-6 right-6'>
                <div className='w-8 h-8 rounded-full border flex items-center justify-center border-white/10 bg-[#010125]/50 group-hover:border-gray-200 group-hover:bg-white transition-colors duration-300'>
                  <ArrowUpRight className='w-3.5 h-3.5 text-white group-hover:text-black transition-colors duration-300' />
                </div>
              </div>

              {/* Icon Container */}
              <div className='mb-6'>
                <div className='w-[50px] h-[50px] rounded-[14px] bg-[#1A2332] border border-[#312E81]/50 flex items-center justify-center group-hover:bg-[#FFF8EB] group-hover:border-[#FFF8EB] transition-colors duration-300'>
                  <feature.icon className='w-6 h-6 text-[#F6B72D]' />
                </div>
              </div>

              {/* Content */}
              <h3 className='text-[19px] md:text-[21px] font-bold leading-tight mb-4 text-white group-hover:text-[#111827] transition-colors duration-300'>
                {feature.title}
              </h3>

              <div className='text-[13.5px] leading-[24px] text-gray-400 group-hover:text-[#4B5563] transition-colors duration-300'>
                {Array.isArray(feature.description) ? (
                  <ul className='space-y-2'>
                    {feature.description.map((item, i) => (
                      <li key={i} className='flex items-start'>
                        <span className='mr-2 mt-2 w-1.5 h-1.5 rounded-full bg-[#F6B72D] flex-shrink-0'></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{feature.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Box seamlessly attached at the bottom (overlapping styled) */}
      <div className='w-full bg-[#CFA329] relative overflow-hidden'>

        {/* Decorative CTA background elements (matching screenshot angled shapes) */}
        <div className='absolute inset-0 opacity-20'>
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polygon fill="#ffffff" points="0,0 20,0 40,50 20,100 0,100" />
            <polygon fill="#ffffff" points="30,0 50,0 70,50 50,100 30,100" />
          </svg>
        </div>

        <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 flex flex-col md:flex-row items-center justify-between'>
          <div className='mb-8 md:mb-0'>
            <h2 className='text-[32px] md:text-[40px] font-bold text-[#010125] mb-3'>
              Ready To Transform ?
            </h2>
            <p className='text-[16px] text-[#010125] font-medium mb-8'>
              Strategic guidance. Executive insight. Measurable transformation.
            </p>
            <div className='flex gap-4 flex-wrap'>
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-[#010125] text-white flex items-center px-6 py-3.5 rounded-[100px] font-semibold text-[14px] hover:bg-gray-900 transition-colors pl-2'
              >
                <div className='bg-white rounded-full p-2 mr-3'>
                  <ArrowRight className='w-4 h-4 text-[#010125]' />
                </div>
                Start Your Journey
              </button>
              <a href="#case-studies-section">
                <button className='bg-[#F6B72D] text-[#010125] flex items-center px-6 py-3.5 rounded-[100px] font-semibold text-[14px] hover:opacity-90 transition-colors pl-2'>
                  <div className='bg-white rounded-full p-2 mr-3'>
                    <ArrowRight className='w-4 h-4 text-[#F6B72D]' />
                  </div>
                  Client Case Studies
                </button>
              </a>
            </div>
          </div>

          <div className='hidden md:flex justify-end mr-12'>
            <img src={vectorImg} alt="Handshake Icon" className="w-[140px] h-auto object-contain opacity-100" />
          </div>
        </div>
      </div>

      {/* Appointment Modal Component tied to CTA */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  )
}
