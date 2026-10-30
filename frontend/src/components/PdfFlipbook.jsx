import React, { useCallback, useEffect, useRef, useState, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Vite emits the worker as .js so production servers serve it with a JavaScript MIME type.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PageCover = forwardRef((props, ref) => {
    return (
        <div className="bg-white flex items-center justify-center overflow-hidden border-2 border-gray-300 shadow-xl" ref={ref} data-density="hard">
            <div className="w-full h-full flex items-center justify-center">
                {props.children}
            </div>
        </div>
    )
})
PageCover.displayName = 'PageCover'

const PageFlipItem = forwardRef((props, ref) => {
    return (
        <div className="bg-white shadow-[inset_-1px_0_10px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden" ref={ref}>
            <div className="w-full h-full overflow-hidden flex items-center justify-center bg-white">
                {props.children}
            </div>
        </div>
    )
})
PageFlipItem.displayName = 'PageFlipItem'

export default function PdfFlipbook({ fileUrl }) {
    const bookRef = useRef(null)
    const [pageImages, setPageImages] = useState([])
    const [numPages, setNumPages] = useState(null)
    const [error, setError] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [renderProgress, setRenderProgress] = useState(0)
    const [dimensions, setDimensions] = useState({ width: 300, height: 420 })
    const [isPortrait, setIsPortrait] = useState(false)

    const measureViewer = useCallback((node) => {
        if (!node) return

        const updateSize = () => {
            const { width, height } = node.getBoundingClientRect()
            if (!width || !height) return

            // portrait = single-page mode on very small screens only
            const portrait = width < 500
            const availableHeight = Math.max(220, height - 56)

            let pageWidth, pageHeight
            if (portrait) {
                // Single page: fill available width
                pageHeight = Math.min(availableHeight, (width - 16) * 1.414)
                pageWidth = Math.max(150, Math.floor(pageHeight / 1.414))
                pageHeight = Math.max(220, Math.floor(pageHeight))
            } else {
                // Two-page spread: each page is half the available width minus gap
                const halfWidth = (width - 48) / 2
                pageHeight = Math.min(availableHeight, halfWidth * 1.414)
                pageWidth = Math.max(200, Math.floor(pageHeight / 1.414))
                pageHeight = Math.max(280, Math.floor(pageHeight))
            }

            setIsPortrait(portrait)
            setDimensions({ width: pageWidth, height: pageHeight })
        }

        updateSize()
        const observer = new ResizeObserver(updateSize)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let cancelled = false
        let loadingTask
        const pageObjectUrls = []

        const renderPdfPages = async () => {
            setPageImages([])
            setNumPages(null)
            setPageNumber(1)
            setRenderProgress(0)
            setError(null)

            try {
                loadingTask = pdfjs.getDocument({ url: fileUrl })
                const pdf = await loadingTask.promise
                if (cancelled) return

                setNumPages(pdf.numPages)
                const renderedPages = []

                // Render stable image pages before handing them to page-flip.
                // react-pageflip reparents its children, which can otherwise
                // detach react-pdf canvases and leave visually blank pages.
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                    if (cancelled) return

                    const page = await pdf.getPage(pageNumber)
                    const initialViewport = page.getViewport({ scale: 1 })
                    const scale = Math.min(850 / initialViewport.width, 1200 / initialViewport.height)
                    const viewport = page.getViewport({ scale })
                    const canvas = document.createElement('canvas')
                    const context = canvas.getContext('2d', { alpha: false })

                    if (!context) throw new Error('Your browser could not create a PDF page canvas.')

                    canvas.width = Math.ceil(viewport.width)
                    canvas.height = Math.ceil(viewport.height)
                    context.fillStyle = '#ffffff'
                    context.fillRect(0, 0, canvas.width, canvas.height)

                    await page.render({
                        canvasContext: context,
                        viewport,
                    }).promise

                    const pageBlob = await new Promise((resolve, reject) => {
                        canvas.toBlob(
                            (blob) => blob ? resolve(blob) : reject(new Error(`Could not prepare page ${pageNumber}.`)),
                            'image/jpeg',
                            0.88,
                        )
                    })
                    const pageObjectUrl = URL.createObjectURL(pageBlob)
                    pageObjectUrls.push(pageObjectUrl)
                    renderedPages.push(pageObjectUrl)
                    canvas.width = 0
                    canvas.height = 0
                    page.cleanup()
                    setRenderProgress(Math.round((pageNumber / pdf.numPages) * 100))
                }

                if (!cancelled) setPageImages(renderedPages)
                await pdf.destroy()
            } catch (loadError) {
                if (!cancelled) setError(loadError?.message || 'Could not render this PDF.')
            }
        }

        renderPdfPages()

        return () => {
            cancelled = true
            if (loadingTask) loadingTask.destroy()
            pageObjectUrls.forEach((pageUrl) => URL.revokeObjectURL(pageUrl))
        }
    }, [fileUrl])

    const handlePageFlip = ({ data }) => setPageNumber(data + 1)
    const goToPreviousPage = () => bookRef.current?.pageFlip()?.flipPrev()
    const goToNextPage = () => bookRef.current?.pageFlip()?.flipNext()

    return (
        <div ref={measureViewer} className="w-full h-full min-h-0 bg-[#f8fafc] flex flex-col items-center justify-center px-3 py-2">
            {error ? (
                <div className="text-center p-8 text-black">
                    <p className="font-bold text-lg mb-2">Could not render Flipbook.</p>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#111827] text-white px-6 py-2 rounded-full"
                    >
                        Download Directly
                    </a>
                </div>
            ) : pageImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-600 font-semibold">
                    <div className="w-7 h-7 rounded-full border-2 border-[#F6B72D] border-t-transparent animate-spin" />
                    <span>Preparing flipbook pages… {renderProgress}%</span>
                </div>
            ) : (
                <div className="w-full min-h-0 flex-1 flex items-center justify-center overflow-hidden">
                    <HTMLFlipBook
                        ref={bookRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        size="fixed"
                        minWidth={150}
                        maxWidth={700}
                        minHeight={220}
                        maxHeight={1200}
                        maxShadowOpacity={0.45}
                        showCover={true}
                        usePortrait={isPortrait}
                        mobileScrollSupport={true}
                        onFlip={handlePageFlip}
                        className="shadow-2xl"
                        drawShadow={true}
                        flippingTime={700}
                        startPage={0}
                    >
                        {pageImages.map((imageSrc, index) => {
                            const PageComponent = (index === 0 || index === numPages - 1) ? PageCover : PageFlipItem
                            return (
                                <PageComponent key={`page_${index + 1}`}>
                                    <img
                                        src={imageSrc}
                                        alt={`Newsletter page ${index + 1}`}
                                        draggable="false"
                                        className="block w-full h-full object-contain bg-white"
                                    />
                                </PageComponent>
                            )
                        })}
                    </HTMLFlipBook>
                </div>
            )}
            {numPages && !error && (
                <div className="relative z-10 flex items-center justify-center gap-5 shrink-0 pt-2 text-[#000023]">
                    <button
                        type="button"
                        onClick={goToPreviousPage}
                        disabled={pageNumber <= 1}
                        aria-label="Previous newsletter page"
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center disabled:opacity-40 hover:border-[#F6B72D] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="min-w-[110px] text-center text-xs font-semibold text-gray-600">
                        {isPortrait
                            ? `Page ${pageNumber} of ${numPages}`
                            : `Pages ${pageNumber}–${Math.min(pageNumber + 1, numPages)} of ${numPages}`
                        }
                    </span>
                    <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        aria-label="Next newsletter page"
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center disabled:opacity-40 hover:border-[#F6B72D] transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
