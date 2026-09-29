import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getAssetUrl } from '@/lib/utils'
import authService from '@/services/authService'
import {
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  GripVertical,
  ImageIcon,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RichTextEditor from '@/components/RichTextEditor'

export default function AddService() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [servicesData, setServicesData] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    aiChatbotEnabled: false,
    status: 'active',
    assignedAdvisors: [],
    chapters: [],
    order: 0,
    comingSoon: false,
  })

  const [newChapter, setNewChapter] = useState({
    title: '',
    shortDescription: '',
    description: '',
    video: null,
    chapterFiles: [],
  })

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [featuredImage, setFeaturedImage] = useState(null)
  const [existingFeaturedImage, setExistingFeaturedImage] = useState(null)
  const [introVideo, setIntroVideo] = useState(null)
  const [existingIntroVideo, setExistingIntroVideo] = useState(null)
  const [existingFiles, setExistingFiles] = useState([])
  const [trainers, setTrainers] = useState([])
  const [editingChapterId, setEditingChapterId] = useState(null)
  const [draggedChapterId, setDraggedChapterId] = useState(null)
  const [editingChapterData, setEditingChapterData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    video: null,
    chapterFiles: [],
  })

  // Fetch trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const trainersData = await authService.getTrainers()
        setTrainers(trainersData || [])
      } catch (error) {
        console.error('Failed to fetch trainers:', error)
      }
    }
    fetchTrainers()
  }, [])

  // Fetch service data if editing
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        const data = await authService.getAdminServices()
        setServicesData(data)
      } catch (err) {
        console.error('Failed to fetch services:', err)
      }
    }
    fetchServicesData()

    if (isEditing) {
      const fetchServiceData = async () => {
        try {
          setFetchLoading(true)
          const serviceData = await authService.getServiceDetails(id)
          console.log('Fetched service data:', serviceData)
          console.log('Chapters from backend:', serviceData.chapters)
          setFormData({
            title: serviceData.title || '',
            shortDescription: serviceData.shortDescription || '',
            description: serviceData.description || '',
            aiChatbotEnabled: serviceData.aiChatbotEnabled || false,
            status: serviceData.status || 'active',
            assignedAdvisors: serviceData.assignedAdvisors
              ? serviceData.assignedAdvisors.map((id) => parseInt(id, 10))
              : [],
            chapters: (serviceData.chapters || []).map((chapter) => ({
              ...chapter,
              shortDescription: chapter.shortDescription || '',
              description: chapter.description || '',
              video: chapter.videoUrl || null,
              isLocal: false,
              chapterFiles:
                chapter.files?.filter(
                  (file) => !file.isChapterVideo && file.fileType !== 'video',
                ) || [],
            })),
            order: serviceData.order || 0,
            comingSoon: serviceData.comingSoon || false,
          })
          setExistingFeaturedImage(getAssetUrl(serviceData.featuredImage))
          setExistingIntroVideo(getAssetUrl(serviceData.introVideo))
          setExistingFiles(
            (serviceData.files || []).filter((file) => file.isServiceFile),
          )
        } catch (err) {
          console.error('Failed to fetch service:', err)
          setError('Failed to load service data')
        } finally {
          setFetchLoading(false)
        }
      }
      fetchServiceData()
    }
  }, [id, isEditing])

  const normalizeChapterOrder = (chapters) =>
    chapters.map((chapter, index) => ({
      ...chapter,
      week: index + 1,
    }))

  const toggleChapter = (chapterId) => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, isExpanded: !chapter.isExpanded }
          : chapter,
      ),
    }))
  }

  const addChapter = () => {
    if (newChapter.title.trim()) {
      const newChapterData = {
        id: Date.now().toString(),
        week: formData.chapters.length + 1,
        title: newChapter.title,
        shortDescription: newChapter.shortDescription,
        description: newChapter.description,
        video: newChapter.video,
        chapterFiles: newChapter.chapterFiles,
        isLocal: true,
        uploadDate: `Uploaded on ${new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`,
        files: [],
        isExpanded: false,
      }

      setFormData((prev) => ({
        ...prev,
        chapters: normalizeChapterOrder([...prev.chapters, newChapterData]),
      }))

      setNewChapter({
        title: '',
        shortDescription: '',
        description: '',
        video: null,
        chapterFiles: [],
      })
    }
  }

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const removeExistingFile = async (fileId) => {
    try {
      await authService.deleteServiceFile(fileId)
      setExistingFiles((prev) => prev.filter((file) => file.id !== fileId))
    } catch (error) {
      console.error('Failed to delete file:', error)
      setError('Failed to delete file. Please try again.')
    }
  }

  const startEditingChapter = (chapter) => {
    setEditingChapterId(chapter.id)
    setEditingChapterData({
      title: chapter.title,
      shortDescription: chapter.shortDescription || '',
      description: chapter.description || '',
      video: chapter.video || null,
      chapterFiles: chapter.chapterFiles || [],
    })
    // Expand the chapter when editing
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chap) =>
        chap.id === chapter.id ? { ...chap, isExpanded: true } : chap,
      ),
    }))
  }

  const cancelEditingChapter = () => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === editingChapterId
          ? { ...chapter, isExpanded: false }
          : chapter,
      ),
    }))
    setEditingChapterId(null)
    setEditingChapterData({
      title: '',
      shortDescription: '',
      description: '',
      video: null,
      chapterFiles: [],
    })
  }

  const saveEditingChapter = () => {
    if (editingChapterData.title.trim()) {
      setFormData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((chapter) =>
          chapter.id === editingChapterId
            ? {
                ...chapter,
                title: editingChapterData.title,
                shortDescription: editingChapterData.shortDescription,
                description: editingChapterData.description,
                video: editingChapterData.video,
                chapterFiles: editingChapterData.chapterFiles,
                isExpanded: false, // Collapse after saving
              }
            : chapter,
        ),
      }))
      cancelEditingChapter()
    }
  }

  const deleteChapter = async (chapterId) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      try {
        const existingChapter = formData.chapters.find(
          (chapter) => chapter.id === chapterId,
        )
        const isPersistedChapter = existingChapter && !existingChapter.isLocal

        if (isPersistedChapter) {
          await authService.deleteChapter(chapterId)
        }
        setFormData((prev) => ({
          ...prev,
          chapters: normalizeChapterOrder(
            prev.chapters.filter((chapter) => chapter.id !== chapterId),
          ),
        }))
      } catch (error) {
        console.error('Failed to delete chapter:', error)
        setError('Failed to delete chapter. Please try again.')
      }
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      console.log('Submitting form data:', formData)
      console.log('Chapters to send:', formData.chapters)

      // Create FormData for file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('shortDescription', formData.shortDescription)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('aiChatbotEnabled', formData.aiChatbotEnabled)
      formDataToSend.append('status', formData.status)
      formDataToSend.append('order', formData.order)
      formDataToSend.append('comingSoon', formData.comingSoon)
      formDataToSend.append(
        'assignedAdvisors',
        JSON.stringify(formData.assignedAdvisors),
      )

      // Only append chapters if there are any chapters
      if (formData.chapters && formData.chapters.length > 0) {
        // Prepare chapters for JSON, handle video files separately
        const chaptersForJson = formData.chapters.map((chapter) => ({
          id: chapter.id,
          week:
            formData.chapters.findIndex((item) => item.id === chapter.id) + 1,
          title: chapter.title,
          shortDescription: chapter.shortDescription,
          description: chapter.description,
          uploadDate: chapter.uploadDate,
          isExpanded: chapter.isExpanded,
          video:
            chapter.video instanceof File ? chapter.video.name : chapter.video,
          existingVideoUrl:
            typeof chapter.video === 'string' ? chapter.video : undefined,
          existingChapterFiles:
            chapter.chapterFiles
              ?.filter((file) => !(file instanceof File))
              .map((file) => ({
                id: file.id,
                fileUrl: file.fileUrl,
                title: file.title,
                fileType: file.fileType,
                fileSize: file.fileSize,
                fileExtension: file.file_extension,
                isDownloadable: file.is_downloadable,
                order: file.order,
              })) || [],
        }))
        formDataToSend.append('chapters', JSON.stringify(chaptersForJson))
        console.log('Sending chapters:', JSON.stringify(chaptersForJson))

        // Append video files separately
        formData.chapters.forEach((chapter, index) => {
          if (chapter.video instanceof File) {
            formDataToSend.append(`chapters[${index}][video]`, chapter.video)
            console.log(
              `Appending video for chapter ${index}:`,
              chapter.video.name,
            )
          }
          chapter.chapterFiles?.forEach((file, fileIndex) => {
            if (file instanceof File) {
              formDataToSend.append(
                `chapters[${index}][files][${fileIndex}]`,
                file,
              )
              console.log(
                `Appending chapter file for chapter ${index}:`,
                file.name,
              )
            }
          })
        })
      } else {
        console.log('Not sending chapters - empty array')
      }

      if (featuredImage) {
        formDataToSend.append('featuredImage', featuredImage)
      }
      if (introVideo) {
        formDataToSend.append('introVideo', introVideo)
      }

      // Add uploaded files - only append valid File objects
      uploadedFiles.forEach((fileObj, index) => {
        console.log(`Checking file ${index}:`, {
          name: fileObj.name,
          file: fileObj.file,
          fileType: typeof fileObj.file,
          isFile: fileObj.file instanceof File,
          size: fileObj.file?.size,
          type: fileObj.file?.type,
        })

        if (
          fileObj.file &&
          fileObj.file instanceof File &&
          fileObj.file.size > 0
        ) {
          formDataToSend.append(`files[${index}]`, fileObj.file)
          console.log(
            `Appending file ${index}:`,
            fileObj.file.name,
            fileObj.file.size,
            'bytes',
          )
        } else {
          console.warn(
            `Skipping invalid/empty file at index ${index}:`,
            fileObj,
          )
        }
      })

      if (isEditing) {
        await authService.updateServiceAdmin(id, formDataToSend)
        setSuccess('Service updated successfully!')
      } else {
        await authService.createServiceAdmin(formDataToSend)
        setSuccess('Service created successfully!')
      }

      setTimeout(() => {
        navigate('/admin-dashboard/services')
      }, 1500)
    } catch (err) {
      console.error('Failed to save service:', err)
      setError(
        err.message ||
          `Failed to ${isEditing ? 'update' : 'create'} service. Please try again.`,
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin-dashboard/services')
  }

  const moveChapter = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return

    setFormData((prev) => {
      const draggedIndex = prev.chapters.findIndex(
        (chapter) => chapter.id === draggedId,
      )
      const targetIndex = prev.chapters.findIndex(
        (chapter) => chapter.id === targetId,
      )

      if (draggedIndex < 0 || targetIndex < 0) {
        return prev
      }

      const reorderedChapters = [...prev.chapters]
      const [draggedChapter] = reorderedChapters.splice(draggedIndex, 1)
      reorderedChapters.splice(targetIndex, 0, draggedChapter)

      return {
        ...prev,
        chapters: normalizeChapterOrder(reorderedChapters),
      }
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      encType='multipart/form-data'
      className='space-y-6 min-h-screen font-exo'
    >
      {fetchLoading ? (
        <div className='flex justify-center items-center min-h-screen'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
        </div>
      ) : (
        <>
          <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className='mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded'>
              {success}
            </div>
          )}

          {/* Title */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Title *</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder='Live Leadership Coaching & Executive Mentoring 12-week Programs'
              className=' input-field '
              required
            />
          </div>

          {/* Short Description */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Short Description (Excerpt)
            </label>
            <Input
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
              placeholder='This is a short description'
              className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg'
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Description
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(content) =>
                setFormData((prev) => ({
                  ...prev,
                  description: content,
                }))
              }
              placeholder='This is a long description'
            />
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg font-exo cursor-pointer'>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent className='bg-white border-2 border-[#F6B72D] rounded-lg font-exo'>
                <SelectItem
                  value='active'
                  className='hover:bg-yellow-50 focus:bg-yellow-50'
                >
                  Active
                </SelectItem>
                <SelectItem
                  value='inactive'
                  className='hover:bg-yellow-50 focus:bg-yellow-50'
                >
                  Inactive
                </SelectItem>
                <SelectItem
                  value='draft'
                  className='hover:bg-yellow-50 focus:bg-yellow-50'
                >
                  Draft
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Order</label>
            <Select
              value={formData.order.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  order: parseInt(value, 10) || 0,
                }))
              }
            >
              <SelectTrigger className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg font-exo cursor-pointer'>
                <SelectValue placeholder='Select order' />
              </SelectTrigger>
              <SelectContent className='bg-white border-2 border-[#F6B72D] rounded-lg font-exo'>
                {(() => {
                  const usedOrders =
                    servicesData?.services?.map((s) => s.order) || []
                  const availableOrders = []
                  for (
                    let i = 0;
                    i <= (servicesData?.services?.length || 0) + 1;
                    i++
                  ) {
                    if (!usedOrders.includes(i) || i === formData.order) {
                      availableOrders.push(i)
                    }
                  }
                  return availableOrders.map((order) => (
                    <SelectItem
                      key={order}
                      value={order.toString()}
                      className='hover:bg-yellow-50 focus:bg-yellow-50'
                    >
                      {order}
                    </SelectItem>
                  ))
                })()}
              </SelectContent>
            </Select>
          </div>

          {/* Coming Soon */}
          <div className='space-y-2'>
            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={formData.comingSoon}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    comingSoon: e.target.checked,
                  }))
                }
                className='w-4 h-4 text-[#F6B72D] bg-gray-100 border-gray-300 rounded focus:ring-[#F6B72D] focus:ring-2'
              />
              <span className='text-sm font-medium text-gray-700'>
                Coming Soon
              </span>
            </label>
          </div>

          {/* Assigned Advisors */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Assigned Advisors
            </label>
            <div className='border-2 border-[#F6B72D] rounded-lg p-4 max-h-48 overflow-y-auto'>
              {trainers.length > 0 ? (
                trainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className='flex items-center space-x-2 mb-2'
                  >
                    <input
                      type='checkbox'
                      id={`advisor-${trainer.id}`}
                      checked={formData.assignedAdvisors.includes(trainer.id)}
                      onChange={(e) => {
                        const advisorId = trainer.id
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            assignedAdvisors: [
                              ...prev.assignedAdvisors,
                              advisorId,
                            ],
                          }))
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            assignedAdvisors: prev.assignedAdvisors.filter(
                              (id) => id !== advisorId,
                            ),
                          }))
                        }
                      }}
                      className='rounded border-gray-300 text-[#F6B72D] focus:ring-[#F6B72D]'
                    />
                    <label
                      htmlFor={`advisor-${trainer.id}`}
                      className='text-sm font-medium text-gray-700 cursor-pointer'
                    >
                      {trainer.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className='text-sm text-gray-500'>Loading advisors...</p>
              )}
            </div>
            {formData.assignedAdvisors.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {formData.assignedAdvisors.map((advisorId) => {
                  const advisor = trainers.find((t) => t.id === advisorId)
                  return advisor ? (
                    <span
                      key={advisorId}
                      className='bg-[#F6B72D] text-white px-2 py-1 rounded-full text-xs'
                    >
                      {advisor.name}
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Featured Image */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Featured Image
            </label>
            <div className='border-2 border-[#F6B72D] rounded-xl p-6 text-center hover:border-[#F6B72D] transition'>
              {existingFeaturedImage && !featuredImage ? (
                <div className='w-20 h-20 border border-gray-300 rounded mx-auto mb-4 flex items-center justify-center overflow-hidden'>
                  <img
                    src={getAssetUrl(existingFeaturedImage)}
                    alt='Current featured image'
                    className='w-full h-full object-cover'
                  />
                </div>
              ) : (
                <div className='w-20 h-20 border border-gray-300 rounded mx-auto mb-4 flex items-center justify-center'>
                  <ImageIcon className='w-8 h-8 text-gray-400' />
                </div>
              )}
              <p className='text-sm text-gray-500 mb-3'>
                Upload featured image (max 100MB)
              </p>
              <p className='text-xs text-gray-400 mb-3'>
                {featuredImage
                  ? featuredImage.name
                  : existingFeaturedImage
                    ? 'Current image loaded'
                    : 'No file chosen'}
              </p>
              <Input
                type='file'
                accept='image/*'
                className='hidden'
                id='featuredImage'
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) {
                    // Check file size (max 5MB)
                    if (selectedFile.size > 5 * 1024 * 1024) {
                      alert('Featured image must be less than 5MB')
                      return
                    }
                    // Check file type
                    if (!selectedFile.type.startsWith('image/')) {
                      alert('Please select a valid image file')
                      return
                    }
                  }
                  setFeaturedImage(selectedFile || null)
                }}
              />
              <label
                htmlFor='featuredImage'
                className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block'
              >
                {existingFeaturedImage ? 'Change Image' : 'Choose Image'}
              </label>
            </div>
          </div>

          {/* Intro Video */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Intro Video
            </label>
            <div className='border-2 border-[#F6B72D] rounded-xl p-6 text-center hover:border-[#F6B72D] transition space-y-3'>
              {existingIntroVideo && !introVideo && (
                <video
                  src={existingIntroVideo}
                  controls
                  className='w-full max-w-md mx-auto rounded-lg border border-gray-200'
                />
              )}
              {!existingIntroVideo && !introVideo && (
                <p className='text-sm text-gray-500'>
                  No intro video uploaded yet
                </p>
              )}
              {introVideo && (
                <div className='flex items-center justify-center gap-2'>
                  <FileText className='w-4 h-4 text-blue-500' />
                  <span className='text-sm text-gray-700'>{introVideo.name}</span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setIntroVideo(null)}
                    className='text-red-500 hover:text-red-700 hover:bg-red-50'
                  >
                    Remove
                  </Button>
                </div>
              )}
              <p className='text-sm text-gray-500'>Upload intro video (max 100MB)</p>
              <Input
                type='file'
                accept='video/*'
                className='hidden'
                id='introVideo'
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) {
                    if (selectedFile.size > 100 * 1024 * 1024) {
                      alert('Intro video must be less than 100MB')
                      return
                    }
                    if (!selectedFile.type.startsWith('video/')) {
                      alert('Please select a valid video file')
                      return
                    }
                  }
                  setIntroVideo(selectedFile || null)
                }}
              />
              <label
                htmlFor='introVideo'
                className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block'
              >
                {existingIntroVideo || introVideo
                  ? 'Change Intro Video'
                  : 'Choose Intro Video'}
              </label>
            </div>
          </div>

          {/* Course Curriculum */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium text-gray-700'>
                Course Curriculum
              </label>
              <Button
                onClick={addChapter}
                className='bg-[#F6B72D] hover:bg-yellow-500  px-4 py-2 rounded-lg'
              >
                + ADD CHAPTER
              </Button>
            </div>

            {/* Existing Chapters */}
            <div className='space-y-3'>
              {formData.chapters.map((chapter, chapterIndex) => (
                <Card
                  key={chapter.id}
                  draggable={editingChapterId !== chapter.id}
                  onDragStart={() => setDraggedChapterId(chapter.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    moveChapter(draggedChapterId, chapter.id)
                    setDraggedChapterId(null)
                  }}
                  onDragEnd={() => setDraggedChapterId(null)}
                  className={`border-2 border-[#F6B72D] rounded-lg transition ${
                    draggedChapterId === chapter.id ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className='p-4'>
                    {editingChapterId === chapter.id ? (
                      // Edit Mode
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-600'>
                            Editing Week {chapterIndex + 1}
                          </span>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              onClick={saveEditingChapter}
                              className='bg-green-500 hover:bg-green-600 text-white'
                            >
                              Save
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={cancelEditingChapter}
                              className='border-gray-300'
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Input
                            value={editingChapterData.title}
                            onChange={(e) =>
                              setEditingChapterData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder='Chapter title'
                            className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg'
                          />
                        </div>

                        <div className='space-y-2'>
                          <label className='text-sm font-medium text-gray-700'>
                            Short Description
                          </label>
                          <Input
                            value={editingChapterData.shortDescription}
                            onChange={(e) =>
                              setEditingChapterData((prev) => ({
                                ...prev,
                                shortDescription: e.target.value,
                              }))
                            }
                            placeholder='Short summary shown in dashboard module lists'
                            className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg'
                          />
                        </div>

                        <div className='space-y-2'>
                          <label className='text-sm font-medium text-gray-700'>
                            Description
                          </label>
                          <RichTextEditor
                            value={editingChapterData.description}
                            onChange={(content) =>
                              setEditingChapterData((prev) => ({
                                ...prev,
                                description: content,
                              }))
                            }
                            placeholder='Chapter description'
                          />
                        </div>

                        <div className='space-y-2'>
                          <label className='text-sm font-medium text-gray-700'>
                            Video File
                          </label>
                          {editingChapterData.video ? (
                            <div className='flex items-center gap-2'>
                              <FileText className='w-4 h-4 text-blue-500' />
                              <span className='text-sm text-gray-700'>
                                {typeof editingChapterData.video === 'string'
                                  ? editingChapterData.video
                                  : editingChapterData.video.name}
                              </span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  setEditingChapterData((prev) => ({
                                    ...prev,
                                    video: null,
                                  }))
                                }
                                className='text-red-500 hover:text-red-700 hover:bg-red-50'
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                              <p className='text-sm text-gray-500 mb-2'>
                                No video uploaded
                              </p>
                              <Input
                                type='file'
                                accept='video/*'
                                className='hidden'
                                id={`editChapterVideo-${chapter.id}`}
                                onChange={(e) => {
                                  const selectedFile = e.target.files?.[0]
                                  if (selectedFile) {
                                    // Check file size (max 500MB for video)
                                    if (selectedFile.size > 500 * 1024 * 1024) {
                                      alert(
                                        'Video file must be less than 500MB',
                                      )
                                      return
                                    }
                                    // Check file type
                                    if (
                                      !selectedFile.type.startsWith('video/')
                                    ) {
                                      alert('Please select a valid video file')
                                      return
                                    }
                                    setEditingChapterData((prev) => ({
                                      ...prev,
                                      video: selectedFile,
                                    }))
                                  }
                                  // If no file selected, do nothing
                                }}
                              />
                              <label
                                htmlFor={`editChapterVideo-${chapter.id}`}
                                className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block text-sm'
                              >
                                Upload Video
                              </label>
                            </div>
                          )}
                        </div>

                        <div className='space-y-2'>
                          <label className='text-sm font-medium text-gray-700'>
                            Chapter Files
                          </label>
                          {editingChapterData.chapterFiles?.length > 0 ? (
                            <div className='space-y-2'>
                              {editingChapterData.chapterFiles.map((file, fileIndex) => (
                                <div
                                  key={`${chapter.id}-edit-file-${fileIndex}`}
                                  className='flex items-center gap-2'
                                >
                                  <FileText className='w-4 h-4 text-red-500' />
                                  <span className='text-sm text-gray-700'>
                                    {file.name || file.title}
                                  </span>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      setEditingChapterData((prev) => ({
                                        ...prev,
                                        chapterFiles: prev.chapterFiles.filter(
                                          (_, index) => index !== fileIndex,
                                        ),
                                      }))
                                    }
                                    className='text-red-500 hover:text-red-700 hover:bg-red-50'
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className='text-sm text-gray-500'>
                              No chapter files uploaded
                            </p>
                          )}
                          <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                            <Input
                              type='file'
                              multiple
                              className='hidden'
                              id={`editChapterFile-${chapter.id}`}
                              onChange={(e) => {
                                const selectedFiles = Array.from(
                                  e.target.files || [],
                                )
                                if (selectedFiles.length > 0) {
                                  setEditingChapterData((prev) => ({
                                    ...prev,
                                    chapterFiles: [
                                      ...prev.chapterFiles,
                                      ...selectedFiles,
                                    ],
                                  }))
                                }
                              }}
                            />
                            <label
                              htmlFor={`editChapterFile-${chapter.id}`}
                              className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block text-sm'
                            >
                              Add Files
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div
                          className='flex items-center justify-between cursor-pointer'
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <div className='flex items-center gap-3'>
                            <GripVertical className='w-4 h-4 text-gray-400 cursor-grab' />
                            <span className='text-sm font-medium text-gray-600'>
                              Week {chapterIndex + 1}
                            </span>
                            <span className='font-medium text-gray-900'>
                              {chapter.title}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='ghost'
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingChapter(chapter)
                              }}
                              className='text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteChapter(chapter.id)
                              }}
                              className='text-red-500 hover:text-red-700 hover:bg-red-50'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                            <span className='text-xs text-gray-500'>
                              {chapter.uploadDate}
                            </span>
                            {chapter.isExpanded ? (
                              <ChevronUp className='w-4 h-4 text-gray-400' />
                            ) : (
                              <ChevronDown className='w-4 h-4 text-gray-400' />
                            )}
                          </div>
                        </div>

                        {chapter.isExpanded && (
                          <div className='mt-4 space-y-3'>
                            {chapter.shortDescription && (
                              <p className='text-sm font-medium text-gray-700'>
                                {chapter.shortDescription}
                              </p>
                            )}
                            <p className='text-sm text-gray-600'>
                              {chapter.description}
                            </p>

                            {/* Video Section */}
                            <div className='space-y-2'>
                              <label className='text-sm font-medium text-gray-700'>
                                Video File
                              </label>
                              {chapter.video ? (
                                <div className='flex items-center gap-2'>
                                  <FileText className='w-4 h-4 text-blue-500' />
                                  <span className='text-sm text-gray-700'>
                                    {typeof chapter.video === 'string'
                                      ? chapter.video
                                      : chapter.video.name}
                                  </span>
                                </div>
                              ) : (
                                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                                  <p className='text-sm text-gray-500 mb-2'>
                                    No video uploaded
                                  </p>
                                  <Input
                                    type='file'
                                    accept='video/*'
                                    className='hidden'
                                    id={`chapterVideo-${chapter.id}`}
                                    onChange={(e) => {
                                      const selectedFile = e.target.files?.[0]
                                      if (selectedFile) {
                                        // Check file size (max 500MB for video)
                                        if (
                                          selectedFile.size >
                                          500 * 1024 * 1024
                                        ) {
                                          alert(
                                            'Video file must be less than 500MB',
                                          )
                                          return
                                        }
                                        // Check file type
                                        if (
                                          !selectedFile.type.startsWith(
                                            'video/',
                                          )
                                        ) {
                                          alert(
                                            'Please select a valid video file',
                                          )
                                          return
                                        }
                                        setFormData((prev) => ({
                                          ...prev,
                                          chapters: prev.chapters.map((chap) =>
                                            chap.id === chapter.id
                                              ? {
                                                  ...chap,
                                                  video: selectedFile,
                                                }
                                              : chap,
                                          ),
                                        }))
                                      }
                                      // If no file selected, do nothing - keep existing video
                                    }}
                                  />
                                  <label
                                    htmlFor={`chapterVideo-${chapter.id}`}
                                    className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block text-sm'
                                  >
                                    Upload Video
                                  </label>
                                </div>
                              )}
                            </div>

                            <div className='space-y-2'>
                              <label className='text-sm font-medium text-gray-700'>
                                Chapter Files
                              </label>
                              {chapter.chapterFiles?.length > 0 ? (
                                <div className='space-y-2'>
                                  {chapter.chapterFiles.map((file, fileIndex) => (
                                    <div
                                      key={`${chapter.id}-file-${fileIndex}`}
                                      className='flex items-center gap-2'
                                    >
                                      <FileText className='w-4 h-4 text-red-500' />
                                      <span className='text-sm text-gray-700'>
                                        {file.name || file.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className='text-sm text-gray-500'>
                                  No chapter files uploaded
                                </p>
                              )}
                              <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                                <Input
                                  type='file'
                                  multiple
                                  className='hidden'
                                  id={`chapterFile-${chapter.id}`}
                                  onChange={(e) => {
                                    const selectedFiles = Array.from(
                                      e.target.files || [],
                                    )
                                    if (selectedFiles.length > 0) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        chapters: prev.chapters.map((chap) =>
                                          chap.id === chapter.id
                                            ? {
                                                ...chap,
                                                chapterFiles: [
                                                  ...(chap.chapterFiles || []),
                                                  ...selectedFiles,
                                                ],
                                              }
                                            : chap,
                                        ),
                                      }))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`chapterFile-${chapter.id}`}
                                  className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block text-sm'
                                >
                                  Add Files
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* New Chapter Form */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Chapter Title
              </label>
              <Input
                value={newChapter.title}
                onChange={(e) =>
                  setNewChapter((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder='This is new chapter title'
                className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Short Description
              </label>
              <Input
                value={newChapter.shortDescription}
                onChange={(e) =>
                  setNewChapter((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                  }))
                }
                placeholder='Short summary shown in dashboard module lists'
                className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Description
              </label>
              <RichTextEditor
                value={newChapter.description}
                onChange={(content) =>
                  setNewChapter((prev) => ({
                    ...prev,
                    description: content,
                  }))
                }
                placeholder='This is the description of the new chapter'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Video File
              </label>
              {newChapter.video ? (
                <div className='flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-blue-500' />
                  <span className='text-sm text-gray-700'>
                    {newChapter.video.name}
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setNewChapter((prev) => ({
                        ...prev,
                        video: null,
                      }))
                    }
                    className='text-red-500 hover:text-red-700 hover:bg-red-50'
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                  <p className='text-sm text-gray-500 mb-2'>
                    No video uploaded
                  </p>
                  <Input
                    type='file'
                    accept='video/*'
                    className='hidden'
                    id='newChapterVideo'
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0]
                      if (selectedFile) {
                        // Check file size (max 500MB for video)
                        if (selectedFile.size > 500 * 1024 * 1024) {
                          alert('Video file must be less than 500MB')
                          return
                        }
                        // Check file type
                        if (!selectedFile.type.startsWith('video/')) {
                          alert('Please select a valid video file')
                          return
                        }
                        setNewChapter((prev) => ({
                          ...prev,
                          video: selectedFile,
                        }))
                      }
                      // If no file selected, do nothing
                    }}
                  />
                  <label
                    htmlFor='newChapterVideo'
                    className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block text-sm'
                  >
                    Upload Video
                  </label>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Chapter Files
              </label>
              {newChapter.chapterFiles?.length > 0 ? (
                <div className='space-y-2'>
                  {newChapter.chapterFiles.map((file, fileIndex) => (
                    <div
                      key={`new-chapter-file-${fileIndex}`}
                      className='flex items-center gap-2'
                    >
                      <FileText className='w-4 h-4 text-red-500' />
                      <span className='text-sm text-gray-700'>{file.name}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          setNewChapter((prev) => ({
                            ...prev,
                            chapterFiles: prev.chapterFiles.filter(
                              (_, index) => index !== fileIndex,
                            ),
                          }))
                        }
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No chapter files uploaded</p>
              )}
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                <Input
                  type='file'
                  multiple
                  className='hidden'
                  id='newChapterFile'
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || [])
                    if (selectedFiles.length > 0) {
                      setNewChapter((prev) => ({
                        ...prev,
                        chapterFiles: [...prev.chapterFiles, ...selectedFiles],
                      }))
                    }
                  }}
                />
                <label
                  htmlFor='newChapterFile'
                  className='cursor-pointer bg-[#F6B72D] text-white px-4 py-2 rounded-full font-medium hover:bg-[#e6b82a] inline-block text-sm'
                >
                  Add Files
                </label>
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium text-gray-700'>Files</label>
              <div>
                <Input
                  type='file'
                  multiple
                  className='hidden'
                  id='serviceFiles'
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || [])
                    const newFiles = selectedFiles.map((file, index) => ({
                      id: Date.now() + index,
                      name: file.name,
                      file: file,
                    }))
                    setUploadedFiles((prev) => [...prev, ...newFiles])
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  className='border-2 border-[#F6B72D] text-yellow-600 hover:bg-yellow-50 bg-transparent'
                  onClick={() =>
                    document.getElementById('serviceFiles')?.click()
                  }
                >
                  UPLOAD FILE
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              {/* Existing Files (when editing) */}
              {isEditing &&
                existingFiles.map((file) => (
                  <div
                    key={file.id}
                    className='flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText className='w-4 h-4 text-blue-500' />
                      <span className='text-sm text-gray-700'>
                        {file.title}
                      </span>
                      <span className='text-xs text-gray-500'>
                        ({(file.fileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <a
                        href={getAssetUrl(file.fileUrl)}
                        download={file.title}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-500 hover:text-blue-700 text-sm'
                      >
                        Download
                      </a>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeExistingFile(file.id)}
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

              {/* Newly Uploaded Files */}
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className='flex items-center justify-between p-2 bg-white rounded border'
                >
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-700'>{file.name}</span>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => removeFile(file.id)}
                    className='text-red-500 hover:text-red-700 hover:bg-red-50'
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4 pt-6 font-sans'>
            <Button
              onClick={handleCancel}
              variant='outline'
              className='flex-1 bg-black text-white hover:bg-gray-800 border-black px-16'
              disabled={loading}
            >
              CANCEL
            </Button>
            <Button
              type='submit'
              className='flex-1 bg-[#F6B72D] hover:bg-yellow-500 px-16'
              disabled={loading}
            >
              {loading
                ? isEditing
                  ? 'UPDATING...'
                  : 'CREATING...'
                : isEditing
                  ? 'UPDATE SERVICE'
                  : 'CREATE SERVICE'}
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
