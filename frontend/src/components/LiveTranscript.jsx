import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download } from 'lucide-react'

export function LiveTranscript() {
  const [entries, setEntries] = useState([
    { speaker: 'James', text: 'Yes, sure I can help.' },
    { speaker: 'Dr. Claire', text: 'Yes, sure I can help, too.' },
    { speaker: 'Client', text: 'Thanks' },
  ])
  const [draft, setDraft] = useState('')

  const content = useMemo(
    () => entries.map((e) => `${e.speaker}: ${e.text}`).join('\n'),
    [entries],
  )

  // Auto-scroll to bottom when new messages arrive
  const scrollBodyRef = useRef(null)
  useEffect(() => {
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = scrollBodyRef.current.scrollHeight
    }
  }, [entries])

  function addLine() {
    if (!draft.trim()) return
    setEntries((prev) => [...prev, { speaker: 'You', text: draft.trim() }])
    setDraft('')
  }

  function downloadTxt() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcript.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className='border-2 border-[#F6B72D] bg-white'>
      <CardHeader className='pb-0'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg uppercase tracking-wide'>
            Live Transcription
          </CardTitle>
          <Button
            variant='ghost'
            size='icon'
            onClick={downloadTxt}
            aria-label='Download transcript'
            className='hover:bg-[#F6B72D]/10'
          >
            <Download className='h-7 w-7' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='pt-3'>
        {/* Transcript area */}
        <div className='rounded-lg border border-gray-200'>
          <ScrollArea className='h-64'>
            <div ref={scrollBodyRef} className='p-3'>
              <ul className='space-y-3 font-exo'>
                {entries.map((e, idx) => (
                  <li key={idx} className='space-y-1'>
                    {/* <div className='text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
                      {e.speaker}
                    </div> */}
                    <div className='inline-block max-w-full rounded-2xl rounded-tl-none border border-gray-200 bg-[#FCFCF8] px-3 py-2 text-sm text-gray-900 shadow-sm'>
                      <span className='font-semibold'>{e.speaker}</span>:{' '}
                      {e.text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
