import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Play,
  Volume2,
  Maximize,
  FileText,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

export function ProgramOverview({
  videoUrl,
  videoThumbnail = '/professional-woman-presenting-at-whiteboard.jpg',
  learningModules,
  contentTitle = 'The art of leadership',
  contentDescription,
  meetings,
  files,
  onModuleClick,
  onModalOpen,
  onScheduleMeeting,
  onVideoProgress,
  onContentProgress,
  disableDownloads = true,
  contentPanelMaxHeight = null,
  meetingScheduleMaxHeight = null,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [active, setActive] = useState('prev')
  const [videoCardHeight, setVideoCardHeight] = useState(null)
  const videoRef = useRef(null)
  const contentRef = useRef(null)
  const videoCardRef = useRef(null)

  const handleFileDownload = async (file) => {
    try {
      const response = await fetch(file.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = file.name || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Failed to download file directly:', error)
      window.open(file.url, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (video && onVideoProgress) {
      const handleTimeUpdate = () => {
        const progress = (video.currentTime / video.duration) * 100
        onVideoProgress(progress)
      }
      video.addEventListener('timeupdate', handleTimeUpdate)
      return () => video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [onVideoProgress])

  useEffect(() => {
    const content = contentRef.current
    if (content && onContentProgress) {
      const handleScroll = () => {
        const scrollTop = content.scrollTop
        const scrollHeight = content.scrollHeight - content.clientHeight
        const progress =
          scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100
        onContentProgress(progress)
      }
      content.addEventListener('scroll', handleScroll)
      // Initial call
      handleScroll()
      return () => content.removeEventListener('scroll', handleScroll)
    }
  }, [onContentProgress])

  useEffect(() => {
    const element = videoCardRef.current
    if (!element) return

    const syncHeight = () => {
      setVideoCardHeight(Math.round(element.getBoundingClientRect().height))
    }

    syncHeight()

    if (typeof window === 'undefined') return

    if (!window.ResizeObserver) {
      window.addEventListener('resize', syncHeight)
      return () => window.removeEventListener('resize', syncHeight)
    }

    const observer = new window.ResizeObserver(syncHeight)
    observer.observe(element)
    return () => observer.disconnect()
  }, [videoUrl, videoThumbnail])

  const handlePlayVideo = () => {
    setIsPlaying(!isPlaying)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white'
      case 'upcoming':
        return 'bg-blue-500 text-white'
      case 'cancelled':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className='space-y-6 font-exo'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'>
        <Card ref={videoCardRef} className='border-2 border-[#F6B72D]'>
          <CardContent className='p-0'>
            <div className='relative w-full aspect-video rounded-lg overflow-hidden flex bg-black'>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  key={videoUrl} // Force re-mount when video URL changes
                  className='w-full h-full object-contain bg-black'
                  poster={videoThumbnail || '/placeholder.svg'}
                  controls={!isPlaying}
                >
                  <source src={videoUrl} type='video/mp4' />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={videoThumbnail || '/placeholder.svg'}
                  alt='Program video'
                  className='w-full h-full object-cover'
                />
              )}

              {/* Video Controls Overlay - only show if no videoUrl */}
              {!videoUrl && (
                <div className='absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center'>
                  <Button
                    onClick={handlePlayVideo}
                    size='lg'
                    className='bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 rounded-full w-16 h-16 p-0'
                  >
                    <Play className='w-8 h-8 ml-1' />
                  </Button>
                </div>
              )}

              {/* Bottom Controls - only show if no videoUrl */}
              {!videoUrl && (
                <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4'>
                  <div className='flex items-center justify-between text-white'>
                    <div className='flex items-center gap-4'>
                      <Button
                        onClick={handlePlayVideo}
                        size='sm'
                        variant='ghost'
                        className='text-white hover:bg-white hover:bg-opacity-20 p-2'
                      >
                        <Play className='w-4 h-4' />
                      </Button>

                      {/* Progress Bar */}
                      <div className='flex-1 mx-4'>
                        <div className='w-full bg-white bg-opacity-30 rounded-full h-1'>
                          <div
                            className='bg-white h-1 rounded-full'
                            style={{ width: '30%' }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-white hover:bg-white hover:bg-opacity-20 p-2'
                      >
                        <Volume2 className='w-4 h-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-white hover:bg-white hover:bg-opacity-20 p-2'
                      >
                        <Maximize className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className='border-2 border-[#F6B72D] bg-white flex flex-col overflow-hidden'
          style={videoCardHeight ? { height: `${videoCardHeight}px` } : undefined}
        >
          <CardHeader className='flex-none'>
            <CardTitle className='text-lg font-semibold'>
              Program Learning Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 overflow-y-auto flex-1'>
            {learningModules.map((module) => (
              <div
                key={`${module.week}-${module.title}`}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  module.isActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => onModuleClick && onModuleClick(module)}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-medium'>
                      Week {module.week} - {module.title}
                    </h3>
                    {module.shortDescription && (
                      <p
                        className={`text-sm mt-1 ${
                          module.isActive ? 'text-white/80' : 'text-gray-600'
                        }`}
                      >
                        {module.shortDescription}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='relative w-12 h-12'>
                      {module.isCompleted ? (
                        // Show checkmark for completed modules
                        <div className='w-12 h-12 bg-green-500 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-6 h-6 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                      ) : (
                        // Show progress circle for incomplete modules
                        <svg
                          className='w-12 h-12 transform -rotate-90'
                          viewBox='0 0 36 36'
                        >
                          <path
                            d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                            fill='none'
                            stroke={module.isActive ? '#374151' : '#e5e7eb'}
                            strokeWidth='2'
                          />
                          <path
                            d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                            fill='none'
                            stroke={module.isActive ? '#ffffff' : '#000F2A'}
                            strokeWidth='2'
                            strokeDasharray={`${module.progress}, 100`}
                          />
                          <circle cx='18' cy='18' r='16' fill='none' />
                        </svg>
                      )}
                      {!module.isCompleted && (
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <span
                            className={`text-xs font-medium ${
                              module.isActive ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {module.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='border-2 border-[#F6B72D] bg-white'>
          <CardContent
            ref={contentRef}
            className='p-6 overflow-y-auto'
            style={
              contentPanelMaxHeight
                ? { maxHeight: contentPanelMaxHeight }
                : undefined
            }
          >
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              {contentTitle}
            </h2>
            <div
              className='text-gray-700 leading-relaxed'
              dangerouslySetInnerHTML={{ __html: contentDescription }}
            ></div>
          </CardContent>
        </Card>

        <Card
          className='border-2 border-[#F6B72D] flex flex-col overflow-hidden'
          style={
            meetingScheduleMaxHeight
              ? { maxHeight: meetingScheduleMaxHeight }
              : undefined
          }
        >
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-lg font-semibold'>
              Meeting Schedule
            </CardTitle>
            <Button
              className='bg-[#F6B72D] hover:bg-yellow-500 text-white'
              onClick={onScheduleMeeting}
            >
              SCHEDULE A MEETING
            </Button>
          </CardHeader>
          <CardContent className='flex-1 overflow-y-auto'>
            <div className='space-y-4'>
              <div className='grid grid-cols-4 gap-4 text-sm font-medium text-gray-600 border-b pb-2'>
                <span>ID</span>
                <span>Dated</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className='grid grid-cols-4 gap-4 items-center py-2'
                >
                  <span className='text-sm text-gray-900'>{meeting.id}</span>
                  <div className='text-sm text-gray-900'>
                    <div>{meeting.date}</div>
                    <div className='text-xs text-gray-600'>{meeting.time}</div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      meeting.status,
                    )}`}
                  >
                    {meeting.status.toUpperCase()}
                  </span>
                  <Button
                    size='sm'
                    variant='outline'
                    className='text-xs bg-black/30 text-white border-none rounded-full'
                  >
                    JOIN MEETING
                  </Button>
                </div>
              ))}

              <div className='flex justify-center mt-6 font-exo'>
                <div className='flex rounded-full overflow-hidden shadow-md bg-black'>
                  {/* Prev */}
                  <button
                    onClick={() => setActive('prev')}
                    className={`flex items-center gap-2 px-6 py-2 text-white transition-colors 
            ${active === 'prev' ? 'bg-[#4c4c4c] rounded-full' : null}
          `}
                  >
                    <ArrowLeft className='h-4 w-4 text-red-500' />
                    Prev
                  </button>

                  {/* Next */}
                  <button
                    onClick={() => setActive('next')}
                    className={`flex items-center gap-2 px-6 py-2 text-white transition-colors 
            ${active === 'next' ? 'bg-[#4c4c4c] rounded-full' : null}
          `}
                  >
                    Next
                    <ArrowRight className='h-4 w-4 text-green-500' />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Resources */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900'>
            Learning Resources
          </h2>
          <span
            className='text-sm font-semibold underline cursor-pointer'
            onClick={onModalOpen}
          >
            Upload Your Own Content
          </span>
        </div>

        {files.length === 0 ? (
          <div className='rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600'>
            No resources uploaded yet. Check back soon.
          </div>
        ) : (
          <div
            className='overflow-y-auto pr-1'
            style={videoCardHeight ? { maxHeight: `${videoCardHeight}px` } : undefined}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {files.map((file) => (
                <div
                  key={file.id}
                  className='flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
                >
                  <div className='flex items-start gap-3'>
                    <FileText className='w-5 h-5 text-red-500 mt-1' />
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>
                        {file.name}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {file.type || 'Resource'} • {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black'
                    onClick={() => handleFileDownload(file)}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
