import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import PageBackButton from '@/components/common/PageBackButton'
import bgHeader from '@/assets/bgHeader.png'

export default function TermsAndConditions() {
  return (
    <div className='min-h-screen bg-[#FBF9F5] font-jakarta text-[#111827]'>
      <Helmet>
        <title>Terms and Conditions | The CEO Influencers</title>
        <meta
          name='description'
          content='Terms and Conditions for The CEO Influencers. Read our terms of service, intellectual property guidelines, and conditions of use.'
        />
      </Helmet>

      {/* Back Button */}
      <div className='max-w-[1383px] mx-auto px-4 sm:px-6 pt-4'>
        <PageBackButton fallbackUrl='/#footer' label='Back' />
      </div>

      {/* Hero Banner */}
      <div className='w-full pt-4'>
        <div className='relative w-full max-w-[1383px] mx-auto py-12 md:py-16 bg-[#FFFBF0] flex flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#F6E5B8] shadow-sm mb-8'>
          <div
            className='absolute inset-0 z-0 pointer-events-none'
            style={{
              backgroundImage: `url("${bgHeader}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className='relative z-10 text-center flex flex-col items-center px-4'>
            <div className='inline-flex items-center justify-center border border-[#F6B72D] rounded-full px-4 py-1 mb-3 bg-white/80'>
              <span className='text-[#000023] font-bold tracking-widest text-[10px] uppercase'>
                Legal & Governance
              </span>
            </div>
            <h1 className='text-3xl md:text-[44px] font-bold font-jakarta text-[#000023] mb-4 tracking-tight uppercase'>
              Terms and Conditions
            </h1>
            <div className='flex items-center text-[14px] font-semibold flex-wrap justify-center gap-y-1'>
              <Link to='/' className='text-[#161616] hover:text-[#F6B72D] transition-colors'>
                Home
              </Link>
              <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
              <span className='text-[#F6B72D]'>Terms and Conditions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 pb-20'>
        <div className='bg-white rounded-[24px] border border-[#E5E7EB] p-8 sm:p-12 md:p-14 shadow-[0_10px_30px_rgba(0,0,0,0.04)]'>

          {/* Introduction */}
          <div className='mb-8'>
            <p className='text-[16px] md:text-[17px] leading-relaxed text-[#374151] font-normal [text-wrap:pretty]'>
              Welcome to <span className='font-semibold text-[#000023]'>The CEO Influencers</span>. By accessing our website and utilizing our executive advisory and leadership development programs, you acknowledge and agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before engaging with our digital platform or consulting solutions.
            </p>
          </div>

          <div className='h-px w-full bg-[#E5E7EB] my-6' />

          {/* Section 1: Use of Services */}
          <section className='my-6'>
            <h2 className='text-xl sm:text-2xl font-bold font-jakarta text-[#000023] mb-3 tracking-tight'>
              1. Use of Services
            </h2>
            <p className='text-[15px] sm:text-[16px] leading-relaxed text-[#4B5563] [text-wrap:pretty]'>
              Our advisory services, coaching modules, mastermind series, and diagnostic assessments are provided strictly for executive, personal, and professional leadership development. You agree to use them responsibly, ethically, and in accordance with all applicable domestic and international laws, regulations, and industry standards.
            </p>
          </section>

          <div className='h-px w-full bg-[#E5E7EB] my-6' />

          {/* Section 2: Intellectual Property */}
          <section className='my-6'>
            <h2 className='text-xl sm:text-2xl font-bold font-jakarta text-[#000023] mb-3 tracking-tight'>
              2. Intellectual Property
            </h2>
            <p className='text-[15px] sm:text-[16px] leading-relaxed text-[#4B5563] [text-wrap:pretty]'>
              All proprietary leadership frameworks, assessment methodologies, text, logos, trademarks, audio-visual materials, and downloadable collateral on this website are owned exclusively by The CEO Influencers and are fully protected under copyright, trademark, and intellectual property statutes worldwide. No content may be reproduced, distributed, republished, or modified without prior written authorization from The CEO Influencers.
            </p>
          </section>

          <div className='h-px w-full bg-[#E5E7EB] my-6' />

          {/* Section 3: Limitation of Liability */}
          <section className='my-6'>
            <h2 className='text-xl sm:text-2xl font-bold font-jakarta text-[#000023] mb-3 tracking-tight'>
              3. Limitation of Liability
            </h2>
            <p className='text-[15px] sm:text-[16px] leading-relaxed text-[#4B5563] [text-wrap:pretty]'>
              While our strategic advisory models are designed using proven neuroscience and organizational optimization principles, The CEO Influencers and its affiliates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from the use or inability to use our services or website. Leadership results depend on individualized implementation and organizational context. Use of our services is at your own discretion.
            </p>
          </section>

          <div className='h-px w-full bg-[#E5E7EB] my-6' />

          {/* Section 4: Changes to Terms */}
          <section className='my-6'>
            <h2 className='text-xl sm:text-2xl font-bold font-jakarta text-[#000023] mb-3 tracking-tight'>
              4. Changes to Terms
            </h2>
            <p className='text-[15px] sm:text-[16px] leading-relaxed text-[#4B5563] [text-wrap:pretty]'>
              We reserve the right to revise or update these terms and conditions at any time without prior individual notification. Any modifications will become effective immediately upon posting to this page. Continued access or use of our services following any posted changes constitutes formal acceptance of the amended terms.
            </p>
          </section>

          <div className='h-px w-full bg-[#E5E7EB] my-6' />

          {/* Section 5: Contact Us */}
          <section className='my-6'>
            <h2 className='text-xl sm:text-2xl font-bold font-jakarta text-[#000023] mb-3 tracking-tight'>
              5. Contact Us
            </h2>
            <p className='text-[15px] sm:text-[16px] leading-relaxed text-[#4B5563] [text-wrap:pretty]'>
              If you have any questions, clarifications, or inquiries regarding these Terms and Conditions, please contact our legal and administrative advisory team directly at:
            </p>
            <div className='mt-4 p-5 rounded-2xl bg-[#FFFBF0] border border-[#F6E5B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div>
                <p className='text-xs font-bold uppercase tracking-wider text-[#A87500] mb-0.5'>Direct Inquiries</p>
                <a
                  href='mailto:info@theceoinfluencers.com'
                  className='text-[16px] font-bold text-[#000023] hover:text-[#F6B72D] transition-colors underline'
                >
                  info@theceoinfluencers.com
                </a>
              </div>
              <p className='text-xs text-gray-500 font-medium'>
                9107 West Russell Road, Suite 100, Las Vegas, Nevada 89148
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
