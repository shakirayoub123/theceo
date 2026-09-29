import { useEffect, useState } from 'react'
import { BookOpen, FileText, Upload, Loader2 } from 'lucide-react'
import clientAPIService from '@/services/clientAPIService'
import { getAssetUrl } from '@/lib/utils'
import { Button } from './ui/button'

export function MeetingResources({
  programId,
  programTitle,
  serviceDetails = null,
  allowUpload = false,
  showModules = true,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modules, setModules] = useState([])
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchResources = async () => {
      if (!programId) return

      if (serviceDetails) {
        const mappedModules =
          serviceDetails?.chapters?.map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            week: chapter.week,
            description: chapter.description,
          })) || []

        const mappedFiles =
          serviceDetails?.files?.map((file) => ({
            id: file.id,
            title: file.title,
            url: getAssetUrl(file.fileUrl),
            type: file.fileType || file.fileExtension,
            createdAt: file.createdAt,
          })) || []

        if (!isMounted) return
        setModules(mappedModules)
        setFiles(mappedFiles)
        return
      }

      setLoading(true)
      setError('')
      try {
        const data = await clientAPIService.getServiceDetails(programId)
        if (!isMounted) return

        const mappedModules =
          data?.chapters?.map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            week: chapter.week,
            description: chapter.description,
          })) || []

        const mappedFiles =
          data?.files?.map((file) => ({
            id: file.id,
            title: file.title,
            url: getAssetUrl(file.fileUrl),
            type: file.fileType || file.fileExtension,
            createdAt: file.createdAt,
          })) || []

        setModules(mappedModules)
        setFiles(mappedFiles)
      } catch (err) {
        console.error('Failed to load meeting resources:', err)
        if (isMounted) {
          setError(
            err?.message ||
              'Unable to load learning resources for this meeting.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchResources()
    return () => {
      isMounted = false
    }
  }, [programId, serviceDetails])

  const handleUpload = async () => {
    if (!selectedFile || !programId) return
    setUploading(true)
    setUploadMessage('')
    try {
      await clientAPIService.uploadClientFile(programId, selectedFile)
      setUploadMessage('File uploaded successfully.')
      setSelectedFile(null)

      // Refresh the resources list
      const data = await clientAPIService.getServiceDetails(programId)
      const mappedFiles =
        data?.files?.map((file) => ({
          id: file.id,
          title: file.title,
          url: getAssetUrl(file.fileUrl),
          type: file.fileType || file.fileExtension,
          createdAt: file.createdAt,
        })) || []
      setFiles(mappedFiles)
    } catch (err) {
      console.error('File upload failed:', err)
      setUploadMessage(err?.message || 'Failed to upload file.')
    } finally {
      setUploading(false)
    }
  }

  if (!programId) {
    return (
      <div className='border-2 border-[#F6B72D] rounded-xl p-4 bg-white'>
        <div className='text-sm text-gray-600'>
          No linked program was found for this meeting yet.
        </div>
      </div>
    )
  }

  return (
    <div className='border-2 border-[#F6B72D] rounded-xl p-6 bg-white'>
      <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Learning Resources
          </h3>
          {programTitle && (
            <p className='text-sm text-gray-600'>
              Linked program: {programTitle}
            </p>
          )}
        </div>
        {loading && (
          <div className='flex items-center text-gray-600 text-sm'>
            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            Loading resources...
          </div>
        )}
      </div>

      {error ? (
        <div className='text-red-600 text-sm'>{error}</div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            showModules ? 'lg:grid-cols-2' : ''
          } gap-4`}
        >
          {showModules && (
            <div className='border rounded-lg p-4 bg-gray-50'>
              <div className='flex items-center gap-2 mb-3'>
                <BookOpen className='h-4 w-4 text-[#F6B72D]' />
                <span className='font-semibold text-gray-900'>
                  Program Sessions
                </span>
              </div>
              {modules.length === 0 ? (
                <p className='text-sm text-gray-600'>
                  No sessions have been shared yet.
                </p>
              ) : (
                <div className='space-y-3 max-h-72 overflow-auto pr-1'>
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className='p-3 rounded-md border bg-white shadow-sm'
                    >
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-gray-900 text-sm'>
                          Week {module.week}: {module.title}
                        </h4>
                      </div>
                      {module.description && (
                        <p className='text-xs text-gray-600 mt-1 line-clamp-2'>
                          {module.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className='border rounded-lg p-4 bg-gray-50 flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-[#F6B72D]' />
              <span className='font-semibold text-gray-900'>Shared Files</span>
            </div>

            {files.length === 0 ? (
              <p className='text-sm text-gray-600'>No files uploaded yet.</p>
            ) : (
              <div className='space-y-2 max-h-64 overflow-auto pr-1'>
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    download={file.title}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-between p-3 rounded-md bg-white border hover:border-[#F6B72D] transition-colors'
                  >
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {file.title}
                      </p>
                      <p className='text-xs text-gray-600'>
                        {file.type || 'file'}
                      </p>
                    </div>
                    <span className='text-xs text-[#F6B72D] font-semibold'>
                      Download
                    </span>
                  </a>
                ))}
              </div>
            )}

            {allowUpload && (
              <div className='pt-2 border-t border-gray-200'>
                <label className='text-sm font-medium text-gray-700'>
                  Upload a file for this session
                </label>
                <input
                  type='file'
                  className='mt-2 w-full text-sm'
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className='flex items-center gap-2 mt-3'>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className='bg-[#F6B72D] hover:bg-[#e6b82a] text-black'
                  >
                    {uploading ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className='h-4 w-4 mr-2' />
                        Upload
                      </>
                    )}
                  </Button>
                  {selectedFile && (
                    <span className='text-xs text-gray-600'>
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                {uploadMessage && (
                  <p
                    className={`text-xs mt-2 ${
                      uploadMessage.includes('successfully')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {uploadMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MeetingResources
