import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

export function EditDetails({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    shortDescription: initialData?.shortDescription || '',
    description: initialData?.description || '',
    aiChatbotEnabled: initialData?.aiChatbotEnabled || false,
    chapters: initialData?.chapters || [
      {
        id: '1',
        week: 1,
        title: 'Foundations of Leadership',
        description: 'This is a description of current chapter.',
        uploadDate: 'Uploaded on 12th March, 2024',
        files: [{ id: '1', name: 'Foundations Content.pdf', type: 'pdf' }],
        isExpanded: true,
      },
    ],
  })

  const [newChapter, setNewChapter] = useState({
    title: '',
    description: '',
  })

  const [uploadedFiles, setUploadedFiles] = useState([
    { id: '1', name: 'Foundations Content.pdf', type: 'pdf' },
    { id: '2', name: 'Foundations Content.pdf', type: 'pdf' },
  ])

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
        description: newChapter.description,
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
        chapters: [...prev.chapters, newChapterData],
      }))

      setNewChapter({ title: '', description: '' })
    }
  }

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSubmit = () => {
    onSubmit?.(formData)
  }

  return (
    <div className=' mx-auto space-y-6 min-h-screen font-exo'>
      {/* Title */}
      <div className='space-y-2'>
        <label className='text-sm font-medium text-gray-700'>Title</label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder='Live Leadership Coaching & Executive Mentoring 12-week Programs'
          className=' input-field '
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
        <label className='text-sm font-medium text-gray-700'>Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder='This is a long description'
          className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg min-h-[120px] resize-none'
        />
      </div>

      {/* AI Chatbot Toggle */}
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium text-gray-700'>
          AI Chatbot Enabled?
        </label>
        <Switch
          checked={formData.aiChatbotEnabled}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, aiChatbotEnabled: checked }))
          }
        />
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
          {formData.chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className='border-2 border-[#F6B72D] rounded-lg'
            >
              <CardContent className='p-4'>
                <div
                  className='flex items-center justify-between cursor-pointer'
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className='flex items-center gap-3'>
                    <span className='text-sm font-medium text-gray-600'>
                      Week {chapter.week}
                    </span>
                    <span className='font-medium text-gray-900'>
                      {chapter.title}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
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
                    <p className='text-sm text-gray-600'>
                      {chapter.description}
                    </p>

                    {chapter.files.length > 0 && (
                      <div className='space-y-2'>
                        <span className='text-sm font-medium text-gray-700'>
                          Files:
                        </span>
                        {chapter.files.map((file) => (
                          <div
                            key={file.id}
                            className='flex items-center gap-2'
                          >
                            <FileText className='w-4 h-4 text-red-500' />
                            <span className='text-sm text-gray-700'>
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
            Description
          </label>
          <Textarea
            value={newChapter.description}
            onChange={(e) =>
              setNewChapter((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder='This is the description of the new chapter'
            className='border-2 border-[#F6B72D] focus:border-yellow-400 rounded-lg min-h-[120px] resize-none'
          />
        </div>
      </div>

      {/* Files Section */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <label className='text-sm font-medium text-gray-700'>Files</label>
          <Button
            variant='outline'
            className='border-2 border-[#F6B72D] text-yellow-600 hover:bg-yellow-50 bg-transparent'
          >
            UPLOAD FILE
          </Button>
        </div>

        <div className='space-y-2'>
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
      <div className='flex inline-flex gap-4 pt-6 font-sans'>
        <Button
          onClick={onCancel}
          variant='outline'
          className='flex-1 bg-black text-white hover:bg-gray-800 border-black px-16'
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSubmit}
          className='flex-1 bg-[#F6B72D] hover:bg-yello-500  px-16'
        >
          SUBMIT
        </Button>
      </div>
    </div>
  )
}
