import { ProgramOverview } from '@/components/ProgramOverview'
import { Button } from '@/components/ui/button'
import { getAssetUrl } from '@/lib/utils'
import clientAPIService from '@/services/clientAPIService'
import { Upload, X } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import ProgramScheduleMeetingModal from '@/components/ProgramScheduleMeetingModal'
import { ContentSecurityWrapper } from '@/components/ContentSecurityWrapper'

export default function ProgramDetails() {
  const { id: serviceId } = useParams()
  const [serviceData, setServiceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeChapterIndex, setActiveChapterIndex] = useState(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [contentProgress, setContentProgress] = useState(0)
  const lastProgressUpdate = useRef(0)

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true)
        const data = await clientAPIService.getServiceDetails(serviceId)
        setServiceData(data)
        // Don't set any chapter as active initially - show service description
        setActiveChapterIndex(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchServiceDetails()
    }
  }, [serviceId])

  const handleModuleClick = (module) => {
    setActiveChapterIndex(module.index)
    // Reset progress when switching chapters
    setVideoProgress(0)
    setContentProgress(0)
  }

  const handleVideoProgress = useCallback((progress) => {
    setVideoProgress(progress)
  }, [])

  const handleContentProgress = useCallback((progress) => {
    setContentProgress(progress)
  }, [])

  // Update progress to backend
  useEffect(() => {
    const updateProgress = async () => {
      const chapter = serviceData?.chapters?.[activeChapterIndex]
      if (!chapter) return

      const overallProgress = Math.round((videoProgress + contentProgress) / 2)
      const now = Date.now()
      if (now - lastProgressUpdate.current > 60000) {
        // 1 minute
        try {
          await clientAPIService.updateChapterProgress(
            chapter.id,
            overallProgress,
          )
          lastProgressUpdate.current = now
        } catch (error) {
          console.error('Failed to update progress:', error)
        }
      }
    }

    if (serviceData && (videoProgress > 0 || contentProgress > 0)) {
      updateProgress()
    }
  }, [videoProgress, contentProgress, activeChapterIndex, serviceData])

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center text-red-500 p-4'>
        Error loading service details: {error}
      </div>
    )
  }

  if (!serviceData) {
    return <div className='text-center p-4'>No service data found.</div>
  }

  // Transform API data to match ProgramOverview component expectations
  const learningModules =
    serviceData.chapters?.map((chapter, index) => ({
      week: chapter.week,
      title: chapter.title,
      shortDescription:
        chapter.shortDescription ||
        chapter.description ||
        `Week ${chapter.week} content`,
      description: chapter.description || `Week ${chapter.week} content`,
      progress: chapter.progress || 0,
      isCompleted: chapter.isCompleted || false,
      isActive: activeChapterIndex !== null && index === activeChapterIndex,
      index: index, // Add index for click handling
    })) || []

  const meetings =
    serviceData.meetingsScheduled?.map((meeting) => ({
      id: meeting.id,
      date: new Date(meeting.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: meeting.time || 'TBD',
      status: meeting.status,
    })) || []

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    try {
      setUploading(true)
      await clientAPIService.uploadClientFile(serviceId, selectedFile)
      toast.success('File uploaded successfully!')
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      // Optionally refresh service data to show new file
      // fetchServiceDetails()
    } catch (err) {
      toast.error('Failed to upload file: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleScheduleMeeting = () => {
    setIsScheduleModalOpen(true)
  }

  const activeChapter =
    activeChapterIndex !== null
      ? serviceData.chapters?.[activeChapterIndex]
      : null
  const chapterVideoUrl =
    activeChapter && typeof activeChapter.video === 'string'
      ? getAssetUrl(activeChapter.video)
      : null
  const resourceSource =
    activeChapter != null
      ? activeChapter.files || []
      : serviceData.files?.filter((file) => file.isServiceFile)
  const files =
    resourceSource?.map((file) => ({
      id: file.id,
      name: file.title,
      uploadedBy: 'System',
      uploadedAt: file.createdAt
        ? new Date(file.createdAt).toLocaleDateString()
        : 'Unknown',
      type: file.fileExtension || file.fileType,
      url: getAssetUrl(file.fileUrl),
    })) || []
  const introVideoUrl = serviceData?.introVideo
    ? getAssetUrl(serviceData.introVideo)
    : null
  const currentVideoUrl =
    activeChapter != null ? chapterVideoUrl || null : introVideoUrl || null

  return (
    <ContentSecurityWrapper disableDownloads={false}>
      <div>
        <h2 className='text-xl font-semibold uppercase text-gray-900 mb-4 tracking-wide'>
          {serviceData.title}
        </h2>
        <ProgramOverview
          title={serviceData.title}
          videoUrl={currentVideoUrl}
          videoThumbnail={getAssetUrl(serviceData.featuredImage)}
          learningModules={learningModules}
          contentTitle={activeChapter ? activeChapter.title : serviceData.title}
          contentDescription={
            activeChapter ? activeChapter.description : serviceData.description
          }
          meetings={meetings}
          files={files}
          onModuleClick={handleModuleClick}
          onModalOpen={() => setIsUploadModalOpen(true)}
          onScheduleMeeting={handleScheduleMeeting}
          onVideoProgress={handleVideoProgress}
          onContentProgress={handleContentProgress}
          disableDownloads={false}
          contentPanelMaxHeight='369px'
          meetingScheduleMaxHeight='369px'
        />

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <>
            <div
              className='fixed inset-0 bg-black bg-opacity-50 z-40'
              onClick={() => setIsUploadModalOpen(false)}
            />
            <div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-96 p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold'>Upload Your Content</h3>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Select File
                  </label>
                  <input
                    type='file'
                    onChange={handleFileSelect}
                    className='w-full p-2 border border-gray-300 rounded-md'
                    accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp4,.mov,.avi'
                  />
                  {selectedFile && (
                    <p className='text-sm text-gray-600 mt-1'>
                      Selected: {selectedFile.name} (
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className='flex gap-3'>
                  <Button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploading}
                    className='flex-1'
                  >
                    {uploading ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className='h-4 w-4 mr-2' />
                        Upload
                      </>
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => setIsUploadModalOpen(false)}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Schedule Meeting Modal */}
        <ProgramScheduleMeetingModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          programId={serviceId}
          programTitle={serviceData?.title || 'Program'}
        />

        <Toaster />
      </div>
    </ContentSecurityWrapper>
  )
}
