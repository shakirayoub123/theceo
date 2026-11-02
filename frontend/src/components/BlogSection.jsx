import { getAssetUrl, formatDate } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import mapBg3 from '@/assets/map bg 3.png'

export default function BlogSection({ blogs = [], loading = false }) {
  // Preserve API ordering for the side list; an explicitly featured blog leads.
  const blogPosts = [...blogs]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((blog) => {
      const topicLower = blog.topic?.toLowerCase() || ''
      let categoryColor = 'bg-[#16A34A]'
      if (topicLower.includes('critical')) categoryColor = 'bg-[#F59E0B]'
      else if (topicLower.includes('know') || topicLower.includes('pressure')) categoryColor = 'bg-[#DC2626]'

      return {
        id: blog.id,
        category: blog.topic?.toUpperCase().replace(/-/g, '-') || 'BUSINESS-HOT',
        categoryColor,
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
      id: '1', category: 'BUSINESS-INSIGHT', categoryColor: 'bg-[#16A34A]',
      title: 'The algorithm of trust: building human-centered leadership in an AI-driven world',
      subtitle: 'Exploring how trust, empathy, and human judgment can shape stronger leadership.',
      image: '/images/blog1.svg', publishedAt: '16th Oct, 2024', timeToRead: 8, author: 'The CEO Influencers', slug: 'algorithm-of-trust',
    },
    {
      id: '2', category: 'BUSINESS-HOT', categoryColor: 'bg-[#16A34A]',
      title: 'Collaboration or competition? How aligned values define the future of strategic alliances',
      subtitle: '', image: '/images/blog2.svg', publishedAt: '28th Sept, 2024', timeToRead: 5, slug: 'collaboration-or-competition',
    },
    {
      id: '3', category: 'BUSINESS-CRITICAL', categoryColor: 'bg-[#F59E0B]',
      title: 'The human algorithm: navigating the organizational shockwaves of AI',
      subtitle: '', image: '/images/blog1.svg', publishedAt: '14th Sept, 2024', timeToRead: 6, slug: 'human-algorithm',
    },
    {
      id: '4', category: 'BUSINESS-NEED-TO-KNOW', categoryColor: 'bg-[#DC2626]',
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
        style={{ backgroundImage: `url("${mapBg3}")`, backgroundSize: 'contain', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}
      />

      <div className='max-w-[1350px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-4 lg:mb-5 gap-3'>
          <div className='max-w-2xl'>
            <div className='inline-block border border-gray-400 rounded-full px-4 py-[2px] mb-2'>
              <span className='text-[#4B5563] font-bold tracking-widest text-[9px] lg:text-[10px] uppercase'>WHAT WE PROVIDE</span>
            </div>
            <h2 className='text-[26px] lg:text-[32px] font-bold leading-none mb-2'>
              <span className='text-black'>OUR </span>
              <span className='text-[#F6B72D] font-sans text-[28px] lg:text-[36px]'>BLOGS</span>
            </h2>
            <p className='text-[#4B5563] text-[12.5px] lg:text-[13.5px] leading-relaxed max-w-xl font-medium'>
              Explore our curated blogs packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.
            </p>
          </div>
          <Link to='/articles' className='group flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap mb-1 shrink-0'>
            <span className='text-black font-bold text-[13px] lg:text-[14px]'>Explore all publications</span>
            <div className='w-7 h-7 rounded-full bg-[#F6B72D] flex items-center justify-center group-hover:translate-x-1 transition-transform'>
              <ArrowRight className='w-3.5 h-3.5 text-white' />
            </div>
          </Link>
        </div>

        {/* Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch'>

          {/* LEFT: Featured — banner image with article details below */}
          {featuredPost && (
            <div className='lg:col-span-6 xl:col-span-7 h-full'>
              <Link
                to={`/blog/${featuredPost.slug}`}
                className='group flex flex-col bg-white rounded-[16px] border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 h-full overflow-hidden'
              >
                <div className='w-full aspect-[1.7/1] sm:aspect-[2.2/1] overflow-hidden bg-[#F3F4F6] flex items-center justify-center'>
                  <img
                    src={getAssetUrl(featuredPost.image)}
                    alt={featuredPost.title}
                    className='w-full h-full object-contain'
                    onError={(e) => { e.target.src = '/images/blog1.svg' }}
                  />
                </div>

                <div className='flex flex-col flex-1 min-w-0 px-5 py-4 lg:px-7 lg:py-5'>
                  <p className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] lg:text-[11px] uppercase tracking-wide text-[#6B7280] mb-2'>
                    <span className='font-semibold text-[#111827]'>
                      {featuredPost.author || 'The CEO Influencers'}
                    </span>
                    <span aria-hidden='true'>•</span>
                    <span>{featuredPost.timeToRead} min read</span>
                    <span aria-hidden='true'>•</span>
                    <span>{featuredPost.publishedAt}</span>
                  </p>

                  <h3 className='text-[17px] lg:text-[21px] font-bold text-[#000023] leading-snug mb-1.5 group-hover:text-[#CFA329] transition-colors line-clamp-2'>
                    {featuredPost.title}
                  </h3>

                  <p className='text-[#4B5563] text-[12px] lg:text-[13px] leading-relaxed line-clamp-2 mb-2'>
                    {featuredPost.subtitle}
                  </p>

                  <div className='flex items-center text-[#000023] font-bold text-[11px] lg:text-[12px] gap-1.5 mt-auto'>
                    <span>Read Article</span>
                    <ArrowRight className='w-3.5 h-3.5 group-hover:translate-x-1 transition-transform' />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* RIGHT: 3 stacked cards */}
          <div className='lg:col-span-6 xl:col-span-5 flex flex-col gap-3 lg:gap-3.5'>
            {listPosts.map((post, index) => (
              <Link
                key={post.id || index}
                to={`/blog/${post.slug}`}
                className='group bg-white rounded-[12px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 px-4 py-5 lg:px-5 lg:py-5 flex items-center gap-4 min-h-[145px]'              >
                {/* Thumbnail */}
                <div className='w-[100px] h-[100px] lg:w-[125px] lg:h-[125px] rounded-[10px] overflow-hidden shrink-0 bg-gray-100'>
                  <img
                    src={getAssetUrl(post.image)}
                    alt={post.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    onError={(e) => { e.target.src = '/images/blog1.svg' }}
                  />
                </div>

                {/* Content */}
                <div className='flex flex-col flex-1 min-w-0'>
                  <span className={`inline-block self-start px-2 py-[3px] text-white text-[7.5px] lg:text-[8px] font-bold uppercase tracking-wide rounded-sm mb-1.5 ${post.categoryColor}`}>
                    {post.category}
                  </span>
                  <h4 className='text-[13px] lg:text-[14px] font-bold text-black leading-snug mb-1.5 line-clamp-2 group-hover:text-[#CFA329] transition-colors'>
                    {post.title}
                  </h4>
                  <p className='text-[#9CA3AF] text-[10.5px] lg:text-[11px] font-medium'>
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
