import { Fragment, useEffect, useRef, useState } from 'react'
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, ArrowUpRight } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import chatbotService from '@/services/chatbotService'
import ReactMarkdown from 'react-markdown'

export default function WebsiteQuestionChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const suggestions = [
    'What services do you offer?',
    'Who are the influencers?',
    'Tell me about newsletters',
    'What is The Human Algorithm?',
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const askQuestion = async (event) => {
    event?.preventDefault()
    const text = question.trim()
    if (!text || isLoading) return

    setMessages((current) => [...current, { sender: 'user', text }])
    setQuestion('')
    setError('')
    setIsLoading(true)

    try {
      const conversation = messages.slice(-8).map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }))
      const result = await chatbotService.askWebsiteQuestion(text, conversation)
      setMessages((current) => [
        ...current,
        {
          sender: 'assistant',
          text: result.answer,
          sources: result.sources || [],
          imageRequested: Boolean(result.image_requested),
        },
      ])
    } catch (requestError) {
      setError(requestError.message || 'Unable to search website information right now.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className='fixed bottom-24 right-6 z-[70]'>
        <Button
          type='button'
          onClick={() => setIsOpen(true)}
          className='h-14 gap-2 rounded-full border border-white/20 bg-[#0B132B] px-5 text-white shadow-[0_12px_30px_rgba(11,19,43,0.28)] transition-transform hover:scale-105 hover:bg-[#17264A]'
          aria-label='Ask questions about our website'
          title='Open the AI Website Assistant'
        >
          <Bot className='h-5 w-5 text-[#F6B72D]' />
          <span className='text-sm font-bold'>Ask AI</span>
        </Button>
      </div>
    )
  }

  return (
    <div className='fixed bottom-24 right-6 z-[70] w-[min(420px,calc(100vw-2rem))] max-sm:bottom-[5.5rem] max-sm:right-3 max-sm:w-[calc(100vw-1.5rem)]'>
      <Card className={`flex ${isMinimized ? 'h-[68px]' : 'h-[min(640px,calc(100dvh-8rem))] max-sm:h-[min(600px,calc(100dvh-10rem))]'} flex-col overflow-hidden rounded-[24px] border border-[#E6E2DA] bg-white shadow-[0_24px_70px_rgba(11,19,43,0.22)]`}>
        <CardHeader className='flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-[#EEEAE2] bg-white px-5 py-4'>
          <div className='flex min-w-0 items-center gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] shadow-sm'>
              <Bot className='h-5 w-5 text-[#F6B72D]' />
            </span>
            <div className='min-w-0'>
              <CardTitle className='text-[15px] font-bold leading-tight text-[#0B132B]'>
                AI Website Assistant
            </CardTitle>
              {!isMinimized && (
                <p className='mt-1 flex items-center gap-1.5 text-[11px] text-[#747987]'>
                  <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                  Here to help you explore TCI
                </p>
              )}
            </div>
          </div>
          <div className='ml-2 flex shrink-0 items-center gap-1'>
            <Button type='button' onClick={() => setIsMinimized((value) => !value)} variant='ghost' size='sm' className='h-9 w-9 rounded-full p-0 text-[#596174] hover:bg-[#F6F4F0]' aria-label={isMinimized ? 'Expand chatbot' : 'Minimize chatbot'}>
              {isMinimized ? <Maximize2 className='h-4 w-4' /> : <Minimize2 className='h-4 w-4' />}
            </Button>
            <Button type='button' onClick={() => setIsOpen(false)} variant='ghost' size='sm' className='h-9 w-9 rounded-full p-0 text-[#596174] hover:bg-[#F6F4F0]' aria-label='Close chatbot'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className='flex min-h-0 flex-1 flex-col p-0'>
            <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5' aria-live='polite'>
              {messages.length === 0 && (
                <div className='my-auto space-y-5'>
                  <div className='rounded-2xl border border-[#F0E7D2] bg-gradient-to-br from-[#FFFBF2] to-[#F8F6F2] p-5'>
                    <span className='mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6B72D]/20 text-[#9A6700]'>
                      <Sparkles className='h-4 w-4' />
                    </span>
                    <h3 className='text-[17px] font-bold tracking-tight text-[#0B132B]'>What would you like to know?</h3>
                    <p className='mt-2 text-[13px] leading-5 text-[#596174]'>Ask me about our services, influencers, blogs, eBooks, or newsletters. I’ll find the relevant information from the site.</p>
                  </div>
                  <div>
                    <p className='mb-2.5 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9297A3]'>Quick questions</p>
                    <div className='grid grid-cols-2 gap-2'>
                    {suggestions.map((prompt) => (
                      <button
                        key={prompt}
                        type='button'
                        onClick={() => {
                          setQuestion(prompt)
                          setTimeout(() => document.getElementById('website-assistant-input')?.focus(), 0)
                        }}
                        className='group flex min-h-[54px] items-center justify-between gap-2 rounded-xl border border-[#E9E6DF] bg-white px-3 py-2.5 text-left text-[11px] font-semibold leading-4 text-[#343B4C] transition hover:border-[#F6B72D] hover:bg-[#FFFBF2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F6B72D]'
                      >
                        <span>{prompt}</span>
                        <ArrowUpRight className='h-3.5 w-3.5 shrink-0 text-[#B77900] opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={`${message.sender}-${index}`} className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-[13px] leading-[1.65] shadow-sm ${message.sender === 'user' ? 'ml-auto rounded-br-md bg-[#0B132B] text-white' : 'rounded-bl-md border border-[#EEEAE2] bg-[#F8F7F4] text-[#343B4C]'}`}>
                  {message.sender === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                        ul: ({ children }) => <ul className='my-2 list-disc space-y-1 pl-5'>{children}</ul>,
                        ol: ({ children }) => <ol className='my-2 list-decimal space-y-1 pl-5'>{children}</ol>,
                        a: ({ children, href }) => <a href={href} className={`font-semibold underline ${message.sender === 'user' ? 'text-[#F6B72D]' : 'text-[#9A6700]'}`} target='_blank' rel='noreferrer'>{children}</a>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : message.text}
                  {message.sources?.length > 0 && (
                    <div className='mt-3 space-y-2 border-t border-[#E5E1D9] pt-2'>
                      <p className='text-[10px] leading-4 text-[#777D89]'>From: {message.sources.map((source) => source.title).join(' · ')}</p>
                      {message.imageRequested && message.sources.find((source) => source.image_url) && (
                        <a
                          href={message.sources.find((source) => source.image_url).image_url}
                          target='_blank'
                          rel='noreferrer'
                          className='block overflow-hidden rounded-xl border border-[#E5E1D9] bg-white'
                          aria-label='Open the original published image'
                        >
                          <img
                            src={message.sources.find((source) => source.image_url).image_url}
                            alt={message.sources.find((source) => source.image_url).title}
                            className='max-h-64 w-full object-contain'
                            loading='lazy'
                          />
                          <span className='block px-3 py-2 text-[10px] font-semibold text-[#596174]'>Open original image</span>
                        </a>
                      )}
                      <div className='flex flex-wrap gap-x-3 gap-y-1'>
                        {message.sources.map((source) => (
                          <Fragment key={`${source.type}-${source.title}`}>
                            {source.url && <a className='text-[10px] font-semibold text-[#9A6700] underline' href={source.url} target='_blank' rel='noreferrer'>View source</a>}
                            {source.download_url && <a className='text-[10px] font-semibold text-[#9A6700] underline' href={source.download_url} target='_blank' rel='noreferrer'>Download PDF</a>}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className='inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#EEEAE2] bg-[#F8F7F4] px-4 py-3 text-xs text-[#596174]' role='status' aria-label='Assistant is responding'>
                  <span>Thinking</span>
                  <span className='flex gap-1' aria-hidden='true'>
                    <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#B77900]' />
                    <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#B77900] [animation-delay:120ms]' />
                    <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#B77900] [animation-delay:240ms]' />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className='shrink-0 border-t border-[#EEEAE2] bg-white p-3.5'>
              {error && <p role='alert' className='mb-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700'>{error}</p>}
              <form onSubmit={askQuestion} className='flex items-center gap-2 rounded-2xl border border-[#E2DED6] bg-[#FBFAF8] p-1.5 pl-3 transition focus-within:border-[#E3A814] focus-within:ring-2 focus-within:ring-[#F6B72D]/20'>
              <Input id='website-assistant-input' value={question} onChange={(event) => setQuestion(event.target.value)} placeholder='Message the assistant…' maxLength={500} disabled={isLoading} aria-label='Ask a question about the website' className='h-10 border-0 bg-transparent px-0 text-[13px] shadow-none focus-visible:ring-0' />
              <Button type='submit' size='icon' className='h-10 w-10 shrink-0 rounded-xl bg-[#F6B72D] text-[#0B132B] shadow-sm hover:bg-[#e6a820] disabled:bg-[#F4DFAC] disabled:text-[#8F815F]' disabled={!question.trim() || isLoading} aria-label='Send question'>
                <Send className='h-4 w-4' />
              </Button>
            </form>
              <p className='mt-2 text-center text-[9px] text-[#969BA5]'>Answers are based on published website content</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
