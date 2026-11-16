import React, { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ShieldCheck, Search, ChevronRight, BookOpen } from 'lucide-react'
import PageBackButton from '@/components/common/PageBackButton'
import bgHeader from '@/assets/bgHeader.png'

function getPlainText(node) {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getPlainText).join('')
  if (typeof node === 'object' && 'props' in node)
    return getPlainText(node.props?.children)
  return ''
}

function slugify(text) {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .trim()
    .replaceAll(/\s+/g, '-')
}

export default function GDPR() {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/gdpr.md', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to load GDPR content (${res.status})`)
        }
        const text = await res.text()
        if (!cancelled) setMarkdown(text)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load content')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const toc = useMemo(() => {
    const lines = markdown.split('\n')
    const items = []
    for (const line of lines) {
      const match = /^(#{2,3})\s+(.*)\s*$/.exec(line)
      if (!match) continue
      const depth = match[1].length
      const rawText = match[2].replaceAll('*', '').trim()
      if (!rawText || rawText.toLowerCase() === 'table of contents') continue
      items.push({
        depth,
        text: rawText,
        id: slugify(rawText),
      })
    }
    return items
  }, [markdown])

  const filteredToc = useMemo(() => {
    if (!searchFilter.trim()) return toc
    const q = searchFilter.toLowerCase()
    return toc.filter((item) => item.text.toLowerCase().includes(q))
  }, [toc, searchFilter])

  const mdComponents = useMemo(
    () => ({
      h1: (props) => (
        <h1
          className='text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#000023] font-jakarta mb-6'
          {...props}
        />
      ),
      h2: ({ children, ...props }) => {
        const text = getPlainText(children).replaceAll('*', '').trim()
        const id = slugify(text)
        return (
          <h2
            id={id}
            className='mt-12 scroll-mt-28 text-xl sm:text-2xl font-bold text-[#000023] font-jakarta pt-6 pb-2 border-b border-[#F6E5B8] flex items-center gap-2'
            {...props}
          >
            {children}
          </h2>
        )
      },
      h3: ({ children, ...props }) => {
        const text = getPlainText(children).replaceAll('*', '').trim()
        const id = slugify(text)
        return (
          <h3
            id={id}
            className='mt-8 scroll-mt-28 text-lg sm:text-xl font-bold text-[#000023] font-jakarta'
            {...props}
          >
            {children}
          </h3>
        )
      },
      h4: (props) => (
        <h4
          className='mt-6 text-base font-bold text-[#000023] font-jakarta'
          {...props}
        />
      ),
      p: (props) => (
        <p className='mt-4 text-[15px] sm:text-[16px] leading-[28px] text-[#4B5563] font-normal [text-wrap:pretty]' {...props} />
      ),
      ul: (props) => (
        <ul
          className='mt-4 ml-5 list-disc space-y-2 text-[15px] sm:text-[16px] leading-[26px] text-[#4B5563]'
          {...props}
        />
      ),
      ol: (props) => (
        <ol
          className='mt-4 ml-5 list-decimal space-y-2 text-[15px] sm:text-[16px] leading-[26px] text-[#4B5563]'
          {...props}
        />
      ),
      li: (props) => <li className='leading-relaxed' {...props} />,
      a: (props) => (
        <a
          className='text-[#D99A1A] font-semibold underline underline-offset-2 hover:text-[#B47A00] transition-colors'
          target='_blank'
          rel='noreferrer'
          {...props}
        />
      ),
      strong: (props) => (
        <strong className='font-bold text-[#000023]' {...props} />
      ),
      hr: (props) => <hr className='my-8 border-[#E5E7EB]' {...props} />,
      blockquote: (props) => (
        <blockquote
          className='my-6 border-l-4 border-[#F6B72D] bg-[#FFFBF0] px-5 py-4 rounded-r-xl text-gray-700 italic text-[15px]'
          {...props}
        />
      ),
      table: (props) => (
        <div className='my-6 overflow-x-auto rounded-xl border border-[#E5E7EB]'>
          <table className='w-full border-collapse text-left text-sm' {...props} />
        </div>
      ),
      th: (props) => (
        <th className='bg-[#FFFBF0] border-b border-[#F6E5B8] px-4 py-3 font-bold text-[#000023]' {...props} />
      ),
      td: (props) => (
        <td className='border-b border-[#E5E7EB] px-4 py-3 text-[#4B5563]' {...props} />
      ),
      code: (props) => (
        <code className='bg-gray-100 text-[#000023] px-1.5 py-0.5 rounded text-sm font-mono' {...props} />
      ),
    }),
    [],
  )

  return (
    <div className='min-h-screen bg-[#FBF9F5] font-jakarta text-[#111827]'>
      <Helmet>
        <title>GDPR Compliance Framework | The CEO Influencers</title>
        <meta
          name='description'
          content='Comprehensive Legal, Compliance, and Data Protection Framework for The CEO Influencers LLC, including GDPR compliance and data privacy standards.'
        />
      </Helmet>

      {/* Back Button */}
      <div className='max-w-[1383px] mx-auto px-4 sm:px-6 pt-4'>
        <PageBackButton fallbackUrl='/#footer' label='Back' />
      </div>

      {/* Hero Banner */}
      <div className='w-full pt-4'>
        <div className='relative w-full max-w-[1383px] mx-auto py-12 md:py-16 bg-[#FFFBF0] flex flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#F6E5B8] shadow-sm mb-8 md:mb-12'>
          <div
            className='absolute inset-0 z-0 pointer-events-none'
            style={{
              backgroundImage: `url("${bgHeader}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className='relative z-10 text-center flex flex-col items-center px-4'>
            <div className='inline-flex items-center justify-center border border-[#F6B72D] rounded-full px-4 py-1 mb-3 bg-white/80'>
              <span className='text-[#000023] font-bold tracking-widest text-[10px] uppercase flex items-center gap-1.5'>
                <ShieldCheck className='w-3.5 h-3.5 text-[#F6B72D]' />
                Legal & Compliance Framework
              </span>
            </div>
            <h1 className='text-3xl md:text-[44px] font-bold font-jakarta text-[#000023] mb-4 tracking-tight uppercase'>
              GDPR Compliance
            </h1>
            <div className='flex items-center text-[14px] font-semibold flex-wrap justify-center gap-y-1'>
              <Link to='/' className='text-[#161616] hover:text-[#F6B72D] transition-colors'>
                Home
              </Link>
              <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
              <span className='text-[#F6B72D]'>GDPR Compliance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className='max-w-[1383px] mx-auto px-4 sm:px-6 pb-20'>
        <div className='grid lg:grid-cols-12 gap-8 items-start'>

          {/* Sticky Table of Contents Sidebar */}
          <aside className='lg:col-span-4 xl:col-span-3'>
            <div className='lg:sticky lg:top-24 rounded-[22px] border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.04)]'>
              <div className='flex items-center gap-2 text-xs font-bold tracking-wider text-[#000023] uppercase mb-3 pb-3 border-b border-[#F6E5B8]'>
                <BookOpen className='w-4 h-4 text-[#F6B72D]' />
                <span>On This Page</span>
              </div>

              {/* Quick Search in TOC */}
              <div className='relative mb-3'>
                <Search className='absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400' />
                <input
                  type='text'
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder='Filter sections…'
                  className='w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-[#FCFCF9] focus:outline-none focus:border-[#F6B72D] text-[#000023]'
                />
              </div>

              {/* TOC Link List */}
              <div className='space-y-1 max-h-[60vh] overflow-y-auto pr-1 text-xs'>
                {filteredToc.length === 0 ? (
                  <p className='text-gray-400 py-2 text-center'>No matching section</p>
                ) : (
                  filteredToc.map((item) => (
                    <a
                      key={`${item.depth}-${item.id}`}
                      href={`#${item.id}`}
                      className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all ${
                        item.depth === 2
                          ? 'text-[#000023] font-bold hover:bg-[#FFFBF0] hover:text-[#B47A00]'
                          : 'text-[#4B5563] pl-5 hover:bg-[#FFFBF0] hover:text-[#000023]'
                      }`}
                    >
                      <span className='truncate'>{item.text}</span>
                      <ChevronRight className='w-3 h-3 opacity-0 group-hover:opacity-100 text-[#F6B72D] transition-opacity shrink-0' />
                    </a>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Main Legal Content Container */}
          <main className='lg:col-span-8 xl:col-span-9'>
            <div className='rounded-[24px] border border-[#E5E7EB] bg-white p-6 sm:p-10 lg:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.04)]'>
              {loading ? (
                <div className='flex flex-col items-center justify-center py-20'>
                  <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6B72D] mb-4'></div>
                  <p className='text-sm text-gray-500 font-medium'>Loading compliance framework…</p>
                </div>
              ) : error ? (
                <div className='p-8 rounded-2xl bg-red-50 border border-red-200 text-center text-red-700'>
                  <p className='font-bold text-lg mb-2'>Unable to load document</p>
                  <p className='text-sm mb-4'>{error}</p>
                  <Link
                    to='/'
                    className='inline-flex items-center px-4 py-2 bg-[#000023] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#1B1B45] transition-colors'
                  >
                    Return Home
                  </Link>
                </div>
              ) : (
                <article className='prose prose-slate max-w-none'>
                  <ReactMarkdown components={mdComponents}>
                    {markdown}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          </main>

        </div>
      </div>
    </div>
  )
}
