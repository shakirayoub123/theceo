import ReactMarkdown from 'react-markdown'
import caseStudyThreeMarkdown from '../../case-study-3.md?raw'
import caseStudyFourMarkdown from '../../case-study-4.md?raw'
import caseStudySixMarkdown from '../../case-study-6.md?raw'
import caseStudySevenMarkdown from '../../case-study-7.md?raw'
import caseStudyEightMarkdown from '../../case-study-8.md?raw'
import caseStudyNineMarkdown from '../../case-study-9.md?raw'
import caseStudyTenMarkdown from '../../case-study-10.md?raw'
import caseStudyElevenMarkdown from '../../case-study-11.md?raw'

const markdownById = {
  'case-study-3': caseStudyThreeMarkdown,
  'case-study-4': caseStudyFourMarkdown,
  'case-study-6': caseStudySixMarkdown,
  'case-study-7': caseStudySevenMarkdown,
  'case-study-8': caseStudyEightMarkdown,
  'case-study-9': caseStudyNineMarkdown,
  'case-study-10': caseStudyTenMarkdown,
  'case-study-11': caseStudyElevenMarkdown,
}

const Section = ({ title, children }) => (
  <section className='mb-5 last:mb-0'>
    <h4 className='mb-2 border-b border-[#F6B72D]/50 pb-1 text-[12px] font-semibold uppercase tracking-wide text-[#0B132B]'>
      {title}
    </h4>
    <div className='space-y-2 text-[12px] font-normal leading-relaxed text-[#4B5563] [&_strong]:font-semibold [&_strong]:text-[#0B132B] [&_p.font-bold]:font-semibold [&_p.font-semibold]:font-medium'>
      {children}
    </div>
  </section>
)

const BulletList = ({ items }) => (
  <ul className='list-disc space-y-1 pl-4 marker:text-[#F6B72D]'>
    {items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
  </ul>
)

export default function CaseStudyFullContent({ cs }) {
  const markdown = markdownById[cs.caseStudyMarkdown]

  if (markdown) {
    return (
      <article className='case-study-markdown space-y-3 text-[12px] font-normal leading-relaxed text-[#4B5563] [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-[13px] [&_h1]:font-semibold [&_h1]:leading-snug [&_h1]:text-[#0B132B] [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:border-b [&_h2]:border-[#F6B72D]/40 [&_h2]:pb-1 [&_h2]:text-[12px] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-[#0B132B] [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-[12px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-[#0B132B] [&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:text-[12px] [&_h4]:font-semibold [&_h4]:text-[#0B132B] [&_h5]:mb-1 [&_h5]:mt-2 [&_h5]:text-[12px] [&_h5]:font-semibold [&_h5]:text-[#0B132B] [&_h6]:mb-1 [&_h6]:mt-2 [&_h6]:text-[12px] [&_h6]:font-semibold [&_h6]:text-[#0B132B] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_li]:pl-0.5 [&_strong]:font-semibold [&_strong]:text-[#0B132B] [&_blockquote]:border-l-2 [&_blockquote]:border-[#F6B72D] [&_blockquote]:pl-3 [&_table]:w-full [&_th]:bg-[#0B132B] [&_th]:p-1.5 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:text-white [&_td]:border-t [&_td]:border-[#E5E7EB] [&_td]:p-1.5'>
        <ReactMarkdown
          components={{
            table: ({ children }) => <div className='mb-3 overflow-x-auto rounded border border-[#E5E7EB]'><table className='min-w-[420px]'>{children}</table></div>,
            a: ({ children, href }) => <a href={href} className='text-[#9A6700] underline' target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>,
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    )
  }

  if (cs.coachingMonths) {
    return (
      <div>
        <Section title='Case Study Overview'>
          <p>{cs.caseSummary}</p>
          <p className='font-medium text-[#0B132B]'>{cs.coachingOrganization}</p>
        </Section>
        <Section title='The Challenge'>
          {cs.challengeSections.map((section) => (
            <div key={section.heading} className='space-y-2'>
              <h5 className='text-[12px] font-semibold text-[#0B132B]'>{section.heading}</h5>
              <p>{section.intro}</p>
              {section.groups.map((group) => (
                <div key={group.heading}>
                  <p className='font-medium text-[#0B132B]'>{group.heading}</p>
                  <ul className='list-disc pl-4 marker:text-[#F6B72D]'>
                    {group.items.map(([label, body]) => <li key={label}><strong>{label}:</strong> {body}</li>)}
                  </ul>
                </div>
              ))}
              <p>{section.conclusion}</p>
            </div>
          ))}
        </Section>
        <Section title='Coaching Program'>
          <p>{cs.approach}</p>
          {cs.coachingMonths.map((month) => (
            <div key={month.title}>
              <p className='font-semibold text-[#0B132B]'>{month.title}</p>
              <BulletList items={month.items} />
            </div>
          ))}
        </Section>
        <Section title='Performance Metrics'>
          <p>{cs.performanceSummary}</p>
          <BulletList items={cs.performanceMetrics.map((metric) => `${metric.dimension}: ${metric.before} → ${metric.after} (${metric.uplift})`)} />
          <p>{cs.performanceNote}</p>
        </Section>
        <Section title='Transformation Markers'>
          <BulletList items={cs.transformationMarkers.map(([before, after]) => `Before: ${before} After: ${after}`)} />
        </Section>
        <Section title='Life Domain Recovery'>
          <BulletList items={cs.lifeDomains.map((domain) => `${domain.title}: ${domain.body}`)} />
          <p>{cs.lifeDomainsConclusion}</p>
        </Section>
        <Section title='Post-Coaching Outcomes'>
          <BulletList items={cs.postCoachingOutcomes.map((item) => `${item.title}: ${item.metric}. ${item.body}`)} />
        </Section>
        <Section title='Coaching Principles'>
          <BulletList items={cs.coachingPrinciples.map(([title, body]) => `${title}: ${body}`)} />
        </Section>
        <Section title='Coaching Summary'>
          <p>{cs.coachingSummary}</p>
          <p>{cs.confidentialityNotice}</p>
        </Section>
      </div>
    )
  }

  if (cs.executiveSummary) {
    return (
      <div>
        <Section title='Executive Summary'><p>{cs.executiveSummary}</p></Section>
        <Section title='The Challenge'><p>{cs.challenge}</p></Section>
        <Section title='Context & Critical Situation'>
          <BulletList items={cs.context.map((item) => `${item.title}: ${item.body}`)} />
        </Section>
        <Section title='Strategic Intervention'>
          <p>{cs.approach}</p>
          <BulletList items={cs.interventionPhases.map((phase) => `${phase.title} (Days ${phase.window}): ${phase.body}`)} />
        </Section>
        <Section title='Key Performance Indicators'>
          <BulletList items={cs.kpis.map((kpi) => `${kpi.value}: ${kpi.label}`)} />
        </Section>
        <Section title='Strategic Outcomes & Research Conclusion'>
          <BulletList items={cs.strategicOutcomes.map((item) => `${item.title}: ${item.body}`)} />
          <p><strong>The Takeaway:</strong> {cs.takeaway}</p>
          <BulletList items={cs.outcomes} />
        </Section>
      </div>
    )
  }

  return (
    <div>
      <Section title='The Challenge'><p>{cs.challenge}</p></Section>
      <Section title="TCI's Approach"><p>{cs.approach}</p></Section>
      <Section title='Outcomes'><BulletList items={cs.outcomes} /></Section>
    </div>
  )
}
