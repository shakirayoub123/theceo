import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import salientFeatures from '@/config/salientFeatures.json'
import { useTranslation } from 'react-i18next'

export default function GallerySection() {
  const { t } = useTranslation()

  const features = salientFeatures.map((item) => ({
    ...item,
    title: t(`features.items.${item.key}.title`),
    description: t(`features.items.${item.key}.description`),
  }))

  return (
    <section className='py-12 lg:py-14 bg-[#FCFCF8]'>
      <div className='container-custom'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center mb-3'>
            <span className='text-gray-600 font-medium tracking-wide'>
              {t('features.sectionHeader')}
            </span>
            <ArrowRight className='ml-3 h-5 w-5 text-gray-600' />
          </div>

          <h2 className='text-2xl lg:text-4xl font-bold text-black mb-6 tracking-wide'>
            {t('features.sectionHeader')}
          </h2>

          <p className='text-lg lg:text-lg text-gray-600 leading-relaxed font-exo'>
            {t('features.sectionDescription')}
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature) => (
            <div
              key={feature.id}
              className='bg-white rounded-2xl border-2 border-[#F6B72D] p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative cursor-pointer overflow-hidden'
            >
              {/* Default Content */}
              <div className='group-hover:opacity-0 group-hover:invisible transition-all duration-300'>
                <div className='flex items-center mb-6'>
                  <div className='w-16 h-16 min-w-16 min-h-16 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mr-4'>
                    <img
                      src='/images/logoYellow.svg'
                      alt='Logo'
                      className='text-white'
                    />
                  </div>
                  <h3 className='text-md lg:text-md font-bold text-black leading-tight'>
                    {feature.title}
                  </h3>
                </div>

                <p className='text-gray-600 leading-relaxed font-exo text-base'>
                  {feature.description}
                </p>
              </div>

              {/* Hover Content */}
              <div className='absolute inset-0 bg-gradient-to-br from-[#1a2332] to-[#2d3a4d] rounded-2xl p-8 flex flex-col opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300'>
                <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
                  <span className='w-3 h-3 bg-[#F6B72D] rounded-full mr-3'></span>
                  {feature.title}
                </h3>

                <ul className='space-y-3 flex-1 overflow-y-auto'>
                  {feature.summary.map((point, idx) => (
                    <li
                      key={idx}
                      className='flex items-start gap-3 text-white text-sm leading-relaxed'
                    >
                      <span className='inline-block w-1.5 h-1.5 bg-[#F6B72D] rounded-full flex-shrink-0 mt-2'></span>
                      <span className='font-exo'>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className='mt-6'>
                  <Link to={`/salient-features/${feature.slug}`}>
                    <Button className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-bold py-2 px-6 rounded-full text-sm w-full'>
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
