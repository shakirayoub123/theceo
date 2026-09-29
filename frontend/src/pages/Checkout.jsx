import BillingDetailsForm from '@/components/BillingDetailsForm'
import Breadcrumb from '@/components/Breadcrumb'
import OrderSummary from '@/components/OrderSummary'
import StripeCheckoutWrapper from '@/components/StripeCheckoutWrapper'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)
  const [billingDetails, setBillingDetails] = useState(null)

  useEffect(() => {
    // Get cart items from localStorage
    const cartData = localStorage.getItem('cartItems')
    if (cartData) {
      try {
        const parsedCart = JSON.parse(cartData)
        setCartItems(parsedCart || [])

        // Calculate totals
        const itemsTotal =
          parsedCart?.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ) || 0
        setSubtotal(itemsTotal)
        setTotal(itemsTotal) // For now, no additional fees
      } catch (error) {
        console.error('Error parsing cart data:', error)
        setCartItems([])
        setSubtotal(0)
        setTotal(0)
      }
    }
  }, [])

  const handlePaymentSuccess = (paymentIntentId) => {
    console.log('Payment successful:', paymentIntentId)
    toast.success('Order placed successfully!')

    // Clear cart
    localStorage.removeItem('cartItems')

    // Redirect to order confirmation
    setTimeout(() => {
      navigate('/order-success', {
        state: { paymentIntentId },
      })
    }, 2000)
  }

  const handleBillingDetailsSubmit = (details) => {
    // Store billing details for payment processing
    setBillingDetails(details)
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Cart', href: '/cart' },
    { label: 'Checkout' },
  ]

  const orderItems = cartItems.map((item) => ({
    name: item.title || item.name,
    quantity: item.quantity || 1,
    price: item.price,
  }))

  // Transform items for Stripe payment (backend expects 'name' field)
  const stripeItems = cartItems.map((item) => ({
    id: item.id,
    name: item.title || item.name,
    price: parseFloat(item.price),
    quantity: item.quantity || 1,
  }))

  return (
    <div className='min-h-screen bg-white'>
      <Breadcrumb items={breadcrumbItems} />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16'>
        <div className='grid lg:grid-cols-2 gap-12'>
          {/* Left Column - Billing Details */}
          <div>
            <BillingDetailsForm
              cartItems={cartItems}
              total={total}
              onSubmitDetails={handleBillingDetailsSubmit}
            />
          </div>

          {/* Right Column - Order Summary and Payment */}
          <div className='space-y-6 font-jakarta normal-case'>
            <OrderSummary
              items={orderItems}
              subtotal={subtotal}
              total={total}
            />

            {/* Stripe Payment Form */}
            <div className='bg-[#FFFFFF] p-8 rounded-[14px] border border-[#CACACA] shadow-sm'>
              <StripeCheckoutWrapper
                total={total}
                items={stripeItems}
                billingDetails={billingDetails}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
