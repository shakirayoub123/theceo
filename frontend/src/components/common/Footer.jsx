import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ArrowRight
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import footerBg from '@/assets/footer.png'

export default function Footer() {
  const { t } = useTranslation()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const socialTarget =
    typeof navigator !== 'undefined' &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent)
      ? '_self'
      : '_blank'

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    if (!newsletterEmail) return

    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch(
        'https://api.theceoinfluencers.com/api/email/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'Newsletter Subscription',
            body: `New newsletter subscription request from: ${newsletterEmail}`,
            subscriber_email: newsletterEmail,
          }),
        },
      )

      if (response.ok) {
        setSubmitMessage('Thank you for subscribing!')
        setNewsletterEmail('')
      } else {
        setSubmitMessage('Failed to subscribe. Please try again.')
      }
    } catch {
      setSubmitMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const linkStyle = "text-[#D1D5DB] hover:text-[#F6B72D] transition-colors text-[13px] md:text-[14px] flex items-center font-medium"

  return (
    <footer className='bg-[#000023] text-white relative flex flex-col font-jakarta overflow-hidden' id='footer'>
      {/* Background Topo */}
      <div
        className='absolute inset-0 z-0 opacity-100 pointer-events-none'
        style={{
          backgroundImage: `url("${footerBg}")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <div className='max-w-[1400px] w-full mx-auto px-6 sm:px-8 pt-16 pb-8 relative z-10'>
        {/* Main Content Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16'>

          {/* Column 1: Info */}
          <div className='lg:col-span-4 flex flex-col'>
            {/* Logo */}
            <div className='mb-6'>
              <img
                src={'/images/fullLogo.svg'}
                alt={'CEO Influencers Logo'}
                className='h-auto w-auto max-h-12'
              />
            </div>
            {/* Address */}
            <div className='text-[#9CA3AF] text-[13px] md:text-[14px] leading-relaxed mb-6 font-medium'>
              <p>9107 West Russell Road, Suite 100</p>
              <p>Las Vegas, Nevada 89148</p>
            </div>
            {/* Email Block */}
            <div>
              <p className='text-[#D1D5DB] font-bold text-[12px] uppercase tracking-wider mb-2'>
                EMAIL BLOCK:
              </p>
              <p className='text-[#9CA3AF] text-[13px] md:text-[14px]'>
                Email: <a href="mailto:info@theceoinfluencers.com" className='text-[#F6B72D] hover:underline font-semibold'>info@theceoinfluencers.com</a>
              </p>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className='lg:col-span-2 flex flex-col'>
            <h4 className='text-[#F6B72D] text-[12px] md:text-[13px] mb-5 tracking-widest font-bold uppercase'>
              COMPANY
            </h4>
            <ul className='space-y-4'>
              <li>
                <Link to='/gdpr' className={linkStyle}>
                  <span className='mr-2 font-bold'>&rsaquo;</span> GDPR Compliance
                </Link>
              </li>
              <li>
                <Link to='/terms-and-conditions' className={linkStyle}>
                  <span className='mr-2 font-bold'>&rsaquo;</span> Terms and Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Links */}
          <div className='lg:col-span-2 flex flex-col'>
            <h4 className='text-[#F6B72D] text-[12px] md:text-[13px] mb-5 tracking-widest font-bold uppercase'>
              LINKS
            </h4>
            <ul className='space-y-4'>
              <li>
                <a href='/#gallery-section' className={linkStyle}>
                  <span className='mr-2 font-bold'>&rsaquo;</span> About Us
                </a>
              </li>
              <li>
                <a href='/#blog' className={linkStyle}>
                  <span className='mr-2 font-bold'>&rsaquo;</span> Blog
                </a>
              </li>
              <li>
                <Link to='/case-studies' className={linkStyle}>
                  <span className='mr-2 font-bold'>&rsaquo;</span> Case Studies
                </Link>
              </li>
              <li>
                <Link to='/sitemap' className={linkStyle}>
                  <span className='mr-2 font-bold'>&rsaquo;</span> Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Socials */}
          <div className='lg:col-span-4 flex flex-col'>
            <h4 className='text-[#F6B72D] text-[12px] md:text-[13px] mb-5 tracking-widest font-bold uppercase'>
              NEWSLETTER
            </h4>
            <form onSubmit={handleNewsletterSubmit} className='mb-8 relative flex w-full max-w-sm gap-3'>
              <div className='flex-1 relative'>
                <Input
                  type='email'
                  placeholder='Email'
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className='w-full bg-[#070707] border border-[#F6B72D] text-white rounded-full text-sm py-5 px-5 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#F6B72D] shadow-inner'
                  required
                />
              </div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='bg-[#F6B72D] hover:bg-[#e6a820] text-black font-bold px-6 py-2 rounded-full text-sm disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 uppercase tracking-widest'
              >
                JOIN <ArrowRight className='h-4 w-4 ml-1.5' strokeWidth={3} />
              </button>
            </form>
            {submitMessage && (
              <p className='text-xs mt-[-1.5rem] mb-6 text-green-400'>{submitMessage}</p>
            )}

            <h4 className='text-white text-[12px] md:text-[13px] mb-4 tracking-widest font-bold uppercase'>
              FOLLOW US
            </h4>
            <div className='flex items-center gap-3'>
              <a
                href='https://www.linkedin.com/company/the-ceo-influencers/?viewAsMember=true'
                target={socialTarget}
                rel='noopener noreferrer'
                className='w-[38px] h-[38px] bg-[#1A2332] rounded-full flex items-center justify-center text-gray-300 hover:bg-[#F6B72D] hover:text-black transition-colors'
              >
                <Linkedin className='h-4 w-4' />
              </a>
              <a
                href='https://x.com/CeoInfluencers'
                target={socialTarget}
                rel='noopener noreferrer'
                className='w-[38px] h-[38px] bg-[#1A2332] rounded-full flex items-center justify-center text-gray-300 hover:bg-[#F6B72D] hover:text-black transition-colors'
              >
                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                </svg>
              </a>
              <a
                href='https://www.instagram.com/theceoinfluencers'
                target={socialTarget}
                rel='noopener noreferrer'
                className='w-[38px] h-[38px] bg-[#1A2332] rounded-full flex items-center justify-center text-gray-300 hover:bg-gradient-to-tr hover:from-yellow-500 hover:to-fuchsia-600 hover:text-white transition-all'
              >
                <Instagram className='h-4 w-4' />
              </a>
              <a
                href='https://www.youtube.com/@TheCEOInfluencers'
                target={socialTarget}
                rel='noopener noreferrer'
                className='w-[38px] h-[38px] bg-[#1A2332] rounded-full flex items-center justify-center text-gray-300 hover:bg-[#FF0000] hover:text-white transition-colors'
              >
                <Youtube className='h-4 w-4' />
              </a>
              <a
                href='https://www.facebook.com/TheCEOInfluencers/'
                target={socialTarget}
                rel='noopener noreferrer'
                className='w-[38px] h-[38px] bg-[#1A2332] rounded-full flex items-center justify-center text-gray-300 hover:bg-[#1877F2] hover:text-white transition-colors'
              >
                <Facebook className='h-4 w-4' />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright / Bottom Bar */}
        <div className='border-t border-white/10 pt-6'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <div className='flex flex-wrap items-center justify-center md:justify-start text-[12px] md:text-[13px] font-bold text-gray-300 gap-2'>
              <span className='text-white'>The CEO Influencers</span>
              <span className='text-gray-600'>•</span>
              <span>Building Better Leaders</span>
              <span className='text-gray-600'>•</span>
              <span className='text-[#F6B72D]'>#1 Leadership Coaching</span>
            </div>

            <div className='text-center md:text-right text-[12px] md:text-[13px] text-gray-500 font-medium'>
              {t('footer.copyright', '© 2026 The CEO Influencers. All rights reserved.')}
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
