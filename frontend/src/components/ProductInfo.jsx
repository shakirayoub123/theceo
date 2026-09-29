import { Facebook, Linkedin, Twitter, Heart, Shuffle, Star, Minus, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function ProductInfo({
  name,
  price,
  description,
  sku,
  category,
  tags,
  author,
  pages,
  isPurchased,
  onAddToCart,
  addingToCart,
}) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className='w-full rounded-[14px] bg-[#FFFFFF] border border-[#CACACA] p-6 lg:p-10 font-jakarta flex flex-col'>
      {/* Product Name */}
      <h1 className='text-[28px] lg:text-[34px] font-bold text-[#000000] leading-tight mb-3'>
        {name}
      </h1>

      {/* Reviews */}
      <div className='flex items-center gap-2 mb-6'>
        <div className='flex gap-1 text-[#F6B72D]'>
          <Star className='w-4 h-4 fill-current' />
          <Star className='w-4 h-4 fill-current' />
          <Star className='w-4 h-4 fill-current' />
          <Star className='w-4 h-4 fill-current' />
          <Star className='w-4 h-4 fill-current opacity-40' />
        </div>
        <span className='text-[12px] font-medium text-[#797979]'>
          (1 Customer Reviews)
        </span>
      </div>

      {/* Description */}
      <div className='space-y-4 mb-6 font-medium'>
        {description.map((paragraph, index) => (
          <p key={index} className='text-[13px] lg:text-[14px] text-[#475569] leading-relaxed'>
            {paragraph}
          </p>
        ))}
      </div>

      {/* Price */}
      <div className='text-[34px] font-bold text-[#F6B72D] mb-6'>
        {price}
      </div>

      {/* Action Buttons */}
      <div className='flex flex-wrap items-center gap-4 mb-10'>
        {/* Quantity (Mocked frontend state) */}
        <div className='flex items-center justify-between min-w-[100px] h-10 px-4 border border-[#CACACA] rounded-full text-black font-semibold text-sm bg-white'>
          <button className='hover:text-[#F6B72D]' onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className='w-3 h-3' /></button>
          <span>{quantity}</span>
          <button className='hover:text-[#F6B72D]' onClick={() => setQuantity(quantity + 1)}><Plus className='w-3 h-3' /></button>
        </div>

        {/* Add to Cart Button */}
        {isPurchased ? (
          <div className='bg-green-100 border border-green-400 text-green-700 px-6 py-2 rounded-full text-sm font-bold'>
            Purchased
          </div>
        ) : onAddToCart ? (
          <Button
            onClick={onAddToCart}
            disabled={addingToCart}
            className='h-10 bg-[#F6B72D] hover:bg-[#e6b82a] text-white px-8 rounded-full text-[14px] font-bold tracking-wide disabled:opacity-50'
          >
            {addingToCart ? 'ADDING...' : 'Add To Cart'}
          </Button>
        ) : (
          <Link to='/cart'>
            <Button className='h-10 bg-[#F6B72D] hover:bg-[#e6b82a] text-white px-8 rounded-full text-[14px] font-bold tracking-wide'>
              Add To Cart
            </Button>
          </Link>
        )}

        {/* Action Icons */}
        <button className='w-10 h-10 rounded-full bg-[#F6B72D] flex items-center justify-center hover:bg-[#e6b82a] transition'>
          <Heart className='w-4 h-4 text-white fill-current' />
        </button>
        <button className='w-10 h-10 rounded-full bg-white border border-[#CACACA] flex items-center justify-center hover:bg-gray-50 transition'>
          <Shuffle className='w-4 h-4 text-[#797979]' />
        </button>
      </div>

      {/* Product Details Table / Meta */}
      <div className='mt-auto pt-6 border border-[#E5E5E5] bg-[#FCFCFC] rounded-[8px] p-6 lg:p-8 flex flex-col md:flex-row gap-6 justify-between text-[13px]'>
        <div className='space-y-4 flex-1'>
          <div className='flex items-center'>
            <span className='font-bold text-black min-w-[80px]'>SKU:</span>
            <span className='text-[#797979] uppercase truncate max-w-[150px]'>{sku || 'N/A'}</span>
          </div>
          <div className='flex items-center'>
            <span className='font-bold text-black min-w-[80px]'>Category:</span>
            <span className='text-[#797979] capitalize'>{category || 'N/A'}</span>
          </div>
        </div>

        <div className='space-y-4 flex-1 md:pl-6'>
          <div className='flex items-center'>
            <span className='font-bold text-black min-w-[60px]'>Tags:</span>
            <span className='text-[#797979] line-clamp-1'>{tags.length ? tags.join(', ') : 'N/A'}</span>
          </div>
          <div className='flex items-center'>
            <span className='font-bold text-black min-w-[60px]'>Share:</span>
            <div className='flex items-center gap-2'>
              <a href='#' className='w-7 h-7 rounded-full bg-[#3b5998] flex items-center justify-center hover:opacity-80 transition'><Facebook className='w-3 h-3 text-white fill-current' /></a>
              <a href='#' className='w-7 h-7 rounded-full bg-[#1da1f2] flex items-center justify-center hover:opacity-80 transition'><Twitter className='w-3 h-3 text-white fill-current' /></a>
              <a href='#' className='w-7 h-7 rounded-full bg-[#0077b5] flex items-center justify-center hover:opacity-80 transition'><Linkedin className='w-3 h-3 text-white fill-current' /></a>
              <a href='#' className='w-7 h-7 rounded-full bg-[#bd081c] flex items-center justify-center hover:opacity-80 transition'>
                <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-4.409 5.25z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
