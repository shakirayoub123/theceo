import { Helmet } from 'react-helmet-async'
import AboutContent from '@/components/AboutContent'
import TabNavigation from '@/components/common/TabNavigation'
import ContactSidebar from '@/components/ContactSidebar'
import InfluencerProfile from '@/components/InfluencerProfile'
import ReviewsContent from '@/components/ReviewsContent'
import { useState, useEffect } from 'react'

const JamesBiography = () => {
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const tabs = [
    { id: 'about', label: 'ABOUT' },
    { id: 'reviews', label: 'REVIEWS' },
  ]

  const influencerData = {
    name: 'Mr. James H. Armstrong',
    title: 'Visionary Thought Leader & Executive Coach',
    description:
      'Highly respected visionary thought leader with extensive experience in coaching top C-level executives.',
    image: '/images/james.jpg',
    languages: ['English', 'Spanish'],
    experience: '25+ years of experience',
    achievements: 'Coached 5,000+ top executive leaders',
  }

  const aboutContent = [
    'Mr. Armstrong is a highly respected and accomplished visionary thought leader with an extremely diverse and successful background in both the corporate & entrepreneurial business worlds. His extensive career has focused on coaching, mentoring and supporting top C-level executives to achieve their personal and professional best through innovative next generation personal/professional leadership assessment, development, optimization and ongoing support. With a proven track record of success coaching 5,000 top executive leaders from international fortune 100, 500 and 1000 companies in over 186+ industries who have all consistently achieved breakthrough business results. His focus on motivating, supporting and influencing top executives and their organizational leadership teams to fully realize and reach both their individual and collective full personal/professional potential has made the impossible in business a reality.',
    'James has a personal passion and rare gift for positively motivating and inspiring people vertically and horizontally throughout organizations to see the very best in themselves and those around them, resulting in creating highly dynamic and aligned internal and external stakeholders who accomplish industry leading business results.',
    'Mr. Armstrong has accomplished all of this by fully utilizing his unique combination of multi-industry experience, continuous professional education, industry insider contacts, political acumen and dynamic interpersonal skills in key areas of business to best support entrepreneurs and corporate leaders alike achieve results. His focus on in depth next generation thought leadership development, authentic personalized executive branding, productive values-aligned internal/external stakeholder engagement, cost-effective enterprise manpower/resources/technology performance optimization, goals focused short, mid and long-range tactical implementation action plans has achieved consistent proven real-world results.',
    "James also draws on significant multi-media entertainment industry expertise having become the Executive Director of an international Model and Talent Management agency developing and promoting audio/visual media talent worldwide at just 22 year old. James was most recently the founder and CEO of a cutting edge online multi-media entertainment company with divisions in radio, television, music and publishing where he created successful multi-media programming. He envisioned and co-hosted International Artist Debut Radio featuring in-depth interviews with celebrities, humanitarians and international leaders who were making a positive difference which achieved a loyal 5 million fan base in 95 Countries. His work received a Humanitarian Award from a 'United Journey for Humanity' for promoting diverse global artists making a positive difference.",
    'James has always been a strong community advocate known for supporting turning around the lives of troubled youth who have suffered abuse to help heal, unite and transform families. Additionally, James is also passionate about developing leading edge youth mentorship programs to invest in the future leaders of tomorrow who will re-shape the way business is done in the 21st century and beyond.',
    'James currently resides in the mountains of beautiful Spain and loves travelling internationally making new friends and experiencing local food and culture. He is also using his expertise to transform a local non-profit no kill animal rescue sanctuary by developing a new website and social media presence combined with new fundraising and volunteer recruitment strategies designed to introduce environmental sustainability and carbon footprint reduction as a core value.',
    'James\' positive influence has transformed people\'s personal and professional lives and his favorite quote says it best: "The power of one can and will positively change the world forever".',
  ]

  const reviews = [
    {
      clientName: 'Robert McDonough',
      company: 'Retired Senior Executive, Multiple Industries',
      rating: 5,
      comment:
        'James is a very dynamic individual who has extensive knowledge of the executive business environment. He is a master mentor to all of his associates and has contributed to their great success and advancement. James has become a leader in his realm by his keen insights, strong dedication, and masterful knowledge of human nature. I trust James\' judgement completely.',
      date: 'March 2024',
    },
    {
      clientName: 'Sandy Priester',
      company: 'CEO/Founder, Lifespark Cancer Resources',
      rating: 5,
      comment:
        'James has advised LifeSpark on several occasions. As a non-profit organization, we have tapped James expertise in the area of corporate fundraising, and he has assisted us with training committee members, and counsel on overall fundraising strategy. James has extensive connections throughout the business community, and his skills related to organizational development, marketing and branding, and leadership development are excellent. James is smart, generous, talented, and very easy to work with. I would highly recommend James in any of these areas.',
      date: 'February 2024',
    },
    {
      clientName: 'Jay Garcia',
      company: 'Executive AICP, LEEP AP, Multiple Industries',
      rating: 5,
      comment:
        'James Armstrong is an extremely well-rounded professional with a strong and diverse background in numerous industries on an international scale. More importantly, James is a good man and a nice person. He communicates well with all types of people at all different levels and while he is extremely good at providing valuable insight and guidance he is also open to taking advice and suggestions for possible solutions.',
      date: 'January 2024',
    },
  ]

  const contactInfo = {
    email: 'james.theceoinfluencers.com',
    socialMedia: {
      facebook: 'https://www.facebook.com/TheCEOInfluencers/',
      twitter: 'https://x.com/CeoInfluencers',
      instagram: 'https://www.instagram.com/theceoinfluencers',
      linkedin: 'https://www.linkedin.com/in/jamesharmstrong/?skipRedirect=true',
    },
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutContent content={aboutContent} />
      case 'reviews':
        return <ReviewsContent reviews={reviews} />
      default:
        return <AboutContent content={aboutContent} />
    }
  }
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Team', href: '/#our-team' },
    { label: 'James Armstrong...' },
  ]
  return (
    <>
      <Helmet>
        <title>
          James Armstrong - CEO Influencer & Leadership Coach | The CEO
          Influencers
        </title>
        <meta
          name='description'
          content='Meet James Armstrong, expert CEO influencer and leadership coach at The CEO Influencers. Discover his journey and coaching expertise.'
        />
        <meta
          name='keywords'
          content='James Armstrong, CEO coach, leadership coach, business mentor, executive coaching'
        />
        <meta
          property='og:title'
          content='James Armstrong - CEO Influencer & Leadership Coach'
        />
        <meta
          property='og:description'
          content="Learn about James Armstrong's expertise in CEO coaching and leadership development."
        />
        <meta
          property='og:image'
          content='https://theceoinfluencers.com/images/james.jpg'
        />
        <meta
          property='og:url'
          content='https://theceoinfluencers.com/biography/james-armstrong'
        />
        <link
          rel='canonical'
          href='https://theceoinfluencers.com/biography/james-armstrong'
        />
      </Helmet>

      <div className='w-full'>
        <div className='w-full bg-[#F5F4F2] pt-6'>
          {/* AUTHOR PROFILE HERO BANNER */}
          <div className='relative w-full max-w-[1383px] mx-auto h-[423px] bg-[#FFFBF0] flex flex-col items-center justify-center overflow-hidden rounded-[28px] shadow-sm mb-12'>
            {/* Topographic Background */}
            <div
              className='absolute inset-0 z-0 opacity-40 pointer-events-none'
              style={{
                backgroundImage: `url('/images/body-bg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
            <div className='relative z-10 text-center flex flex-col items-center px-4 mt-6'>
              <h1 className='text-4xl md:text-[54px] font-bold font-jakarta text-[#000023] mb-6 tracking-tight'>Author Profile</h1>
              <div className='flex items-center text-[15px] font-semibold font-jakarta'>
                <a href='/' className='text-[#161616] hover:text-[#F6B72D] transition-colors'>Home</a>
                <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
                <a href='/#our-team' className='text-[#F6B72D] hover:text-[#e6a820] transition-colors'>Team</a>
                <span className='mx-3 text-[#161616] tracking-widest'>&gt;</span>
                <span className='text-[#F6B72D]'>James Armstrong...</span>
              </div>
            </div>
          </div>

          {/* MAIN PAGE BACKGROUND */}
          <div className='bg-[#F8F9FA] pt-12 pb-24'>
            <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'>

              {/* INFLUENCER PROFILE CARD */}
              <div className='bg-white border border-gray-200 rounded-[12px] shadow-sm mb-10 overflow-hidden'>
                <InfluencerProfile {...influencerData} />
              </div>

              {/* ABOUT / REVIEWS CARD */}
              <div className='bg-[#FBFBFB] border border-gray-200 rounded-[12px] shadow-sm overflow-hidden mb-8'>
                <div className='flex justify-center border-b border-gray-200 pt-6 px-10 bg-[#FBFBFB]'>
                  <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    className={''}
                  />
                </div>
                <div className='grid lg:grid-cols-3 gap-8 p-10 mt-4'>
                  <div className={activeTab === 'reviews' ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    {renderTabContent()}
                  </div>
                  {activeTab === 'reviews' && (
                    <div className='lg:col-span-1'>
                      <ContactSidebar contactInfo={contactInfo} title={'CONTACT'} />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default JamesBiography
