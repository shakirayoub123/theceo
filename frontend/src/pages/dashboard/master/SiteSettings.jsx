import { useEffect, useState } from 'react'
import { Bot, CheckCircle2, LoaderCircle, Settings2 } from 'lucide-react'
import chatbotService from '@/services/chatbotService'

export default function SiteSettings() {
  const [chatbotEnabled, setChatbotEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    chatbotService
      .getAdminSiteSettings()
      .then((settings) => {
        if (active) setChatbotEnabled(settings.chatbot_enabled !== false)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load site settings.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleToggle = async () => {
    if (saving || loading) return
    const nextEnabled = !chatbotEnabled
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const settings = await chatbotService.updateAdminSiteSettings({
        chatbot_enabled: nextEnabled,
      })
      setChatbotEnabled(settings.chatbot_enabled)
      setSaved(true)
    } catch (requestError) {
      setError(requestError.message || 'Could not update the chatbot setting.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <header>
        <p className='text-xs font-bold uppercase tracking-[0.18em] text-[#B77900]'>Website controls</p>
        <h1 className='mt-1 text-2xl font-extrabold text-[#0B132B]'>Site Settings</h1>
        <p className='mt-2 text-sm text-slate-600'>Control which public website features visitors can access.</p>
      </header>

      <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-4'>
            <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B132B]'>
              <Bot className='h-6 w-6 text-[#F6B72D]' />
            </span>
            <div>
              <h2 className='font-bold text-slate-900'>AI Website Assistant</h2>
              <p className='mt-1 max-w-xl text-sm leading-6 text-slate-600'>
                {chatbotEnabled
                  ? 'The assistant launcher is visible to visitors on the public website.'
                  : 'The assistant is hidden from visitors. You can turn it back on at any time.'}
              </p>
              <p className={`mt-2 text-xs font-semibold ${chatbotEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {loading ? 'Loading setting…' : chatbotEnabled ? 'Currently visible' : 'Currently hidden'}
              </p>
            </div>
          </div>

          <button
            type='button'
            role='switch'
            aria-checked={chatbotEnabled}
            aria-label='Show AI Website Assistant on public website'
            disabled={loading || saving}
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B77900] disabled:cursor-not-allowed disabled:opacity-60 ${chatbotEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow transition-transform ${chatbotEnabled ? 'translate-x-7' : 'translate-x-1'}`}>
              {saving ? <LoaderCircle className='h-3.5 w-3.5 animate-spin text-slate-500' /> : null}
            </span>
          </button>
        </div>

        {error && <p role='alert' className='mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</p>}
        {saved && <p role='status' className='mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'><CheckCircle2 className='h-4 w-4' />Setting saved successfully.</p>}
      </section>

      <div className='flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900'>
        <Settings2 className='mt-0.5 h-5 w-5 shrink-0 text-amber-700' />
        <p>Changes apply to visitors across the public website. Admins can still manage this setting from the dashboard.</p>
      </div>
    </div>
  )
}
