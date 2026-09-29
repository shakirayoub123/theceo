import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Mic, MicOff, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useState, useEffect, useRef, useCallback } from 'react'

export function Chat({ title = 'CHAT', messages, onSendMessage }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Available languages for speech recognition
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (BR)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ru-RU', name: 'Russian' },
  ]

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        const recognition = recognitionRef.current

        // Configure recognition
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = selectedLanguage

        recognition.onstart = () => {
          setIsListening(true)
          setError('')
          console.log('Speech recognition started')
        }

        recognition.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          // Update input field with transcript
          if (inputRef.current) {
            const newValue = finalTranscript || interimTranscript
            inputRef.current.value = newValue
            setTranscript(newValue)
          }
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)

          switch (event.error) {
            case 'no-speech':
              setError('No speech detected. Please try again.')
              break
            case 'audio-capture':
              setError('No microphone found. Please check your microphone.')
              break
            case 'not-allowed':
              setError(
                'Microphone permission denied. Please allow microphone access.',
              )
              break
            case 'network':
              setError('Network error. Please check your connection.')
              break
            case 'service-not-allowed':
              setError('Speech recognition service not allowed.')
              break
            default:
              setError(`Speech recognition error: ${event.error}`)
          }

          // Auto-hide error after 3 seconds
          setTimeout(() => setError(''), 3000)
        }

        recognition.onend = () => {
          setIsListening(false)
          console.log('Speech recognition ended')
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [selectedLanguage])

  // Update recognition language when selectedLanguage changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage
    }
  }, [selectedLanguage])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!recognitionRef.current) {
      setError('Speech recognition not initialized.')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      // Request microphone permission if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      setError('')
      recognitionRef.current.start()
    } catch (err) {
      console.error('Error starting speech recognition:', err)
      setError(
        'Failed to start speech recognition. Please check microphone permissions.',
      )
      setTimeout(() => setError(''), 3000)
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode)
    setShowLanguageSelector(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get('message')
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim())
      e.currentTarget.reset()
      setTranscript('')
    }
  }

  return (
    <Card className='border-2 border-[#F6B72D] h-full flex flex-col bg-white'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold text-foreground'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col font-exo'>
        <div
          ref={messagesContainerRef}
          className='flex-1 space-y-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto'
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'other' && (
                <Avatar className='w-8 h-8 mr-2 bg-gray-400 text-white'>
                  <AvatarImage src={message.avatar || '/placeholder.svg'} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-2 p-2 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='mt-auto flex gap-2'>
          <div className='relative flex-1'>
            <Input
              ref={inputRef}
              name='message'
              placeholder='Type a message...'
              className={`w-full border rounded-full pr-20 ${
                isListening ? 'border-red-500 bg-red-50' : ''
              }`}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />

            {/* Mic button */}
            <button
              type='button'
              onClick={handleMicClick}
              disabled={!isSupported}
              className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                isListening
                  ? 'text-red-500 animate-pulse'
                  : isSupported
                    ? 'hover:text-[#F6B72D]'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
              title={
                !isSupported
                  ? 'Speech recognition not supported'
                  : isListening
                    ? 'Stop listening'
                    : 'Start voice input'
              }
            >
              {isListening ? (
                <MicOff className='w-4 h-4' />
              ) : (
                <Mic className='w-4 h-4' />
              )}
            </button>

            {/* Language dropdown */}
            {showLanguageSelector && (
              <div className='absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-10'>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type='button'
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-sm ${
                      selectedLanguage === lang.code
                        ? 'bg-[#F6B72D] text-white'
                        : ''
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type='submit'
            size='icon'
            className='bg-[#F6B72D] rounded-full hover:bg-[#F6B72D]/90'
          >
            <Send className='w-4 h-4' />
          </Button>
        </form>

        {/* Browser support warning */}
        {!isSupported && (
          <div className='mt-2 text-xs text-gray-500 text-center'>
            Speech recognition requires Chrome, Firefox, Safari, or Edge
            browser.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
