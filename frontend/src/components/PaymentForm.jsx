import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import authService from '@/services/authService'
import stripeService from '@/services/stripeService'
import toast from 'react-hot-toast'

export default function PaymentForm({
  total,
  items,
  billingDetails,
  onSuccess,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate total
    if (!total || total <= 0) {
      setError('Invalid cart total')
      toast.error('Your cart is empty')
      return
    }

    // Validate billing details
    if (!billingDetails) {
      setError('Missing billing details')
      toast.error('Please fill in billing details first')
      return
    }

    if (!stripe || !elements) {
      setError('Stripe is not loaded')
      toast.error('Payment system not ready. Please refresh the page.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Create payment intent on backend
      const paymentMetadata = {
        customer_name: billingDetails.customerName,
        customer_email: billingDetails.customerEmail,
        customer_phone: billingDetails.customerPhone,
      }

      if (billingDetails.country) {
        paymentMetadata.country = billingDetails.country
      }

      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        paymentMetadata.user_id = storedUserId
      }

      const paymentIntentData = await stripeService.createPaymentIntent(
        total,
        items,
        paymentMetadata,
      )

      if (!paymentIntentData || !paymentIntentData.client_secret) {
        throw new Error('Failed to create payment intent')
      }

      const { client_secret } = paymentIntentData

      // Step 2: Confirm card payment
      const cardElement = elements.getElement(CardElement)
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: billingDetails.customerName,
              email: billingDetails.customerEmail,
              phone: billingDetails.customerPhone,
            },
          },
        })

      if (confirmError) {
        setError(confirmError.message)
        toast.error(`Payment failed: ${confirmError.message}`)
      } else if (
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing'
      ) {
        // Step 3: Create order after successful payment with billing details
        try {
          await authService.checkout({
            stripe_payment_intent_id: paymentIntent.id,
            customerName: billingDetails.customerName,
            customerEmail: billingDetails.customerEmail,
            ebooks: billingDetails.ebooks,
          })

          toast.success('Payment successful! Order created.')
          onSuccess && onSuccess(paymentIntent.id)
        } catch (checkoutError) {
          console.error('Checkout error:', checkoutError)
          toast.error('Payment succeeded but order creation failed')
        }
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message)
      toast.error(`Payment error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    hidePostalCode: true,
    style: {
      base: {
        fontSize: '16px',
        color: '#424242',
        fontFamily: '"Exo 2", sans-serif',
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  }

  return (
    <div>
      <h2 className='text-xl text-black mb-6'>PAYMENT</h2>

      <form onSubmit={handleSubmit} className='space-y-6 font-exo'>
        <div className='border border-gray-300 rounded-lg p-4 bg-white'>
          <label className='block text-sm font-medium text-black mb-3'>
            Card Details
          </label>
          <CardElement options={cardElementOptions} />
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}

        <div className='text-sm text-gray-600'>
          <p>Your payment is secure and encrypted.</p>
          <p>Please check your junk mail folder if you do not see your receipt.</p>
        </div>

        <Button
          type='submit'
          disabled={!stripe || loading}
          className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black py-3 px-10 rounded-full text-sm font-medium transition-all duration-200'
        >
          {loading ? (
            <span className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-black'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            `CHECKOUT $${total.toFixed(2)}`
          )}
        </Button>

        <p className='text-xs text-gray-500 text-center'>
          By clicking checkout, you agree to our Terms of Service
        </p>
      </form>
    </div>
  )
}
