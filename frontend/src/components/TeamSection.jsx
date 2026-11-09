import { ArrowUpRight, ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

function CountUp({ end, duration = 3000, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      const easeOut = 1 - Math.pow(1 - progress, 3) // ease out cubic
      setCount(
        Math.floor(easeOut * end * Math.pow(10, decimals)) /
        Math.pow(10, decimals),
      )

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration, decimals])

  return (
    <>
      {count.toFixed(decimals)}
      {suffix}
    </>
  )
}

export default function TeamSection() {
  const { t } = useTranslation()
  const [activeVideo, setActiveVideo] = useState(null)

  const teamMembers = [
    {
      name: t('team.members.james.name', 'James Armstrong'),
      title: t('team.members.james.title', 'CDC/HPB/RMC INTERNATIONAL - CERTIFIED C-SUITE LEADERSHIP AND BUSINESS MENTOR'),
      image: '/images/james.jpg',
      stats: { clients: '5,000+', years: '20+' },
      link: '/biography/james-armstrong',
      biographyVideo: '/videos/JamesBio.mp4',
      philosophyVideo: '/videos/ourJames2.mp4',
      iconTheme: 'orange'
    },
    {
      name: t('team.members.claire.name', 'Dr. Claire Keogh'),
      title: t('team.members.claire.title', 'BSC IT (HONS), PHD. INTERNATIONAL C-SUITE LEADERSHIP AND BUSINESS MENTOR'),
      image: '/images/claire.jpeg',
      stats: { clients: '2,500+', years: '20+' },
      link: '/biography/claire-keogh',
      biographyVideo: '/videos/CliareBio.mp4',
      philosophyVideo: '/videos/ourcliare2.mp4',
      iconTheme: 'white'
    },
  ]

  return (
    <section id='team' className='py-6 lg:py-8 relative overflow-hidden bg-[#FCFBF7] font-jakarta min-h-[calc(100vh-140px)] flex flex-col justify-center'>
      <div className='w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header */}
        <div className='mb-5 md:mb-6 text-center'>
          <div className='inline-block border border-gray-400 rounded-full px-5 py-0.5 mb-3'>
            <span className='text-[#111827] font-semibold tracking-widest text-[9px] uppercase'>
              Who We Are
            </span>
          </div>
          <h2 className='text-[28px] lg:text-[34px] leading-[1.1] tracking-[-1.01px] font-bold text-[#111827] mb-2 uppercase'>
            Our <span className='text-[#F6B72D]'>Influencers</span>
          </h2>
          <p className='text-[13px] lg:text-[15px] leading-[24px] font-normal text-[#4B5563] max-w-2xl mx-auto'>
            Our expert coaching advisors provide cutting edge, personalized 2-on-1 coaching.
          </p>
        </div>

        {/* Team Members Grid */}
        <div className='grid md:grid-cols-2 gap-4 lg:gap-6 mb-5 md:mb-6'>
          {teamMembers.map((member, index) => (
            <div key={index} className='site-hover-highlight bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2.5 sm:p-3 flex flex-col sm:flex-row relative group hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300'>
              {/* Link Overlay — z-10, sits below the video button */}
              <Link to={member.link} className="absolute inset-0 z-10" />

              <div className='w-full sm:w-[38%] flex-shrink-0'>
                <img src={member.image} className='w-full h-[200px] sm:h-[100%] sm:min-h-[220px] object-cover rounded-[16px]' alt={member.name} />
              </div>

              <div className='p-3 md:px-5 md:py-2 flex flex-col justify-center w-full relative'>
                {/* Arrow icon */}
                <Link to={member.link} className='hidden sm:flex absolute top-1 right-2 z-20 hover:scale-110 transition-transform duration-200'>
                  {member.iconTheme === 'orange' ? (
                    <div className='w-7 h-7 rounded-full bg-[#F6B72D] flex items-center justify-center shadow-sm'>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className='w-7 h-7 rounded-full border border-gray-200 bg-[#F6B72D] flex items-center justify-center shadow-sm'>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </Link>

                <h3 className='text-[18px] md:text-[20px] font-extrabold text-[#111827] font-jakarta mb-1 leading-tight tracking-tight'>
                  {member.name}
                </h3>
                <p className='text-[8.5px] md:text-[9.5px] text-gray-500 font-semibold tracking-wider uppercase mb-3 leading-relaxed max-w-[95%]'>
                  {member.title}
                </p>

                <div className='flex justify-between items-center border border-gray-100 rounded-[12px] px-3 py-2 w-full md:w-[95%] mb-3 mt-auto'>
                  <div className='flex flex-col'>
                    <span className='text-[16px] md:text-[20px] font-extrabold text-[#111827] leading-none'>
                      {member.stats.clients}
                    </span>
                    <span className='text-[7px] md:text-[8px] uppercase tracking-[0.1em] text-gray-400 font-bold mt-1'>
                      Clients Advised
                    </span>
                  </div>
                  <div className='w-px h-8 bg-gray-200'></div>
                  <div className='flex flex-col'>
                    <span className='text-[16px] md:text-[20px] font-extrabold text-[#111827] leading-none'>
                      {member.stats.years}
                    </span>
                    <span className='text-[7px] md:text-[8px] uppercase tracking-[0.1em] text-gray-400 font-bold mt-1'>
                      Years Experience
                    </span>
                  </div>
                </div>

                {/* Biography and Philosophy actions sit above the card link overlay. */}
                <div className='relative z-20 flex flex-wrap items-center gap-2'>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setActiveVideo({
                        url: member.biographyVideo,
                        label: 'Biography',
                        memberName: member.name,
                      })
                    }}
                    className='inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#FCFBF7] py-1.5 pl-2 pr-4 text-[12px] font-bold text-[#111827] transition-colors hover:border-[#F6B72D] hover:bg-[#FFF8E8]'
                  >
                    <span className='flex h-8 w-8 items-center justify-center rounded-full bg-[#F6B72D]'>
                      <ArrowRight className='h-4 w-4 text-white' />
                    </span>
                    Biography
                  </button>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setActiveVideo({
                        url: member.philosophyVideo,
                        label: 'Philosophy',
                        memberName: member.name,
                      })
                    }}
                    className='inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#FCFBF7] py-1.5 pl-2 pr-4 text-[12px] font-bold text-[#111827] transition-colors hover:border-[#F6B72D] hover:bg-[#FFF8E8]'
                  >
                    <span className='flex h-8 w-8 items-center justify-center rounded-full bg-[#F6B72D]'>
                      <ArrowRight className='h-4 w-4 text-white' />
                    </span>
                    Philosophy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats Container */}
        <div className='w-full'>
          <div className='relative w-full bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 py-3 md:py-4 px-8 flex flex-col sm:flex-row items-center justify-around gap-3 md:gap-4 overflow-hidden'>

            {/* Top-Left gold underline decoration */}
            <div className='absolute top-0 left-[6%] w-[25%] h-[3px] bg-[#F6B72D] rounded-b-sm'></div>

            {/* Bottom-Right gold underline decoration */}
            <div className='absolute bottom-0 right-[6%] w-[25%] h-[3px] bg-[#F6B72D] rounded-t-sm'></div>

            {/* Item 1 */}
            <div className='flex flex-col items-center justify-center text-center w-full sm:w-1/3'>
              <div className='text-[28px] md:text-[36px] font-extrabold text-[#F6B72D] font-jakarta tracking-tight leading-none mb-1 md:mb-[6px]'>
                <CountUp end={7500} suffix={''} />+
              </div>
              <div className='text-[#111827] text-[9.5px] md:text-[10px] font-bold tracking-[0.15em] uppercase'>Total Clients Served</div>
            </div>

            {/* Divider */}
            <div className='hidden sm:block w-px h-10 bg-gray-200'></div>

            {/* Item 2 */}
            <div className='flex flex-col items-center justify-center text-center w-full sm:w-1/3'>
              <div className='flex items-center gap-1.5 justify-center text-[28px] md:text-[36px] font-extrabold text-[#F6B72D] font-jakarta tracking-tight leading-none mb-1 md:mb-[6px]'>
                <span><CountUp end={4.9} decimals={1} /></span>
                <svg className="w-5 h-5 md:w-[24px] md:h-[24px] fill-[#F6B72D] text-[#F6B72D] transform -translate-y-[1px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className='text-[#111827] text-[9.5px] md:text-[10px] font-bold tracking-[0.15em] uppercase'>Avg Rating</div>
            </div>

            {/* Divider */}
            <div className='hidden sm:block w-px h-10 bg-gray-200'></div>

            {/* Item 3 */}
            <div className='flex flex-col items-center justify-center text-center w-full sm:w-1/3'>
              <div className='text-[28px] md:text-[36px] font-extrabold text-[#F6B72D] font-jakarta tracking-tight leading-none mb-1 md:mb-[6px]'>
                <CountUp end={20} />+
              </div>
              <div className='text-[#111827] text-[9.5px] md:text-[10px] font-bold tracking-[0.15em] uppercase'>Years Experience Each</div>
            </div>
          </div>
        </div>

      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'
          onClick={() => setActiveVideo(null)}
        >
          <div
            className='relative w-full max-w-4xl aspect-video bg-black'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='absolute -top-10 right-0 text-white hover:text-gray-300'
              onClick={() => setActiveVideo(null)}
            >
              <X size={32} />
            </button>
            <p className='absolute -top-10 left-0 text-white text-sm font-semibold'>
              {activeVideo.memberName}: {activeVideo.label}
            </p>
            <video
              src={activeVideo.url}
              controls
              autoPlay
              className='w-full h-full'
            />
          </div>
        </div>
      )}
    </section>
  )
}
