import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, CloudDownload, Maximize2, Printer, Bookmark } from 'lucide-react'

import authService from '../services/authService'
import { getAssetUrl } from '../lib/utils'
import PdfFlipbook from './PdfFlipbook'
import groupBg from '@/assets/Group.png'
export default function NewsletterSection() {
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNewsletter, setSelectedNewsletter] = useState(null)
  const [blobFileUrl, setBlobFileUrl] = useState(null)
  const [fileLoadError, setFileLoadError] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const viewerRootRef = useRef(null)

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoading(true)
        const response = await authService.getAllNewsletters()
        const items = response?.newsletters || []
        setNewsletters(items)
        if (items.length > 0) setSelectedNewsletter(items[0])
        setError(null)
      } catch (err) {
        console.error('Error fetching newsletters:', err)
        setError('Failed to load newsletters')
        setNewsletters([])
      } finally {
        setLoading(false)
      }
    }
    fetchNewsletters()
  }, [])

  const fallbackEditions = [
    {
      id: 'fallback-1',
      title: 'AI Leadership in North America: Workforce, Ethics & Environmental Impact',
      image: '/images/blog1.svg',
    },
    {
      id: 'fallback-2',
      title: 'Global Aviation Leadership Across the Skies Workforce, Governance & Environmental Impact',
      image: '/images/blog2.svg',
    },
    {
      id: 'fallback-3',
      title: 'Global Leadership Performance Optimization in the Global EV Marketplace',
      image: '/images/blog.svg',
    },
  ]

  const displayEditions = newsletters.length > 0 ? newsletters : fallbackEditions

  const handleNewsletterSelect = (newsletter) => {
    setSelectedNewsletter(newsletter)
  }

  const getEditionTitle = (edition) =>
    edition?.title || edition?.month || 'Newsletter Edition'

  const getNewsletterFileUrl = (item) => {
    const raw =
      item?.fileUrl ||
      item?.file_url ||
      item?.pdf ||
      item?.file ||
      item?.url ||
      null
    if (!raw) return null

    const resolvedUrl = getAssetUrl(raw)
    if (typeof window === 'undefined') return resolvedUrl

    try {
      const parsedUrl = new URL(resolvedUrl, window.location.href)
      const localHosts = ['localhost', '127.0.0.1', '::1']
      const isLocalFrontend = localHosts.includes(window.location.hostname)
      const isLocalBackend =
        localHosts.includes(parsedUrl.hostname) && parsedUrl.port === '8000'

      // Vite proxies /api to Django. Reuse that proxy for signed PDF URLs so
      // browser CORS rules do not block local development requests.
      if (isLocalFrontend && isLocalBackend && parsedUrl.pathname.startsWith('/api/')) {
        return `${window.location.origin}${parsedUrl.pathname}${parsedUrl.search}`
      }
      return parsedUrl.href
    } catch {
      return resolvedUrl
    }
  }

  const selectedFileUrl = selectedNewsletter
    ? getNewsletterFileUrl(selectedNewsletter)
    : null
  const selectedNewsletterId = selectedNewsletter?.id
  const viewerFileUrl = blobFileUrl || selectedFileUrl

  useEffect(() => {
    if (!selectedFileUrl) {
      setBlobFileUrl(null)
      setFileLoadError('')
      setFileLoading(false)
      return
    }

    let cancelled = false
    let objectUrl = null

    const loadPdfAsBlob = async () => {
      try {
        setFileLoading(true)
        setFileLoadError('')
        setBlobFileUrl(null)
        let response = await fetch(selectedFileUrl, {
          credentials: 'include',
        })

        if (response.status === 401 || response.status === 403) {
          const refreshedData = await authService.getAllNewsletters()
          const refreshedNewsletter = refreshedData?.newsletters?.find(
            (newsletter) =>
              String(newsletter.id) === String(selectedNewsletterId),
          )
          const refreshedFileUrl = getNewsletterFileUrl(refreshedNewsletter)

          if (refreshedFileUrl) {
            response = await fetch(refreshedFileUrl, {
              credentials: 'include',
            })
          }
        }

        if (!response.ok) {
          throw new Error(`PDF request failed (${response.status})`)
        }

        const pdfBlob = await response.blob()
        if (pdfBlob.size === 0) {
          throw new Error('The newsletter PDF is empty.')
        }
        objectUrl = URL.createObjectURL(pdfBlob)
        if (!cancelled) {
          setBlobFileUrl(objectUrl)
        }
      } catch (err) {
        if (!cancelled) {
          setBlobFileUrl(null)
          setFileLoadError(err?.message || 'Could not load the newsletter PDF.')
          console.error('Failed to retrieve newsletter PDF:', err)
        }
      } finally {
        if (!cancelled) {
          setFileLoading(false)
        }
      }
    }

    loadPdfAsBlob()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFileUrl, selectedNewsletterId])

  if (loading) {
    return (
      <section className='py-10 md:py-12 bg-[#000023] relative font-jakarta'>
        <div className='flex justify-center items-center h-64 z-10 relative'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='py-10 md:py-12 bg-[#000023] relative font-jakarta'>
        <div className='flex justify-center items-center h-64 z-10 relative'>
          <p className='text-red-500 bg-white/10 px-6 py-3 rounded-xl font-medium tracking-wide'>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className='py-8 lg:py-10 min-h-[calc(100svh-80px)] flex flex-col justify-center bg-[#000023] relative overflow-hidden font-jakarta w-full'>
      {/* Background Topo Pattern */}
      <div
        className='absolute inset-0 z-0 opacity-100 pointer-events-none'
        style={{
          backgroundImage: `url("${groupBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>

        {/* Header Block */}
        <div className='flex flex-col items-center text-center justify-center mb-6 md:mb-7 max-w-4xl mx-auto'>
          <div className='inline-block border border-white/30 rounded-full px-4 py-[3px] mb-2'>
            <span className='text-white font-bold tracking-widest text-[9px] uppercase'>
              WHAT WE PROVIDE
            </span>
          </div>
          <h2 className='text-[28px] md:text-[38px] font-bold leading-none mb-3 tracking-tight'>
            <span className='text-white'>OUR </span>
            <span className='text-[#F6B72D] font-sans text-[32px] md:text-[42px]'>QUARTERLY NEWSLETTERS</span>
          </h2>
          <p className='text-[#CBD5E1] text-[12px] md:text-[14px] leading-[19px] md:leading-[22px] font-medium mx-auto max-w-4xl'>
            Unlock a decisive competitive edge with our quarterly strategic briefing, where we deconstruct business-critical shifts across global continents and local markets, distilling high-stakes industry trends and corporate maneuvers into actionable leadership blueprints tailored for today's complex economic landscape.
          </p>
        </div>

        {/* Embedded App Interface */}
        <div className='bg-[#F1F5F9] rounded-[20px] overflow-hidden shadow-2xl flex flex-col w-full min-h-[540px] h-[min(76svh,760px)] border border-white/10'>

          {/* Main App Grid (Split View) */}
          <div className='flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4 pb-0 md:pb-4'>

            {/* Left Sidebar: Thumbnails */}
            <div className='newsletter-sidebar-scroll w-full md:w-[230px] lg:w-[260px] md:h-full bg-transparent overflow-x-auto md:overflow-x-hidden md:overflow-y-auto pb-2 md:pb-0 md:pr-2 shrink-0 flex flex-row md:flex-col items-stretch gap-3'>
              {displayEditions.map((edition, index) => {
                const isActive = selectedNewsletter?.id
                  ? selectedNewsletter.id === edition.id
                  : index === 0

                return (
                  <button
                    type='button'
                    key={edition.id || index}
                    onClick={() => handleNewsletterSelect(edition)}
                    aria-pressed={isActive}
                    className={`group w-[140px] sm:w-[160px] md:w-full min-w-0 shrink-0 rounded-[12px] overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border-[2px] ${isActive
                        ? 'border-[#F6B72D] shadow-md ring-2 ring-[#F6B72D]/25'
                        : 'border-transparent hover:border-[#CBD5E1]'
                      }`}
                  >
                    <div className='w-full h-[140px] sm:h-[165px] md:h-[185px] bg-[#E8EDF3] rounded-[10px] overflow-hidden'>
                      <img
                        src={
                          getAssetUrl(edition.thumbnailImage?.url || edition.thumbnailImage) ||
                          getAssetUrl(edition.thumbnailImageUrl) ||
                          getAssetUrl(edition.image) ||
                          getAssetUrl(edition.cover_image) ||
                          '/images/ebook.svg'
                        }
                        alt={`${getEditionTitle(edition)}`}
                        className='object-cover h-full w-full transition-transform duration-300 group-hover:scale-[1.04]'
                        loading='lazy'
                        onError={(event) => { event.currentTarget.src = '/images/ebook.svg' }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right Viewer: PDF Instance */}
            <div className='flex-1 min-w-0 min-h-[280px] md:min-h-0 border border-gray-200 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-[#FCFCFC] shadow-sm relative h-full flex flex-col mt-0'>
              <div
                ref={viewerRootRef}
                className='w-full h-full relative'
              >
                {fileLoading ? (
                  <div className='h-full flex items-center justify-center bg-[#FCFCFC]'>
                    <div className='flex items-center gap-3 text-gray-600 font-semibold'>
                      <span className='w-5 h-5 rounded-full border-2 border-[#F6B72D] border-t-transparent animate-spin' />
                      Loading newsletter...
                    </div>
                  </div>
                ) : fileLoadError ? (
                  <div className='h-full flex items-center justify-center bg-[#FCFCFC] p-6'>
                    <div className='text-center max-w-md'>
                      <h3 className='text-lg font-bold text-gray-900 mb-2'>
                        Newsletter could not be opened
                      </h3>
                      <p className='text-sm text-gray-500 mb-4'>{fileLoadError}</p>
                      {selectedFileUrl && (
                        <a
                          href={selectedFileUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex rounded-full bg-[#111827] text-white px-5 py-2 text-sm'
                        >
                          Open PDF directly
                        </a>
                      )}
                    </div>
                  </div>
                ) : viewerFileUrl ? (
                  <PdfFlipbook fileUrl={viewerFileUrl} />
                ) : (
                  <div className='h-full flex items-center justify-center bg-[#FCFCFC]'>
                    <div className='text-center'>
                      <div className='text-5xl mb-4 opacity-50'>📄</div>
                      <h3 className='text-lg font-bold text-gray-700 mb-2'>
                        Select a Newsletter
                      </h3>
                      <p className='text-sm text-gray-400'>
                        Choose an edition from the menu to open.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Action Bar */}
          <div className='bg-white px-4 py-3 border-t border-gray-200 mt-auto flex flex-col md:flex-row items-center justify-between gap-3'>

            {/* Context Info */}
            <div className='flex items-center gap-3 w-full md:w-auto'>
              <div className='w-9 h-9 rounded-xl bg-[#FDF5DF] flex items-center justify-center shrink-0'>
                <CloudDownload className='w-4 h-4 text-[#CFA329]' />
              </div>
              <div>
                <h4 className='text-black font-bold text-[14px]'>Instant E-Book Access</h4>
                <p className='text-gray-400 text-[10px] md:text-[10.5px] font-medium tracking-wide'>
                  PDF • Secure Module • Instant Download • Unrestricted Offline Reading
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2 w-full md:w-auto justify-end'>
              <a
                href={viewerFileUrl || selectedFileUrl || '#'}
                download
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 rounded-lg bg-[#0037B0] hover:bg-[#002b8a] transition-colors px-4 py-2 text-[12px] font-bold text-white shadow-sm'
              >
                <CloudDownload className='w-3.5 h-3.5' />
                Download Now
              </a>
              <a
                href={viewerFileUrl || selectedFileUrl || '#'}
                target='_blank'
                rel='noopener noreferrer'
                className='hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] border border-gray-200 hover:bg-gray-100 transition-colors px-3 py-2 text-[12px] font-semibold text-gray-700'
              >
                <Maximize2 className='w-3.5 h-3.5' />
                Full Screen
              </a>
              <button
                onClick={() => window.open(viewerFileUrl || selectedFileUrl)}
                className='hidden lg:inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] border border-gray-200 hover:bg-gray-100 transition-colors px-3 py-2 text-[12px] font-semibold text-gray-700'
              >
                <Printer className='w-3.5 h-3.5' />
                Print Guide
              </button>
              <button className='hidden lg:inline-flex items-center justify-center rounded-lg bg-[#F8FAFC] border border-gray-200 hover:bg-gray-100 transition-colors w-8 h-8 text-gray-600'>
                <Bookmark className='w-3.5 h-3.5' />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
