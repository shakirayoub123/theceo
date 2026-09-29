import { Trash2, Minus, Plus } from 'lucide-react'

export default function CartItem({
  id,
  name,
  price,
  image,
  quantity = 1,
  onRemove,
  onQuantityChange,
}) {
  return (
    <div className='py-6 border-b border-[#CACACA] last:border-b-0'>
      <div className='flex items-start gap-4 sm:items-center'>
        {/* Product Image */}
        <div className='w-20 h-28 sm:w-20 sm:h-28 border border-[#CACACA] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#F8F8F8] p-2'>
          <img
            src={image || '/placeholder.svg'}
            alt={name}
            className='w-full h-full object-contain'
          />
        </div>

        <div className='min-w-0 flex-1 ml-4'>
          <div className='flex items-start justify-between gap-3'>
            <h3 className='text-base sm:text-[17px] font-bold text-black leading-snug font-jakarta'>
              {name}
            </h3>

            <button
              onClick={() => onRemove(id)}
              className='text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2 -mt-2 sm:mr-0 sm:mt-0'
              aria-label='Remove item'
            >
              <Trash2 className='h-5 w-5' />
            </button>
          </div>

          <div className='mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between'>
            {/* Quantity Controls */}
            <div className='flex items-center justify-between sm:justify-start'>
              <span className='text-xs font-semibold uppercase tracking-wider text-gray-500 sm:hidden'>
                Quantity
              </span>
              <div className='flex items-center justify-between min-w-[100px] h-9 px-3 border border-[#CACACA] rounded-full text-black font-semibold text-sm bg-white'>
                <button
                  onClick={() =>
                    onQuantityChange?.(id, Math.max(1, quantity - 1))
                  }
                  className='hover:text-[#F6B72D] flex items-center justify-center p-1'
                  aria-label='Decrease quantity'
                >
                  <Minus className='h-3 w-3' />
                </button>
                <span className='w-6 text-center font-bold'>{quantity}</span>
                <button
                  onClick={() => onQuantityChange?.(id, quantity + 1)}
                  className='hover:text-[#F6B72D] flex items-center justify-center p-1'
                  aria-label='Increase quantity'
                >
                  <Plus className='h-3 w-3' />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className='flex items-center justify-between sm:block w-[100px] text-right'>
              <span className='text-xs font-semibold uppercase tracking-wider text-gray-500 sm:hidden'>
                Total
              </span>
              <div className='text-base sm:text-[18px] font-bold text-black font-jakarta'>
                ${(price * quantity).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
