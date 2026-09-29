export default function AboutContent({ content }) {
  return (
    <div>
      <div className='prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed font-exo text-gray-700'>
        {content.map((paragraph, index) => {
          if (index === content.length - 1) {
            return (
              <div
                key={index}
                className='mt-10 p-6 md:p-8 rounded-[10px] border border-[#F6B72D] text-center mx-auto max-w-[978px]'
                style={{ backgroundColor: 'rgba(255, 251, 235, 0.7)' }}
              >
                <p className='text-gray-900 font-semibold italic m-0' dangerouslySetInnerHTML={{ __html: paragraph.replace(/("The power of one can and will positively change the world forever".)/, '<strong>$1</strong>') }}></p>
              </div>
            )
          }
          return <p key={index}>{paragraph}</p>
        })}
      </div>
    </div>
  )
}
