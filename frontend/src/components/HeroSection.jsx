import { Instagram, Linkedin, Play, X, Facebook, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import AppointmentModal from './AppointmentModal'
import heroBg from '@/assets/hero.png'

export default function HeroSection({ tickerItems = [] }) {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const fallbackTicker = ['Microsoft', 'IBM', 'Apple', 'Google', 'U.S./UK Government Agencies', 'U.S. Congress', 'Northrop Grumman', 'ExxonMobil', 'JPMorgan Chase & Co.']
  const focusItems = tickerItems.length > 0 ? tickerItems : fallbackTicker

  return (
    <section className='relative w-full pt-[40px] md:pt-[60px] pb-8 bg-white'>
      <div className='container mx-auto px-4 md:px-6'>
        {/* Floating rounded hero display */}
        <div className='relative flex flex-col items-center justify-center h-auto min-h-[500px] md:min-h-[600px] pb-16 pt-16 border border-gray-300 rounded-[16px] md:rounded-[20px] mx-auto md:mx-4 lg:mx-8 shadow-2xl'>

          {/* Background Layer properly layered with z-0 instead of -z-10 to avoid clipping under the body */}
          <div className='absolute inset-0 rounded-[16px] md:rounded-[20px] overflow-hidden bg-[#000023] z-0'>
            <img
              src={heroBg}
              alt='Hero background'
              className='w-full h-full object-cover object-center opacity-100'
            />
          </div>

          {/* Hero Content */}
          <div className='relative z-10 flex flex-col items-center text-center px-8 md:px-16 w-full max-w-[1000px]'>

            {/* Pill Tag */}
            <div className='border border-white/40 rounded-full px-5 py-1 mb-8 inline-block backdrop-blur-sm bg-white/5'>
              <span className='font-jakarta text-[14px] font-medium leading-[15.9px] tracking-normal text-white uppercase'>
                Strategic Transformation • Enterprise Vitality
              </span>
            </div>

            {/* Typography Title */}
            <h1 className='font-caslon text-[40px] lg:text-[72px] leading-[1.1] lg:leading-[77px] tracking-[-1px] lg:tracking-[-1.8px] text-white mb-6 font-normal'>
              Positively <span className='text-[#F6B72D] italic underline decoration-double decoration-2 underline-offset-[6px] decoration-[#F6B72D]'>Redefining</span><br />
              21st Century Leadership.
            </h1>

            {/* Subtitle */}
            <p className='font-jakarta text-[16px] leading-[26px] tracking-normal text-gray-100 max-w-[850px] mb-12 font-normal'>
              The CEO Influencers is a next-generation executive leadership and organizational performance optimization coaching consultancy that empowers leaders from start-ups to multinational corporations to maximize success in the 21st-century global business marketplace.
            </p>

            {/* Buttons Row */}
            <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full'>
              <button
                onClick={() => setIsVideoOpen(true)}
                className='bg-white hover:bg-gray-100 text-[#161616] rounded-full pl-1.5 pr-6 h-[48px] flex items-center gap-4 transition-all duration-300 font-jakarta font-semibold text-sm w-full sm:w-auto shadow-xl group'
              >
                <div className='bg-[#F6B72D] h-9 w-9 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
                  <ArrowRight className='h-4 w-4 text-white' />
                </div>
                <span>View Introduction Video</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-white hover:bg-gray-100 text-[#161616] rounded-full pl-1.5 pr-6 h-[48px] flex items-center gap-4 transition-all duration-300 font-jakarta font-semibold text-sm w-full sm:w-auto shadow-xl group'
              >
                <div className='bg-[#F6B72D] h-9 w-9 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
                  <ArrowRight className='h-4 w-4 text-white' />
                </div>
                <span>Schedule A Discovery Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Ticker directly below — matched to reference: gold → dark navy, evenly spaced sparkle separators */}
      <div className='w-full overflow-hidden bg-gradient-to-r from-[#F6B72D] via-[#8a7440] to-[#1A2332] py-4 mt-8'>
        <div className='ticker-track'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-center whitespace-nowrap'>
              {focusItems.map((item, idx) => (
                <div key={idx} className='flex items-center gap-3 md:gap-4 pr-3 md:pr-4'>
                  <span className='text-white font-jakarta text-[17px] md:text-[19px] font-semibold tracking-wide'>
                    {item}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className='shrink-0'>
                    <path d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z" />
                  </svg>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Local styles for ticker + hover effects */}
      <style>{`
        @-webkit-keyframes tickerMove {
          0%   { -webkit-transform: translateX(0);     transform: translateX(0); }
          100% { -webkit-transform: translateX(-33.33%); transform: translateX(-33.33%); }
        }
        @keyframes tickerMove {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .ticker-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          padding-left: 1.5rem;
          -webkit-animation: tickerMove 60s linear infinite;
          animation: tickerMove 60s linear infinite;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
        }
      `}</style>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Video Modal */}
      {isVideoOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className='relative w-full max-w-4xl aspect-video bg-black'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='absolute -top-10 right-0 text-white hover:text-gray-300'
              onClick={() => setIsVideoOpen(false)}
            >
              <X size={32} />
            </button>
            <video
              src='/videos/intro-video.mp4'
              controls
              autoPlay
              className='w-full h-full'
            />
          </div>
        </div>
      )}
    </section>
  )
}

/* ----------------- Sub-components ----------------- */
function RailItem({ label, link }) {
  return (
    <a
      className='rail-item flex flex-col items-center gap-2 transition-transform cursor-pointer'
      href={link || '#'}
    >
      <div className='rail-logo rounded-lg flex items-center justify-center'>
        <img
          src='/images/logo.svg'
          alt='Logo'
          className='text-white transition-transform duration-300'
        />
      </div>
      <span className='text-white text-xs sm:text-sm font-bold tracking-wide'>
        {label}
      </span>
    </a>
  )
}

function PrimaryButton({ children, onClick }) {
  return (
    <Button
      onClick={onClick}
      className='w-[calc(100%-2rem)] max-w-[320px] sm:w-auto sm:max-w-none bg-[#F6B72D] hover:bg-[#e6b82a] text-black py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center text-xs sm:text-sm'
    >
      {children}
    </Button>
  )
}

function SocialSquare({ href, className = '', children }) {
  const isMobile =
    typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <a
      href={href}
      target={isMobile ? '_self' : '_blank'}
      rel='noopener noreferrer'
      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 ${className}`}
    >
      {children}
    </a>
  )
}