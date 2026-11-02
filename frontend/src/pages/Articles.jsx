import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock3, Search, X } from 'lucide-react'
import authService from '@/services/authService'
import { formatDate, getAssetUrl } from '@/lib/utils'
import mapBg3 from '@/assets/map bg 3.png'

const fallbackImage = '/images/blog1.svg'

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeTopic, setActiveTopic] = useState('All insights')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true

    authService
      .getAllBlogs()
      .then((response) => {
        const blogList = response?.blogs ?? response?.data?.blogs
        if (active) setArticles(Array.isArray(blogList) ? blogList : [])
      })
      .catch((requestError) => {
        console.error('Failed to load articles:', requestError)
        if (active) setError('We could not load publications right now. Please try again later.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retry])

  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)),
    [articles],
  )

  const topics = useMemo(
    () => ['All insights', ...new Set(sortedArticles.map((article) => article.topic).filter(Boolean))],
    [sortedArticles],
  )

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return sortedArticles.filter((article) => {
      const matchesTopic = activeTopic === 'All insights' || article.topic === activeTopic
      const searchableText = `${article.title || ''} ${article.shortDescription || ''} ${article.topic || ''}`.toLowerCase()
      return matchesTopic && (!normalizedQuery || searchableText.includes(normalizedQuery))
    })
  }, [activeTopic, query, sortedArticles])

  return (
    <main className='relative min-h-[65vh] overflow-hidden bg-[#FBF9F5] py-10 font-jakarta sm:py-14 lg:py-16'>
      <Helmet>
        <title>Articles & Publications | The CEO Influencers</title>
        <meta
          name='description'
          content='Explore practical leadership articles, business insights, and expert publications from The CEO Influencers.'
        />
      </Helmet>

      <div
        className='pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-top bg-no-repeat opacity-40'
        style={{ backgroundImage: `url("${mapBg3}")`, backgroundSize: 'min(100%, 1500px) auto' }}
        aria-hidden='true'
      />

      <div className='relative z-10 mx-auto max-w-[1350px] px-4 sm:px-6 lg:px-8'>
        <header className='mb-8 flex flex-col gap-6 border-b border-slate-200/80 pb-7 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-3xl'>
            <p className='mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#B47A00]'>Ideas for better leadership</p>
            <h1 className='text-3xl font-extrabold leading-tight tracking-tight text-[#0B132B] sm:text-4xl lg:text-5xl'>
              OUR <span className='text-[#F6B72D]'>BLOGS</span>
            </h1>
            <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base'>
              Explore expert perspectives, practical frameworks, and fresh ideas to strengthen leaders and organizations.
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm'>
            <BookOpen className='h-4 w-4 text-[#D99A1A]' aria-hidden='true' />
            <span>{loading ? 'Loading publications…' : `${sortedArticles.length} ${sortedArticles.length === 1 ? 'publication' : 'publications'}`}</span>
          </div>
        </header>

        <div className='mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex gap-2 overflow-x-auto pb-1' aria-label='Filter publications by topic'>
            {topics.map((topic) => (
              <button
                key={topic}
                type='button'
                onClick={() => setActiveTopic(topic)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition sm:text-sm ${activeTopic === topic ? 'border-[#0B132B] bg-[#0B132B] text-white shadow-sm' : 'border-slate-200 bg-white/90 text-slate-600 hover:border-[#F6B72D] hover:text-[#805900]'}`}
                aria-pressed={activeTopic === topic}
              >
                {topic}
              </button>
            ))}
          </div>

          <label className='flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-[#E5A91F] focus-within:ring-2 focus-within:ring-[#F6B72D]/20 lg:max-w-sm'>
            <Search className='h-4 w-4 shrink-0 text-slate-400' aria-hidden='true' />
            <span className='sr-only'>Search publications</span>
            <input
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search articles…'
              className='min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400'
            />
            {query && (
              <button type='button' onClick={() => setQuery('')} aria-label='Clear search' className='rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700'>
                <X className='h-4 w-4' aria-hidden='true' />
              </button>
            )}
          </label>
        </div>

        {loading ? (
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3' role='status' aria-label='Loading articles'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
                <div className='aspect-[16/10] animate-pulse bg-slate-200' />
                <div className='space-y-3 p-5'>
                  <div className='h-3 w-1/3 animate-pulse rounded bg-slate-200' />
                  <div className='h-5 w-5/6 animate-pulse rounded bg-slate-200' />
                  <div className='h-4 w-full animate-pulse rounded bg-slate-100' />
                  <div className='h-4 w-2/3 animate-pulse rounded bg-slate-100' />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className='rounded-2xl border border-red-200 bg-white px-6 py-14 text-center shadow-sm' role='alert'>
            <p className='font-semibold text-red-700'>{error}</p>
            <button type='button' onClick={() => { setError(''); setLoading(true); setRetry((count) => count + 1) }} className='mt-5 rounded-full bg-[#0B132B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#17264a]'>
              Try again
            </button>
          </div>
        ) : sortedArticles.length === 0 ? (
          <div className='rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm'>
            <BookOpen className='mx-auto mb-4 h-10 w-10 text-[#D99A1A]' aria-hidden='true' />
            <h2 className='text-xl font-bold text-[#0B132B]'>No publications yet</h2>
            <p className='mt-2 text-sm text-slate-600'>Please check back soon for new articles and insights.</p>
            <Link to='/' className='mt-6 inline-flex items-center gap-2 font-semibold text-[#9A6A00] hover:underline'>
              Back to home <ArrowRight className='h-4 w-4' aria-hidden='true' />
            </Link>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className='rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm'>
            <Search className='mx-auto mb-4 h-9 w-9 text-slate-300' aria-hidden='true' />
            <h2 className='text-xl font-bold text-[#0B132B]'>No matching articles</h2>
            <p className='mt-2 text-sm text-slate-600'>Try another search or clear your filters to see all publications.</p>
            <button type='button' onClick={() => { setQuery(''); setActiveTopic('All insights') }} className='mt-5 inline-flex items-center gap-2 rounded-full bg-[#F6B72D] px-5 py-2.5 text-sm font-bold text-[#0B132B] transition hover:bg-[#e8a91f]'>
              Clear filters <X className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6'>
            {filteredArticles.map((article) => {
              const imageUrl = getAssetUrl(article.thumbnailImage) || fallbackImage
              const articleUrl = `/blog/${article.slug}`
              const date = article.publishedAt && !Number.isNaN(new Date(article.publishedAt).getTime())
                ? formatDate(article.publishedAt)
                : 'Recently published'

              return (
                <article key={article.id} className='group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]'>
                  <Link to={articleUrl} className='block aspect-[16/10] overflow-hidden bg-slate-100' aria-label={`Read ${article.title}`}>
                    <img
                      src={imageUrl}
                      alt={article.title || 'Publication cover'}
                      loading='lazy'
                      className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]'
                      onError={(event) => { event.currentTarget.src = fallbackImage }}
                    />
                  </Link>
                  <div className='flex flex-1 flex-col p-5 sm:p-6'>
                    <p className='mb-3 min-h-4 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#B47A00]' title={article.topic || 'Leadership insights'}>
                      {article.topic || 'Leadership insights'}
                    </p>
                    <h2 className='line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-snug text-[#0B132B] transition-colors group-hover:text-[#A87500]'>
                      <Link to={articleUrl}>{article.title}</Link>
                    </h2>
                    <p className='mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600'>
                      {article.shortDescription || 'Read the latest perspective from The CEO Influencers.'}
                    </p>
                    <div className='mt-5 flex min-h-10 items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-slate-500'>
                      <span className='truncate'>{date}</span>
                      <span className='inline-flex shrink-0 items-center gap-1'><Clock3 className='h-3.5 w-3.5' aria-hidden='true' />{article.timeToRead || 5} min read</span>
                    </div>
                    <Link to={articleUrl} className='mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0B132B] hover:text-[#A87500]'>
                      Read article <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' aria-hidden='true' />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
