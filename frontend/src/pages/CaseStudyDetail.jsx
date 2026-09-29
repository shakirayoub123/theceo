import { ArrowRight, ArrowLeft, Clock, Tag, Zap } from 'lucide-react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { allCaseStudies } from '@/data/caseStudiesData'

export default function CaseStudyDetail() {
  const { id } = useParams()
  const cs = allCaseStudies.find((s) => s.id === Number(id))

  if (!cs) return <Navigate to='/case-studies' replace />

  // Clever Regex to parse Approach text into display cards if structured
  const parseApproachToGrid = (text) => {
    if (text.includes('Phase I ') || text.includes('Phase II ')) {
      const parts = text.split(/(Phase I |Phase II |Phase III |Phase IV )/);
      const intro = parts[0].trim();
      const phases = [];
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i] && parts[i + 1]) {
          phases.push({
            title: `WINDOW 0${(i + 1) / 2}`,
            content: (parts[i] + parts[i + 1]).trim().replace(/^Phase [I]+ \((.*?)\),\s*/i, '$1: ')
          })
        }
      }
      // Cleanup content string a bit just to look clean
      phases.forEach(p => {
        if (p.content.startsWith('Phase')) {
          const colonIdx = p.content.indexOf(':');
          if (colonIdx > 0 && colonIdx < 30) {
            p.title = p.content.substring(0, colonIdx);
            p.content = p.content.substring(colonIdx + 1).trim();
          }
        }
      })
      return { intro, phases };
    }
    if (text.includes('Month 1:') || text.includes('Month 2:')) {
      const parts = text.split(/(Month 1:|Month 2:|Month 3:)/);
      const intro = parts[0].trim();
      const phases = [];
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i] && parts[i + 1]) {
          phases.push({
            title: parts[i].replace(':', '').trim().toUpperCase(),
            content: parts[i + 1].trim()
          })
        }
      }
      return { intro, phases };
    }
    return { intro: text, phases: [] };
  }

  const { intro: approachIntro, phases: approachPhases } = parseApproachToGrid(cs.approach);

  return (
    <div className='min-h-screen bg-[#FFFFFF] font-jakarta pb-24'>
      <Helmet>
        <title>{cs.title} | Client Case Studies | The CEO Influencers</title>
        <meta name='description' content={cs.excerpt} />
      </Helmet>

      {/* Hero Section Container matching Figma */}
      <div className='pt-6 pb-4 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto'>
        {/* Hero Card */}
        <div className='bg-[#000023] rounded-[24px] lg:rounded-[32px] pt-16 pb-20 px-8 relative overflow-hidden shadow-md'>
          {/* Topo map */}
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
            <div className='inline-block border border-gray-600 rounded-full px-5 py-1.5 mb-6 bg-white/5'>
              <span className='text-white text-[11px] uppercase tracking-widest'>CASE STUDY #{cs.id}</span>
            </div>

            <h1 className='text-white text-[38px] md:text-[54px] font-semibold leading-tight tracking-[-1px] mb-4 max-w-4xl'>
              {cs.title}
            </h1>

            <p className='text-[#F6B72D] text-[13px] md:text-[14px] font-bold uppercase tracking-widest mb-4'>
              {cs.subtitle}
            </p>

            <p className='text-[#CBD5E1] text-[14px] md:text-[15px] mb-8 font-medium'>
              {cs.client}
            </p>

            {/* Embedded Pills */}
            <div className='flex flex-wrap justify-center gap-3'>
              <div className='flex items-center gap-2 bg-[#000023] border border-[#2D2D4A] rounded-full px-4 py-1.5 shadow-inner'>
                <Clock className='w-4 h-4 text-[#CBD5E1]' />
                <span className='text-[#CBD5E1] text-[12px] font-medium'>{cs.duration}</span>
              </div>
              <div className='flex items-center gap-2 bg-[#000023] border border-[#2D2D4A] rounded-full px-4 py-1.5 shadow-inner'>
                <Tag className='w-4 h-4 text-[#CBD5E1]' />
                <span className='text-[#CBD5E1] text-[12px] font-medium'>{cs.tags.slice(0, 2).join(' · ')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Global Key Result Banner - Edge to Edge Layout */}
      <div className='w-full bg-gradient-to-r from-[#F59E0B] via-[#454545] to-[#1F2937] py-4 px-4 flex items-center justify-center gap-4 text-center mt-3 shadow-md relative z-10'>
        <span className='text-white text-base md:text-xl'>✦</span>
        <p className='text-white font-bold text-[13px] md:text-[15px] tracking-widest uppercase'>
          KEY RESULT:{cs.keyResult}
        </p>
        <span className='text-white text-base md:text-xl'>✦</span>
      </div>

      {/* Meta Detail Box */}
      <div className='max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 mt-10'>
        <div className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-10 shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#E5E7EB] pb-8 mb-8'>
            <div>
              <p className='text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-1.5'>Client</p>
              <p className='text-[#000000] font-bold text-[15px]'>{cs.client}</p>
            </div>
            <div>
              <p className='text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-1.5'>Duration</p>
              <p className='text-[#000000] font-bold text-[15px]'>{cs.duration}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-5 gap-8'>
            <div className='md:col-span-2'>
              <p className='text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-2'>Key Result</p>
              <p className='text-[#000000] font-bold text-[15px] leading-snug'>{cs.keyResult}</p>
            </div>
            <div className='md:col-span-3 flex flex-wrap gap-2 items-start'>
              {cs.tags.map((tag, idx) => (
                <span key={idx} className='text-[10px] font-bold text-[#797979] bg-[#F8F8F8] border border-[#E5E7EB] px-3.5 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap'>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider Title */}
        <div className='flex items-center justify-center mt-20 mb-8'>
          <div className='w-12 h-[2px] bg-[#F6B72D]'></div>
          <p className='mx-4 text-[#F6B72D] text-[11px] font-bold uppercase tracking-widest'>EXECUTIVE SUMMARY</p>
          <div className='w-12 h-[2px] bg-[#F6B72D]'></div>
        </div>

        <h2 className='text-center text-[28px] md:text-[32px] font-black text-[#000000] mb-12 uppercase tracking-tight'>
          Case Study Overview
        </h2>

        {/* The Challenge Card */}
        <div className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm text-center mb-8 hover:shadow-md transition-shadow'>
          <div className='w-8 h-[3px] bg-[#F6B72D] mx-auto mb-4 rounded-full'></div>
          <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-6'>The Challenge</h3>
          <p className='text-[#4B5563] text-[15px] md:text-[16px] leading-relaxed font-medium mx-auto max-w-4xl text-center'>{cs.challenge}</p>
        </div>

        {/* Approach Card */}
        <div className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm text-center mb-8 hover:shadow-md transition-shadow'>
          <div className='w-8 h-[3px] bg-[#F6B72D] mx-auto mb-4 rounded-full'></div>
          <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-6'>TCI's Approach</h3>

          <p className='text-[#4B5563] text-[15px] md:text-[16px] leading-relaxed font-medium mx-auto max-w-4xl text-center mb-10'>
            {approachIntro}
          </p>

          {approachPhases.length > 0 && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto'>
              {approachPhases.map((phase, i) => (
                <div key={i} className='bg-[#FDFBF7] border border-[#F6B72D]/20 border-t-[4px] border-t-[#F6B72D] rounded-[12px] p-6 shadow-sm'>
                  <p className='text-[#B45309] text-[10px] font-bold uppercase tracking-widest mb-3'>
                    {phase.title}
                  </p>
                  <p className='text-[#4B5563] text-[13px] md:text-[14px] leading-relaxed font-medium'>
                    {phase.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outcomes Card */}
        <div className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm text-center mb-8 hover:shadow-md transition-shadow'>
          <div className='w-8 h-[3px] bg-[#F6B72D] mx-auto mb-4 rounded-full'></div>
          <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-10'>Outcomes</h3>

          {/* Headline Achievement Box */}
          <div className='max-w-4xl mx-auto bg-[#FFFBF0] border border-[#F6B72D]/30 rounded-[12px] p-6 flex flex-col md:flex-row items-center gap-6 mb-8 hover:shadow-sm transition-all'>
            <div className='w-12 h-12 bg-[#F6B72D] rounded-[10px] flex items-center justify-center shrink-0 shadow-sm'>
              <Zap className='w-6 h-6 text-white shrink-0' />
            </div>
            <div className='text-center md:text-left'>
              <p className='text-[#B45309] text-[10px] font-bold uppercase tracking-widest mb-1.5'>Headline Achievement</p>
              <p className='text-[#000000] font-bold text-[18px] md:text-[20px] leading-tight'>{cs.keyResult}</p>
            </div>
          </div>

          {/* Other Outcomes Grid */}
          <div className='max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4'>
            {cs.outcomes.map((outcome, idx) => (
              <div key={idx} className='bg-[#F8F9FA] rounded-[10px] p-5 flex items-start gap-4 text-left shadow-sm border border-transparent hover:border-[#CACACA] transition-colors'>
                <div className='w-1.5 h-1.5 rounded-full bg-[#F6B72D] mt-2 shrink-0'></div>
                <p className='text-[#4B5563] text-[13px] md:text-[14px] leading-relaxed font-medium'>{outcome}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className='bg-[#F6B72D] rounded-[16px] p-10 md:p-16 text-center shadow-lg mt-16 max-w-[900px] mx-auto'>
          <h2 className='text-[28px] md:text-[36px] font-bold text-[#000000] tracking-tight mb-3'>
            READY TO WRITE YOUR OWN?
          </h2>
          <p className='text-[#000000] text-[15px] md:text-[17px] mb-8 font-semibold opacity-90'>
            Schedule a confidential discovery call today.
          </p>
          <Link
            to='/'
            className='inline-flex items-center gap-3 bg-white text-[#000000] font-bold py-3.5 px-8 rounded-full text-[13px] transition-transform hover:scale-105 shadow-sm'
          >
            <span className='w-6 h-6 bg-[#F6B72D] rounded-full flex items-center justify-center shrink-0 shadow-inner'>
              <ArrowRight className='h-4 w-4 text-white' />
            </span>
            GET STARTED
          </Link>
        </div>

        {/* Bottom Nav */}
        <div className='text-center mt-12 pb-8'>
          <Link to='/case-studies' className='inline-flex items-center gap-3 bg-[#000023] text-white font-bold py-3.5 px-8 rounded-full text-[12px] uppercase tracking-widest transition-transform hover:-translate-y-1 hover:shadow-lg'>
            <span className='w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0'>
              <ArrowLeft className='h-4 w-4 text-[#000023]' />
            </span>
            VIEW ALL 11 CASE STUDIES
          </Link>
        </div>
      </div>
    </div>
  )
}
