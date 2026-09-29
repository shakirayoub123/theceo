import { Button } from './ui/button'
import { Link } from 'react-router-dom'

export default function CartTotals({ subtotal, total }) {
  return (
    <div className='rounded-[14px] border border-[#CACACA] bg-[#FCFCFC] p-6 lg:p-8 lg:sticky lg:top-24 shadow-sm font-jakarta'>
      <h2 className='text-[18px] font-bold mb-8 text-[#000000] border-b border-[#CACACA] pb-4'>
        Order Summary
      </h2>

      <div className='space-y-5 mb-8'>
        {/* Subtotal */}
        <div className='flex justify-between items-center py-1 gap-4 font-medium'>
          <span className='text-[#475569] text-[15px]'>Subtotal</span>
          <span className='text-[#000000] text-[15px] font-bold'>${subtotal.toFixed(2)}</span>
        </div>

        {/* Total */}
        <div className='flex justify-between items-center py-1 gap-4 border-t border-[#CACACA] pt-5'>
          <span className='text-[#000000] font-bold text-[16px]'>Total</span>
          <span className='text-[#F6B72D] font-bold text-2xl'>
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className='flex justify-center'>
        <Link to='/checkout' className='w-full'>
          <Button className='w-full h-11 bg-[#F6B72D] hover:bg-[#e6b82a] text-white font-bold px-8 rounded-full text-[14px] tracking-wide'>
            Proceed To Checkout
          </Button>
        </Link>
      </div>
    </div>
  )
}
