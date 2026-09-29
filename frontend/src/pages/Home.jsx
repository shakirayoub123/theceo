import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import BlogSection from '@/components/BlogSection'
import HeroSection from '@/components/HeroSection'
import NewsletterSection from '@/components/NewsletterSection'
import ProductsSection from '@/components/ProductsSection'
import ServicesSection from '@/components/ServicesSection'
import SalientFeaturesSection from '@/components/SalientFeaturesSection'
import StatsSection from '@/components/StatsSection'
import TeamSection from '@/components/TeamSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import AppointmentModal from '@/components/AppointmentModal'
import ClientCaseStudiesSection from '@/components/ClientCaseStudiesSection'
import authService from '@/services/authService'

const Home = () => {
  const [featuredData, setFeaturedData] = useState({
    blogs: [],
    ebooks: [],
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoading(true)

        // Fetch blogs data from LMS APIs
        const [blogsData, ebooksData] = await Promise.all([
          authService.getAllBlogs().catch(() => ({ blogs: [] })),
          authService.getPeopleEbooks().catch(() => ({ ebooks: [] })),
        ])

        setFeaturedData({
          blogs: blogsData.blogs || [],
          ebooks: ebooksData.ebooks || [],
        })
      } catch (error) {
        console.error('Error fetching featured content:', error)
        // Set empty arrays as fallback
        setFeaturedData({
          blogs: [],
          ebooks: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedContent()
  }, [])

  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        })
      }
    }
  }, [loading])

  const buildTickerItems = () => {
    return [
      'Microsoft', 'IBM', 'Apple', 'Google', 'U.S./UK Government Agencies',
      'U.S. Congress', 'Northrop Grumman', 'Ball Aerospace', 'ExxonMobil',
      'Dow Inc.', 'United Airlines', 'Boeing', 'UnitedHealthcare',
      'Merrill Lynch', 'Goldman Sachs', 'Citicorp', 'JPMorgan Chase & Co.',
      'FINRA', 'Visa', 'Ford', 'BMW', 'Toyota', 'Wyndham Hotels & Resorts Inc.',
      'Higher Education', 'and other leading global organizations.'
    ]
  }

  return (
    <div>
      <Helmet>
        <title>
          The CEO Influencers - Expert Leadership Coaching & Business
          Development
        </title>
        <meta
          name='description'
          content='Elevate your leadership potential with The CEO Influencers. Access expert coaching, premium ebooks, and tailored business development services for ambitious C-suite executives and entrepreneurs worldwide.'
        />
        <meta
          name='keywords'
          content='leadership coaching, CEO development, business strategy, executive coaching, leadership training, C-suite, business influencers'
        />
        <meta
          property='og:title'
          content='The CEO Influencers - Expert Leadership Coaching'
        />
        <meta
          property='og:description'
          content='Elevate your leadership skills with personalized coaching and resources from industry experts.'
        />
        <meta
          property='og:image'
          content='https://theceoinfluencers.com/images/og-image.jpg'
        />
        <meta property='og:url' content='https://theceoinfluencers.com' />
        <meta name='twitter:card' content='summary_large_image' />
        <link rel='canonical' href='https://theceoinfluencers.com' />
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'The CEO Influencers',
            url: 'https://theceoinfluencers.com',
            logo: 'https://theceoinfluencers.com/images/logo.png',
            description:
              'Expert leadership coaching and business development services for C-suite executives.',
            sameAs: [
              'https://x.com/CeoInfluencers',
              'https://www.instagram.com/theceoinfluencers',
              'https://www.facebook.com/TheCEOInfluencers/',
              'https://www.youtube.com/@TheCEOInfluencers',
              'https://www.tiktok.com/@theceoinfluencers',
              'https://www.pinterest.com/theceoinfluencers/',
              'https://www.linkedin.com/company/the-ceo-influencers/?viewAsMember=true',
            ],
          })}
        </script>
      </Helmet>
      <div id='hero-section'>
        <HeroSection tickerItems={buildTickerItems()} />
      </div>
      <div id='our-team'>
        <TeamSection />
      </div>
      <div id='services-section'>
        <ServicesSection />
      </div>
      <div id='salient-features'>
        <SalientFeaturesSection />
      </div>

      <div id='stats-section'>
        <StatsSection />
      </div>
      <div id='testimonials-section'>
        <TestimonialsSection />
      </div>
      <div id='blog'>
        <BlogSection blogs={featuredData.blogs} loading={loading} />
      </div>
      <div id='newsletter-section'>
        <NewsletterSection />
      </div>
      <div id='products-section'>
        <ProductsSection loading={loading} />
      </div>
      <div id='case-studies-section'>
        <ClientCaseStudiesSection />
      </div>
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default Home
