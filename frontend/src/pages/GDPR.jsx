import React, { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'

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

const GDPR = () => {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const mdComponents = useMemo(
    () => ({
      h1: (props) => (
        <h1
          className='text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide text-black font-exo'
          {...props}
        />
      ),
      h2: ({ children, ...props }) => {
        const text = getPlainText(children).replaceAll('*', '').trim()
        const id = slugify(text)
        return (
          <h2
            id={id}
            className='mt-10 scroll-mt-24 text-xl sm:text-2xl font-bold text-black font-exo'
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
            className='mt-8 scroll-mt-24 text-lg sm:text-xl font-semibold text-black font-exo'
            {...props}
          >
            {children}
          </h3>
        )
      },
      h4: (props) => (
        <h4
          className='mt-6 text-base font-semibold text-black font-exo'
          {...props}
        />
      ),
      p: (props) => (
        <p className='mt-4 text-gray-700 leading-relaxed font-exo' {...props} />
      ),
      ul: (props) => (
        <ul
          className='mt-4 ml-5 list-disc space-y-2 text-gray-700 font-exo'
          {...props}
        />
      ),
      ol: (props) => (
        <ol
          className='mt-4 ml-5 list-decimal space-y-2 text-gray-700 font-exo'
          {...props}
        />
      ),
      li: (props) => <li className='leading-relaxed' {...props} />,
      a: (props) => (
        <a
          className='text-[#0B6E99] underline underline-offset-2 hover:text-[#094d6a]'
          target='_blank'
          rel='noreferrer'
          {...props}
        />
      ),
      strong: (props) => (
        <strong className='font-semibold text-black' {...props} />
      ),
      hr: (props) => <hr className='my-8 border-gray-200' {...props} />,
    }),
    [],
  )

  return (
    <section className='py-10 lg:py-14 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid lg:grid-cols-12 gap-8'>
          <aside className='lg:col-span-4 xl:col-span-3'>
            <div className='lg:sticky lg:top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
              <div className='text-sm font-bold tracking-wide text-black font-exo'>
                On this page
              </div>
              <div className='mt-4 space-y-2 max-h-[65vh] overflow-y-auto pr-1'>
                {toc.map((item) => (
                  <a
                    key={`${item.depth}-${item.id}`}
                    href={`#${item.id}`}
                    className={`block text-sm font-exo hover:text-black ${
                      item.depth === 2
                        ? 'text-gray-700 font-semibold'
                        : 'text-gray-600 ml-3'
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className='lg:col-span-8 xl:col-span-9'>
            <div className='rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm'>
              {loading ? (
                <div className='text-gray-600 font-exo'>Loading…</div>
              ) : error ? (
                <div className='text-red-600 font-exo'>
                  {error}. Ensure `tci-frontend/public/gdpr.md` exists.
                </div>
              ) : (
                <ReactMarkdown components={mdComponents}>
                  {markdown}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GDPR
