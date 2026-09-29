import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from './PaymentForm'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

export default function StripeCheckoutWrapper({
  total,
  items,
  billingDetails,
  onSuccess,
}) {
  // Check if total is valid before rendering
  if (!total || total <= 0) {
    return (
      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800'>
        <p>Your cart is empty. Please add items to checkout.</p>
      </div>
    )
  }

  if (!billingDetails) {
    return (
      <div className='p-6 bg-[#FFFFFF] border-2 border-dashed border-[#CACACA] rounded-[8px] text-[#000000] flex items-center justify-center text-center'>
        <p className='font-jakarta font-medium text-[15px] text-[#797979]'>
          Please complete and save your billing details first to proceed with payment.
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        total={total}
        items={items}
        billingDetails={billingDetails}
        onSuccess={onSuccess}
      />
    </Elements>
  )
}
