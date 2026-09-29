import { useState } from 'react'
import { Link } from 'react-router-dom'
import EbookSeriesCard from './EbookSeriesCard'
import authService from '@/services/authService'

export default function EbookSeriesBooks({ ebooks = [] }) {
  const [addingToCart, setAddingToCart] = useState({})

  const handleAddToCart = async (ebookId) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [ebookId]: true }))

      // For anonymous users, we'll need to generate a cart ID
      const cartId = localStorage.getItem('cartId') || generateCartId()
      localStorage.setItem('cartId', cartId)

      await authService.addToCart(ebookId, cartId)
      alert('Ebook added to cart successfully!')
    } catch (err) {
      console.error('Add to cart error:', err)
      if (err.message.includes('already purchased')) {
        alert('You have already purchased this ebook')
      } else if (err.message.includes('already in cart')) {
        alert('This ebook is already in your cart')
      } else {
        alert('Failed to add ebook to cart')
      }
    } finally {
      setAddingToCart((prev) => ({ ...prev, [ebookId]: false }))
    }
  }

  const generateCartId = () => {
    return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Transform API data to component format
  const books = ebooks.map((ebook) => ({
    id: ebook.id,
    focusLabel: ebook.isPurchased ? 'PURCHASED' : 'AVAILABLE',
    category: ebook.topic.toUpperCase(),
    categoryColor: 'border-[#F6B72D]',
    categoryBg: 'bg-[#F6B72D]',
    categoryText: 'text-[#F6B72D]',
    title: ebook.title,
    subtitle: ebook.description,
    image: ebook.coverImage || '/images/ebook.svg',
    primaryButton: ebook.isPurchased ? 'VIEW EBOOK' : 'PURCHASE EBOOK',
    secondaryButton: 'VIEW DETAILS',
    price: `$${ebook.price}`,
    author: ebook.author,
    pages: ebook.pages,
    isPurchased: ebook.isPurchased,
    onAddToCart: () => handleAddToCart(ebook.id),
    addingToCart: addingToCart[ebook.id] || false,
  }))

  // Fallback to static data if no ebooks provided
  const fallbackBooks = [
    {
      focusLabel: 'IN FOCUS',
      category: 'BUSINESS CRITICAL TOPIC',
      categoryColor: 'border-red-600',
      categoryBg: 'bg-red-600',
      categoryText: 'text-red-600',
      title:
        'THE HUMAN ALGORITHM: NAVIGATING THE ORGANIZATIONAL SHOCKWAVES OF AI',
      subtitle:
        'AI, Automation & the Future of Work: Strategic Imperatives in the Age of Intelligent Technology',
      image: '/images/ebook.svg',
      primaryButton: 'PURCHASE BUNDLE',
      secondaryButton: 'VIEW SERIES',
    },
    {
      focusLabel: 'IN FOCUS',
      category: 'BUSINESS CRITICAL TOPIC',
      categoryColor: 'border-yellow-500',
      categoryBg: 'bg-yellow-500',
      categoryText: 'text-yellow-500',
      title:
        'THE HUMAN ALGORITHM: NAVIGATING THE ORGANIZATIONAL SHOCKWAVES OF AI',
      subtitle:
        'AI, Automation & the Future of Work: Strategic Imperatives in the Age of Intelligent Technology',
      image: '/images/ebook3.svg',
      primaryButton: 'PURCHASE EBOOK',
      secondaryButton: 'VIEW SERIES',
    },
    {
      focusLabel: 'IN FOCUS',
      category: 'BUSINESS CRITICAL TOPIC',
      categoryColor: 'border-green-600',
      categoryBg: 'bg-green-600',
      categoryText: 'text-green-600',
      title:
        'THE HUMAN ALGORITHM: NAVIGATING THE ORGANIZATIONAL SHOCKWAVES OF AI',
      subtitle:
        'AI, Automation & the Future of Work: Strategic Imperatives in the Age of Intelligent Technology',
      image: '/images/ebook4.svg',
      primaryButton: 'PURCHASE EBOOK',
      secondaryButton: 'VIEW SERIES',
    },
  ]

  const displayBooks = books.length > 0 ? books : fallbackBooks

  return (
    <div className='bg-white py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Title */}
        <h2 className='text-2xl lg:text-3xl text-black mb-8 tracking-wide'>
          BOOKS IN THE SERIES
        </h2>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {displayBooks.map((book) => (
            <EbookSeriesCard
              key={book.id || book.title}
              title={book.title}
              subtitle={book.subtitle}
              coverImage={book.image}
              focusLabel={book.focusLabel}
              category={book.category}
              categoryColor={book.categoryColor}
              categoryBg={book.categoryBg}
              categoryText={book.categoryText}
              primaryButton={book.primaryButton}
              secondaryButton={book.secondaryButton}
              price={book.price}
              author={book.author}
              pages={book.pages}
              isPurchased={book.isPurchased}
              onAddToCart={book.onAddToCart}
              addingToCart={book.addingToCart}
            />
          ))}
        </div>

        {books.length === 0 && (
          <div className='text-center mt-8'>
            <p className='text-gray-600'>No ebooks found in this series.</p>
            <Link
              to='/'
              className='inline-block mt-4 px-6 py-2 bg-[#F6B72D] text-white rounded hover:bg-[#e6b82a]'
            >
              Browse All Ebooks
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
