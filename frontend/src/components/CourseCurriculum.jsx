import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Play,
  Volume2,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Clock,
  BadgeDollarSign,
  Files,
} from 'lucide-react'

export default function CourseCurriculum({
  courseIncludes,
  lectureCount,
  duration,
}) {
  const [expandedModule, setExpandedModule] = useState('module-1')

  const modules = [
    {
      id: 'module-1',
      title:
        'Module 1: Personal & Professional Alignment & Emotional Intelligence (EQ)',
      description:
        'This module guides senior executives to align their personal values, professional aspirations, and emotional intelligence competencies to drive exceptional leadership performance.',
      isExpanded: true,
    },
    {
      id: 'principles-management',
      title: 'Principles of Management',
      description: 'Core management principles and leadership fundamentals.',
    },
    {
      id: 'marketing-strategies',
      title: 'Marketing Strategies',
      description: 'Strategic marketing approaches for business growth.',
    },
    {
      id: 'financial-accounting',
      title: 'Financial Accounting',
      description:
        'Essential financial literacy for executive decision making.',
    },
    {
      id: 'organizational-behavior',
      title: 'Organizational Behavior',
      description: 'Understanding organizational dynamics and team management.',
    },
    {
      id: 'business-ethics',
      title: 'Business Ethics and Corporate Social Responsibility',
      description:
        'Ethical leadership and corporate responsibility frameworks.',
    },
  ]

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? '' : moduleId)
  }

  return (
    <div className='py-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid lg:grid-cols-3 gap-12'>
          {/* Left - Curriculum */}
          <div className='lg:col-span-2'>
            <h2 className='text-3xl lg:text-4xl text-black mb-8 tracking-wide'>
              COURSE CURRICULUM
            </h2>

            {/* Course Details */}
            <div className='flex items-center gap-6 mb-8'>
              <div className='flex items-center gap-2'>
                <Files className='h-5 w-5 text-[#292D32]' />
                <span className='font-medium font-exo'>
                  {lectureCount} lectures
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='h-5 w-5 text-[#292D32]' />
                <span className='font-medium font-exo'>
                  {duration} duration
                </span>
              </div>
            </div>

            {/* Modules List */}
            <div className='space-y-4'>
              {modules.map((module, index) => (
                <div key={module.id}>
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className='w-full p-4 border-2 border-[#F6B72D] rounded-lg bg-[#FCFCF8] hover:bg-gray-50 transition-colors flex items-center justify-between'
                  >
                    <span className='text-md font-medium font-exo text-left'>
                      {module.title}
                    </span>
                    {expandedModule === module.id ? (
                      <ChevronDown className='h-5 w-5 text-gray-600 flex-shrink-0' />
                    ) : (
                      <ChevronRight className='h-5 w-5 text-gray-600 flex-shrink-0' />
                    )}
                  </button>

                  {/* Expanded Content - Only for Module 1 */}
                  {expandedModule === module.id && index === 0 && (
                    <div className='mt-6'>
                      {/* Module Description */}
                      <p className='text-md font-exo leading-relaxed mb-6'>
                        {module.description}
                      </p>

                      {/* Demo Video Label */}
                      <h4 className='text-xl text-black mb-4 font-exo'>
                        Demo Video:
                      </h4>

                      {/* Video Player */}
                      <div className='bg-black rounded-lg overflow-hidden mb-8'>
                        <div className='relative aspect-video'>
                          <img
                            src='youtube.com'
                            alt='Course Demo Video'
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 flex items-center justify-center'>
                            <Button className='bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-4'>
                              <Play className='h-8 w-8' />
                            </Button>
                          </div>
                        </div>

                        {/* Video Controls */}
                        <div className='bg-gray-900 p-4 flex items-center justify-between'>
                          <div className='flex items-center gap-4 flex-1'>
                            <Button className='text-white hover:text-gray-300 p-2'>
                              <Play className='h-4 w-4' />
                            </Button>
                            <div className='flex-1 bg-gray-700 h-1 rounded-full mx-4 max-w-md'>
                              <div className='bg-white h-1 rounded-full w-1/3'></div>
                            </div>
                            <span className='text-white text-sm'>
                              2:45 / 8:30
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button className='text-white hover:text-gray-300 p-2'>
                              <Volume2 className='h-4 w-4' />
                            </Button>
                            <Button className='text-white hover:text-gray-300 p-2'>
                              <Maximize2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Course Includes */}
          <div className='lg:col-span-1'>
            <div className='bg-[#FCFCF8] border-2 border-yellow-400 rounded-lg p-6 font-exo'>
              <h3 className='text-xl mb-4'>This Course Includes:</h3>
              <ul className='space-y-3 mb-6'>
                {courseIncludes.map((item, index) => (
                  <li key={index} className=' text-md  flex items-start gap-3'>
                    <span className=' font-bold'>.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className='flex items-center gap-2 mb-2 text-md font-exo'>
                <BadgeDollarSign className='w-4 h-4' />
                <span>
                  Price: <span className='text-lg'>To be discussed</span>
                </span>
              </div>
              <Button className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-black py-4 rounded-md font-sans mt-6'>
                BOOK A DISCOVERY CALL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
