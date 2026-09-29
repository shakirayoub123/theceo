export default function CourseOverview({
  description,
  length,
  modules,
  advisors,
}) {
  return (
    <div className=' py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <p className='text-[#656766] text-center mb-12 max-w-4xl mx-auto text-xl leading-relaxed font-exo'>
          {description}
        </p>

        <div className='grid md:grid-cols-3 gap-8 text-center'>
          {/* Length */}
          <div className='relative'>
            <h3 className='text-2xl text-black mb-4'>LENGTH</h3>
            <p className='text-xl text-[#656766] font-exo'>{length}</p>
            {/* Separator */}
            <div className='hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gray-300'></div>
          </div>

          {/* Modules */}
          <div className='relative'>
            <h3 className='text-2xl text-black mb-4'>MODULES</h3>
            <p className='text-xl text-[#656766] font-exo'>{modules}</p>
            {/* Separator */}
            <div className='hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gray-300'></div>
          </div>

          {/* Advisors */}
          <div>
            <h3 className='text-2xl text-black mb-4'>ADVISORS</h3>
            <div className='flex justify-center gap-4'>
              {advisors.map((advisor, index) => (
                <div key={index} className='text-center'>
                  <img
                    src={advisor.image || '/placeholder.svg'}
                    alt={advisor.name}
                    className='w-16 h-16 rounded-full mx-auto mb-2 object-cover'
                  />
                  <p className='text-xl text-[#656766] font-exo'>
                    {advisor.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
