import { getAssetUrl } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import mapBg3 from '@/assets/map bg 3.png'

export default function BlogSection({ blogs = [], loading = false }) {
  const { t } = useTranslation()

  // Transform API data to component format
  // Fetch up to 4 posts: 1 for featured, 3 for the side list
  const blogPosts = blogs.slice(0, 4).map((blog) => {
    let categoryColor = 'bg-[#16A34A]' // default green (Business-Hot)
    const topicLower = blog.topic?.toLowerCase() || ''

    if (topicLower.includes('critical')) {
      categoryColor = 'bg-[#F6B72D]' // gold
    } else if (topicLower.includes('know') || topicLower.includes('pressure')) {
      categoryColor = 'bg-[#DC2626]' // red
    }

    return {
      id: blog.id,
      category: blog.topic?.toUpperCase() || 'BUSINESS-HOT',
      topic: blog.topic,
      categoryColor: categoryColor,
      title: blog.title,
      subtitle: blog.shortDescription || blog.title,
      image: blog.thumbnailImage || '/images/blog1.svg',
      publishedAt: blog.publishedAt,
      author: blog.author || 'Dr. Alistair Vance',
      timeToRead: blog.timeToRead || Math.floor(Math.random() * 5) + 4,
      slug: blog.slug,
    }
  })

  // Fallback data matching the Figma mockup layout
  const fallbackPosts = [
    {
      id: '1',
      category: 'BUSINESS-INSIGHT',
      categoryColor: 'bg-[#16A34A]',
      title: 'The algorithm of trust: building human-centered leadership in an AI-driven world',
      subtitle: 'Exploring how trust, empathy, and human judgment can shape stronger leadership as organizations navigate the rapid rise of artificial intelligence.',
      image: '/images/blog1.svg',
      author: 'DR. ALISTAIR VANCE',
      timeToRead: 8,
      publishedAt: 'OCTOBER 2024',
      slug: 'algorithm-of-trust'
    },
    {
      id: '2',
      category: 'BUSINESS-HOT',
      categoryColor: 'bg-[#16A34A]',
      title: 'Collaboration or competition? How aligned values define the future of strategic alliances',
      image: '/images/blog2.svg',
      publishedAt: 'Sept 28, 2024',
      timeToRead: 5,
      slug: 'collaboration-or-competition'
    },
    {
      id: '3',
      category: 'BUSINESS-CRITICAL',
      categoryColor: 'bg-[#F6B72D]',
      title: 'The human algorithm: navigating the organizational shockwaves of AI',
      image: '/images/blog1.svg',
      publishedAt: 'Sept 14, 2024',
      timeToRead: 6,
      slug: 'human-algorithm'
    },
    {
      id: '4',
      category: 'BUSINESS-NEED-TO-KNOW',
      categoryColor: 'bg-[#DC2626]',
      title: 'Pressure points: the structural shift in global business resilience',
      image: '/images/blog2.svg',
      publishedAt: 'August 30, 2024',
      timeToRead: 7,
      slug: 'pressure-points'
    }
  ]

  const displayPosts = blogPosts.length > 0 ? blogPosts : fallbackPosts

  if (loading) {
    return (
      <section className='py-8 lg:py-[5vh] min-h-[50vh] flex items-center justify-center bg-[#FBF9F5]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </section>
    )
  }

  const featuredPost = displayPosts[0]
  const listPosts = displayPosts.slice(1, 4)

  return (
    <section className='py-12 lg:py-[6vh] min-h-screen flex items-center relative overflow-hidden bg-[#FBF9F5] font-jakarta'>

      {/* Background Map Pattern */}
      <div
        className='absolute inset-0 z-0 pointer-events-none opacity-100'
        style={{
          backgroundImage: `url("${mapBg3}")`,
          backgroundSize: 'contain',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className='max-w-[1350px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header Block */}
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-8 lg:mb-[4vh] gap-4'>
          <div className='max-w-3xl'>
            <div className='inline-block border border-gray-400 rounded-full px-4 py-1 mb-4 lg:mb-5'>
              <span className='text-[#4B5563] font-bold tracking-widest text-[9px] lg:text-[10px] uppercase'>
                WHAT WE PROVIDE
              </span>
            </div>
            <h2 className='text-[32px] lg:text-[38px] font-bold leading-none mb-3'>
              <span className='text-black'>OUR </span>
              <span className='text-[#F6B72D] font-sans text-[34px] lg:text-[40px]'>BLOGS</span>
            </h2>
            <p className='text-[#4B5563] text-[14px] lg:text-[15px] leading-relaxed max-w-2xl font-medium'>
              Explore our curated blogs packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.
            </p>
          </div>

          <Link to='/articles' className='group flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap mb-2'>
            <span className='text-black font-bold text-[14px] lg:text-[15px]'>Explore all publications</span>
            <div className='w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-[#F6B72D] flex items-center justify-center group-hover:translate-x-1 transition-transform'>
              <ArrowRight className='w-4 h-4 text-white' />
            </div>
          </Link>
        </div>

        {/* Content Layout Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8'>

          {/* Left Column: Featured Post */}
          {featuredPost && (
            <div className='lg:col-span-7 flex flex-col h-full'>
              <Link to={`/blog/${featuredPost.slug}`} className='group bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block'>

                {/* Large Featured Image */}
                <div className='w-full h-[200px] sm:h-[250px] lg:h-[30vh] max-h-[300px] overflow-hidden bg-gray-100'>
                  <img
                    src={getAssetUrl(featuredPost.image) || '/placeholder.svg'}
                    alt={featuredPost.title}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700'
                    onError={(e) => { e.target.src = '/images/placeholder-blog.jpg' }}
                  />
                </div>

                {/* Featured Content Base */}
                <div className='p-6 lg:p-8 flex flex-col flex-grow'>
                  {/* Meta */}
                  <div className='flex flex-wrap items-center text-[#6B7280] text-[10px] lg:text-[11px] font-bold uppercase tracking-widest gap-2 mb-3 lg:mb-4'>
                    <span>{featuredPost.author}</span>
                    <span className='w-1 h-1 rounded-full bg-gray-400'></span>
                    <span>{featuredPost.timeToRead} MIN READ</span>
                    <span className='w-1 h-1 rounded-full bg-gray-400'></span>
                    <span>{featuredPost.publishedAt || 'RECENT'}</span>
                  </div>

                  {/* Title */}
                  <h3 className='text-[22px] lg:text-[26px] font-bold text-black leading-tight mb-3 lg:mb-4 group-hover:text-[#CFA329] transition-colors line-clamp-2'>
                    {featuredPost.title}
                  </h3>

                  {/* Description */}
                  {featuredPost.subtitle && (
                    <p className='text-[#4B5563] text-[14px] lg:text-[15px] leading-relaxed mb-6 lg:mb-8 font-medium line-clamp-2 mt-auto'>
                      {featuredPost.subtitle}
                    </p>
                  )}

                  {/* Action Link */}
                  <div className='mt-2 flex items-center text-black font-bold text-[13px] lg:text-[14px] group/btn'>
                    Read Article
                    <ArrowRight className='w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform' />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Right Column: List of Posts */}
          <div className='lg:col-span-5 flex flex-col gap-4 lg:gap-5 justify-between'>
            {listPosts.map((post, index) => (
              <Link
                key={post.id || index}
                to={`/blog/${post.slug}`}
                className='group bg-white rounded-[20px] p-3 lg:p-4 flex flex-col sm:flex-row items-center gap-4 lg:gap-5 shadow-sm border border-gray-100/80 hover:shadow-md hover:border-gray-300 transition-all duration-300 h-full max-h-[160px]'
              >
                {/* Thumbnail */}
                <div className='w-full sm:w-[110px] lg:w-[120px] h-[120px] sm:h-[110px] lg:h-[120px] rounded-[14px] overflow-hidden shrink-0 bg-gray-100 hidden sm:block'>
                  <img
                    src={getAssetUrl(post.image) || '/placeholder.svg'}
                    alt={post.title}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
                  />
                </div>

                {/* List Content */}
                <div className='flex flex-col flex-1 py-1 overflow-hidden h-full justify-center'>
                  {/* Category Pill */}
                  <div className='mb-2 lg:mb-3'>
                    <span className={`inline-block px-2.5 py-1 text-white text-[9px] lg:text-[10px] font-bold uppercase tracking-wider rounded-md ${post.categoryColor}`}>
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className='text-[15px] lg:text-[16px] font-bold text-black leading-snug mb-2 flex-grow line-clamp-2 group-hover:text-[#CFA329] transition-colors'>
                    {post.title}
                  </h4>

                  {/* Meta */}
                  <div className='text-[#6B7280] text-[12px] font-medium mt-auto'>
                    {post.publishedAt || 'Recent'} • {post.timeToRead} min read
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
