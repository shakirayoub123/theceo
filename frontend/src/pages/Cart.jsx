import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import CartTable from '@/components/CartTable'
import CartTotals from '@/components/CartTotals'
import Breadcrumb from '@/components/Breadcrumb'

export default function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Get cart items from localStorage
  const getCartItems = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cartItems') || '[]')
      return cart
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error)
      return []
    }
  }

  // Update cart in localStorage
  const updateCartInStorage = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items))
    setCartItems(items)
    // Dispatch custom event to notify header of cart changes
    window.dispatchEvent(new Event('cartUpdated'))
  }

  useEffect(() => {
    const items = getCartItems()
    setCartItems(items)
    setLoading(false)
  }, [])

  const handleRemoveFromCart = (ebookId) => {
    const updatedItems = cartItems.filter((item) => item.id !== ebookId)
    updateCartInStorage(updatedItems)
  }

  const handleUpdateQuantity = (ebookId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(ebookId)
      return
    }

    const updatedItems = cartItems.map((item) =>
      item.id === ebookId ? { ...item, quantity: quantity } : item,
    )
    updateCartInStorage(updatedItems)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Cart' }]

  // Transform localStorage data to component format
  const cartProducts = cartItems.map((item) => ({
    id: item.id,
    name: item.title,
    price: parseFloat(item.price),
    image: item.coverImage || '/images/ebook-red.svg',
    author: item.author,
    topic: item.topic,
    quantity: item.quantity || 1,
    addedAt: item.addedAt,
  }))

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const total = subtotal // Add tax/shipping calculations if needed

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Shopping Cart - The CEO Influencers</title>
        <meta
          name='description'
          content='Review and manage items in your shopping cart. Purchase ebooks and resources from The CEO Influencers.'
        />
        <meta
          name='keywords'
          content='shopping cart, ebooks, purchase, CEO resources'
        />
        <meta
          property='og:title'
          content='Shopping Cart - The CEO Influencers'
        />
        <meta
          property='og:description'
          content='Complete your purchase of leadership ebooks and resources.'
        />
        <meta property='og:url' content='https://theceoinfluencers.com/cart' />
        <link rel='canonical' href='https://theceoinfluencers.com/cart' />
      </Helmet>
      <Breadcrumb items={breadcrumbItems} />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16'>
        {cartProducts.length === 0 ? (
          <div className='text-center py-14 sm:py-16 px-4'>
            <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
              Your cart is empty
            </h2>
            <p className='text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto'>
              Add some ebooks to get started!
            </p>
            <button
              onClick={() => navigate('/#products-section')}
              className='w-full sm:w-auto px-6 py-3 bg-[#F6B72D] text-white rounded-lg hover:bg-[#e6b82a] font-semibold'
            >
              Browse Ebooks
            </button>
          </div>
        ) : (
          <div className='grid gap-6 lg:grid-cols-3 lg:gap-8'>
            {/* Cart Items */}
            <div className='lg:col-span-2'>
              <CartTable
                products={cartProducts}
                onRemove={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            </div>

            {/* Cart Totals */}
            <div className='lg:col-span-1'>
              <CartTotals subtotal={subtotal} total={total} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
