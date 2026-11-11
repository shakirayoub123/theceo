
import { getAssetUrl, formatDate } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import mapBg3 from '@/assets/map bg 3.png'

export default function BlogSection({ blogs = [], loading = false }) {
  // Helper to get category badge color according to topic:
  // 1. business need to know -> green
  // 2. business hot topic -> yellow
  // 3. business critical -> red
  const getTopicColor = (topic) => {
    const t = topic?.toLowerCase() || ''
    if (t.includes('critical')) return 'bg-[#DC2626]' // Red
    if (t.includes('hot')) return 'bg-[#F59E0B]' // Yellow
    if (t.includes('know')) return 'bg-[#16A34A]' // Green
    return 'bg-[#16A34A]'
  }

  // Preserve API ordering for the side list; an explicitly featured blog leads.
  const blogPosts = [...blogs]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((blog) => {
      return {
        id: blog.id,
        category: blog.topic?.toUpperCase().replace(/-/g, '-') || 'BUSINESS-HOT',
        categoryColor: getTopicColor(blog.topic),
        title: blog.title,
        subtitle: blog.shortDescription || blog.title,
        image: blog.thumbnail || blog.thumbnailImage || '/images/blog1.svg',
        publishedAt: blog.publishedAt ? formatDate(blog.publishedAt) : 'Recent',
        timeToRead: blog.timeToRead || 5,
        author: blog.author,
        slug: blog.slug,
        isFeatured: blog.isFeatured,
      }
    })

  const fallbackPosts = [
    {
      id: '1', category: 'BUSINESS-NEED-TO-KNOW', categoryColor: 'bg-[#16A34A]',
      title: 'The algorithm of trust: building human-centered leadership in an AI-driven world',
      subtitle: 'Exploring how trust, empathy, and human judgment can shape stronger leadership.',
      image: '/images/blog1.svg', publishedAt: '16th Oct, 2024', timeToRead: 8, author: 'The CEO Influencers', slug: 'algorithm-of-trust',
    },
    {
      id: '2', category: 'BUSINESS-HOT', categoryColor: 'bg-[#F59E0B]',
      title: 'Collaboration or competition? How aligned values define the future of strategic alliances',
      subtitle: '', image: '/images/blog2.svg', publishedAt: '28th Sept, 2024', timeToRead: 5, slug: 'collaboration-or-competition',
    },
    {
      id: '3', category: 'BUSINESS-CRITICAL', categoryColor: 'bg-[#DC2626]',
      title: 'The human algorithm: navigating the organizational shockwaves of AI',
      subtitle: '', image: '/images/blog1.svg', publishedAt: '14th Sept, 2024', timeToRead: 6, slug: 'human-algorithm',
    },
    {
      id: '4', category: 'BUSINESS-NEED-TO-KNOW', categoryColor: 'bg-[#16A34A]',
      title: 'Pressure points: the structural shift in global business resilience',
      subtitle: '', image: '/images/blog2.svg', publishedAt: '30th Aug, 2024', timeToRead: 7, slug: 'pressure-points',
    },
  ]

  const displayPosts = blogPosts.length > 0 ? blogPosts : fallbackPosts
  const featuredPost =
    displayPosts.find((post) => post.isFeatured) || displayPosts[0]
  const listPosts = displayPosts
    .filter((post) => post.id !== featuredPost?.id)
    .slice(0, 3)

  if (loading) {
    return (
      <section className='min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#FBF9F5]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </section>
    )
  }

  return (
    <section className='py-4 lg:py-5 min-h-[calc(100vh-140px)] flex flex-col justify-center relative overflow-hidden bg-[#FBF9F5] font-jakarta'>
      <div
        className='absolute inset-0 z-0 pointer-events-none'
        style={{
          backgroundImage: `url("${mapBg3}")`,
          backgroundSize: 'contain',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className='max-w-[1350px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5 md:mb-6'>
          <div className='max-w-3xl'>
            <h2 className='text-[36px] lg:text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]'>
              <span className='text-[#111827]'>OUR </span>
              <span className='text-[#F6B72D]'>BLOGS</span>
            </h2>
            <p className='mt-2 text-[#4B5563] text-[12px] sm:text-[13px] lg:text-[14px] leading-relaxed max-w-[720px]'>
              Explore our curated blogs packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.
            </p>
          </div>

          <Link to='/articles' className='group inline-flex items-center gap-2 self-start md:self-end whitespace-nowrap hover:opacity-80 transition-opacity'>
            <span className='text-[#111827] font-bold text-[11px] sm:text-[12px] lg:text-[13px]'>Explore all publications</span>
            <div className='w-7 h-7 rounded-full bg-[#F6B72D] flex items-center justify-center group-hover:translate-x-1 transition-transform'>
              <ArrowRight className='w-3 h-3 text-white' />
            </div>
          </Link>
        </div>

        {/* Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch'>

          {/* LEFT: Featured */}
          {featuredPost && (
            <div className='lg:col-span-7 h-full'>
              <Link
                to={`/blog/${featuredPost.slug}`}
                className='site-hover-highlight group flex flex-col bg-white rounded-[18px] border border-[#E5E7EB] shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:shadow-lg transition-all duration-300 h-full overflow-hidden'
              >
                <div className='relative w-full aspect-[1.9/1] lg:aspect-[2.4/1] overflow-hidden bg-[#F3F4F6] flex items-center justify-center'>
                  <img
                    src={getAssetUrl(featuredPost.image)}
                    alt={featuredPost.title}
                    className='w-full h-full object-cover'
                    onError={(e) => { e.target.src = '/images/blog1.svg' }}
                  />
                  <span className={`absolute left-4 top-4 inline-block rounded-sm px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow ${featuredPost.categoryColor}`}>
                    {featuredPost.category}
                  </span>
                </div>

                <div className='flex flex-col flex-1 min-w-0 px-5 py-4 lg:px-6 lg:py-5'>
                  <p className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-2'>
                    <span className='font-semibold text-[#111827]'>
                      {featuredPost.author || 'The CEO Influencers'}
                    </span>
                    <span aria-hidden='true'>•</span>
                    <span>{featuredPost.timeToRead} min read</span>
                    <span aria-hidden='true'>•</span>
                    <span>{featuredPost.publishedAt}</span>
                  </p>

                  <h3 className='text-[15px] sm:text-[16px] lg:text-[18px] font-bold text-[#111827] leading-[1.2] mb-2 group-hover:text-[#CFA329] transition-colors line-clamp-2'>
                    {featuredPost.title}
                  </h3>

                  <p className='text-[#4B5563] text-[12px] sm:text-[13px] leading-relaxed line-clamp-2 mb-2'>
                    {featuredPost.subtitle}
                  </p>

                  <div className='flex items-center text-[#111827] font-bold text-[11px] sm:text-[12px] gap-1.5 mt-auto'>
                    <span>Read Article</span>
                    <ArrowRight className='w-3 h-3 group-hover:translate-x-1 transition-transform' />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* RIGHT: 3 stacked cards */}
          <div className='lg:col-span-5 flex flex-col gap-3 h-full'>
            {listPosts.map((post, index) => (
              <Link
                key={post.id || index}
                to={`/blog/${post.slug}`}
                className='site-hover-highlight group bg-white rounded-[14px] border border-[#E5E7EB] shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:shadow-md transition-all duration-300 p-3 lg:p-3 flex items-center gap-3 h-full flex-1 self-stretch'
              >
                {/* Thumbnail */}
                <div className='w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-[12px] overflow-hidden shrink-0 bg-gray-100'>
                  <img
                    src={getAssetUrl(post.image)}
                    alt={post.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    onError={(e) => { e.target.src = '/images/blog1.svg' }}
                  />
                </div>

                {/* Content */}
                <div className='flex flex-col flex-1 min-w-0 justify-center'>
                  <span className={`inline-block self-start px-2 py-[3px] text-white text-[7px] sm:text-[7.5px] font-bold uppercase tracking-[0.1em] rounded-sm mb-1.5 ${post.categoryColor}`}>
                    {post.category}
                  </span>

                  <h4 className='text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-[#111827] leading-snug mb-1 line-clamp-2 group-hover:text-[#CFA329] transition-colors'>
                    {post.title}
                  </h4>

                  <p className='text-[#6B7280] text-[10px] sm:text-[11px] font-medium'>
                    {post.publishedAt} • {post.timeToRead} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
