import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useState } from 'react'
import { SpecialZoomLevel, Viewer, Worker } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'

export function FileViewerModal({ isOpen, onClose, file }) {
  const [pdfPassword, setPdfPassword] = useState('')
  const [pdfPasswordError, setPdfPasswordError] = useState('')
  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  if (!isOpen || !file) return null

  const renderFileContent = () => {
    const fileType = file.type?.toLowerCase()
    const fileUrl = file.url

    if (fileType === 'pdf') {
      return (
        <Worker workerUrl={pdfWorkerUrl}>
          <div className='h-full'>
            <Viewer
              fileUrl={fileUrl}
              defaultScale={SpecialZoomLevel.PageFit}
              plugins={[defaultLayoutPluginInstance]}
              renderProtectedView={({ passwordStatus, verifyPassword }) => (
                <div className='flex h-full items-center justify-center p-8'>
                  <div className='w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
                    <p className='mb-2 text-lg font-semibold text-gray-900'>
                      Password protected PDF
                    </p>
                    <p className='mb-4 text-sm text-gray-600'>
                      Enter the PDF password to open this file.
                    </p>
                    <Input
                      type='password'
                      value={pdfPassword}
                      onChange={(e) => {
                        setPdfPassword(e.target.value)
                        setPdfPasswordError('')
                      }}
                      placeholder='Enter PDF password'
                      className='mb-3'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && pdfPassword.trim()) {
                          verifyPassword(pdfPassword)
                        }
                      }}
                    />
                    {(pdfPasswordError ||
                      passwordStatus === 'WrongPassword') && (
                      <p className='mb-3 text-sm text-red-600'>
                        {pdfPasswordError || 'Incorrect password. Try again.'}
                      </p>
                    )}
                    <div className='flex gap-3'>
                      <Button
                        onClick={() => {
                          if (!pdfPassword.trim()) {
                            setPdfPasswordError('Password is required.')
                            return
                          }
                          verifyPassword(pdfPassword)
                        }}
                        className='bg-[#F6B72D] hover:bg-yellow-500'
                      >
                        Unlock PDF
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => window.open(fileUrl, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              renderError={() => (
                <div className='flex flex-col items-center justify-center h-full text-center p-8'>
                  <p className='text-lg mb-4'>Unable to display PDF directly.</p>
                  <Button
                    onClick={() => window.open(fileUrl, '_blank')}
                    className='bg-[#F6B72D] hover:bg-yellow-500'
                  >
                    Open PDF in New Tab
                  </Button>
                </div>
              )}
            />
          </div>
        </Worker>
      )
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <div className='flex items-center justify-center h-full'>
          <img
            src={fileUrl}
            alt={file.name}
            className='max-w-full max-h-full object-contain'
          />
        </div>
      )
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(fileType)) {
      return (
        <div className='flex items-center justify-center h-full'>
          <video
            src={fileUrl}
            controls
            className='max-w-full max-h-full'
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    } else {
      // For other file types, try to display as iframe or show download link
      return (
        <div className='flex flex-col items-center justify-center h-full text-center p-8'>
          <p className='text-lg mb-4'>
            This file type cannot be previewed directly.
          </p>
          <Button
            onClick={() => window.open(fileUrl, '_blank')}
            className='bg-[#F6B72D] hover:bg-yellow-500'
          >
            Open File
          </Button>
        </div>
      )
    }
  }

  const handleClose = () => {
    setPdfPassword('')
    setPdfPasswordError('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4'
        onClick={handleClose}
      >
        {/* Modal Content */}
        <div
          className='bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex justify-between items-center p-4 border-b'>
            <h3 className='text-lg font-semibold truncate'>{file.name}</h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClose}
              className='shrink-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-hidden'>{renderFileContent()}</div>
        </div>
      </div>
    </>
  )
}
