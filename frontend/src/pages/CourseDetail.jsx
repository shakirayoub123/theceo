import CourseCurriculum from '@/components/CourseCurriculum'
import CourseHero from '@/components/CourseHero'
import CourseOverview from '@/components/CourseOverview'
import KeynoteTopics from '@/components/KeynoteTopics'

export default function CourseDetail() {
  const courseData = {
    title: 'INTENSIVE LEADERSHIP DEVELOPMENT PROGRAM',
    description:
      'This module guides senior executives to align their personal values, professional aspirations, and emotional intelligence competencies to drive exceptional leadership performance.',
    backgroundImage: '/images/hero2.svg',
    length: '12 weeks',
    modules: 12,
    advisors: [
      {
        name: 'James Armstrong',
        image: '/images/team1.svg',
      },
      {
        name: 'Dr. Claire Keogh',
        image: '/images/team2.svg',
      },
    ],
  }

  const courseIncludes = [
    '10.4 hours on-demand videos',
    '3 study materials',
    'Full lifetime access',
    'Certificate of completion',
  ]

  const keynoteTopics = [
    {
      id: 'motivation',
      title: 'MOTIVATION',
      content: [
        'The global impact of Positive Multi-Media programs that make a difference.',
        'Positive leadership potential and how it impacts global markets.',
        'Strategic long-term ERP-Enterprise Resource Planning Market Impact to overcome volatile global markets.',
      ],
    },
    {
      id: 'strategic',
      title: 'STRATEGIC',
      content: [
        'Strategic planning methodologies for organizational transformation.',
        'Long-term vision development and implementation strategies.',
        'Market analysis and competitive positioning frameworks.',
      ],
    },
    {
      id: 'emotional-intelligence',
      title: 'EMOTIONAL INTELLIGENCE',
      content: [
        'Understanding and managing emotional responses in leadership contexts.',
        'Building empathy and emotional awareness in team environments.',
        'Developing emotional resilience for high-pressure situations.',
      ],
    },
    {
      id: 'public-speaking',
      title: 'PUBLIC SPEAKING',
      content: [
        'Mastering the art of compelling presentations and storytelling.',
        'Building confidence and presence on stage and in meetings.',
        'Advanced techniques for audience engagement and persuasion.',
      ],
    },
  ]

  return (
    <div className='min-h-screen bg-white'>
      <CourseHero
        title={courseData.title}
        backgroundImage={courseData.backgroundImage}
      />

      <CourseOverview
        description={courseData.description}
        length={courseData.length}
        modules={courseData.modules}
        advisors={courseData.advisors}
      />

      <CourseCurriculum
        courseIncludes={courseIncludes}
        lectureCount={12}
        duration='10.4h'
      />

      <KeynoteTopics topics={keynoteTopics} />
    </div>
  )
}
