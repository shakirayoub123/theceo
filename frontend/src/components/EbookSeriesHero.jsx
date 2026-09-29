import { Button } from '@/components/ui/button'

export default function EbookSeriesHero() {
  return (
    <div className='relative h-[550px] bg-cover bg-center flex items-center justify-center'>
      {/* Background Image */}
      <div
        className='absolute inset-0 bg-cover bg-center'
        style={{
          backgroundImage: `url('/images/hero2.svg')`,
        }}
      >
        <div className='absolute inset-0 bg-black bg-opacity-50'></div>
      </div>

      {/* Content */}
      <div className=' z-10 flex flex-col items-center gap-10'>
        <h1 className='text-4xl lg:text-5xl tracking-wide text-center'>
          <span className='text-[#F6B72D]'>12-BUILDING</span>{' '}
          <span className='text-white'>BETTER</span>
          <br />
          <span className='text-white'>LEADERS</span>
        </h1>

        <Button className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black  px-10 py-3 rounded-md text-lg mt-10'>
          BUY BUNDLE
        </Button>
      </div>
    </div>
  )
}
