import { useState } from 'react'
import { ArrowRight, Clock, Tag, FileDown } from 'lucide-react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { allCaseStudies } from '@/data/caseStudiesData'
import PageBackButton from '@/components/common/PageBackButton'
import AppointmentModal from '@/components/AppointmentModal'
import bgHeader from '@/assets/bgHeader.png'

export default function CaseStudyDetail() {
  const { id } = useParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const cs = allCaseStudies.find((s) => s.id === Number(id))

  if (!cs) return <Navigate to='/case-studies' replace />

  return (
    <div className='min-h-screen bg-[#FFFFFF] font-jakarta pb-24'>
      <Helmet>
        <title>{cs.title} | Client Case Studies | The CEO Influencers</title>
        <meta name='description' content={cs.excerpt} />
      </Helmet>

      {/* Top Back Button */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4'>
        <PageBackButton
          fallbackUrl='/#case-studies-section'
          label='Back to Case Studies'
        />
      </div>

      {/* Hero Section Container */}
      <div className='pt-4 pb-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto'>
        <div className='bg-[#000023] rounded-[24px] lg:rounded-[32px] pt-16 pb-20 px-8 relative overflow-hidden shadow-md'>
          {/* Topo map */}
          <div
            className='absolute inset-0 z-0 opacity-20 pointer-events-none'
            style={{
              backgroundImage: `url("${bgHeader}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div className='relative z-10 flex flex-col items-center text-center'>
            {cs.caseStudyEyebrow && (
              <p className='text-[#F6B72D] text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] mb-3'>
                {cs.caseStudyEyebrow}
              </p>
            )}
            <div className='inline-block border border-gray-600 rounded-full px-5 py-1.5 mb-6 bg-white/5'>
              <span className='text-white text-[11px] uppercase tracking-widest'>
                CASE STUDY #{cs.id}
              </span>
            </div>

            <h1 className='text-white text-[32px] sm:text-[40px] md:text-[52px] font-semibold leading-tight tracking-[-1px] mb-4 max-w-4xl uppercase'>
              {cs.title}
            </h1>

            {cs.secondaryTitle && (
              <p className='text-white text-[16px] md:text-[20px] font-semibold mb-4 max-w-3xl'>
                {cs.secondaryTitle}
              </p>
            )}

            <p className='text-[#F6B72D] text-[13px] md:text-[14px] font-bold uppercase tracking-widest mb-4'>
              {cs.subtitle}
            </p>

            <p className='text-[#CBD5E1] text-[14px] md:text-[15px] mb-8 font-medium max-w-2xl'>
              {cs.client}
            </p>

            {cs.caseStudyLabel && (
              <p className='text-[#CBD5E1]/75 text-[10px] md:text-[11px] uppercase tracking-widest mb-6 max-w-3xl'>
                {cs.caseStudyLabel}
              </p>
            )}

            {/* Embedded Pills */}
            <div className='flex flex-wrap justify-center gap-3'>
              <div className='flex items-center gap-2 bg-[#000023] border border-[#2D2D4A] rounded-full px-4 py-1.5 shadow-inner'>
                <Clock className='w-4 h-4 text-[#CBD5E1]' />
                <span className='text-[#CBD5E1] text-[12px] font-medium'>
                  {cs.duration}
                </span>
              </div>
              <div className='flex items-center gap-2 bg-[#000023] border border-[#2D2D4A] rounded-full px-4 py-1.5 shadow-inner'>
                <Tag className='w-4 h-4 text-[#CBD5E1]' />
                <span className='text-[#CBD5E1] text-[12px] font-medium'>
                  {cs.tags?.slice(0, 2).join(' · ')}
                </span>
              </div>
              {cs.engagementType && (
                <div className='bg-[#000023] border border-[#2D2D4A] rounded-full px-4 py-1.5 text-[#CBD5E1] text-[12px] font-medium'>
                  {cs.engagementType}
                </div>
              )}
              {cs.measurementWindow && (
                <div className='bg-[#000023] border border-[#2D2D4A] rounded-full px-4 py-1.5 text-[#CBD5E1] text-[12px] font-medium'>
                  Measurement: {cs.measurementWindow}
                </div>
              )}
            </div>

            {cs.pdfUrl && (
              <a
                href={cs.pdfUrl}
                download={`case-study-${cs.id}.pdf`}
                className='mt-7 inline-flex items-center gap-2 rounded-full bg-[#F6B72D] px-5 py-3 text-sm font-bold text-[#0B132B] shadow-md transition-colors hover:bg-[#e6ab29] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
              >
                <FileDown className='h-4 w-4' aria-hidden='true' />
                Download Case Study PDF
              </a>
            )}
          </div>
        </div>
      </div>

      <p className='max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-center text-xs leading-relaxed text-[#6B7280]'>
        This case study is based on TCI’s work with an actual former client and uses no other companies’ data or externally sourced outcomes.
      </p>

      {/* Global Key Result Banner - Edge to Edge */}
      <div className='w-full bg-gradient-to-r from-[#F59E0B] via-[#454545] to-[#1F2937] py-4 px-4 flex items-center justify-center gap-4 text-center mt-3 shadow-md relative z-10'>
        <span className='text-white text-base md:text-xl'>✦</span>
        <p className='text-white font-bold text-[13px] md:text-[15px] tracking-widest uppercase'>
          KEY RESULT: {cs.keyResult}
        </p>
        <span className='text-white text-base md:text-xl'>✦</span>
      </div>

      {/* Meta Detail Box */}
      <div className='max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 mt-10'>
        <div className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-10 shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#E5E7EB] pb-8 mb-8'>
            <div>
              <p className='text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-1.5'>
                Client
              </p>
              <p className='text-[#000000] font-bold text-[15px]'>{cs.client}</p>
            </div>
            <div>
              <p className='text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-1.5'>
                Duration
              </p>
              <p className='text-[#000000] font-bold text-[15px]'>{cs.duration}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-5 gap-8'>
            <div className='md:col-span-2'>
              <p className='text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-2'>
                Key Result
              </p>
              <p className='text-[#000000] font-bold text-[15px] leading-snug'>
                {cs.keyResult}
              </p>
            </div>
            <div className='md:col-span-3 flex flex-wrap gap-2 items-start'>
              {cs.tags?.map((tag, idx) => (
                <span
                  key={idx}
                  className='text-[10px] font-bold text-[#797979] bg-[#F8F8F8] border border-[#E5E7EB] px-3.5 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap'
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider Title */}
        <div className='flex items-center justify-center mt-16 mb-8'>
          <div className='w-12 h-[2px] bg-[#F6B72D]' />
          <p className='mx-4 text-[#F6B72D] text-[11px] font-bold uppercase tracking-widest'>
            CASE STUDY ANALYSIS
          </p>
          <div className='w-12 h-[2px] bg-[#F6B72D]' />
        </div>

        <h2 className='text-center text-[26px] md:text-[32px] font-black text-[#000000] mb-12 uppercase tracking-tight'>
          {cs.subject || cs.title}
        </h2>

        {/* UNIFIED CASE STUDY TEMPLATE (MATCHING CASE STUDY #2 EXACTLY) */}
        <div className='space-y-8'>
          {/* 0. Overview / Case Summary Card */}
          <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
            <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-6'>
              <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
              <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                Case Study Overview
              </h3>
            </div>
            <p className='text-[#4B5563] text-[15px] md:text-[16px] leading-relaxed'>
              {cs.caseSummary || cs.executiveSummary}
            </p>
            <p className='mt-5 text-[#0B132B] font-semibold'>
              {cs.coachingOrganization || 'THE CEO INFLUENCERS | Senior Executive Leadership & Organizational Performance Optimization'}
            </p>
          </section>

          {/* 1. The Challenge */}
          <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
            <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-6'>
              <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
              <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                1. The Challenge
              </h3>
            </div>

            {cs.challengeSections ? (
              cs.challengeSections.map((section) => (
                <div key={section.heading} className='mb-8 last:mb-0'>
                  <h4 className='text-lg font-bold text-[#0B132B] mb-3'>{section.heading}</h4>
                  <p className='text-[#4B5563] leading-relaxed mb-6'>{section.intro}</p>
                  <div className='space-y-7'>
                    {section.groups?.map((group) => (
                      <div key={group.heading}>
                        <h5 className='font-bold text-[#0B132B] mb-4'>{group.heading}</h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {group.items?.map(([label, body]) => (
                            <article key={label} className='rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] p-5 hover:border-[#F6B72D]/40 transition-colors'>
                              <h6 className='font-bold text-[#0B132B] mb-2'>{label}</h6>
                              <p className='text-[#4B5563] text-sm leading-relaxed'>{body}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {section.conclusion && (
                    <p className='mt-6 rounded-xl bg-[#FFFBF0] border border-[#F6B72D]/30 p-5 text-[#0B132B] font-semibold leading-relaxed'>
                      {section.conclusion}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className='text-[#4B5563] text-[15px] md:text-[16px] leading-relaxed'>
                {cs.challenge}
              </p>
            )}
          </section>

          {/* 2. The Coaching Program / Strategic Framework */}
          <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
            <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4'>
              <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
              <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                2. The Strategic Framework &amp; Coaching Program
              </h3>
            </div>
            <h4 className='text-lg font-bold text-[#0B132B] mb-3'>Bespoke Architecture: Structure &amp; Methodology</h4>
            <p className='text-[#4B5563] leading-relaxed mb-7'>{cs.approach}</p>
            {cs.coachingMonths && (
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
                {cs.coachingMonths.map((month) => (
                  <article
                    key={month.title}
                    className='rounded-xl bg-[#FDFBF7] border border-[#F6B72D]/30 border-t-4 border-t-[#F6B72D] p-6 shadow-2xs hover:shadow-sm transition-shadow'
                  >
                    <h5 className='font-bold text-[#0B132B] mb-4'>{month.title}</h5>
                    <ul className='space-y-3'>
                      {month.items?.map((item) => (
                        <li key={item} className='flex items-start gap-2 text-[#4B5563] text-sm leading-relaxed'>
                          <span className='mt-2 w-1.5 h-1.5 rounded-full bg-[#F6B72D] shrink-0' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 3. Performance Metrics */}
          <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
            <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4'>
              <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
              <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                3. Performance Metrics
              </h3>
            </div>
            <h4 className='text-lg font-bold text-[#0B132B] mb-3'>Before vs. After: Measurement Window</h4>
            <p className='text-[#4B5563] leading-relaxed mb-6'>{cs.performanceSummary}</p>

            {/* 3 Dark Navy Stat Cards */}
            {cs.performanceStats && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
                {cs.performanceStats.map(([value, label]) => (
                  <article key={label} className='rounded-xl bg-[#000023] p-5 text-center shadow-sm border border-[#2D2D4A]'>
                    <p className='text-[#F6B72D] text-3xl md:text-4xl font-black'>{value}</p>
                    <p className='text-white text-xs font-bold uppercase tracking-wide mt-2'>{label}</p>
                  </article>
                ))}
              </div>
            )}

            {/* KPI Table */}
            {cs.performanceMetrics && (
              <>
                <h5 className='font-bold text-[#0B132B] mb-3'>Key Performance Indicators</h5>
                <div className='overflow-x-auto rounded-xl border border-[#E5E7EB] shadow-sm'>
                  <table className='w-full min-w-[640px] text-left text-sm'>
                    <thead className='bg-[#F8F9FA] text-[#0B132B]'>
                      <tr>
                        {['Performance Dimension', 'Before Coaching', 'After Coaching', 'Point Uplift'].map((heading) => (
                          <th key={heading} className='p-4 font-bold text-xs uppercase tracking-wider text-[#0B132B]'>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cs.performanceMetrics.map((metric) => (
                        <tr key={metric.dimension} className='border-t border-[#E5E7EB] even:bg-[#F8F9FA] hover:bg-[#FFFBF0]/60 transition-colors'>
                          <th className='p-4 font-semibold text-[#0B132B]'>{metric.dimension}</th>
                          <td className='p-4 text-[#4B5563]'>{metric.before}</td>
                          <td className='p-4 text-[#4B5563]'>{metric.after}</td>
                          <td className='p-4 font-semibold text-[#B45309]'>{metric.uplift}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {cs.performanceNote && (
              <p className='mt-4 text-sm text-[#4B5563] leading-relaxed'>{cs.performanceNote}</p>
            )}
          </section>

          {/* 4. Critical Transformation Markers */}
          {cs.transformationMarkers && (
            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4'>
                <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
                <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                  4. Critical Transformation Markers
                </h3>
              </div>
              <h4 className='text-lg font-bold text-[#0B132B] mb-3'>A Definitive Before-and-After Comparison</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>
                The following comparison documents critical transformation markers observed across the engagement and post-program measurement period.
              </p>
              <div className='overflow-x-auto rounded-xl border border-[#E5E7EB] shadow-sm'>
                <table className='w-full min-w-[640px] text-left text-sm'>
                  <thead className='bg-[#000023] text-white'>
                    <tr>
                      <th className='p-4 font-bold text-xs uppercase tracking-wider text-white border-b border-[#2D2D4A]'>Before Coaching / Prior State</th>
                      <th className='p-4 font-bold text-xs uppercase tracking-wider text-white border-b border-[#2D2D4A]'>After Coaching / Transformed State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cs.transformationMarkers.map(([before, after]) => (
                      <tr key={before} className='border-t border-[#E5E7EB] even:bg-[#F8F9FA] hover:bg-[#FFFBF0]/60 transition-colors'>
                        <td className='p-4 text-[#4B5563] align-top text-[14px] leading-relaxed'>{before}</td>
                        <td className='p-4 text-[#4B5563] align-top text-[14px] leading-relaxed font-medium'>{after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 5. Core Strategic Focus & Life Domain Recovery */}
          {cs.lifeDomains && (
            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4'>
                <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
                <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                  5. Core Strategic Focus &amp; Life Domain Recovery
                </h3>
              </div>
              <h4 className='text-lg font-bold text-[#0B132B] mb-4'>The Co-Constitutive Foundation of Enduring Success</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>
                Sustainable organizational performance is directly proportional to holistic leadership alignment across core personal and institutional dimensions.
              </p>
              <div className='space-y-4'>
                {cs.lifeDomains.map((domain) => (
                  <article key={domain.title} className='rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] p-5 hover:border-[#F6B72D]/40 transition-colors'>
                    <h5 className='font-bold text-[#0B132B] mb-2'>{domain.title}</h5>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{domain.body}</p>
                  </article>
                ))}
              </div>
              {cs.lifeDomainsConclusion && (
                <p className='mt-6 text-[#0B132B] font-bold text-lg leading-relaxed'>
                  {cs.lifeDomainsConclusion}
                </p>
              )}
            </section>
          )}

          {/* 6. Post-Coaching Outcomes */}
          {cs.postCoachingOutcomes && (
            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4'>
                <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
                <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                  6. Post-Coaching Outcomes
                </h3>
              </div>
              <h4 className='text-lg font-bold text-[#0B132B] mb-4'>Long-Term Value Creation &amp; Proof-of-Concept Results</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>
                Following the intervention, measurable commercial and organizational breakthroughs confirmed the depth and durability of transformed capability.
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {cs.postCoachingOutcomes.map((outcome) => (
                  <article key={outcome.title} className='rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-6 hover:shadow-sm transition-shadow'>
                    <h5 className='font-bold text-[#0B132B] mb-3'>{outcome.title}</h5>
                    <p className='text-[#B45309] font-bold text-sm mb-3'>{outcome.metric}</p>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{outcome.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 7. Key Strategic & Coaching Principles Validated */}
          {cs.coachingPrinciples && (
            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <div className='flex items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-4'>
                <div className='w-2 h-7 bg-[#F6B72D] rounded-full shrink-0' />
                <h3 className='text-[20px] md:text-[24px] font-bold text-[#000000] uppercase tracking-wide leading-tight'>
                  7. Key Strategic &amp; Coaching Principles Validated
                </h3>
              </div>
              <h4 className='text-lg font-bold text-[#0B132B] mb-6'>Evidence-Based Insights From This Engagement</h4>
              <div className='space-y-4'>
                {cs.coachingPrinciples.map(([title, body], index) => (
                  <article key={title} className='border-l-4 border-[#F6B72D] bg-[#F8F9FA] rounded-r-xl p-5 hover:bg-white hover:shadow-2xs transition-all'>
                    <h5 className='font-bold text-[#0B132B] mb-2'>{index + 1}. {title}</h5>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 8. Coaching Summary Statement */}
          <section className='bg-[#000023] rounded-[16px] p-8 md:p-12 text-white shadow-md'>
            <p className='text-[#F6B72D] text-xs font-bold uppercase tracking-widest mb-3'>
              8. Definitive Coaching Summary
            </p>
            <h3 className='text-2xl font-bold mb-5'>The Definitive Assessment</h3>
            <blockquote className='text-lg md:text-xl italic leading-relaxed text-[#F3F4F6]'>
              “{cs.coachingSummary}”
            </blockquote>
            <p className='mt-5 text-sm text-[#CBD5E1] font-semibold'>
              - {cs.coachingSummaryAttribution}
            </p>
          </section>

          {/* Standardized Executive Contact & Confidentiality Card */}
          <section className='bg-[#FFFBF0] border border-[#F6B72D]/40 rounded-[16px] p-8 md:p-10'>
            <h3 className='text-xl font-bold text-[#0B132B] mb-3'>Ready to Transform Your Leadership?</h3>
            <p className='text-[#4B5563] mb-5'>
              For information about The CEO Influencers' bespoke Executive Leadership and Organizational Performance Optimization programs, contact us directly.
            </p>
            <p className='text-[#0B132B] font-semibold'>
              Email: <a className='text-[#9A6700] underline' href={`mailto:${cs.contactEmail || 'info@theceoinfluencers.com'}`}>{cs.contactEmail || 'info@theceoinfluencers.com'}</a>
            </p>
            <p className='text-[#0B132B] font-semibold'>
              Website: <a className='text-[#9A6700] underline' href={`https://${cs.contactWebsite || 'www.theceoinfluencers.com'}`} target='_blank' rel='noreferrer'>{cs.contactWebsite || 'www.theceoinfluencers.com'}</a>
            </p>
            <p className='text-[#6B7280] text-xs leading-relaxed mt-6'>
              {cs.confidentialityNotice}
            </p>
            <p className='text-center text-xs text-[#6B7280] mt-5'>
              {cs.caseStudyCopyright}
            </p>
          </section>
        </div>

        {/* CTA: "READY TO WRITE YOUR OWN?" - Triggers AppointmentModal */}
        <div className='bg-[#F6B72D] rounded-[16px] p-10 md:p-16 text-center shadow-lg mt-16 max-w-[900px] mx-auto'>
          <h2 className='text-[28px] md:text-[36px] font-bold text-[#000000] tracking-tight mb-3'>
            READY TO WRITE YOUR OWN?
          </h2>
          <p className='text-[#000000] text-[15px] md:text-[17px] mb-8 font-semibold opacity-90'>
            Schedule a confidential discovery call today.
          </p>
          <button
            type='button'
            onClick={() => setIsModalOpen(true)}
            className='inline-flex items-center gap-3 bg-white text-[#000000] font-bold py-3.5 px-8 rounded-full text-[13px] transition-transform hover:scale-105 shadow-sm cursor-pointer'
          >
            <span className='w-6 h-6 bg-[#F6B72D] rounded-full flex items-center justify-center shrink-0 shadow-inner'>
              <ArrowRight className='h-4 w-4 text-white' />
            </span>
            GET STARTED
          </button>
        </div>

        {/* Bottom Nav */}
        <div className='flex flex-wrap items-center justify-center gap-4 mt-12 pb-8'>
          <PageBackButton
            fallbackUrl='/#case-studies-section'
            label='Back to Previous Page'
            variant='dark'
          />
          <Link
            to='/case-studies'
            className='inline-flex items-center gap-3 bg-[#F6B72D] hover:bg-[#e6a820] text-black font-bold py-2.5 px-6 rounded-full text-[12px] uppercase tracking-wider transition-all shadow-md'
          >
            VIEW ALL 11 CASE STUDIES
          </Link>
        </div>
      </div>

      {/* Discovery Call Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
