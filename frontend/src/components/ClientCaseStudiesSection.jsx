import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { allCaseStudies } from '@/data/caseStudiesData'
import mapBg2 from '@/assets/map bg 2.png'
import { useState } from 'react'

export default function ClientCaseStudiesSection() {
  const [page, setPage] = useState(0)
  const studiesPerPage = 3
  const pageCount = Math.ceil(allCaseStudies.length / studiesPerPage)
  const displayStudies = allCaseStudies.slice(
    page * studiesPerPage,
    (page + 1) * studiesPerPage,
  )
  const firstVisibleStudy = page * studiesPerPage + 1
  const lastVisibleStudy = Math.min((page + 1) * studiesPerPage, allCaseStudies.length)

  return (
    <section className='py-8 lg:py-10 bg-[#FBF9F5] font-jakarta relative overflow-hidden'>

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
        <div className='flex flex-col items-center text-center justify-center mb-5 lg:mb-6'>
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
          <p className='max-w-2xl mt-2 text-[#6B7280] text-[10px] lg:text-[11px] leading-relaxed font-medium'>
            These case studies are based on TCI’s work with actual former clients and use no other companies’ data or externally sourced outcomes.
          </p>
        </div>

        {/* 3 Grid Layout */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch gap-5 lg:gap-6 mb-6 lg:mb-8'>
          {displayStudies.map((cs, idx) => (
            <Link
              key={cs.id}
              to={`/case-studies/${cs.id}`}
              state={{ from: '/#case-studies-section' }}
              onClick={() => sessionStorage.setItem('tci_last_home_section', 'case-studies-section')}
              aria-label={`Read case study ${cs.id}: ${cs.title}`}
              className='group block h-full cursor-pointer rounded-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6B72D]'
            >
              <CaseStudyCard cs={cs} index={cs.id - 1} />
            </Link>
          ))}
        </div>

        {pageCount > 1 && (
          <div className='flex items-center justify-center gap-5 mb-5 lg:mb-6'>
            <button
              type='button'
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
              aria-label='Show previous three case studies'
              className='flex h-10 w-10 items-center justify-center rounded-full border border-[#0B132B]/20 bg-white text-[#0B132B] shadow-sm transition hover:border-[#F6B72D] hover:bg-[#F6B72D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#0B132B]/20 disabled:hover:bg-white'
            >
              <ArrowLeft className='h-4 w-4' aria-hidden='true' />
            </button>
            <span className='min-w-[110px] text-center text-sm font-semibold text-[#4B5563]' aria-live='polite'>
              {firstVisibleStudy}-{lastVisibleStudy} of {allCaseStudies.length}
            </span>
            <button
              type='button'
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={page === pageCount - 1}
              aria-label='Show next three case studies'
              className='flex h-10 w-10 items-center justify-center rounded-full border border-[#0B132B]/20 bg-white text-[#0B132B] shadow-sm transition hover:border-[#F6B72D] hover:bg-[#F6B72D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#0B132B]/20 disabled:hover:bg-white'
            >
              <ArrowRight className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        )}

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
  const overviewText = cs.excerpt || cs.executiveSummary || cs.caseSummary || ''

  return (
    <article className='bg-white rounded-[22px] lg:rounded-[26px] overflow-hidden flex flex-col shadow-sm border border-gray-200/90 group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] group-hover:-translate-y-1 transition-all duration-300 h-full min-h-[490px] lg:min-h-[510px] relative'>

      {/* Top Graphic Border Accent */}
      <div className='h-[5px] w-full bg-[#F6B72D] absolute top-0 left-0 right-0 group-hover:bg-[#e6b82a] transition-colors'></div>

      <div className='p-5 sm:p-6 lg:p-7 flex flex-col flex-1 mt-1'>

        {/* Identifier Badge */}
        <div className='mb-2.5'>
          <span className='bg-[#000023] text-white text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-[4px] tracking-wider uppercase inline-block'>
            CASE STUDY {displayId}
          </span>
        </div>

        {/* Subtitle Line */}
        <div className='flex min-w-0 items-center gap-1.5 mb-2'>
          <span className='text-[#F6B72D] text-xs lg:text-sm leading-none shrink-0'>•</span>
          <span className='text-[#F6B72D] text-[9.5px] lg:text-[10px] font-bold uppercase tracking-widest truncate'>
            {cs.subtitle}
          </span>
        </div>

        {/* Title */}
        <h3 className='text-[18px] lg:text-[20px] font-bold text-[#000023] mb-3 leading-snug font-jakarta line-clamp-2 min-h-[3rem] lg:min-h-[3.4rem] group-hover:text-[#A87500] transition-colors'>
          {cs.title}
        </h3>

        {/* Overview Label & Text */}
        <div className='mb-4 flex-1 flex flex-col'>
          <p className='text-[#B77900] text-[10px] font-bold uppercase tracking-wider mb-1.5'>
            OVERVIEW
          </p>
          <p className='text-[#4B5563] text-[13px] lg:text-[13.5px] leading-relaxed font-normal line-clamp-3 lg:line-clamp-4'>
            {overviewText}
          </p>
        </div>

        {/* Key Result Box */}
        <div className='bg-[#000023] rounded-[14px] p-3.5 lg:p-4 mb-4 border-l-[3px] border-l-[#F6B72D] w-full shrink-0 group-hover:bg-[#070730] transition-colors shadow-sm'>
          <p className='text-[#F6B72D] text-[8.5px] lg:text-[9px] font-bold uppercase tracking-widest mb-1'>
            KEY RESULT
          </p>
          <p className='text-white font-semibold text-[12.5px] lg:text-[13.5px] leading-snug line-clamp-2'>
            {cs.keyResult}
          </p>
        </div>

        {/* Bottom Part: Tags & Action */}
        <div className='mt-auto pt-3 border-t border-gray-100 flex flex-col gap-3 shrink-0'>
          {/* Tags */}
          <div className='flex items-center gap-1.5 flex-nowrap overflow-hidden'>
            {cs.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                title={tag}
                className='text-[8.5px] lg:text-[9px] font-bold text-[#4B5563] bg-[#F8F9FA] border border-[#E5E7EB] px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap truncate shrink-0'
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Interactive CTA */}
          <div className='flex items-center justify-between pt-0.5'>
            <span className='inline-flex items-center gap-1.5 text-[12px] lg:text-[13px] font-bold text-[#000023] group-hover:text-[#D99A1A] transition-colors'>
              Read Full Case Study
              <ArrowRight className='w-3.5 h-3.5 text-[#F6B72D] group-hover:translate-x-1.5 transition-transform' />
            </span>
            <span className='text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors'>
              Explore →
            </span>
          </div>
        </div>

      </div>
    </article>
  )
}
