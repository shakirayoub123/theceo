import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, CloudDownload, Maximize2, Printer, Bookmark } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import authService from '../services/authService'
import { getAssetUrl } from '../lib/utils'
import PdfFlipbook from './PdfFlipbook'
import groupBg from '@/assets/Group.png'
export default function NewsletterSection() {
  const { t } = useTranslation()
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNewsletter, setSelectedNewsletter] = useState(null)
  const [blobFileUrl, setBlobFileUrl] = useState(null)
  const [fileLoadError, setFileLoadError] = useState('')
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
    return raw ? getAssetUrl(raw) : null
  }

  const selectedFileUrl = selectedNewsletter
    ? getNewsletterFileUrl(selectedNewsletter)
    : null
  const viewerFileUrl = blobFileUrl || selectedFileUrl

  useEffect(() => {
    if (!selectedFileUrl) {
      setBlobFileUrl(null)
      setFileLoadError('')
      return
    }

    let cancelled = false
    let objectUrl = null

    const loadPdfAsBlob = async () => {
      try {
        setFileLoadError('')
        let response = await fetch(selectedFileUrl, {
          credentials: 'include',
        })

        if (response.status === 403) {
          const refreshedData = await authService.getAllNewsletters()
          const refreshedNewsletter = refreshedData?.newsletters?.find(
            (newsletter) =>
              String(newsletter.id) === String(selectedNewsletter.id),
          )
          const refreshedFileUrl = getNewsletterFileUrl(refreshedNewsletter)

          if (refreshedFileUrl) {
            response = await fetch(refreshedFileUrl, {
              credentials: 'include',
            })
          }
        }

        if (!response.ok) {
          throw new Error(`Unexpected server response (${response.status})`)
        }

        const pdfBlob = await response.blob()
        objectUrl = URL.createObjectURL(pdfBlob)
        if (!cancelled) {
          setBlobFileUrl(objectUrl)
        }
      } catch (err) {
        if (!cancelled) {
          setBlobFileUrl(null)
          setFileLoadError(err?.message || 'Failed to retrieve PDF')
        }
      }
    }

    loadPdfAsBlob()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFileUrl])

  if (loading) {
    return (
      <section className='py-16 md:py-24 bg-[#000023] relative font-jakarta'>
        <div className='flex justify-center items-center h-64 z-10 relative'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='py-16 md:py-24 bg-[#000023] relative font-jakarta'>
        <div className='flex justify-center items-center h-64 z-10 relative'>
          <p className='text-red-500 bg-white/10 px-6 py-3 rounded-xl font-medium tracking-wide'>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className='py-20 md:py-28 bg-[#000023] relative overflow-hidden font-jakarta w-full'>
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
        <div className='flex flex-col items-center text-center justify-center mb-16 max-w-4xl mx-auto'>
          <div className='inline-block border border-white/30 rounded-full px-5 py-[4px] mb-6'>
            <span className='text-white font-bold tracking-widest text-[11px] uppercase'>
              WHAT WE PROVIDE
            </span>
          </div>
          <h2 className='text-[36px] md:text-[52px] font-bold leading-none mb-6 tracking-tight'>
            <span className='text-white'>OUR </span>
            <span className='text-[#F6B72D] font-sans text-[40px] md:text-[56px]'>NEWSLETTERS</span>
          </h2>
          <p className='text-[#94A3B8] text-[15px] md:text-[17px] leading-relaxed font-medium mx-auto max-w-3xl'>
            Unlock a decisive competitive edge with our quarterly strategic briefing, where we deconstruct business-critical shifts across global continents and local markets, distilling high-stakes industry trends and corporate maneuvers into actionable leadership blueprints tailored for today's complex economic landscape.
          </p>
        </div>

        {/* Embedded App Interface */}
        <div className='bg-[#F1F5F9] rounded-[24px] overflow-hidden shadow-2xl flex flex-col w-full h-[800px] border border-white/10'>

          {/* Main App Grid (Split View) */}
          <div className='flex flex-col md:flex-row flex-1 overflow-hidden p-4 md:p-5 gap-5 pb-0 md:pb-5'>

            {/* Left Sidebar: Thumbnails */}
            <div className='w-full md:w-[280px] lg:w-[320px] bg-transparent overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-2 shrink-0 flex flex-col gap-4'>
              {displayEditions.map((edition, index) => {
                const isActive = selectedNewsletter?.id
                  ? selectedNewsletter.id === edition.id
                  : index === 0

                return (
                  <div
                    key={edition.id || index}
                    onClick={() => handleNewsletterSelect(edition)}
                    className={`rounded-[16px] overflow-hidden bg-white cursor-pointer transition-all duration-300 block my-1 shadow-sm border-2 ${isActive
                      ? 'border-[#F6B72D] shadow-md ring-2 ring-[#F6B72D]/20 transform scale-[1.02]'
                      : 'border-white hover:border-gray-300'
                      }`}
                  >
                    <div className='w-full aspect-[4/3] sm:aspect-video md:aspect-[4/3] bg-gray-100 flex items-center justify-center p-0 rounded-t-[14px] overflow-hidden'>
                      <img
                        src={
                          getAssetUrl(edition.thumbnailImage) ||
                          getAssetUrl(edition.image) ||
                          getAssetUrl(edition.cover_image) ||
                          '/images/ebook.svg'
                        }
                        alt={`${getEditionTitle(edition)} Newsletter`}
                        className='object-cover h-full w-full opacity-90 transition-opacity duration-300'
                        loading='lazy'
                      />
                    </div>
                    <div className='p-4 text-center bg-white border-t border-gray-100'>
                      <h3 className='text-[13px] md:text-[14px] font-bold text-[#0B132B] leading-snug'>
                        {getEditionTitle(edition)}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Viewer: PDF Instance */}
            <div className='flex-1 border border-gray-200 rounded-[20px] overflow-hidden bg-[#FCFCFC] shadow-sm relative h-full flex flex-col mt-4 md:mt-0'>
              <div
                ref={viewerRootRef}
                className='w-full h-full relative'
              >
                {viewerFileUrl ? (
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
          <div className='bg-white px-5 py-4 border-t border-gray-200 mt-auto flex flex-col md:flex-row items-center justify-between gap-4'>

            {/* Context Info */}
            <div className='flex items-center gap-4 w-full md:w-auto'>
              <div className='w-10 h-10 rounded-xl bg-[#FDF5DF] flex items-center justify-center shrink-0'>
                <CloudDownload className='w-5 h-5 text-[#CFA329]' />
              </div>
              <div>
                <h4 className='text-black font-bold text-[15px]'>Instant E-Book Access</h4>
                <p className='text-gray-400 text-[11px] font-medium tracking-wide'>
                  PDF • Secure Module • Instant Download • Unrestricted Offline Reading
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-3 w-full md:w-auto justify-end'>
              <a
                href={viewerFileUrl || selectedFileUrl || '#'}
                download
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 rounded-lg bg-[#0037B0] hover:bg-[#002b8a] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm'
              >
                <CloudDownload className='w-4 h-4' />
                Download Now
              </a>
              <a
                href={viewerFileUrl || selectedFileUrl || '#'}
                target='_blank'
                rel='noopener noreferrer'
                className='hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] border border-gray-200 hover:bg-gray-100 transition-colors px-4 py-2.5 text-[13px] font-semibold text-gray-700'
              >
                <Maximize2 className='w-4 h-4' />
                Read Full Screen
              </a>
              <button
                onClick={() => window.open(viewerFileUrl || selectedFileUrl)}
                className='hidden lg:inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] border border-gray-200 hover:bg-gray-100 transition-colors px-4 py-2.5 text-[13px] font-semibold text-gray-700'
              >
                <Printer className='w-4 h-4' />
                Print Guide
              </button>
              <button className='hidden lg:inline-flex items-center justify-center rounded-lg bg-[#F8FAFC] border border-gray-200 hover:bg-gray-100 transition-colors w-10 h-10 text-gray-600'>
                <Bookmark className='w-4 h-4' />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
