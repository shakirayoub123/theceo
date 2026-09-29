import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function WebSearch() {
  const [query, setQuery] = useState('')
  const src = useMemo(() => {
    const q = query.trim()
    if (!q) return 'https://www.google.com/webhp?igu=1'
    return `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`
  }, [query])

  return (
    <Card className='border-2 border-[#F6B72D] bg-white'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg font-semibold text-foreground'>
          Web Search
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='overflow-hidden rounded-xl border border-gray-200'>
          <iframe
            title='Google Search'
            src={src}
            className='h-[420px] w-full'
            referrerPolicy='no-referrer-when-downgrade'
            sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox'
          />
        </div>
      </CardContent>
    </Card>
  )
}
