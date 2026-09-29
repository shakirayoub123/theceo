import { useTranslation } from 'react-i18next'
import { Target, Users, TrendingUp, Award } from 'lucide-react'

export default function OverviewSection() {
  const { t } = useTranslation()

  const valueProps = [
    {
      icon: Target,
      title: 'Strategic Vision',
      description: 'Develop long-term strategic thinking with expert guidance',
    },
    {
      icon: Users,
      title: 'Executive Network',
      description: 'Connect with C-suite leaders and industry influencers',
    },
    {
      icon: TrendingUp,
      title: 'Career Acceleration',
      description: 'Accelerate your leadership journey with measurable results',
    },
    {
      icon: Award,
      title: 'Industry Recognition',
      description: 'Gain credibility as a thought leader in your field',
    },
  ]

  return (
    <section className='py-8 lg:py-12 relative'>
      <div className='container-custom'>
        <div className='flex flex-col lg:flex-row items-center gap-12 lg:gap-16'>
          {/* Left Image - Made Smaller */}
          <div className='relative w-full lg:w-2/5'>
            <div className='relative h-[400px] sm:h-[500px] lg:h-[550px] rounded-2xl overflow-hidden shadow-2xl'>
              <img
                src='/images/skyscraper.png'
                alt='Modern skyscraper looking up - Symbolizing leadership growth and ambition'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
            </div>

            {/* Floating Stats Card */}
            <div className='absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-6 border border-gray-100'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-[#F6B72D] mb-1'>
                  500+
                </div>
                <div className='text-sm font-medium text-gray-600'>
                  Leaders Transformed
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - More Space */}
          <div className='w-full lg:w-3/5 space-y-8'>
            {/* Header */}
            <div className='space-y-4'>
              <div className='inline-flex items-center px-4 py-2 bg-[#F6B72D]/10 rounded-full'>
                <span className='text-[#F6B72D] font-semibold text-sm tracking-wide'>
                  TRANSFORM YOUR LEADERSHIP
                </span>
              </div>

              <p className='text-lg text-gray-700 leading-relaxed font-exo'>
                {t('overview.description')}
              </p>
            </div>

            {/* Value Proposition Grid - Reduced to 2 columns */}
            <div className='grid grid-cols-1 gap-4'>
              {valueProps.map((prop, index) => (
                <div
                  key={index}
                  className='group bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#F6B72D]/20'
                >
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='w-10 h-10 bg-[#F6B72D]/10 rounded-lg flex items-center justify-center group-hover:bg-[#F6B72D]/20 transition-colors duration-300'>
                        <prop.icon className='w-5 h-5 text-[#F6B72D]' />
                      </div>
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-bold text-black mb-1 leading-tight'>
                        {prop.title}
                      </h3>
                      <p className='text-gray-600 text-sm leading-relaxed font-exo'>
                        {prop.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
