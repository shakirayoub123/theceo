import { getAssetUrl } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function EbookSeriesCard(ebook) {
  return (
    <div className='bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-[#F6B72D] cursor-pointer block'>
      {/* Focus Label */}
      <div className='text-center py-2 bg-[#36454F]'>
        <span className='font-bold text-sm tracking-wide text-white'>
          {ebook.focusLabel}
        </span>
      </div>
      <hr className='h-px border-white' />
      <div className='bg-[#36454F] text-center py-2'>
        <span className='font-bold text-sm tracking-wide text-white'>
          {ebook.category}
        </span>
      </div>
      <hr className={`h-px bg-[#F6B72D] border-0`} />

      <div className='p-4 text-center'>
        <h3 className='text-sm font-bold text-black leading-tight tracking-wide'>
          {ebook.title}
        </h3>
        {ebook.price && (
          <p className='text-lg font-bold text-[#F6B72D] mt-2'>{ebook.price}</p>
        )}
      </div>
      <hr className='h-px bg-[#D4D4D4] border-0' />
      <div className='p-4 text-center'>
        {/* Subtitle */}
        <p className='text-xs text-gray-600 leading-relaxed'>
          {ebook.subtitle}
        </p>
        {ebook.author && (
          <p className='text-xs text-gray-500 mt-2'>By {ebook.author}</p>
        )}
        {ebook.pages && (
          <p className='text-xs text-gray-500'>{ebook.pages} pages</p>
        )}
      </div>
      <hr className='h-px bg-[#D4D4D4] border-0' />

      {/* Content */}
      <div className='p-6'>
        {/* eBook Cover */}
        <div className='relative h-64 mb-6 overflow-hidden rounded-lg'>
          <img
            src={getAssetUrl(ebook.coverImage) || '/placeholder.svg'}
            alt={ebook.title}
            className='w-full h-full object-contain hover:scale-105 transition-transform duration-500'
          />
        </div>

        <div className='mt-auto flex flex-col w-full space-y-4'>
          <Link
            to={`/ebook-detail/${ebook.id || 'sample-ebook'}`}
            className='w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 text-center block'
          >
            {ebook.secondaryButton}
          </Link>
        </div>
      </div>
    </div>
  )
}
