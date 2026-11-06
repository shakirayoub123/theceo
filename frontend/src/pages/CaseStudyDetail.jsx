import { ArrowRight, ArrowLeft, Clock, Tag, Zap, FileDown } from 'lucide-react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { allCaseStudies } from '@/data/caseStudiesData'
import caseStudyThreeMarkdown from '../../case-study-3.md?raw'
import caseStudyFourMarkdown from '../../case-study-4.md?raw'
import caseStudySixMarkdown from '../../case-study-6.md?raw'
import caseStudySevenMarkdown from '../../case-study-7.md?raw'
import caseStudyEightMarkdown from '../../case-study-8.md?raw'
import caseStudyNineMarkdown from '../../case-study-9.md?raw'
import caseStudyTenMarkdown from '../../case-study-10.md?raw'
import caseStudyElevenMarkdown from '../../case-study-11.md?raw'
import bgHeader from '@/assets/bgHeader.png'

const markdownTableToLists = (markdown) => {
  const lines = markdown.split('\n')
  const formattedLines = []
  const splitRow = (line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
  const isSeparator = (line) =>
    splitRow(line).every((cell) => /^:?-{3,}:?$/.test(cell))

  for (let index = 0; index < lines.length; index += 1) {
    if (
      lines[index].trim().startsWith('|') &&
      lines[index + 1]?.trim().startsWith('|') &&
      isSeparator(lines[index + 1])
    ) {
      const headings = splitRow(lines[index])
      index += 2
      const rows = []

      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const values = splitRow(lines[index])
        rows.push(
          `- ${headings
            .map((heading, cellIndex) => `**${heading}:** ${values[cellIndex] || ''}`)
            .join(' · ')}`,
        )
        index += 1
      }

      formattedLines.push('', ...rows, '')
      index -= 1
      continue
    }

    formattedLines.push(lines[index])
  }

  return formattedLines.join('\n')
}

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
            title: `PHASE ${(i + 1) / 2}`,
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
            className='absolute inset-0 z-0 opacity-20 pointer-events-none'
            style={{
              backgroundImage: `url("${bgHeader}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>

          <div className='relative z-10 flex flex-col items-center text-center'>
            {cs.caseStudyEyebrow && (
              <p className='text-[#F6B72D] text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] mb-3'>
                {cs.caseStudyEyebrow}
              </p>
            )}
            {/* Pill */}
            <div className='inline-block border border-gray-600 rounded-full px-5 py-1.5 mb-6 bg-white/5'>
              <span className='text-white text-[11px] uppercase tracking-widest'>CASE STUDY #{cs.id}</span>
            </div>

            <h1 className='text-white text-[38px] md:text-[54px] font-semibold leading-tight tracking-[-1px] mb-4 max-w-4xl'>
              {cs.title}
            </h1>

            {cs.secondaryTitle && (
              <p className='text-white text-[16px] md:text-[20px] font-semibold mb-4'>{cs.secondaryTitle}</p>
            )}

            <p className='text-[#F6B72D] text-[13px] md:text-[14px] font-bold uppercase tracking-widest mb-4'>
              {cs.subtitle}
            </p>

            <p className='text-[#CBD5E1] text-[14px] md:text-[15px] mb-8 font-medium'>
              {cs.client}
            </p>

            {cs.caseStudyLabel && (
              <p className='text-[#CBD5E1]/75 text-[10px] md:text-[11px] uppercase tracking-widest mb-6'>
                {cs.caseStudyLabel}
              </p>
            )}

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
          <p className='mx-4 text-[#F6B72D] text-[11px] font-bold uppercase tracking-widest'>
            {cs.subject ? 'SUBJECT' : cs.coachingMonths ? 'CASE STUDY OVERVIEW' : 'EXECUTIVE SUMMARY'}
          </p>
          <div className='w-12 h-[2px] bg-[#F6B72D]'></div>
        </div>

        <h2 className='text-center text-[28px] md:text-[32px] font-black text-[#000000] mb-12 uppercase tracking-tight'>
          {cs.subject || cs.title || 'Case Study Overview'}
        </h2>

        {cs.caseStudyMarkdown ? (
          <article className='max-w-[1100px] mx-auto rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 md:p-12 shadow-sm'>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className='text-3xl md:text-4xl font-black text-[#000023] leading-tight mt-10 mb-5 first:mt-0'>{children}</h1>,
                h2: ({ children }) => <h2 className='text-2xl md:text-3xl font-bold text-[#0B132B] mt-10 mb-4 border-b border-[#F6B72D]/40 pb-3'>{children}</h2>,
                h3: ({ children }) => <h3 className='text-xl font-bold text-[#0B132B] mt-8 mb-3'>{children}</h3>,
                h4: ({ children }) => <h4 className='text-lg font-bold text-[#0B132B] mt-6 mb-3'>{children}</h4>,
                p: ({ children }) => <p className='text-[#4B5563] text-[15px] leading-7 mb-4'>{children}</p>,
                ul: ({ children }) => <ul className='list-disc pl-6 space-y-2 mb-6 text-[#4B5563] marker:text-[#F6B72D]'>{children}</ul>,
                ol: ({ children }) => <ol className='list-decimal pl-6 space-y-2 mb-6 text-[#4B5563] marker:text-[#B45309]'>{children}</ol>,
                li: ({ children }) => <li className='pl-1 leading-relaxed'>{children}</li>,
                blockquote: ({ children }) => <blockquote className='border-l-4 border-[#F6B72D] bg-[#FFFBF0] px-5 py-4 my-6 rounded-r-xl text-[#0B132B] italic'>{children}</blockquote>,
                strong: ({ children }) => <strong className='font-bold text-[#0B132B]'>{children}</strong>,
                table: ({ children }) => <div className='overflow-x-auto my-6 rounded-xl border border-[#E5E7EB]'><table className='w-full min-w-[640px] text-left text-sm'>{children}</table></div>,
                thead: ({ children }) => <thead className='bg-[#000023] text-white'>{children}</thead>,
                th: ({ children }) => <th className='p-3 md:p-4 font-bold'>{children}</th>,
                td: ({ children }) => <td className='p-3 md:p-4 border-t border-[#E5E7EB] text-[#4B5563] align-top'>{children}</td>,
                hr: () => <hr className='my-8 border-[#E5E7EB]' />,
                a: ({ children, href }) => <a href={href} className='text-[#9A6700] underline' target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>,
              }}
            >
              {markdownTableToLists(
                {
                  'case-study-3': caseStudyThreeMarkdown,
                  'case-study-4': caseStudyFourMarkdown,
                  'case-study-6': caseStudySixMarkdown,
                  'case-study-7': caseStudySevenMarkdown,
                  'case-study-8': caseStudyEightMarkdown,
                  'case-study-9': caseStudyNineMarkdown,
                  'case-study-10': caseStudyTenMarkdown,
                  'case-study-11': caseStudyElevenMarkdown,
                }[cs.caseStudyMarkdown],
              )}
            </ReactMarkdown>
          </article>
        ) : cs.coachingMonths ? (
          <div className='space-y-8'>
            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <p className='text-[#4B5563] text-[15px] md:text-[16px] leading-relaxed'>{cs.caseSummary}</p>
              <p className='mt-5 text-[#0B132B] font-semibold'>{cs.coachingOrganization}</p>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-6'>1. The Challenge</h3>
              {cs.challengeSections.map((section) => (
                <div key={section.heading} className='mb-8 last:mb-0'>
                  <h4 className='text-lg font-bold text-[#0B132B] mb-3'>{section.heading}</h4>
                  <p className='text-[#4B5563] leading-relaxed mb-6'>{section.intro}</p>
                  <div className='space-y-7'>
                    {section.groups.map((group) => (
                      <div key={group.heading}>
                        <h5 className='font-bold text-[#0B132B] mb-4'>{group.heading}</h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {group.items.map(([label, body]) => (
                            <article key={label} className='rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] p-5'>
                              <h6 className='font-bold text-[#0B132B] mb-2'>{label}</h6>
                              <p className='text-[#4B5563] text-sm leading-relaxed'>{body}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className='mt-6 rounded-xl bg-[#FFFBF0] border border-[#F6B72D]/30 p-5 text-[#0B132B] font-semibold leading-relaxed'>{section.conclusion}</p>
                </div>
              ))}
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>2. The Coaching Program</h3>
              <h4 className='text-lg font-bold text-[#0B132B] mb-3'>3-Month Bespoke Framework: Structure &amp; Methodology</h4>
              <p className='text-[#4B5563] leading-relaxed mb-7'>{cs.approach}</p>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
                {cs.coachingMonths.map((month) => (
                  <article key={month.title} className='rounded-xl bg-[#FDFBF7] border border-[#F6B72D]/30 border-t-4 border-t-[#F6B72D] p-6'>
                    <h5 className='font-bold text-[#0B132B] mb-4'>{month.title}</h5>
                    <ul className='space-y-3'>
                      {month.items.map((item) => (
                        <li key={item} className='flex items-start gap-2 text-[#4B5563] text-sm leading-relaxed'>
                          <span className='mt-2 w-1.5 h-1.5 rounded-full bg-[#F6B72D] shrink-0' />{item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>3. Performance Metrics</h3>
              <h4 className='text-lg font-bold text-[#0B132B] mb-3'>Before vs. After: 12-Month Measurement Window</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>{cs.performanceSummary}</p>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
                {[
                  ['+70 pts', 'Average Metric Uplift Across All 5 KPIs'],
                  ['90%', 'Profitability: Up From Negative Equity'],
                  ['95%', 'Staff Retention: Up From 45%'],
                ].map(([value, label]) => (
                  <article key={label} className='rounded-xl bg-[#000023] p-5 text-center'>
                    <p className='text-[#F6B72D] text-3xl font-black'>{value}</p>
                    <p className='text-white text-xs font-bold uppercase tracking-wide mt-2'>{label}</p>
                  </article>
                ))}
              </div>
              <h5 className='font-bold text-[#0B132B] mb-3'>Key Performance Indicators</h5>
              <div className='overflow-x-auto rounded-xl border border-[#E5E7EB]'>
                <table className='w-full min-w-[640px] text-left text-sm'>
                  <thead className='bg-[#F8F9FA] text-[#0B132B]'>
                    <tr>{['Performance Dimension', 'Before Coaching', 'After Coaching', 'Point Uplift'].map((heading) => <th key={heading} className='p-4 font-bold'>{heading}</th>)}</tr>
                  </thead>
                  <tbody>
                    {cs.performanceMetrics.map((metric) => (
                      <tr key={metric.dimension} className='border-t border-[#E5E7EB]'>
                        <th className='p-4 font-semibold text-[#0B132B]'>{metric.dimension}</th>
                        <td className='p-4 text-[#4B5563]'>{metric.before}</td>
                        <td className='p-4 text-[#4B5563]'>{metric.after}</td>
                        <td className='p-4 font-semibold text-[#B45309]'>{metric.uplift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className='mt-4 text-sm text-[#4B5563] leading-relaxed'>{cs.performanceNote}</p>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>4. Critical Transformation Markers</h3>
              <h4 className='text-lg font-bold text-[#0B132B] mb-6'>A Definitive Before-and-After Comparison</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>The following comparison documents eight critical transformation markers observed across the engagement and the 12-month post-program measurement period.</p>
              <div className='overflow-x-auto rounded-xl border border-[#E5E7EB]'>
                <table className='w-full min-w-[640px] text-left text-sm'>
                  <thead className='bg-[#000023] text-white'><tr><th className='p-4'>Before Coaching</th><th className='p-4'>After Coaching</th></tr></thead>
                  <tbody>
                    {cs.transformationMarkers.map(([before, after]) => (
                      <tr key={before} className='border-t border-[#E5E7EB] even:bg-[#F8F9FA]'>
                        <td className='p-4 text-[#4B5563]'>{before}</td><td className='p-4 text-[#4B5563]'>{after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>5. Personal and Life Domain Recovery</h3>
              <h4 className='text-lg font-bold text-[#0B132B] mb-4'>The Co-Constitutive Foundation of Business Success</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>The recovery of the CEO's personal life was not peripheral to the business success story but co-constitutive. A leader who is whole at home shows up whole at work.</p>
              <div className='space-y-4'>
                {cs.lifeDomains.map((domain) => (
                  <article key={domain.title} className='rounded-xl bg-[#F8F9FA] p-5'>
                    <h5 className='font-bold text-[#0B132B] mb-2'>{domain.title}</h5>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{domain.body}</p>
                  </article>
                ))}
              </div>
              <p className='mt-6 text-[#0B132B] font-bold text-lg'>{cs.lifeDomainsConclusion}</p>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>6. Post-Coaching Outcomes</h3>
              <h4 className='text-lg font-bold text-[#0B132B] mb-4'>New Venture Success: Proof-of-Concept Results</h4>
              <p className='text-[#4B5563] leading-relaxed mb-6'>Following the coaching program, the CEO launched a company in an entirely new industry, with no prior experience, inherited relationships, or institutional advantage. The outcomes are attributed to the CEO's transformed personal capability.</p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {cs.postCoachingOutcomes.map((outcome) => (
                  <article key={outcome.title} className='rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-6'>
                    <h5 className='font-bold text-[#0B132B] mb-3'>{outcome.title}</h5>
                    <p className='text-[#B45309] font-bold text-sm mb-3'>{outcome.metric}</p>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{outcome.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>7. Key Coaching Principles Validated</h3>
              <h4 className='text-lg font-bold text-[#0B132B] mb-6'>Eight Evidence-Based Insights From This Engagement</h4>
              <div className='space-y-4'>
                {cs.coachingPrinciples.map(([title, body], index) => (
                  <article key={title} className='border-l-4 border-[#F6B72D] bg-[#F8F9FA] rounded-r-xl p-5'>
                    <h5 className='font-bold text-[#0B132B] mb-2'>{index + 1}. {title}</h5>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className='bg-[#000023] rounded-[16px] p-8 md:p-12 text-white'>
              <p className='text-[#F6B72D] text-xs font-bold uppercase tracking-widest mb-3'>8. Coaching Summary Statement</p>
              <h3 className='text-2xl font-bold mb-5'>The Definitive Assessment</h3>
              <blockquote className='text-lg leading-relaxed'>“{cs.coachingSummary}”</blockquote>
              <p className='mt-5 text-sm text-[#CBD5E1]'>— {cs.coachingSummaryAttribution}</p>
            </section>

            <section className='bg-[#FFFBF0] border border-[#F6B72D]/40 rounded-[16px] p-8 md:p-10'>
              <h3 className='text-xl font-bold text-[#0B132B] mb-3'>Ready to Transform Your Leadership?</h3>
              <p className='text-[#4B5563] mb-5'>For information about The CEO Influencers' 3-Month Bespoke Personalized Executive Leadership and Organizational Performance Optimization Coaching Program, contact us directly.</p>
              <p className='text-[#0B132B] font-semibold'>Email: <a className='text-[#9A6700] underline' href={`mailto:${cs.contactEmail}`}>{cs.contactEmail}</a></p>
              <p className='text-[#0B132B] font-semibold'>Website: <a className='text-[#9A6700] underline' href={`https://${cs.contactWebsite}`} target='_blank' rel='noreferrer'>{cs.contactWebsite}</a></p>
              <p className='text-[#6B7280] text-xs leading-relaxed mt-6'>{cs.confidentialityNotice}</p>
              <p className='text-center text-xs text-[#6B7280] mt-5'>{cs.caseStudyCopyright}</p>
            </section>
          </div>
        ) : cs.executiveSummary ? (
          <div className='space-y-8'>
            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-5'>Executive Summary</h3>
              <p className='text-[#4B5563] text-[15px] md:text-[16px] leading-relaxed'>{cs.executiveSummary}</p>
              <p className='mt-5 rounded-xl bg-[#FFFBF0] border border-[#F6B72D]/30 p-5 text-[#111827] font-semibold leading-relaxed'>
                <span className='text-[#B45309]'>The Challenge: </span>{cs.challenge}
              </p>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-6'>Context &amp; Critical Situation</h3>
              <p className='text-[#4B5563] mb-6'>The client was managing a high-net-worth portfolio but was hit by a “Perfect Storm” of adversity:</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                {cs.context.map((item) => (
                  <article key={item.title} className='rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] p-6'>
                    <h4 className='font-bold text-[#0B132B] mb-3'>{item.title}</h4>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-3'>The 30-Day Strategic Intervention Plan</h3>
              <p className='text-[#4B5563] mb-7'>{cs.approach}</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                {cs.interventionPhases.map((phase, index) => (
                  <article key={phase.window} className='rounded-xl bg-[#FDFBF7] border border-[#F6B72D]/30 border-t-4 border-t-[#F6B72D] p-6'>
                    <p className='text-[#B45309] text-xs font-bold tracking-widest mb-2'>PHASE {index + 1} · DAYS {phase.window}</p>
                    <h4 className='font-bold text-[#0B132B] mb-3'>{phase.title}</h4>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{phase.body}</p>
                  </article>
                ))}
              </div>
              <p className='mt-6 text-center font-bold text-[#0B132B]'>All goals were achieved in 30 days, with a 150% overall profitability increase.</p>
            </section>

            <section className='bg-[#000023] rounded-[16px] p-8 md:p-10'>
              <h3 className='text-center text-white text-xl font-bold uppercase tracking-wide mb-7'>Key Performance Indicators (KPIs) — Post-Intervention</h3>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                {cs.kpis.map((kpi) => (
                  <article key={kpi.label} className='rounded-xl border border-white/15 bg-white/5 p-6 text-center'>
                    <p className='text-[#F6B72D] text-3xl md:text-4xl font-black'>{kpi.value}</p>
                    <p className='text-white text-xs font-bold uppercase tracking-widest mt-2'>{kpi.label}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className='bg-white border border-[#CACACA] rounded-[16px] p-8 md:p-12 shadow-sm'>
              <h3 className='text-[20px] font-bold text-[#000000] uppercase tracking-wide mb-6'>Strategic Outcomes &amp; Research Conclusion</h3>
              <p className='text-[#4B5563] mb-6'>The proven real-world results exceeded all expectations. By the end of the 30-day cycle, the client had achieved:</p>
              <div className='space-y-4'>
                {cs.strategicOutcomes.map((item) => (
                  <article key={item.title} className='border-l-4 border-[#F6B72D] bg-[#F8F9FA] rounded-r-xl p-5'>
                    <h4 className='font-bold text-[#0B132B] mb-2'>{item.title}</h4>
                    <p className='text-[#4B5563] text-sm leading-relaxed'>{item.body}</p>
                  </article>
                ))}
              </div>
              <div className='mt-8 bg-[#FFFBF0] border border-[#F6B72D]/40 rounded-xl p-6'>
                <h4 className='text-[#B45309] text-sm font-bold uppercase tracking-widest mb-2'>The Takeaway</h4>
                <p className='text-[#0B132B] text-lg font-bold leading-relaxed'>{cs.takeaway}</p>
              </div>
              <p className='text-center text-xs text-[#6B7280] mt-8'>{cs.copyright}</p>
            </section>
          </div>
        ) : (
          <>
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
          </>
        )}

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
