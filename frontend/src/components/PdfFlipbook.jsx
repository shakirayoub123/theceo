import React, { useState, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use local worker bundled securely inside the app to prevent CORS and unpkg blocks
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

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
    const [numPages, setNumPages] = useState(null)
    const [error, setError] = useState(null)

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages)
        setError(null)
    }

    function onDocumentLoadError(e) {
        setError(e.message)
    }

    // Adjust width/height as needed for the flipbook container.
    // The layout will stretch inside the parent bounding box.
    const bookWidth = 460
    const bookHeight = 650

    return (
        <div className="w-full h-full bg-[#f8fafc] flex flex-col items-center justify-center py-6">
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
            ) : (
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    className="w-full h-full flex items-center justify-center"
                    loading={
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-[#F6B72D] border-t-transparent animate-spin" />
                            <span className="text-gray-600 font-bold">Loading Flipbook...</span>
                        </div>
                    }
                >
                    {numPages && (
                        <HTMLFlipBook
                            width={bookWidth}
                            height={bookHeight}
                            size="stretch"
                            minWidth={315}
                            maxWidth={1000}
                            minHeight={400}
                            maxHeight={1533}
                            maxShadowOpacity={0.5}
                            showCover={true}
                            mobileScrollSupport={true}
                            className="mt-6 md:mt-0 max-w-full"
                        >
                            {Array.from(new Array(numPages), (el, index) => {
                                const PageComponent = (index === 0 || index === numPages - 1) ? PageCover : PageFlipItem
                                return (
                                    <PageComponent key={`page_${index + 1}`}>
                                        <Page
                                            pageNumber={index + 1}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            width={bookWidth}
                                            className="bg-white"
                                            loading={<div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Page {index + 1}...</div>}
                                        />
                                    </PageComponent>
                                )
                            })}
                        </HTMLFlipBook>
                    )}
                </Document>
            )}
        </div>
    )
}
