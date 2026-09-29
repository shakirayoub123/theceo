import { useState } from 'react'
import { ArrowRight, X, Plus } from 'lucide-react'

export default function KeynoteTopics({ topics }) {
  const [activeTopic, setActiveTopic] = useState(topics[0]?.id || '')

  const activeTopicData = topics.find((topic) => topic.id === activeTopic)

  return (
    <div className='py-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-12'>
          <div className='flex items-center mb-6'>
            <span className='text-[#656766] font-medium tracking-wide font-exo'>
              OUR SPEAKING TOPICS
            </span>
            <ArrowRight className='ml-3 h-5 w-5 text-[#656766]' />
          </div>
          <h2 className='text-3xl lg:text-4xl text-black mb-6 tracking-wide'>
            KEYNOTE SPEAKING TOPICS
          </h2>
          <p className='text-lg lg:text-xl text-[#656766] leading-relaxed max-w-4xl font-exo'>
            Our keynote speaking engagements feature dynamic two-person teams
            that blend energy and expertise to inspire and equip audiences with
            actionable leadership strategies.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Left Column - Topic Selection */}
          <div className='space-y-4'>
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`w-full p-6 rounded-lg border-2 flex items-center justify-between transition-all duration-300 ${
                  activeTopic === topic.id
                    ? 'bg-gray-900 text-white border-[#F6B72D]'
                    : 'bg-[#FCFCF8] text-black border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className='text-lg tracking-wide'>{topic.title}</span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activeTopic === topic.id
                      ? 'bg-[#FCFCF8] text-gray-900'
                      : 'bg-gray-900 text-[#FCFCF8]'
                  }`}
                >
                  {activeTopic === topic.id ? (
                    <X className='h-5 w-5' />
                  ) : (
                    <Plus className='h-5 w-5' />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column - Content Display */}
          <div className='bg-gray-900 text-white p-8 rounded-lg border-2 border-[#F6B72D]'>
            <h3 className='text-2xl mb-8 tracking-wide'>TOPICS</h3>
            <div className='space-y-6'>
              {activeTopicData?.content.map((item, index) => (
                <div key={index} className='flex items-start gap-4 font-exo'>
                  <div className='w-1 h-1 bg-white rounded-full mt-3 flex-shrink-0'></div>
                  <p className='text-lg leading-relaxed'>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
