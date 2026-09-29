import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const StudentProgress = ({ data }) => {
  // If no data, show default
  if (!data || data.length === 0) {
    const modules = [
      { name: 'Module 1', progress: '72%' },
      { name: 'Module 2', progress: '72%' },
      { name: 'Module 3', progress: '72%' },
    ]
    return (
      <Card className='border-2 border-[#F6B72D] bg-white h-full'>
        <CardHeader className='pb-4 '>
          <div className='w-full flex items-center justify-between font-exo'>
            <CardTitle className='m-0 text-lg font-semibold text-foreground flex-1'>
              Student Progress
            </CardTitle>
            <p className='text-sm text-gray-500 flex-none ml-4 whitespace-nowrap'>
              9 Lectures
            </p>
          </div>
        </CardHeader>
        <CardContent className=' font-exo'>
          <div className='border border-[#191919]/20 py-5 px-3 rounded-lg mb-4  text-gray-800 font-medium'>
            Live Leadership Coaching & Executive Mentoring 12-week Programs
          </div>
          <div className='space-y-3 ml-[10%]'>
            {modules.map((module, idx) => (
              <div
                key={idx}
                className='bg-[#0B1220] text-white flex justify-between items-center p-4 rounded-lg'
              >
                <span>{module.name}</span>
                <span className='border border-white rounded-full px-2 py-3 text-sm'>
                  {module.progress}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use real data
  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-full'>
      <CardHeader className='pb-4 '>
        <div className='w-full flex items-center justify-between font-exo'>
          <CardTitle className='m-0 text-lg font-semibold text-foreground flex-1'>
            Student Progress
          </CardTitle>
          <p className='text-sm text-gray-500 flex-none ml-4 whitespace-nowrap'>
            {data.reduce(
              (total, program) => total + program.chapters.length,
              0,
            )}{' '}
            Chapters
          </p>
        </div>
      </CardHeader>
      <CardContent className=' font-exo'>
        {data.map((program, programIdx) => (
          <div key={programIdx}>
            <div className='border border-[#191919]/20 py-5 px-3 rounded-lg mb-4 text-gray-800 font-medium'>
              {program.programName}
            </div>
            <div className='space-y-3 ml-[10%]'>
              {program.chapters.map((chapter, idx) => (
                <div
                  key={idx}
                  className='bg-[#0B1220] text-white flex justify-between items-center p-4 rounded-lg'
                >
                  <span>{chapter.title}</span>
                  <span className='border border-white rounded-full px-2 py-3 text-sm'>
                    {chapter.completionPercent}%
                  </span>
                </div>
              ))}
            </div>
            {programIdx < data.length - 1 && <div className='mb-6'></div>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
