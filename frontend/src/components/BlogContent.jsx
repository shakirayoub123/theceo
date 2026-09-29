export default function BlogContent({ content, inlineImage }) {
  const normalizedContent = (content || '').replace(
    /https?:\/\/(?:www\.)?mckinsey\.com\/[^"'\s<)]*2020[^"'\s<)]*/gi,
    'https://www.mckinsey.com/featured-insights/',
  )

  return (
    <div className='bg-white w-full py-16 md:py-24 font-jakarta'>
      <div className='max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8'>
        {inlineImage && (
          <div className='mb-16 border-4 border-[#F6B72D] rounded-[20px] overflow-hidden shadow-xl aspect-video'>
            <img
              src={inlineImage || '/placeholder.svg'}
              alt='Article Image'
              className='w-full h-full object-cover object-center'
            />
          </div>
        )}
        <div className='bg-[#FCFCF9] border border-[#F6E5B8] rounded-[20px] p-8 md:p-12 shadow-sm'>
          <div
            className='prose prose-lg max-w-none text-gray-600 font-normal leading-[1.8] marker:text-[#F6B72D]
            [&_*]:!text-left
            [&_p]:text-[16px] md:[&_p]:text-[17px] [&_p]:leading-[30px] [&_p]:mb-6
            [&_li]:text-[16px] md:[&_li]:text-[17px] [&_li]:leading-[28px] [&_li]:mb-3
            [&_h1]:text-[32px] md:[&_h1]:text-[40px] [&_h1]:font-bold [&_h1]:text-[#0B132B] [&_h1]:mb-6 [&_h1]:mt-10
            [&_h2]:text-[28px] md:[&_h2]:text-[32px] [&_h2]:font-bold [&_h2]:text-[#0B132B] [&_h2]:mb-5 [&_h2]:mt-8
            [&_h3]:text-[24px] md:[&_h3]:text-[26px] [&_h3]:font-bold [&_h3]:text-[#0B132B] [&_h3]:mb-4 [&_h3]:mt-6
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-8
            [&_a]:text-[#D99A1A] [&_a]:underline'
            dangerouslySetInnerHTML={{ __html: normalizedContent }}
          />
        </div>

        {/* Ready to Begin CTA Section matching Service Details */}
        <div className='w-full rounded-[24px] bg-[#000023] overflow-hidden p-8 md:p-12 mt-12 flex flex-col md:flex-row items-center justify-between shadow-2xl relative'>
          {/* Subtle background decoration */}
          <div
            className='absolute inset-0 z-0 opacity-20 pointer-events-none'
            style={{
              backgroundImage: `url('/images/body-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className='max-w-2xl mb-6 md:mb-0 relative z-10'>
            <h3 className='text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight font-jakarta'>ELEVATE YOUR LEADERSHIP IMPACT</h3>
            <p className='text-gray-300 text-[15px] md:text-[16px] leading-relaxed font-exo'>
              Transform these insights into tangible outcomes. Connect with world-class executive influencers and build a tailored roadmap for your business.
            </p>
          </div>
          <a
            href="/#connect-section"
            className='relative z-10 bg-[#F6B72D] hover:bg-[#e6b82a] text-[#000023] font-bold h-14 px-8 rounded-xl shadow-lg border-b-4 border-[#D99A1A] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 group whitespace-nowrap'
          >
            CONNECT NOW
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
