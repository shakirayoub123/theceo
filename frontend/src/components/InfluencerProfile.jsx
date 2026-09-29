import { Award, Calendar, Globe, Mail, Linkedin } from 'lucide-react'

export default function InfluencerProfile({
  name,
  title,
  description,
  image,
  languages,
  experience,
  achievements,
}) {
  return (
    <div className='flex flex-col lg:flex-row gap-8 lg:gap-14 w-full p-8 md:p-12'>
      {/* Left - Photo */}
      <div className='lg:flex-shrink-0'>
        <img
          src={image || '/placeholder.svg'}
          alt={name}
          className='w-full lg:w-[420px] h-[480px] object-cover object-center rounded-[6px]'
        />
      </div>

      {/* Right - Info */}
      <div className='flex flex-col justify-center font-jakarta'>
        <div className='flex items-center gap-3 mb-3'>
          <div className='w-6 h-[2px] bg-[#F6B72D]'></div>
          <p className='text-[#F6B72D] text-[11px] font-extrabold uppercase tracking-widest'>OUR INFLUENCER</p>
        </div>
        <h2 className='text-[36px] md:text-[42px] leading-[1.1] font-bold text-[#000023] mb-5 tracking-tight'>{name}</h2>
        <p className='text-[#4B5563] mb-8 text-[16px] leading-[1.6] max-w-[550px]'>{description}</p>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8'>
          <div className='border border-gray-200 rounded-[10px] p-5 flex flex-col justify-center bg-white shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex items-center gap-2 text-[#F6B72D] mb-3'>
              <Calendar className='h-4 w-4' />
              <span className='text-[10px] font-bold tracking-widest uppercase'>EXPERIENCE</span>
            </div>
            <div className='text-[32px] font-black text-[#000023] mb-1 leading-none'>25+</div>
            <p className='text-[#9CA3AF] text-[10px] tracking-widest uppercase font-semibold'>YEARS OF EXPERIENCE</p>
          </div>

          <div className='border border-gray-200 rounded-[10px] p-5 flex flex-col justify-center bg-white shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex items-center gap-2 text-[#F6B72D] mb-3'>
              <Award className='h-4 w-4' />
              <span className='text-[10px] font-bold tracking-widest uppercase'>LEADERSHIP</span>
            </div>
            <div className='text-[32px] font-black text-[#000023] mb-1 leading-none'>5,000+</div>
            <p className='text-[#9CA3AF] text-[10px] tracking-widest uppercase font-semibold'>TOP EXECUTIVE LEADERS</p>
          </div>

          <div className='border border-gray-200 rounded-[10px] p-5 flex flex-col justify-center bg-white shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex items-center gap-2 text-[#F6B72D] mb-3'>
              <Globe className='h-4 w-4' />
              <span className='text-[10px] font-bold tracking-widest uppercase'>LANGUAGES</span>
            </div>
            <div className='text-[#000023] text-[14px] font-bold mb-2'>Speaks: {languages && languages[0]}</div>
            <div className='flex items-center gap-1.5 text-[12px] text-gray-500'>
              <span className='bg-[#F6B72D] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-[3px] tracking-widest uppercase'>NATIVE</span>
              <span>, {languages && languages.slice(1).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className='flex flex-wrap sm:flex-nowrap gap-5'>
          <a href='mailto:james.theceoinfluencers.com' className='border border-gray-200 rounded-[10px] p-3 flex items-center gap-4 hover:border-[#F6B72D] transition-colors flex-1 shadow-sm hover:shadow-md bg-white'>
            <div className='bg-[#FFFBEB] p-2.5 rounded-[6px]'>
              <Mail className='h-5 w-5 text-[#F6B72D]' />
            </div>
            <div>
              <div className='text-[#9CA3AF] text-[10px] font-bold tracking-widest uppercase mb-1'>EMAIL INQUIRIES</div>
              <div className='text-[#000023] text-[13px] font-semibold'>james.theceoinfluencers.com</div>
            </div>
          </a>

          <a href='https://www.linkedin.com/in/jamesharmstrong/?skipRedirect=true' target='_blank' rel='noopener noreferrer' className='border border-gray-200 rounded-[10px] p-3 flex items-center gap-4 hover:border-[#F6B72D] transition-colors flex-1 shadow-sm hover:shadow-md bg-white'>
            <div className='bg-[#FFFBEB] p-2.5 rounded-[6px]'>
              <Linkedin className='h-5 w-5 text-[#F6B72D]' />
            </div>
            <div>
              <div className='text-[#9CA3AF] text-[10px] font-bold tracking-widest uppercase mb-1'>EXECUTIVE NETWORK</div>
              <div className='text-[#000023] text-[13px] font-semibold'>Connect on LinkedIn</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
