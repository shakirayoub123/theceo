import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { allCaseStudies } from '@/data/caseStudiesData'

export default function CaseStudies() {
  return (
    <div className='min-h-screen bg-[#FBF9F5] font-jakarta pb-24'>
      <Helmet>
        <title>Client Case Studies | The CEO Influencers</title>
        <meta
          name='description'
          content='Explore 11 real-world case studies documenting transformational outcomes for CEOs, executives, and organizations worldwide, delivered by The CEO Influencers LLC.'
        />
      </Helmet>

      {/* Hero Section Container matching Figma */}
      <div className='pt-6 pb-4 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto'>

        {/* Hero Card */}
        <div className='bg-[#000023] rounded-[24px] lg:rounded-[32px] pt-14 pb-16 px-4 relative overflow-hidden shadow-md'>
          {/* Topo Map Background */}
          <div
            className='absolute inset-0 z-0 opacity-10 pointer-events-none'
            style={{
              backgroundImage: `url('/images/body-bg.png')`,
              backgroundRepeat: 'repeat',
              backgroundSize: 'auto',
            }}
          ></div>

          <div className='relative z-10 flex flex-col items-center text-center'>
            {/* Pill */}
            <div className='inline-block border border-[#F6B72D]/50 rounded-full px-5 py-1.5 mb-6 bg-white/5'>
              <span className='text-white text-[11px] uppercase tracking-widest'>PROVEN RESULTS</span>
            </div>

            <h1 className='text-white text-[42px] md:text-[65px] font-semibold leading-tight tracking-[-1.8px] mb-6'>
              Client Case Studies
            </h1>

            <p className='text-[#CBD5E1] text-[15px] md:text-[17px] max-w-3xl leading-relaxed mb-16'>
              Eleven documented engagements with actual former clients of The CEO
              Influencers. These case studies use TCI client data and outcomes only;
              no other companies’ data or externally sourced outcomes are used.
            </p>

            {/* Stats */}
            <div className='flex flex-wrap justify-center items-center gap-x-8 md:gap-x-12 gap-y-10'>
              <div className='text-left md:text-center w-full md:w-auto px-4 md:px-0'>
                <p className='text-white text-[42px] md:text-[46px] font-bold leading-none mb-2'>11</p>
                <p className='text-[#F6B72D] text-[11px] uppercase tracking-widest font-bold'>Case Studies</p>
              </div>
              <div className='hidden md:block w-px h-12 bg-[#F59E0B]' />
              <div className='text-left md:text-center w-full md:w-auto px-4 md:px-0'>
                <p className='text-white text-[42px] md:text-[46px] font-bold leading-none mb-2'>100%</p>
                <p className='text-[#F6B72D] text-[11px] uppercase tracking-widest font-bold'>Adoption & Retention</p>
              </div>
              <div className='hidden md:block w-px h-12 bg-[#F59E0B]' />
              <div className='text-left md:text-center w-full md:w-auto px-4 md:px-0'>
                <p className='text-white text-[42px] md:text-[46px] font-bold leading-none mb-2'>1,847%</p>
                <p className='text-[#F6B72D] text-[11px] uppercase tracking-widest font-bold'>Average Client ROI</p>
              </div>
              <div className='hidden md:block w-px h-12 bg-[#F59E0B]' />
              <div className='text-left md:text-center w-full md:w-auto px-4 md:px-0'>
                <p className='text-white text-[42px] md:text-[46px] font-bold leading-none mb-2'>5M+</p>
                <p className='text-[#F6B72D] text-[11px] uppercase tracking-widest font-bold'>Lives Impacted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Banner directly attached to the bottom */}
        <div className='w-full bg-[#000023] py-3.5 px-4 flex items-center justify-center gap-4 text-center mt-3 shadow-md rounded-[8px]'>
          <span className='text-[white] text-base md:text-xl'>✦</span>
          <p className='text-white font-bold text-[12px] md:text-[15px] tracking-wide uppercase'>
            KEY RESULT:150% OVERALL PROFITABILITY INCREASE IN 30 DAYS
          </p>
          <span className='text-[white] text-base md:text-xl'>✦</span>
        </div>
      </div>

      {/* Grid */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
          {allCaseStudies.map((cs, idx) => (
            <Link
              to={`/case-studies/${cs.id}`}
              key={cs.id}
              aria-label={`Read case study ${idx + 1}: ${cs.title}`}
              className='block group h-full cursor-pointer rounded-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F6B72D]'
            >
              <CaseStudyCard cs={cs} index={idx} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function CaseStudyCard({ cs, index }) {
  const displayId = String(index + 1).padStart(2, '0')

  return (
    <div className='bg-[#FFFFFF] rounded-[24px] lg:rounded-[28px] overflow-hidden flex flex-col shadow-sm border border-[#CACACA] group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group-hover:-translate-y-1.5 transition-all duration-300 h-full min-h-[410px] lg:min-h-[430px] max-h-[480px] relative'>
      {/* Top Graphic Border */}
      <div className='h-[6px] w-full bg-[#F6B72D] absolute top-0 left-0 right-0 group-hover:bg-[#e6b82a] transition-colors'></div>

      <div className='p-5 lg:p-6 flex flex-col flex-1 mt-1 min-h-0'>
        {/* Identifier Badge */}
        <div className='mb-2 lg:mb-3'>
          <span className='bg-[#0B132B] text-white text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-[4px] tracking-wider uppercase inline-block'>
            CASE STUDY {displayId}
          </span>
        </div>

        {/* Subtitle Line */}
        <div className='flex min-w-0 items-center gap-2 mb-2'>
          <span aria-hidden='true' className='text-[#F6B72D] text-[18px] leading-none shrink-0'>•</span>
          <span title={cs.subtitle} className='text-[#F6B72D] text-[10px] font-bold uppercase tracking-widest truncate'>
            {cs.subtitle}
          </span>
        </div>

        {/* Title */}
        <h3 title={cs.title} className='text-[20px] lg:text-[22px] font-bold text-[#000000] mb-2 lg:mb-3 leading-snug font-jakarta line-clamp-2 min-h-[3.5rem] lg:min-h-[3.9rem]'>
          {cs.title}
        </h3>

        {/* Excerpt */}
        <p title={cs.excerpt} className='text-[#4B5563] text-[14px] leading-relaxed font-medium flex-1 min-h-0 mb-3 lg:mb-4 line-clamp-4 font-jakarta'>
          {cs.excerpt}
        </p>

        {/* Key Result Box */}
        <div className='bg-[#0B132B] rounded-[14px] p-4 mb-3 lg:mb-4 border-l-[3px] border-l-[#F6B72D] w-full group-hover:bg-[#161f3d] transition-colors shrink-0'>
          <p className='text-[#F6B72D] text-[9px] font-bold uppercase tracking-widest mb-1'>
            KEY RESULT
          </p>
          <p title={cs.keyResult} className='text-white font-bold text-[13px] lg:text-[14px] leading-snug line-clamp-2'>
            {cs.keyResult}
          </p>
        </div>

        {/* Footer Tags */}
        <div className='flex flex-nowrap gap-2 mt-auto h-[26px] overflow-hidden shrink-0'>
          {cs.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              title={tag}
              className='min-w-0 truncate text-[9px] font-bold text-[#797979] bg-[#F8F8F8] border border-[#E5E7EB] px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap'
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
