import { Outlet } from 'react-router-dom'
import signInBg from '@/assets/Sign in.png'

export function AuthLayout() {
  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-[#FFFFFF] font-jakarta'>
      {/* Left Form Side */}
      <div className='w-full lg:w-1/2 flex flex-col px-6 py-12 sm:px-12 lg:px-24 xl:px-32 justify-center relative shadow-[8px_0_24px_rgba(0,0,0,0.02)] z-10'>
        {/* Form injected via Outlet */}
        <div className='w-full max-w-[440px] mx-auto'>
          <div className='lg:hidden mb-12 text-center'>
            <img src='/images/fullLogo.svg' alt='Logo' className='h-12 mx-auto grayscale opacity-80' />
          </div>

          <Outlet />
        </div>
      </div>

      {/* Right Graphic Side */}
      <div
        className='hidden lg:flex w-full lg:w-1/2 relative flex-col justify-between p-12 lg:p-16 text-white'
        style={{
          backgroundImage: `url("${signInBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className='w-full flex justify-end'>
          <img src='/images/fullLogo.svg' alt='Logo' className='h-12 w-auto brightness-0 invert' />
        </div>

        <div className='mt-auto pb-12 pr-12 max-w-[600px]'>
          <div className='inline-flex flex-row items-center gap-1.5 bg-white/20 backdrop-blur-[2px] rounded-full px-5 py-2 mb-6 border border-white/40'>
            <span className='w-1.5 h-1.5 bg-white rounded-full'></span>
            <span className='text-[10px] font-bold uppercase tracking-widest text-white'>EXECUTIVE PLATFORM</span>
          </div>

          <h1 className='text-[42px] lg:text-[52px] font-bold mb-8 leading-[1.15] text-white tracking-tight'>
            IMPROVE YOUR SKILL<br />WITH US!
          </h1>

          <div className='w-20 h-px bg-white/80 mb-6'></div>

          <p className='text-[15px] lg:text-[16px] leading-[1.7] text-white/90 font-medium'>
            Embark on a journey of continuous learning and professional growth.<br className='hidden xl:block' />
            Our platform empowers you to acquire new skills, connect with<br className='hidden xl:block' />
            industry experts, and achieve your career goals.
          </p>
        </div>
      </div>
    </div>
  )
}
