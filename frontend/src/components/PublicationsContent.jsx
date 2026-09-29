import { BookOpen } from 'lucide-react'

export default function PublicationsContent({ publications }) {
  if (!publications || publications.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-[12px] border border-dashed border-gray-200 mt-4'>
        <p className='text-gray-500 font-medium font-exo'>Publications content will be displayed here.</p>
      </div>
    )
  }

  return (
    <div className='w-full'>
      <div className='space-y-5 mt-2'>
        {publications.map((publication, index) => (
          <div
            key={index}
            className='group bg-white border border-gray-200 p-6 md:p-8 rounded-[12px] shadow-sm hover:shadow-md hover:border-[#F6B72D] transition-all duration-300 relative overflow-hidden font-exo'
          >
            {/* Subtle left border accent on hover */}
            <div className='absolute left-0 top-0 bottom-0 w-[4px] bg-[#F6B72D] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300'></div>

            <div className='flex flex-col md:flex-row md:items-start gap-5'>
              <div className='hidden md:flex bg-[#FFFBF0] p-3 rounded-[8px] flex-shrink-0 border border-[#F6B72D]/20 mt-1'>
                <BookOpen className='h-5 w-5 text-[#F6B72D]' />
              </div>

              <div className='flex-1'>
                <div className='flex flex-wrap items-center gap-3 mb-3'>
                  <span className='bg-[#000023] text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-[4px]'>
                    {publication.year}
                  </span>
                  {publication.journal && (
                    <span className='bg-[#F6B72D]/10 text-[#000023] border border-[#F6B72D]/30 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-[4px]'>
                      {publication.journal}
                    </span>
                  )}
                </div>

                <h4 className='font-bold text-[#000023] text-lg md:text-[19px] leading-snug mb-3 group-hover:text-[#F6B72D] transition-colors'>
                  {publication.description.charAt(0).toUpperCase() + publication.description.slice(1)}
                </h4>

                <div className='w-10 h-[2px] bg-gray-200 mb-4 group-hover:bg-[#F6B72D] transition-colors duration-300'></div>

                <p className='text-[#4B5563] text-[14px] leading-relaxed italic'>
                  {publication.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
