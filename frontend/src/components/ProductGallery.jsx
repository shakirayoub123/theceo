export default function ProductGallery({ images, productName }) {
  return (
    <div className='w-full h-full flex'>
      {/* Main Image Container */}
      <div className='w-full rounded-[14px] bg-[#F8F8F8] border border-[#CACACA] p-6 lg:p-12 flex items-center justify-center'>
        <img
          src={images[0] || '/placeholder.svg'}
          alt={productName}
          className='max-w-full max-h-[500px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500'
        />
      </div>
    </div>
  )
}
