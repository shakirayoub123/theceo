import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { featuredCaseStudies } from '@/data/caseStudiesData'
import mapBg2 from '@/assets/map bg 2.png'

export default function ClientCaseStudiesSection() {
  const displayStudies = featuredCaseStudies.slice(0, 3)

  return (
    <section className='py-8 lg:py-10 min-h-[calc(100vh-140px)] flex flex-col justify-center bg-[#FBF9F5] font-jakarta relative overflow-hidden'>

      {/* Background Topo */}
      <div
        className='absolute inset-0 z-0 opacity-100 pointer-events-none'
        style={{
          backgroundImage: `url("${mapBg2}")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'top center'
        }}
      ></div>

      <div className='max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header */}
        <div className='flex flex-col items-center text-center justify-center mb-6 lg:mb-8'>
          <div className='inline-block border border-gray-400 rounded-full px-4 py-0.5 mb-3 lg:mb-4 bg-white'>
            <span className='text-[#4B5563] font-bold tracking-widest text-[9px] lg:text-[10px] uppercase'>
              CLIENT SUCCESS STORIES
            </span>
          </div>

          <h2 className='text-[28px] lg:text-[36px] font-bold leading-none mb-3'>
            <span className='text-black'>Client </span>
            <span className='text-[#F6B72D] font-sans text-[30px] lg:text-[38px]'>Case Studies</span>
          </h2>

          <p className='text-[#6B7280] text-[14px] lg:text-[15px] leading-relaxed max-w-2xl font-medium mx-auto line-clamp-2'>
            Real results from real leaders. Explore how The CEO Influencers has
            transformed executives, organizations, and careers across industries
            worldwide.
          </p>
        </div>

        {/* 3 Grid Layout */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 lg:mb-8'>
          {displayStudies.map((cs, idx) => (
            <CaseStudyCard key={cs.id} cs={cs} index={idx} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='flex justify-center'>
          <Link
            to='/case-studies'
            className='inline-flex items-center gap-3 bg-[#0B132B] hover:bg-[#1a2b5c] text-white rounded-full transition-all duration-300 shadow-md pr-6 pl-1.5 py-1.5 group'
          >
            <div className='w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
              <ArrowRight className='w-3 h-3 lg:w-4 lg:h-4 text-[#0B132B]' />
            </div>
            <span className='font-bold text-[12px] lg:text-[13px] tracking-wide'>VIEW ALL 11 CASE STUDIES</span>
          </Link>
        </div>

      </div>
    </section>
  )
}

function CaseStudyCard({ cs, index }) {
  // Format to standard 2-digit number for visual consistency
  const displayId = String(index + 1).padStart(2, '0')

  return (
    <div className='bg-white rounded-[20px] lg:rounded-[24px] overflow-hidden flex flex-col shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full max-h-[460px] lg:max-h-[440px] relative'>

      {/* Top Graphic Border */}
      <div className='h-1 w-full bg-[#F6B72D] absolute top-0 left-0 right-0'></div>

      <div className='p-4 lg:p-5 flex flex-col flex-1 mt-0.5'>

        {/* Identifier Badge */}
        <div className='mb-2.5 lg:mb-3'>
          <span className='bg-[#0B132B] text-white text-[9px] font-bold px-2.5 py-1 rounded-sm tracking-wider uppercase inline-block'>
            CASE STUDY {displayId}
          </span>
        </div>

        {/* Subtitle Line */}
        <div className='flex items-center gap-1.5 mb-2'>
          <span className='text-[#F6B72D] text-xs lg:text-sm leading-none'>•</span>
          <span className='text-[#F6B72D] text-[9px] font-bold uppercase tracking-widest truncate line-clamp-1'>
            {cs.subtitle}
          </span>
        </div>

        {/* Title */}
        <h3 className='text-[16px] lg:text-[18px] font-bold text-black mb-2 lg:mb-3 leading-tight'>
          {cs.title}
        </h3>

        {/* Excerpt */}
        <p className='text-[#4B5563] text-[12px] lg:text-[13px] leading-relaxed font-medium flex-1 mb-4 lg:mb-5 line-clamp-3'>
          {cs.excerpt}
        </p>

        {/* Key Result Box */}
        <div className='bg-[#0B132B] rounded-[12px] p-3 lg:p-4 mb-4 lg:mb-5 border-l-[3px] border-l-[#F6B72D] w-full'>
          <p className='text-[#F6B72D] text-[8px] font-bold uppercase tracking-widest mb-1'>
            KEY RESULT
          </p>
          <p className='text-white font-bold text-[12px] lg:text-[13px] leading-snug line-clamp-2'>
            {cs.keyResult}
          </p>
        </div>

        {/* Footer Tags */}
        <div className='flex flex-wrap gap-2 mt-auto h-[26px] overflow-hidden'>
          {cs.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className='text-[8px] lg:text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap'
            >
              {tag}
            </span>
          ))}
        </div>

      </div>
    </div>
  )
}
