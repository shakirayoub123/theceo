import { useState, useEffect, useRef } from 'react'
import {
  Globe,
  TrendingUp,
  Building2,
  Star,
  Heart
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import mapBg4 from '@/assets/map bg 4.png'

export default function StatsSection() {
  const { t } = useTranslation()
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const sectionRef = useRef(null)

  const stats = [
    {
      icon: Globe,
      number: 5000,
      suffix: '+',
      label: 'Clients Served'
    },
    {
      icon: TrendingUp,
      number: 99,
      suffix: '%',
      label: 'Client Satisfaction'
    },
    {
      icon: Building2,
      number: 186,
      suffix: '+',
      label: 'Industries Served'
    },
    {
      icon: Star,
      number: 98,
      suffix: '%',
      label: 'Strategic Partnerships'
    },
    {
      icon: Heart,
      number: 100,
      suffix: '%',
      label: 'Leadership Performance'
    }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimationTrigger((prev) => prev + 1)
          }
        })
      },
      { threshold: 0.3 }
    )

    const section = sectionRef.current

    if (section) {
      observer.observe(section)
    }

    return () => {
      if (section) {
        observer.unobserve(section)
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className='relative bg-[#FBF9F5] font-jakarta overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 border-b border-gray-200/50'>

      {/* Map Background Pattern */}
      <div
        className='absolute inset-0 z-0 opacity-100 pointer-events-none'
        style={{
          backgroundImage: `url("${mapBg4}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header Section */}
        <div className='flex flex-col items-center text-center mb-16 md:mb-24'>
          <div className='inline-block border border-gray-400/60 rounded-full px-5 py-[2px] mb-6 bg-transparent'>
            <span className='text-[#4B5563] font-bold tracking-widest text-[11px] uppercase'>
              WHY US
            </span>
          </div>

          <h2 className='text-[38px] md:text-[48px] font-bold text-[#111827] leading-[1.1] tracking-tight mb-1'>
            Real Numbers. Real Impact.
          </h2>
          <h2 className='text-[38px] md:text-[48px] font-bold text-[#F6B72D] leading-[1.1] tracking-tight'>
            Real Transformation.
          </h2>
        </div>

        {/* 5-Column Stats Flexbox */}
        <div className='flex flex-col md:flex-row items-center justify-center w-full divide-y md:divide-y-0 md:divide-x divide-gray-200/80'>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className='flex-1 flex flex-col items-center text-center w-full py-10 md:py-4 px-2'
            >
              {/* Circular Icon */}
              <div className='w-[60px] h-[60px] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110'>
                <stat.icon className='w-6 h-6 text-[#F6B72D]' strokeWidth={1.5} />
              </div>

              {/* Number with CountUp */}
              <div className='text-[46px] md:text-[54px] font-extrabold text-[#111827] leading-none mb-3 tracking-tighter'>
                <CountUp
                  end={stat.number}
                  suffix={stat.suffix}
                  trigger={animationTrigger}
                />
              </div>

              {/* Label */}
              <p className='text-[11px] md:text-[12px] font-bold text-[#64748B] uppercase tracking-[0.15em]'>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CountUp({ end, suffix, trigger }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (trigger > 0) {
      setCount(0)
      const duration = 2500 // 2.5 seconds
      const steps = 60
      const increment = end / steps
      const stepDuration = duration / steps

      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, stepDuration)

      return () => clearInterval(timer)
    }
  }, [end, trigger])

  return (
    <span className='inline-flex items-baseline justify-center'>
      <span className='tabular-nums'>
        {count.toLocaleString()}
      </span>
      {suffix && (
        <span className='ml-[2px]'>{suffix}</span>
      )}
    </span>
  )
}
