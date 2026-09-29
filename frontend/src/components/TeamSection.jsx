import { ArrowUpRight, ArrowRight } from 'lucide-react'
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

  const teamMembers = [
    {
      name: t('team.members.james.name', 'James Armstrong'),
      title: t('team.members.james.title', 'CDC/HPB/RMC INTERNATIONAL - CERTIFIED C-SUITE LEADERSHIP AND BUSINESS MENTOR'),
      image: '/images/james.jpg',
      stats: { clients: '5,000+', years: '25+' },
      link: '/biography/james-armstrong',
      iconTheme: 'orange'
    },
    {
      name: t('team.members.claire.name', 'Dr. Claire Keogh'),
      title: t('team.members.claire.title', 'BSC IT (HONS), PHD. INTERNATIONAL C-SUITE LEADERSHIP AND BUSINESS MENTOR'),
      image: '/images/claire.jpeg',
      stats: { clients: '2500+', years: '20+' },
      link: '/biography/claire-keogh',
      iconTheme: 'white'
    },
  ]

  return (
    <section id='team' className='py-12 lg:py-20 relative overflow-hidden bg-[#FCFBF7] font-jakarta'>
      <div className='w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header */}
        <div className='mb-12 text-center'>
          <div className='inline-block border border-gray-400 rounded-full px-5 py-1 mb-5'>
            <span className='text-[#111827] font-semibold tracking-widest text-[9px] uppercase'>
              Who We Are
            </span>
          </div>
          <h2 className='text-[40px] leading-[51px] tracking-[-1.01px] font-bold text-[#111827] mb-2 uppercase'>
            Our <span className='text-[#F6B72D]'>Influencers</span>
          </h2>
          <p className='text-[16px] leading-[28px] tracking-[0px] font-normal text-[#4B5563] max-w-2xl mx-auto'>
            Our expert coaching advisors provide cutting edge, personalized 2-on-1 coaching.
          </p>
        </div>

        {/* Team Members Grid */}
        <div className='grid md:grid-cols-2 gap-6 lg:gap-8 mb-12'>
          {teamMembers.map((member, index) => (
            <div key={index} className='bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row relative group hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300'>
              {/* Link Overlay */}
              <Link to={member.link} className="absolute inset-0 z-10" />

              <div className='w-full sm:w-[38%] flex-shrink-0'>
                <img src={member.image} className='w-full h-[250px] sm:h-full object-cover rounded-[16px]' alt={member.name} />
              </div>

              <div className='p-4 md:px-7 md:py-3 flex flex-col justify-center w-full relative'>
                {/* Arrow icon absolute positioned */}
                <Link to={member.link} className='hidden sm:flex absolute top-1 right-2 z-20 hover:scale-110 transition-transform duration-200'>
                  {member.iconTheme === 'orange' ? (
                    <div className='w-7 h-7 rounded-full bg-[#F6B72D] flex items-center justify-center shadow-sm'>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className='w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm'>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#111827]" />
                    </div>
                  )}
                </Link>

                <h3 className='text-[22px] md:text-[25px] font-extrabold text-[#111827] font-jakarta mb-1 leading-tight tracking-tight'>
                  {member.name}
                </h3>
                <p className='text-[10px] md:text-[11px] text-gray-500 font-semibold tracking-wider uppercase mb-7 leading-relaxed max-w-[90%]'>
                  {member.title}
                </p>

                <div className='flex justify-between items-center border border-gray-100 rounded-[14px] px-6 py-4 w-full md:w-[95%] mb-5'>
                  <div className='flex flex-col'>
                    <span className='text-[18px] md:text-[22px] font-extrabold text-[#111827]'>
                      {member.stats.clients}
                    </span>
                    <span className='text-[7.5px] md:text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold mt-1'>
                      Clients Advised
                    </span>
                  </div>
                  <div className='w-px h-10 bg-gray-200'></div>
                  <div className='flex flex-col'>
                    <span className='text-[18px] md:text-[22px] font-extrabold text-[#111827]'>
                      {member.stats.years}
                    </span>
                    <span className='text-[7.5px] md:text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold mt-1'>
                      Years Experience
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-[95%]">
                  <div className="flex items-center gap-3 bg-[#FCFBF7] border border-gray-200 rounded-full py-1.5 px-2 hover:bg-gray-50 transition-colors w-max transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-[#F6B72D] flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[13px] font-bold text-[#111827] pr-4">View Introduction Video</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats Container */}
        <div className='w-full'>
          <div className='relative w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 py-6 md:py-[24px] px-8 flex flex-col sm:flex-row items-center justify-around gap-8 md:gap-4 overflow-hidden'>

            {/* Top-Left gold underline decoration */}
            <div className='absolute top-0 left-[6%] w-[25%] h-[3px] bg-[#F6B72D] rounded-b-sm'></div>

            {/* Bottom-Right gold underline decoration */}
            <div className='absolute bottom-0 right-[6%] w-[25%] h-[3px] bg-[#F6B72D] rounded-t-sm'></div>

            {/* Item 1 */}
            <div className='flex flex-col items-center justify-center text-center w-full sm:w-1/3'>
              <div className='text-[34px] md:text-[42px] font-extrabold text-[#F6B72D] font-jakarta tracking-tight leading-none mb-[10px]'>
                <CountUp end={5000} suffix={''} />+
              </div>
              <div className='text-[#111827] text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase'>Total Clients</div>
            </div>

            {/* Divider */}
            <div className='hidden sm:block w-px h-12 bg-gray-200'></div>

            {/* Item 2 */}
            <div className='flex flex-col items-center justify-center text-center w-full sm:w-1/3'>
              <div className='flex items-center gap-1.5 justify-center text-[34px] md:text-[42px] font-extrabold text-[#F6B72D] font-jakarta tracking-tight leading-none mb-[10px]'>
                <span><CountUp end={4.9} decimals={1} /></span>
                <svg className="w-7 h-7 md:w-[32px] md:h-[32px] fill-[#F6B72D] text-[#F6B72D] transform -translate-y-[1px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className='text-[#111827] text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase'>Avg Rating</div>
            </div>

            {/* Divider */}
            <div className='hidden sm:block w-px h-12 bg-gray-200'></div>

            {/* Item 3 */}
            <div className='flex flex-col items-center justify-center text-center w-full sm:w-1/3'>
              <div className='text-[34px] md:text-[42px] font-extrabold text-[#F6B72D] font-jakarta tracking-tight leading-none mb-[10px]'>
                <CountUp end={45} />+
              </div>
              <div className='text-[#111827] text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase'>Years Combined</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
