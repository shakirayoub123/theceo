import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

class StripeService {
  // Initialize a payment intent on the backend
  async createPaymentIntent(amount, items, metadata = {}) {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api'}/lms/people/create-payment-intent/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount, // Send amount in dollars, backend will convert to cents
            items: items,
            metadata: metadata,
          }),
        },
      )

      if (!response.ok) {
        let errorMessage = 'Failed to create payment intent'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      console.error('createPaymentIntent error:', error)
      throw error
    }
  }

  // Confirm card payment
  async confirmCardPayment(clientSecret, cardElement) {
    const stripe = await stripePromise
    return stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })
  }

  // Get Stripe instance
  async getStripe() {
    return stripePromise
  }

  // Handle 3D Secure or additional authentication
  async handleCardAction(clientSecret) {
    const stripe = await stripePromise
    return stripe.handleCardAction(clientSecret)
  }
}

export default new StripeService()
