import { Helmet } from 'react-helmet-async'
import AboutContent from '@/components/AboutContent'
import TabNavigation from '@/components/common/TabNavigation'
import ContactSidebar from '@/components/ContactSidebar'
import InfluencerProfile from '@/components/InfluencerProfile'
import PublicationsContent from '@/components/PublicationsContent'
import ReviewsContent from '@/components/ReviewsContent'
import { useState, useEffect } from 'react'

const ClaireBiography = () => {
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const tabs = [
    { id: 'about', label: 'ABOUT' },
    { id: 'publications', label: 'PUBLICATIONS' },
    { id: 'reviews', label: 'REVIEWS' },
  ]

  const influencerData = {
    name: 'DR. CLAIRE KEOGH (BSc IT Hons, PhD)',
    title: 'International Business Consultant & Keynote Speaker',
    description:
      'Expert in social research, business development, and creating positive work-life balance norms.',
    image: '/images/claire.jpeg',
    languages: ['English', 'Spanish'],
    experience: '20+ years of experience',
    achievements: 'Consulted 2,500+ top executive leaders',
  }

  const aboutContent = [
    'Dr Claire Keogh is a highly accomplished international business consultant with 20 years of proven results-focused experience in social research, business development, and consultancy with a Doctorate in Philosophy focused on creating leading edge positive work-life balance norms within IT and other diverse business sectors. Claire combines multi-level Information Technology expertise with in-depth knowledge of the social and organizational dynamics critical to creating and maintaining business success. Claire is a noted University Lecturer, published international author and highly sought after keynote speaker who designs and elevates business practices globally.',
    'With a broad and diverse career across academia, local and national government, corporations, third-sector organizations and international multimedia networks such as the BBC, Dr Keogh has built an impressive portfolio of achieving industry leading real-world results. She also played a pivotal role in providing business critical strategic insights based on multi-industry focus groups and data analysis, which have guided full cycle business development and effectively influenced key organizational decision-making. Her experience spans the development and execution of top organization-wide performance improvement initiatives that not only address and overcome operational challenges, but also ensure long-term growth through AI business innovation.',
    "A core area of Dr Keoghs expertise includes working with both internal senior leadership teams and key external stakeholders to manage a wide variety of high-impact initiatives within the National Health Service (NHS), aimed at improving service delivery and developing new, cutting-edge approaches to healthcare. Additionally, Claire has worked extensively with business leaders and politicians, providing evidence-based policy responses for key areas social housing policy, children's services, safeguarding, and public health.",
    'Dr Keoghs consultancy work also extended to conducting equalities review for a UK regional housing strategy, where she applied rigorous research and analysis methodologies to recommend and implement optimal strategic housing industry improvement solutions, with an emphasis on housing fairness and accessibility to move regional healthcare innovation forward.',
    'Throughout her career, Claire has demonstrated a unique ability to bridge research and business strategy with practical results focused application with a commitment to driving meaningful and effective real-world change that moves business forward. Claire continues to support organizations in navigating complex organizational challenges, optimizing service delivery, and fostering innovation, while enhancing overall work-life balance, well-being and job satisfaction across all sectors.',
    'Dr. Keogh and her family currently reside in beautiful Andalucia, Spain where she enjoys the beautiful weather and scenery with a personal focus on giving back to her local community through animal rescue activism and a firm commitment to reducing her carbon footprint by doing her part in assisting with reducing the catastrophic effects of global climate change. Claire is also passionate about developing the next generation of young empathetic 21st century business leaders through 1:1 mentorship programs to help ensure their success.',
  ]

  const publications = [
    {
      title:
        "Adam, A., Richardson, H., Griffiths, M., Keogh, C., Moore, K. and Tattersall, A. (2006) 'Being an 'it' in IT: gendered identities in the IT workplace' European Journal of Information Systems Volume 15 no 4 August 2006 368-378",
      year: '2006',
      journal: 'Journals',
      description: 'Gendered identities in the IT workplace',
    },
    {
      title:
        "Adam, A., Griffiths, M., Keogh, C., Moore, K., Richardson, H. and Tattersall, A. (2005) 'You don't have to be male to work here but it helps! Gender and the IT labour market' in Archibald, J., Emms, J., Grundy, F., Payne, J and Turner, E. (Eds) 'The Gender Politics of ICT' (2005) Middlesex University Press, Middlesex.",
      year: '2005',
      journal: 'Book Chapters',
      description: 'Gender and the IT labour market',
    },
    {
      title:
        'Moore, K, Griffiths, M, Richardson, H, Keogh, C & Tattersall, A 2005, Managing diversity or valuing diversity?: gender and the IT labour market. in R Griffeth, F Niederman & T Ferratt (eds), IT workers: human capital issues in a knowledge-based environment. Information Science Publishing, Hershey, PA, USA.',
      year: '2005',
      journal: 'Book Chapters',
      description: 'Managing diversity in IT labour market',
    },
    {
      title:
        "Tattersall, A., Keogh, C., Richardson, A., and Adam, A. (2006) Women and the IT workplace in North West England' in Trauth, E (Ed) 'Encyclopaedia of gender and information technology' IDEA Group pp1252-1257",
      year: '2006',
      journal: 'Book Chapters',
      description: 'Women in IT workplace',
    },
    {
      title:
        "Adam, A., Griffiths, M., Keogh, C., Moore, K Richardson, H and Tattersall, A., (2006) 'Gender and information systems research at the University of Salford' in Trauth, E (Ed) 'Encyclopaedia of gender and information technology' IDEA Group.",
      year: '2006',
      journal: 'Book Chapters',
      description: 'Gender and information systems research',
    },
    {
      title:
        "Keogh, C, Tattersall, A and Richardson, H. (2006) 'Directing equal pay in the UK ICT labour market' in Trauth, E (Ed) 'Encyclopaedia of gender and information technology' IDEA Group pp 200-206",
      year: '2006',
      journal: 'Book Chapters',
      description: 'Equal pay in ICT labour market',
    },
    {
      title:
        'Tattersall, A., Keogh, C., and Richardson, H. (2007) The Gender Pay Gap in UK ICT in Khosrow-Pour, M (Ed) Managing Worldwide Operations and Communications with Information Technology.',
      year: '2007',
      journal: 'Book Chapters',
      description: 'Gender pay gap in UK ICT',
    },
    {
      title:
        "Tattersall, A. Keogh, C. (2008) 'Donne e comunità professionali nell’industria ICT' (Gender and Social Capital: the impact on pay, position and status in the UK ICT industry) in Capitani, T. (Ed) 'Un altro genere di technologia'. Editorizone Stampa Lulu Enterprises Ltd Reports.",
      year: '2008',
      journal: 'Book Chapters',
      description: 'Gender and social capital in ICT industry',
    },
    {
      title:
        "Tattersall, A, Keogh, C., Richardson, H. and Adam, A. (2004) 'The Women in North West IT Final Report' University of Salford and the European Social Fund",
      year: '2004',
      journal: 'Reports',
      description: 'Women in North West IT',
    },
    {
      title:
        "Keogh, C., Tattersall, A. and Richardson, H. (2007) 'The Directing Equal Pay in ICT (DEPICT) Final Report' University of Salford and the European Social Fund",
      year: '2007',
      journal: 'Reports',
      description: 'Equal pay in ICT',
    },
    {
      title:
        "Keogh, C., Tattersall, A., and Richardson, H. (2008) 'Gender, Age, Technology and Employability' University of Salford and the European Social Fund.",
      year: '2008',
      journal: 'Reports',
      description: 'Gender, age, technology and employability',
    },
    {
      title:
        "Keogh, C. (2010) 'Equality Impact Assessment, Housing Allocations Policy', Housing in Regeneration, Manchester City Council.",
      year: '2010',
      journal: 'Reports',
      description: 'Housing allocations policy',
    },
    {
      title:
        "Keogh, C. (2013) 'Portable Care Packages – Care from Housing to Hospital Final Report' Research and Development, Housing 21. (Internal report)",
      year: '2013',
      journal: 'Reports',
      description: 'Portable care packages',
    },
    {
      title:
        "Keogh, C. (2011) 'Promoting Dignity and Respect 'Portable Care Packages – Care from Housing to Hospital' Care Talk – The Voice of Excellence in Social Care Magazine, Issue 5, September 2011",
      year: '2011',
      journal: 'Reports',
      description: 'Promoting dignity and respect',
    },
    {
      title:
        'Stewart, C., Keogh, C. (2014). Extra Care Model Evaluation, Research and Evaluation, Housing 21. (Internal report)',
      year: '2014',
      journal: 'Reports',
      description: 'Extra care model evaluation',
    },
    {
      title:
        'Keogh, C. (2019). "Wythenshawe Housing Allocation Refresh" Wythenshawe Community Housing Group (Internal Report)',
      year: '2019',
      journal: 'Reports',
      description: 'Housing allocation refresh',
    },
    {
      title:
        'Keogh, C. (2019). "Analysis of Wythenshawe Health and Housing Needs" Wythenshawe Community Housing Group (Internal Report)',
      year: '2019',
      journal: 'Reports',
      description: 'Health and housing needs analysis',
    },
    {
      title:
        'Keogh, C. (2022). "Supporting NHS Ethnic Minority Staff and Communities" NHS Dumfries and Galloway NHS Trust (pending website release)',
      year: '2022',
      journal: 'Reports',
      description: 'Supporting NHS ethnic minority staff',
    },
    {
      title:
        "Adam, A., Griffiths, M., Keogh, C., Moore, K., Richardson, H. and Tattersall, A., (2005) 'Being an 'it' in IT: gendered identities in the IT workplace'. 6th International Women into Computing Conference University of Greenwich. July 2005",
      year: '2005',
      journal: 'Refereed Conference Papers',
      description: 'Gendered identities in IT workplace',
    },
    {
      title:
        'Griffiths M., Keogh C., Moore K., Richardson H.J., Tattersall A. (2006) Inclusion Through the Ages? Gender, ICT Workplaces, and Life Stage Experiences in England. In: Trauth E.M., Howcroft D., Butler T., Fitzgerald B., DeGross J.I. (eds) Social Inclusion: Societal and Organizational Implications for Information Systems. IFIP International Federation for Information Processing, vol 208. Springer, Boston, MA',
      year: '2006',
      journal: 'Refereed Conference Papers',
      description: 'Gender and life stage experiences',
    },
    {
      title:
        "Tattersall, A. and Keogh, C. (2006) 'Gender and Social Capital: the impact on pay, position and status in the UK ICT industry' itAIS conference, Milan, Italy. October 2006.",
      year: '2006',
      journal: 'Refereed Conference Papers',
      description: 'Gender and social capital in ICT',
    },
    {
      title:
        "Adam, A., Griffiths, M., Keogh, C., Moore, K., Richardson, H and Tattersall, A. (2006) Gender and technology trouble: gendered identities in the IT workplace ESRC funded seminar series: 'Gendering the knowledge economy' Lancaster. March 2006.",
      year: '2006',
      journal: 'Refereed Conference Papers',
      description: 'Gender and technology trouble',
    },
    {
      title:
        "Keogh, C., Tattersall A., (2006) 'The Gender Pay Gap in ICT: Initial Findings from the DEPICT Project' The WINIT International and Interdisciplinary Conference on Gender, Technology and the ICT Workplace, University of Salford, Manchester. March 2006",
      year: '2006',
      journal: 'Refereed Conference Papers',
      description: 'Gender pay gap in ICT',
    },
    {
      title:
        "Tattersall, A., Keogh, C. and Richardson, H. (2007) 'The gender pay gap in ICT' 18th Information Resources Management Association (IRMA) conference, Vancouver Canada. May 2007",
      year: '2007',
      journal: 'Refereed Conference Papers',
      description: 'Gender pay gap in ICT',
    },
    {
      title:
        "Keogh, C., (2008) 'Gender, ICT and Work-life Balance' Gender, Work and Organization, Keele University, UK. 5th International Interdisciplinary Conference, 27th - 29th June 2008.",
      year: '2008',
      journal: 'Refereed Conference Papers',
      description: 'Gender, ICT and work-life balance',
    },
    {
      title:
        'Burns, B., Keogh, C., Richardson, H., and Tattersall, A. (2009) Using E-Business Tools to Overcome Gender Barriers for Women at Work in the UK ICT Labour Market. International Conference on Information Society and Information Technologies - ISIT 09, 12-13 October 2009, Dolenjske Toplice, Slovenia',
      year: '2009',
      journal: 'Refereed Conference Papers',
      description: 'E-business tools for gender barriers',
    },
    {
      title:
        "Keogh, C. (2010) 'Work-life Balance Policy in the UK: Gendered ICT Workplaces and the Culture of Resentment' Unpublished PhD, University of Salford",
      year: '2010',
      journal: 'Miscellaneous',
      description: 'Work-life balance policy',
    },
  ]

  const reviews = [
    {
      clientName: 'Helen Richardson',
      company: 'Professor, Sheffield Business School, Sheffield Hallam University',
      rating: 5,
      comment:
        'Claire demonstrated exceptional research capabilities during her tenure at the University of Salford, where she led multiple research initiatives examining gender disparity within the Information Communication Technology sector. Her work garnered significant recognition, resulting in numerous peer-reviewed publications and high-profile presentations to key stakeholders, including British parliamentary briefings at the House of Commons and strategic industry forums.',
      date: 'March 2024',
    },
    {
      clientName: 'Dr. Sarina B.',
      company: 'Director/Deputy Director - Nursing, NHS England/Scotland',
      rating: 5,
      comment:
        'I have had the privilege of collaborating with Claire over several years across strategic research initiatives, leadership development programs, and innovative organizational transformation projects. Throughout this professional partnership, Claire has consistently demonstrated an exceptional capacity to bridge the gap between rigorous academic research and practical business application.',
      date: 'February 2024',
    },
    {
      clientName: 'CEO Confidential',
      company: 'Kent County Council, British Government',
      rating: 5,
      comment:
        'Dr. Claire Keogh is a strategic analyst of exceptional caliber whose work has consistently delivered high-impact intelligence solutions to our C-Suite and board-level stakeholders. Claire possesses a rare ability to translate complex data into actionable insights that drive meaningful organizational performance across critical public services.',
      date: 'January 2024',
    },
  ]

  const contactInfo = {
    email: 'claire.theceoinfluencers.com',
    socialMedia: {
      facebook: 'https://www.facebook.com/TheCEOInfluencers/',
      twitter: 'https://x.com/CeoInfluencers',
      instagram: 'https://www.instagram.com/theceoinfluencers',
      linkedin: 'https://www.linkedin.com/in/claire-keogh-phd-9b134213/',
    },
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutContent content={aboutContent} />
      case 'publications':
        return <PublicationsContent publications={publications} />
      case 'reviews':
        return <ReviewsContent reviews={reviews} />
      default:
        return <AboutContent content={aboutContent} />
    }
  }
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Team', href: '/#our-team' },
    { label: 'Dr. Claire Keogh...' },
  ]
  return (
    <>
      <Helmet>
        <title>
          Dr. Claire Keogh - CEO Influencer & Leadership Coach | The CEO
          Influencers
        </title>
        <meta
          name='description'
          content='Meet Dr. Claire Keogh, expert CEO influencer and leadership coach at The CEO Influencers. Discover her academic background and coaching expertise.'
        />
        <meta
          name='keywords'
          content='Claire Keogh, CEO coach, leadership coach, business mentor, executive coaching, PhD'
        />
        <meta
          property='og:title'
          content='Dr. Claire Keogh - CEO Influencer & Leadership Coach'
        />
        <meta
          property='og:description'
          content="Learn about Dr. Claire Keogh's expertise in CEO coaching and leadership development."
        />
        <meta
          property='og:image'
          content='https://theceoinfluencers.com/images/claire.jpeg'
        />
        <meta
          property='og:url'
          content='https://theceoinfluencers.com/biography/claire-keogh'
        />
        <link
          rel='canonical'
          href='https://theceoinfluencers.com/biography/claire-keogh'
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
                <span className='text-[#F6B72D]'>Dr. Claire Keogh...</span>
              </div>
            </div>
          </div>

          {/* MAIN PAGE BACKGROUND */}
          <div className='w-full'>
            <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'>

              {/* INFLUENCER PROFILE CARD */}
              <div className='bg-white border border-gray-200 rounded-[12px] shadow-sm mb-10 overflow-hidden'>
                <InfluencerProfile {...influencerData} />
              </div>

              {/* ABOUT / REVIEWS CARD */}
              <div className='bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden mb-8'>
                <div className='flex justify-center border-b border-gray-200 pt-6 px-10 bg-[#FBFBFB]'>
                  <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    className={''}
                  />
                </div>
                <div className='grid lg:grid-cols-3 gap-8 p-10 mt-4 bg-white'>
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

export default ClaireBiography
