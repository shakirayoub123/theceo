import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function CourseHero({ title, backgroundImage }) {
  return (
    <div
      className='relative h-[550px] bg-cover bg-center flex items-center justify-center'
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className='absolute inset-0 bg-black bg-opacity-60'></div>
      <div className='z-10 flex flex-col items-center gap-10 text-white max-w-4xl px-4'>
        <h1 className='text-4xl lg:text-5xl tracking-wide text-center'>
          <span className='text-[#F6B72D]'>12-WEEK</span> {title}
        </h1>
        <Link to='/contact'>
          <Button className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black  px-10 py-3 rounded-md text-lg mt-10'>
            BOOK A DISCOVERY CALL
          </Button>
        </Link>
      </div>
    </div>
  )
}
