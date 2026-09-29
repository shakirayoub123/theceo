import {
  Calendar,
  Clock,
  User,
  Eye,
  Facebook,
  Linkedin,
  Twitter,
} from 'lucide-react'

export default function BlogHeader({
  title,
  publishedDate,
  readTime,
  featuredImage,
  author,
  viewsCount,
  shareUrl,
  shareTitle,
}) {
  const encodedUrl = encodeURIComponent(
    shareUrl || 'https://theceoinfluencers.com',
  )
  const encodedTitle = encodeURIComponent(shareTitle || '')

  return (
    <div className='w-full font-jakarta bg-white'>
      {/* BLOG DETAILS HERO BANNER */}
      <div className='w-full pt-6'>
        <div className='relative w-full max-w-[1383px] mx-auto py-16 md:py-[70px] bg-[#FFFBF0] flex flex-col items-center justify-center overflow-hidden rounded-[28px] shadow-sm mb-12'>
          {/* Topographic Background */}
          <div
            className='absolute inset-0 z-0 opacity-40 pointer-events-none'
            style={{
              backgroundImage: `url('/images/body-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className='relative z-10 text-center flex flex-col items-center px-4 mt-2'>
            <h1 className='text-4xl md:text-[50px] font-bold font-jakarta text-[#000023] mb-5 tracking-tight'>
              Blog Details
            </h1>
            <div className='flex items-center text-[15px] font-semibold font-jakarta flex-wrap justify-center'>
              <a href='/' className='text-[#161616] hover:text-[#F6B72D] transition-colors'>
                Home
              </a>
              <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
              <a href='/#blog' className='text-[#F6B72D] hover:text-[#e6a820] transition-colors'>
                Blog
              </a>
              <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
              <span className='text-[#F6B72D] text-center max-w-[600px] truncate'>
                {title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meta details section placed above the blog content */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className='text-3xl md:text-5xl lg:text-5xl font-bold text-[#0B132B] tracking-tight leading-[1.2] mb-6'>
          {title}
        </h1>

        <div className='flex flex-wrap items-center gap-6 text-gray-500 font-exo mb-6 text-[15px]'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-[#F6B72D]' />
            <span>{publishedDate}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-[#F6B72D]' />
            <span>{readTime}</span>
          </div>
          {author && (
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4 text-[#F6B72D]' />
              <span>By {author}</span>
            </div>
          )}
          {viewsCount && (
            <div className='flex items-center gap-2'>
              <Eye className='h-4 w-4 text-[#F6B72D]' />
              <span>{viewsCount} views</span>
            </div>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-4 font-exo'>
          <span className='text-sm font-semibold tracking-wide text-[#0B132B]'>
            SHARE THIS ARTICLE
          </span>
          <div className='h-px w-8 bg-[#F6B72D]' />
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`}
            target='_blank'
            rel='noopener noreferrer'
            className='w-10 h-10 rounded-full bg-[#FFFBF0] hover:bg-[#F6B72D] hover:text-white border border-[#F6E5B8] flex items-center justify-center text-[#D99A1A] transition-all transform hover:scale-105 shadow-sm'
          >
            <Facebook className='h-4 w-4' />
          </a>
          <a
            href={`https://linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target='_blank'
            rel='noopener noreferrer'
            className='w-10 h-10 rounded-full bg-[#FFFBF0] hover:bg-[#F6B72D] hover:text-white border border-[#F6E5B8] flex items-center justify-center text-[#D99A1A] transition-all transform hover:scale-105 shadow-sm'
          >
            <Linkedin className='h-4 w-4' />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target='_blank'
            rel='noopener noreferrer'
            className='w-10 h-10 rounded-full bg-[#FFFBF0] hover:bg-[#F6B72D] hover:text-white border border-[#F6E5B8] flex items-center justify-center text-[#D99A1A] transition-all transform hover:scale-105 shadow-sm'
          >
            <Twitter className='h-4 w-4' />
          </a>
        </div>
      </div>
    </div>
  )
}
