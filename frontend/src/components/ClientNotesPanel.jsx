import { useCallback, useEffect, useState } from 'react'
import { NotebookText, Save } from 'lucide-react'
import authService from '@/services/authService'

const formatWhen = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
}

const ROLE_LABEL = { trainer: 'Coach', sales: 'Sales', admin: 'Admin', client: 'Client' }

/**
 * Server-saved notes for one client, with full history (newest first).
 * - Coaches/staff: write coaching notes; see coaching + client notes.
 * - Client: write their own notes; see only their own notes.
 */
export default function ClientNotesPanel({
  clientUserId,
  clientName,
  viewer = 'staff',
  className = '',
}) {
  const [notes, setNotes] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!clientUserId) {
      setNotes([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await authService.getClientNotes(clientUserId)
      setNotes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load notes:', err)
      setError('Could not load notes.')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [clientUserId])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    const content = draft.trim()
    if (!content || !clientUserId) return
    setSaving(true)
    setError('')
    try {
      const created = await authService.createClientNote(clientUserId, content)
      setNotes((prev) => [created, ...prev])
      setDraft('')
    } catch (err) {
      console.error('Failed to save note:', err)
      setError(err?.message || 'Could not save the note.')
    } finally {
      setSaving(false)
    }
  }

  const isClient = viewer === 'client'

  return (
    <div className={`bg-white border-2 border-[#F6B72D] rounded-xl p-4 shadow-sm flex flex-col ${className}`}>
      <div className='flex items-center gap-2 mb-1'>
        <NotebookText className='w-5 h-5 text-[#1a2332]' />
        <h3 className='text-base sm:text-lg font-extrabold uppercase tracking-wide text-gray-800'>
          Notes
        </h3>
      </div>
      <p className='text-sm text-gray-600 mb-3'>
        {!clientUserId
          ? 'Select a client to see and add notes.'
          : isClient
            ? 'Your notes are saved to your account. Your coaching team can read them.'
            : `Coaching and client notes for ${clientName || 'this client'}. Coaching notes are private to staff.`}
      </p>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={!clientUserId || saving}
        className='w-full min-h-[110px] rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:border-[#F6B72D] focus:ring-2 focus:ring-[#F6B72D]/30 outline-none disabled:bg-gray-50'
        placeholder={isClient ? 'Write a note...' : 'Write a coaching note...'}
      />
      <div className='mt-2 flex items-center justify-between gap-3'>
        <button
          type='button'
          onClick={save}
          disabled={!clientUserId || saving || !draft.trim()}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F6B72D] text-black text-sm font-semibold hover:bg-[#e6b82a] disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Save className='w-4 h-4' /> {saving ? 'Saving...' : 'Save note'}
        </button>
        {error && <span className='text-xs text-red-600'>{error}</span>}
      </div>

      <div className='mt-4 border-t border-gray-100 pt-3 flex-1 min-h-0'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
          Previous notes {notes.length ? `(${notes.length})` : ''}
        </p>
        {loading ? (
          <p className='text-sm text-gray-500'>Loading notes...</p>
        ) : notes.length ? (
          <ul className='space-y-2 max-h-[320px] overflow-y-auto pr-1'>
            {notes.map((note) => {
              const fromClient = note.authorRole === 'client'
              return (
                <li
                  key={note.noteId}
                  className={`rounded-lg border p-3 ${fromClient ? 'border-blue-200 bg-blue-50/50' : 'border-[#F6B72D]/40 bg-[#F6B72D]/5'}`}
                >
                  <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500'>
                    <span className='font-semibold text-gray-700'>
                      {note.advisorName || 'Unknown'}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${fromClient ? 'bg-blue-100 text-blue-800' : 'bg-[#F6B72D]/30 text-black'}`}
                      >
                        {ROLE_LABEL[note.authorRole] || 'Note'}
                      </span>
                    </span>
                    <span>{formatWhen(note.createdAt)}</span>
                  </div>
                  <p className='mt-1 whitespace-pre-wrap text-sm text-gray-800'>{note.content}</p>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className='text-sm text-gray-500'>{clientUserId ? 'No notes yet.' : ''}</p>
        )}
      </div>
    </div>
  )
}
