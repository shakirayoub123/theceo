import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import BlogContent from '@/components/BlogContent'
import BlogHeader from '@/components/BlogHeader'
import Breadcrumb from '@/components/Breadcrumb'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'

export default function Blog() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [blogData, setBlogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setLoading(true)
        setError('')

        // 1. Primary fetch using slug
        try {
          const data = await authService.getBlogDetails(slug)
          if (data && (data.id || data.title)) {
            setBlogData(data)
            return
          }
        } catch (initialErr) {
          console.warn('Initial blog lookup failed, trying fallback list match:', initialErr)
        }

        // 2. Secondary fallback: search across published blogs
        const allBlogsResponse = await authService.getAllBlogs()
        const list = allBlogsResponse?.blogs || allBlogsResponse?.data?.blogs || []
        const cleanSlug = slug.toLowerCase()
        const matched = list.find(
          (b) =>
            b.slug === slug ||
            String(b.id) === slug ||
            slug.endsWith(`-${b.id}`) ||
            (b.slug && (b.slug.includes(cleanSlug) || cleanSlug.includes(b.slug))) ||
            (b.title && b.title.toLowerCase().includes(cleanSlug.replace(/-/g, ' ')))
        )

        if (matched?.slug) {
          const data = await authService.getBlogDetails(matched.slug)
          setBlogData(data)
          return
        }

        setError('Failed to load blog details')
      } catch (err) {
        setError('Failed to load blog details')
        console.error('Blog details error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchBlogDetails()
    }
  }, [slug])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error || !blogData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Blog</p>
          <p className='text-sm'>{error || 'Blog not found'}</p>
          <button
            onClick={() => navigate('/')}
            className='mt-4 px-4 py-2 bg-[#F6B72D] text-white rounded hover:bg-[#e6b82a]'
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const normalizedAuthor =
    blogData.author && blogData.author.toLowerCase() !== 'super admin'
      ? blogData.author
      : null
  const blogHeaderData = {
    title: blogData.title,
    publishedDate: new Date(blogData.publishedAt).toLocaleDateString(),
    readTime: `${blogData.timeToRead || 5} mins read`,
    featuredImage: getAssetUrl(blogData.thumbnailImage) || '/images/blog1.svg',
    author: normalizedAuthor,
    viewsCount: blogData.viewsCount,
  }
  const shareUrl = `https://theceoinfluencers.com/blog/${slug}`

  const handleDownloadBlog = () => {
    const articleText = new DOMParser().parseFromString(
      blogData.content || '',
      'text/html',
    ).body.innerText
    const downloadContent = [
      blogData.title,
      `Topic: ${blogData.topic || 'Business Insight'}`,
      `Author: ${normalizedAuthor || 'The CEO Influencers'}`,
      `Published: ${blogHeaderData.publishedDate}`,
      '',
      articleText,
    ].join('\n')
    const file = new Blob([downloadContent], { type: 'text/plain;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${slug || 'blog'}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <div className='min-h-screen bg-white font-jakarta'>
      <Helmet>
        <title>{blogData.title} - The CEO Influencers Blog</title>
        <meta
          name='description'
          content={
            blogData.excerpt
              ? `${blogData.excerpt.substring(0, 140)}... Explore expert perspectives on leadership and business innovation.`
              : 'Dive into thought-provoking articles on business leadership, executive coaching, and entrepreneurial success from The CEO Influencers.'
          }
        />
        <meta
          name='keywords'
          content={`blog, ${blogData.tags ? blogData.tags.join(', ') : 'leadership, business'}, CEO`}
        />
        <meta
          property='og:title'
          content={`${blogData.title} - The CEO Influencers`}
        />
        <meta
          property='og:description'
          content={
            blogData.excerpt
              ? blogData.excerpt.substring(0, 160)
              : 'Expert insights on leadership and business strategy.'
          }
        />
        <meta
          property='og:image'
          content={
            getAssetUrl(blogData.thumbnailImage) ||
            'https://theceoinfluencers.com/images/blog-default.jpg'
          }
        />
        <meta
          property='og:url'
          content={`https://theceoinfluencers.com/blog/${slug}`}
        />
        <meta name='twitter:card' content='summary_large_image' />
        <link
          rel='canonical'
          href={`https://theceoinfluencers.com/blog/${slug}`}
        />
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: blogData.title,
            description: blogData.excerpt,
            image: getAssetUrl(blogData.thumbnailImage),
            author: {
              '@type': 'Person',
              name: blogData.author,
            },
            publisher: {
              '@type': 'Organization',
              name: 'The CEO Influencers',
            },
            datePublished: blogData.publishedAt,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://theceoinfluencers.com/blog/${slug}`,
            },
          })}
        </script>
      </Helmet>

      <BlogHeader
        title={blogHeaderData.title}
        publishedDate={blogHeaderData.publishedDate}
        readTime={blogHeaderData.readTime}
        featuredImage={blogHeaderData.featuredImage}
        author={blogHeaderData.author}
        viewsCount={blogHeaderData.viewsCount}
        topic={blogData.topic}
        onDownload={handleDownloadBlog}
        shareUrl={shareUrl}
        shareTitle={blogData.title}
      />
      <BlogContent
        content={blogData.content}
        inlineImage={
          getAssetUrl(blogData.thumbnailImage) || '/images/blog1.svg'
        }
      />
    </div>
  )
}
