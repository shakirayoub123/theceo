export default function OrderSummary({ items, subtotal, total }) {
  return (
    <div className='bg-[#FCFCFC] border border-[#CACACA] rounded-[14px] p-8 font-jakarta shadow-sm normal-case'>
      <h2 className='text-[18px] font-bold text-[#000000] mb-6 border-b border-[#CACACA] pb-4'>
        Order Summary
      </h2>

      <div className='space-y-4 pb-2'>
        {items.map((item, index) => (
          <div key={index} className='flex justify-between items-center py-2'>
            <span className='font-medium text-[15px]'>
              <span className='text-[#475569]'>{item.name} </span>
              <span className='font-bold ml-1 text-black'>× {item.quantity}</span>
            </span>
            <span className='text-black font-bold text-[15px]'>${parseFloat(item.price).toFixed(2)}</span>
          </div>
        ))}

        <div className='flex justify-between items-center py-2 border-t border-[#CACACA] mt-6 pt-6'>
          <span className='text-black font-bold text-[15px]'>Subtotal</span>
          <span className='text-black font-bold text-[15px]'>${parseFloat(subtotal).toFixed(2)}</span>
        </div>
        <div className='flex justify-between items-center py-2'>
          <span className='text-black font-bold text-[16px]'>Total</span>
          <span className='text-[#F6B72D] font-bold text-2xl'>${parseFloat(total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
