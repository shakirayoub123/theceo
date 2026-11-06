import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X, Minimize2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import chatbotService from '@/services/chatbotService'

export default function WebsiteQuestionChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const suggestions = ['What services do you offer?', 'Who are the influencers?', 'Tell me about newsletters', 'What is The Human Algorithm?']

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
      const result = await chatbotService.askWebsiteQuestion(text)
      setMessages((current) => [
        ...current,
        { sender: 'assistant', text: result.answer, sources: result.sources || [] },
      ])
    } catch (requestError) {
      setError(requestError.message || 'Unable to search website information right now.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className='fixed bottom-24 right-6 z-50'>
        <Button
          type='button'
          onClick={() => setIsOpen(true)}
          className='h-14 w-14 rounded-full bg-[#0B132B] shadow-lg hover:bg-[#17264A]'
          size='icon'
          aria-label='Ask questions about our website'
          title='Ask questions about our website'
        >
          <Bot className='h-6 w-6 text-[#F6B72D]' />
        </Button>
      </div>
    )
  }

  return (
    <div className='fixed bottom-24 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm'>
      <Card className={`flex ${isMinimized ? 'h-14' : 'h-[min(520px,calc(100dvh-8rem))]'} flex-col overflow-hidden border-2 border-[#F6B72D] bg-white shadow-xl`}>
        <CardHeader className='flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-4 py-3'>
          <div>
            <CardTitle className='flex items-center gap-2 text-sm font-bold text-[#0B132B]'>
              <Bot className='h-4 w-4 text-[#B77900]' /> AI Website Assistant
            </CardTitle>
            {!isMinimized && <p className='mt-1 text-[11px] text-gray-500'>Answers are based on published website content</p>}
          </div>
          <div className='flex gap-1'>
            <Button type='button' onClick={() => setIsMinimized((value) => !value)} variant='ghost' size='sm' className='h-8 w-8 p-0' aria-label={isMinimized ? 'Expand chatbot' : 'Minimize chatbot'}>
              <Minimize2 className='h-4 w-4' />
            </Button>
            <Button type='button' onClick={() => setIsOpen(false)} variant='ghost' size='sm' className='h-8 w-8 p-0' aria-label='Close chatbot'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className='flex min-h-0 flex-1 flex-col p-3'>
            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto pr-1' aria-live='polite'>
              {messages.length === 0 && (
                <div className='space-y-3'>
                  <div className='rounded-xl bg-[#F8F6F2] p-3 text-sm leading-relaxed text-gray-700'>
                    Hi! I can answer questions using the website content and help you explore our services, thinkers, blogs, eBooks, and newsletters.
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {suggestions.map((prompt) => (
                      <button
                        key={prompt}
                        type='button'
                        onClick={() => setQuestion(prompt)}
                        className='rounded-full border border-[#F6B72D] bg-[#FFF8E7] px-2.5 py-1 text-[10px] font-medium text-[#0B132B] transition hover:bg-[#FCE7A8]'
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={`${message.sender}-${index}`} className={`max-w-[90%] whitespace-pre-line rounded-xl px-3 py-2 text-sm leading-relaxed ${message.sender === 'user' ? 'ml-auto bg-[#0B132B] text-white' : 'bg-[#F5F5F4] text-gray-800'}`}>
                  {message.text}
                  {message.sources?.length > 0 && (
                    <p className='mt-2 border-t border-gray-200 pt-2 text-[10px] text-gray-500'>Sources: {message.sources.map((source) => source.title).join(' · ')}</p>
                  )}
                </div>
              ))}
              {isLoading && <div className='text-xs text-gray-500'>Searching website content…</div>}
              <div ref={messagesEndRef} />
            </div>

            {error && <p role='alert' className='mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700'>{error}</p>}

            <form onSubmit={askQuestion} className='mt-3 flex shrink-0 gap-2 border-t pt-3'>
              <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder='Ask about our website…' maxLength={500} disabled={isLoading} aria-label='Ask a question about the website' />
              <Button type='submit' size='icon' className='shrink-0 bg-[#F6B72D] text-black hover:bg-[#e6a820]' disabled={!question.trim() || isLoading} aria-label='Send question'>
                <Send className='h-4 w-4' />
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
