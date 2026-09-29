import Breadcrumb from '@/components/Breadcrumb'
import ProductGallery from '@/components/ProductGallery'
import ProductInfo from '@/components/ProductInfo'
import ProductTabs from '@/components/ProductTabs'
import authService from '@/services/authService'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams } from 'react-router-dom'

export default function EbookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ebookData, setEbookData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const fetchEbookDetails = async () => {
      try {
        setLoading(true)
        const data = await authService.getPeopleEbookDetails(id)
        setEbookData(data)
      } catch (err) {
        setError('Failed to load ebook details')
        console.error('Ebook details error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEbookDetails()
    }
  }, [id])

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true)

      // Store ebook in localStorage cart
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
      const existingItem = cartItems.find((item) => item.id === id)

      if (existingItem) {
        alert('This ebook is already in your cart')
        return
      }

      cartItems.push({
        id: id,
        title: ebookData.title,
        price: ebookData.price,
        coverImage: ebookData.coverImage,
        author: ebookData.author,
        topic: ebookData.topic,
        series: ebookData.series,
        quantity: 1,
        addedAt: new Date().toISOString(),
      })

      localStorage.setItem('cartItems', JSON.stringify(cartItems))

      // Dispatch event for Navbar instantly updating cart icon counter on the same tab
      window.dispatchEvent(new Event('cartUpdated'))

      alert('Ebook added to cart successfully!')
    } catch (err) {
      console.error('Add to cart error:', err)
      alert('Failed to add ebook to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error || !ebookData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Ebook</p>
          <p className='text-sm'>{error || 'Ebook not found'}</p>
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

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Ebooks', href: '/#products-section' },
    { label: ebookData.title },
  ]

  const productImages = [ebookData.coverImage || '/images/ebook-red.svg']
  const introductionText =
    ebookData.introduction ||
    ebookData.description ||
    'No introduction available.'

  const productData = {
    name: ebookData.title,
    price: `$${ebookData.price}`,
    description: [introductionText],
    sku: ebookData.id,
    category: ebookData.topic || 'ebooks',
    tags: ['ebook', ebookData.topic].filter(Boolean),
    author: ebookData.author,
    pages: ebookData.pages,
    isPurchased: ebookData.isPurchased,
    onAddToCart: handleAddToCart,
    addingToCart,
  }

  const tabs = [
    {
      id: 'introduction',
      label: 'Introduction',
      content: [introductionText],
    },
    {
      id: 'additional-info',
      label: 'Additional Information',
      content: [
        `Author: ${ebookData.author}`,
        `Pages: ${ebookData.pages}`,
        `Topic: ${ebookData.topic}`,
        `ISBN: ${ebookData.isbn || 'N/A'}`,
        `Total Sold: ${ebookData.totalSold}`,
      ],
    },
    {
      id: 'series-info',
      label: 'Series Information',
      content: ebookData.series
        ? [
          `Series: ${ebookData.series.title}`,
          `Description: ${ebookData.series.description}`,
          `Cover: ${ebookData.series.coverImage}`,
        ]
        : ['This ebook is not part of a series.'],
    },
  ]

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>{ebookData.title} - The CEO Influencers</title>
        <meta
          name='description'
          content={
            ebookData.description
              ? `${ebookData.description.substring(0, 140)}... Discover expert strategies for business success.`
              : 'Unlock powerful business insights with this comprehensive ebook from The CEO Influencers. Gain actionable strategies to elevate your leadership and drive growth.'
          }
        />
        <meta
          name='keywords'
          content={`ebook, ${ebookData.topic}, leadership, business, ${ebookData.author}, CEO`}
        />
        <meta
          property='og:title'
          content={`${ebookData.title} - The CEO Influencers`}
        />
        <meta
          property='og:description'
          content={
            ebookData.description
              ? ebookData.description.substring(0, 160)
              : 'Expert insights on leadership and business strategy.'
          }
        />
        <meta
          property='og:image'
          content={
            ebookData.coverImage ||
            'https://theceoinfluencers.com/images/ebook-default.jpg'
          }
        />
        <meta
          property='og:url'
          content={`https://theceoinfluencers.com/ebook/${id}`}
        />
        <meta name='twitter:card' content='summary_large_image' />
        <link
          rel='canonical'
          href={`https://theceoinfluencers.com/ebook/${id}`}
        />
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Book',
            name: ebookData.title,
            author: {
              '@type': 'Person',
              name: ebookData.author,
            },
            description: ebookData.description,
            image: ebookData.coverImage,
            numberOfPages: ebookData.pages,
            isbn: ebookData.isbn,
            genre: ebookData.topic,
            publisher: {
              '@type': 'Organization',
              name: 'The CEO Influencers',
            },
            offers: {
              '@type': 'Offer',
              price: ebookData.price,
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
          })}
        </script>
      </Helmet>
      <div className='w-full'>
        {/* SHOP DETAILS HERO BANNER */}
        <div className='w-full bg-[#FFFFFF] pt-6'>
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
              <h1 className='text-4xl md:text-[50px] font-bold font-jakarta text-[#000023] mb-5 tracking-tight'>Shop Details</h1>
              <div className='flex items-center text-[15px] font-semibold font-jakarta'>
                <a href='/' className='text-[#161616] hover:text-[#F6B72D] transition-colors'>Home</a>
                <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
                <a href='/#products-section' className='text-[#F6B72D] hover:text-[#e6a820] transition-colors'>Ebooks</a>
                <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
                <span className='text-[#F6B72D]'>{ebookData.title}</span>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-24'>
          {/* Product Details Section */}
          <div className='grid lg:grid-cols-2 gap-8 mb-12'>
            {/* Left - Product Gallery */}
            <ProductGallery
              images={productImages}
              productName={productData.name}
            />

            {/* Right - Product Info */}
            <ProductInfo
              name={productData.name}
              price={productData.price}
              description={productData.description}
              sku={productData.sku}
              category={productData.category}
              tags={productData.tags}
              author={productData.author}
              pages={productData.pages}
              isPurchased={productData.isPurchased}
              onAddToCart={productData.onAddToCart}
              addingToCart={productData.addingToCart}
            />
          </div>

          {/* Product Tabs */}
          <ProductTabs tabs={tabs} />
        </div>
      </div>
    </div>
  )
}
