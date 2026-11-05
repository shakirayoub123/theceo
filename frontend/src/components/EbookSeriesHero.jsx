import { Button } from '@/components/ui/button'

export default function EbookSeriesHero({ seriesData }) {
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
      <div className='relative z-10 flex flex-col items-center gap-8 px-4 max-w-4xl'>
        <div className='w-full rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm p-6 md:p-8 text-center'>
          <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide text-white leading-tight'>
            {seriesData?.title || '12-BUILDING BETTER LEADERS'}
          </h1>
          {seriesData?.description && (
            <p className='max-w-3xl mx-auto mt-4 text-sm md:text-base leading-7 text-white/90'>
              {seriesData.description}
            </p>
          )}
        </div>

        <Button className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black px-10 py-3 rounded-md text-lg'>
          BUY BUNDLE
        </Button>
      </div>
    </div>
  )
}
