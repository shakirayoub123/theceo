import Breadcrumb from '@/components/Breadcrumb'
import salientFeatures from '@/config/salientFeatures.json'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import salientFeaturesMarkdown from '../../salient-features.md?raw'

const parseSalientSquares = (markdown) => {
  const squareRegex = /SQUARE ?([1-6]):/g
  const matches = []
  let match

  while ((match = squareRegex.exec(markdown)) !== null) {
    matches.push({
      number: match[1],
      index: match.index,
      length: match[0].length,
    })
  }

  const sections = {}

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const next = matches[i + 1]
    const start = current.index + current.length
    const end = next ? next.index : markdown.length
    const content = markdown.slice(start, end).trim()
    sections[current.number] = content
  }

  return sections
}

const SALIENT_SQUARE_CONTENT = parseSalientSquares(salientFeaturesMarkdown)

const getLinesFromSquare = (squareNumber) => {
  const raw = SALIENT_SQUARE_CONTENT[String(squareNumber)] || ''
  if (!raw) return { headingLine: '', lines: [] }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const [headingLine = '', ...rest] = lines
  return {
    headingLine,
    lines: rest,
  }
}

export default function SalientFeatureDetail() {
  const { slug } = useParams()
  const { t } = useTranslation()

  const feature = useMemo(
    () => salientFeatures.find((item) => item.slug === slug),
    [slug],
  )

  if (!feature) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#FCFCF8] font-jakarta'>
        <div className='max-w-md bg-white rounded-2xl shadow-lg p-8 text-center'>
          <h2 className='text-xl font-semibold mb-3 text-black tracking-wide'>
            Salient feature not found
          </h2>
          <p className='text-gray-600 mb-6'>
            The feature you are looking for does not exist or has been moved.
          </p>
          <Link to='/'>
            <button className='bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-full'>
              Go back to home
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const translationKey = feature.key
  const title = t(`features.items.${translationKey}.title`)
  const shortDescription = t(`features.items.${translationKey}.description`)
  const sectionDescription = t('features.sectionDescription')

  const { headingLine, lines } = getLinesFromSquare(feature.square)
  const [highlightText, ...remainingLines] = lines

  return (
    <div className='min-h-screen bg-white font-jakarta'>
      <Helmet>
        <title>{title} - The CEO Influencers</title>
        <meta
          name='description'
          content={
            shortDescription
              ? `${shortDescription.substring(0, 140)}... Learn how this feature can transform your business approach.`
              : 'Explore innovative features designed to empower C-suite executives and business leaders.'
          }
        />
        <meta
          name='keywords'
          content={`salient feature, ${title}, leadership, business, CEO`}
        />
      </Helmet>

      {/* Hero Section */}
      <div className='relative w-full px-4 md:px-8 pt-4 pb-0'>
        <div
          className='w-full max-w-[1400px] mx-auto rounded-[16px] md:rounded-[24px] overflow-hidden relative flex flex-col justify-center shadow-xl'
          style={{
            backgroundImage: `url(/images/hero.png)`, // Default fallback representing an office/coaching
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '480px'
          }}
        >
          {/* Overlay mask */}
          <div className='absolute inset-0 bg-black/75 z-0' />

          <div className='relative z-10 w-full px-8 md:px-16 py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12'>

            {/* Left Content */}
            <div className='max-w-2xl flex-1'>
              <div className='inline-flex items-center px-4 py-1.5 rounded-full border border-white/40 mb-6'>
                <span className='text-[10px] font-semibold tracking-[0.15em] text-white uppercase'>
                  SALIENT FEATURES
                </span>
              </div>

              <h1 className='text-3xl md:text-5xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.1] mb-6'>
                {title}
              </h1>

              {headingLine && (
                <p className='text-[16px] leading-[26px] text-gray-200 font-medium mb-4'>
                  {headingLine}
                </p>
              )}

              <p className='text-[14px] leading-[24px] text-gray-400 border border-gray-600/50 border-dashed rounded-lg p-3 inline-block'>
                {sectionDescription}
              </p>
            </div>

            {/* Right Card */}
            <div className='w-full lg:w-[450px] shrink-0 bg-[#0B132B]/80 backdrop-blur-sm border border-[#1A2332] rounded-[16px] p-8 relative overflow-hidden'>
              {/* Decorative border matching Figma */}
              <div className='absolute top-0 left-0 w-1 h-32 bg-[#F6B72D] rounded-br-[4px]' />
              <div className='absolute bottom-0 right-0 w-12 h-1 bg-[#F6B72D] rounded-tl-[4px]' />

              <h3 className='text-[14px] font-bold text-[#F6B72D] uppercase tracking-widest mb-4'>
                Why this feature matters
              </h3>
              <p className='text-[15px] leading-[26px] text-gray-200'>
                {shortDescription}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-10 py-6 uppercase'>
        <Breadcrumb
          bg='#FFFFFF'
          items={[
            { label: 'Home', href: '/' },
            {
              label: 'Salient Features',
              href: '/#salient-features',
            },
            { label: title },
          ]}
        />
      </div>

      {/* Content Section */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-10 pb-20'>
        <div className='grid lg:grid-cols-3 gap-12 lg:gap-16'>

          {/* Main Content (Left) */}
          <div className='lg:col-span-2 space-y-10'>

            {/* Highlight Box */}
            {highlightText && (
              <div className='bg-[#FFFCF6] border border-[#FCE1A5] border-l-4 border-l-[#F6B72D] rounded-r-[16px] rounded-bl-[16px] p-8 md:p-10 shadow-sm'>
                <h3 className='text-[18px] md:text-[20px] font-bold text-[#F6B72D] uppercase tracking-wide mb-4'>
                  Strategic Executive Imperative
                </h3>
                <p className='text-[16px] leading-[28px] text-[#0B132B] font-medium'>
                  {highlightText}
                </p>
              </div>
            )}

            {/* Paragraphs */}
            <div className='space-y-6'>
              {remainingLines.map((paragraph, index) => (
                <p
                  key={index}
                  className='text-[15.5px] lg:text-[16px] text-[#475569] leading-[28px] font-normal'
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className='space-y-8'>

            {/* Key Takeaways */}
            <div className='bg-white border border-gray-100 shadow-xl rounded-[20px] p-8 relative overflow-hidden'>
              <div className='absolute -top-12 -right-12 w-40 h-40 bg-[#F6B72D] opacity-20 blur-[50px] rounded-full point-events-none' />

              <h3 className='text-[20px] font-bold text-[#0B132B] mb-6 relative z-10'>
                KEY TAKEAWAYS
              </h3>

              <ul className='space-y-4 relative z-10'>
                {feature.summary.map((point) => (
                  <li
                    key={point}
                    className='flex items-start gap-4 text-[14px] leading-[22px] text-[#475569] font-medium'
                  >
                    <span className='mt-2 inline-block w-1 h-1 rounded-full bg-[#475569] shrink-0' />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explore More Features */}
            <div className='bg-[#0B132B] rounded-[20px] p-8 shadow-2xl relative overflow-hidden'>
              <h3 className='text-[20px] font-bold text-white mb-4 pr-4 uppercase leading-snug'>
                EXPLORE OTHER SALIENT FEATURES
              </h3>
              <p className='text-[13.5px] leading-[22px] text-gray-300 mb-8'>
                Deepen your understanding of how our integrated leadership framework works together to create sustainable, measurable impact across your organization.
              </p>

              <div className='flex flex-col gap-3'>
                {salientFeatures
                  .filter((item) => item.id !== feature.id)
                  .map((item) => (
                    <Link
                      key={item.id}
                      to={`/salient-features/${item.slug}`}
                      className='text-[11px] font-bold tracking-widest lg:text-[12px] px-5 py-3 rounded-full border border-white/20 hover:border-[#F6B72D] hover:bg-[#F6B72D]/10 text-white transition-all uppercase flex items-center justify-between group'
                    >
                      <span className='truncate'>{t(`features.items.${item.key}.title`)}</span>
                      <ChevronRight className='w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-[#F6B72D]' />
                    </Link>
                  ))}
              </div>
            </div>

            {/* Image Block */}
            <div className='w-full rounded-[20px] overflow-hidden border border-gray-200 shadow-md aspect-square bg-[#000]'>
              <img
                src='/images/hero.png'
                alt='Team Meeting'
                className='w-full h-full object-cover object-center opacity-90 hover:opacity-100 transition-opacity duration-300 hover:scale-105'
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
