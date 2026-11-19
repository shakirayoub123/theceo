import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Lock, Plus, Trash2, Upload, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'

const openFile = (file) => {
  const url = getAssetUrl(file?.url)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

const isRealProgramId = (id) => id !== null && id !== undefined && /^\d+$/.test(String(id))

const iconButton =
  'inline-flex items-center justify-center rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40'

/**
 * Left-hand column: every Learning Session of the selected program (opens its
 * PDF) with that session's toolkit files, plus the program's own toolkit.
 * Clients only receive materials for programs they purchased (server-enforced).
 *
 * With `editable` (coaches/admins) the column also adds and deletes Learning
 * Sessions, session PDFs/toolkit files and program toolkit files.
 */
export default function LearningMaterialsRail({
  programId,
  programName,
  className = '',
  editable = false,
  title = 'Learning Sessions',
}) {
  const [state, setState] = useState({ loading: false, data: null, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [newSession, setNewSession] = useState({ title: '', summary: '', pdf: null })
  const uploadTarget = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isRealProgramId(programId)) {
      setState({ loading: false, data: null, error: '' })
      return undefined
    }
    let cancelled = false
    setState((prev) => ({
      loading: true,
      // Keep the current list visible while refreshing after an edit.
      data: reloadKey && prev.data?.program?.id === String(programId) ? prev.data : null,
      error: '',
    }))
    authService
      .getProgramLearningMaterials(programId)
      .then((data) => !cancelled && setState({ loading: false, data, error: '' }))
      .catch((err) => {
        console.error('Failed to load learning materials:', err)
        if (!cancelled) {
          setState({ loading: false, data: null, error: 'Could not load learning materials.' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [programId, reloadKey])

  useEffect(() => {
    setShowAddSession(false)
    setNewSession({ title: '', summary: '', pdf: null })
  }, [programId])

  const reload = () => setReloadKey((k) => k + 1)

  const run = useCallback(async (action, successMessage) => {
    setBusy(true)
    try {
      await action()
      if (successMessage) toast.success(successMessage)
      setReloadKey((k) => k + 1)
      return true
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Something went wrong.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const pickFile = (target) => {
    uploadTarget.current = target
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const onFilePicked = (event) => {
    const file = event.target.files?.[0]
    const target = uploadTarget.current
    if (!file || !target) return
    if (target.kind === 'session') {
      run(() => authService.addSessionToolkitFile(target.id, file), `"${file.name}" added.`)
    } else {
      run(() => authService.addProgramToolkitFile(programId, file), `"${file.name}" added.`)
    }
  }

  const confirmDelete = (label, action) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    run(action, 'Deleted.')
  }

  const submitNewSession = async (event) => {
    event.preventDefault()
    const title = newSession.title.trim()
    if (!title) {
      toast.error('Enter a session title.')
      return
    }
    const ok = await run(
      () => authService.addLearningSession(programId, { ...newSession, title }),
      'Learning session added.',
    )
    if (ok) {
      setShowAddSession(false)
      setNewSession({ title: '', summary: '', pdf: null })
    }
  }

  const { loading, data, error } = state
  const sessions = data?.sessions || []
  const programToolkits = data?.programToolkits || []
  const canEdit = editable && isRealProgramId(programId) && !data?.locked

  const addSessionForm = showAddSession && canEdit && (
    <form onSubmit={submitNewSession} className='px-4 py-3 space-y-2 bg-[#F6B72D]/5 border-b border-gray-100'>
      <input
        type='text'
        value={newSession.title}
        onChange={(e) => setNewSession((s) => ({ ...s, title: e.target.value }))}
        placeholder='Session title'
        maxLength={255}
        className='w-full rounded border border-gray-300 px-2 py-1.5 text-sm'
        autoFocus
      />
      <textarea
        value={newSession.summary}
        onChange={(e) => setNewSession((s) => ({ ...s, summary: e.target.value }))}
        placeholder='Short summary / key points (optional)'
        rows={2}
        maxLength={500}
        className='w-full rounded border border-gray-300 px-2 py-1.5 text-sm'
      />
      <label className='block text-xs text-gray-600'>
        Session PDF (optional)
        <input
          type='file'
          accept='.pdf,application/pdf'
          onChange={(e) => setNewSession((s) => ({ ...s, pdf: e.target.files?.[0] || null }))}
          className='mt-1 block w-full text-xs'
        />
      </label>
      <div className='flex gap-2'>
        <button
          type='submit'
          disabled={busy}
          className='rounded bg-[#F6B72D] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#e5a825] disabled:opacity-50'
        >
          {busy ? 'Saving…' : 'Add Session'}
        </button>
        <button
          type='button'
          onClick={() => setShowAddSession(false)}
          className='rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50'
        >
          Cancel
        </button>
      </div>
    </form>
  )

  let body
  if (!isRealProgramId(programId)) {
    body = <p className='px-4 py-6 text-sm text-gray-500'>Select a program to see its learning sessions.</p>
  } else if (loading && !data) {
    body = (
      <div className='flex justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  } else if (error) {
    body = (
      <div className='px-4 py-6 text-sm text-red-600'>
        {error}{' '}
        <button type='button' onClick={reload} className='underline'>
          Retry
        </button>
      </div>
    )
  } else if (data?.locked) {
    body = (
      <div className='px-4 py-8 text-center text-sm text-gray-600'>
        <Lock className='mx-auto mb-2 h-6 w-6 text-[#F6B72D]' />
        <p className='font-semibold text-gray-900'>Locked</p>
        <p className='mt-1'>
          {data.message || 'Learning materials are available after you purchase this program.'}
        </p>
      </div>
    )
  } else if (!sessions.length && !programToolkits.length && !canEdit) {
    body = <p className='px-4 py-6 text-sm text-gray-500'>No learning sessions have been added to this program yet.</p>
  } else {
    body = (
      <div className='divide-y divide-gray-100'>
        {!sessions.length && (
          <p className='px-4 py-4 text-sm text-gray-500'>
            No learning sessions yet.{canEdit ? ' Use “Add” to create the first one.' : ''}
          </p>
        )}
        {sessions.map((session) => (
          <div key={session.id} className='px-4 py-3'>
            <div className='flex items-start gap-1'>
              <button
                type='button'
                onClick={() => openFile(session.pdf)}
                disabled={!session.pdf}
                title={session.pdf ? 'Open Learning Session PDF' : 'PDF not uploaded yet'}
                className={`block min-w-0 flex-1 text-left ${session.pdf ? 'group cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
              >
                <p className='text-xs text-gray-500 uppercase'>Learning Session {session.number}</p>
                <p className='text-sm font-semibold text-gray-900 group-hover:text-[#b8860b]'>{session.title}</p>
                {session.summary && (
                  <p className='mt-0.5 text-xs text-gray-600 line-clamp-3'>{session.summary}</p>
                )}
                <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-500'>
                  <FileText className='h-3 w-3' />
                  {session.pdf ? 'Open PDF' : 'PDF not available yet'}
                </p>
              </button>
              {canEdit && (
                <button
                  type='button'
                  disabled={busy}
                  onClick={() =>
                    confirmDelete(`learning session "${session.title}" and all its files`, () =>
                      authService.deleteLearningSession(session.id),
                    )
                  }
                  title='Delete learning session'
                  className={iconButton}
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              )}
            </div>

            {canEdit && session.pdf && (
              <button
                type='button'
                disabled={busy}
                onClick={() =>
                  confirmDelete(`the PDF of "${session.title}"`, () => authService.deleteSessionFile(session.pdf.id))
                }
                className='mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-600'
              >
                <Trash2 className='h-3 w-3' /> Remove PDF
              </button>
            )}

            {session.toolkits.length > 0 && (
              <ul className='mt-2 space-y-1 border-l-2 border-[#F6B72D]/50 pl-3'>
                {session.toolkits.map((file) => (
                  <li key={file.id} className='flex items-center gap-1'>
                    <button
                      type='button'
                      onClick={() => openFile(file)}
                      className='flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs text-[#1a2332] hover:text-[#b8860b]'
                    >
                      <Wrench className='h-3 w-3 shrink-0' />
                      <span>
                        Toolkit: {file.title}
                        {file.fileExtension ? ` (${file.fileExtension.toUpperCase()})` : ''}
                      </span>
                    </button>
                    {canEdit && (
                      <button
                        type='button'
                        disabled={busy}
                        onClick={() =>
                          confirmDelete(`toolkit file "${file.title}"`, () => authService.deleteSessionFile(file.id))
                        }
                        title='Delete toolkit file'
                        className={iconButton}
                      >
                        <Trash2 className='h-3 w-3' />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canEdit && (
              <button
                type='button'
                disabled={busy}
                onClick={() => pickFile({ kind: 'session', id: session.id })}
                className='mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#b8860b] hover:underline disabled:opacity-50'
              >
                <Upload className='h-3 w-3' /> {session.pdf ? 'Add toolkit file' : 'Upload PDF / toolkit file'}
              </button>
            )}
          </div>
        ))}

        {(programToolkits.length > 0 || canEdit) && (
          <div className='px-4 py-3 bg-[#F6B72D]/5'>
            <div className='mb-1.5 flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase text-gray-600'>Program Toolkit</p>
              {canEdit && (
                <button
                  type='button'
                  disabled={busy}
                  onClick={() => pickFile({ kind: 'program' })}
                  className='inline-flex items-center gap-1 text-[11px] font-semibold text-[#b8860b] hover:underline disabled:opacity-50'
                >
                  <Upload className='h-3 w-3' /> Add file
                </button>
              )}
            </div>
            {programToolkits.length === 0 && <p className='text-xs text-gray-500'>No program toolkit files yet.</p>}
            <ul className='space-y-1'>
              {programToolkits.map((file) => (
                <li key={file.id} className='flex items-center gap-1'>
                  <button
                    type='button'
                    onClick={() => openFile(file)}
                    className='flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs text-[#1a2332] hover:text-[#b8860b]'
                  >
                    <Wrench className='h-3 w-3 shrink-0' />
                    <span>
                      {file.title}
                      {file.fileExtension ? ` (${file.fileExtension.toUpperCase()})` : ''}
                    </span>
                  </button>
                  {canEdit && (
                    <button
                      type='button'
                      disabled={busy}
                      onClick={() =>
                        confirmDelete(`program toolkit file "${file.title}"`, () => authService.deleteProgramFile(file.id))
                      }
                      title='Delete program toolkit file'
                      className={iconButton}
                    >
                      <Trash2 className='h-3 w-3' />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm flex flex-col overflow-hidden ${className}`}>
      <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D]'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-sm font-extrabold uppercase tracking-wide text-black'>{title}</span>
          <div className='flex items-center gap-1.5'>
            {canEdit && (
              <button
                type='button'
                onClick={() => setShowAddSession((v) => !v)}
                className='inline-flex items-center gap-1 rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/80'
                title='Add a learning session'
              >
                <Plus className='h-3 w-3' /> Add
              </button>
            )}
            <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>{sessions.length}</span>
          </div>
        </div>
        {(data?.program?.title || programName) && (
          <p className='text-xs text-black/70 mt-1 truncate'>{data?.program?.title || programName}</p>
        )}
      </div>
      {addSessionForm}
      <div className='flex-1 min-h-0 overflow-y-auto'>{body}</div>
      {editable && (
        <input ref={fileInputRef} type='file' className='hidden' onChange={onFilePicked} />
      )}
    </div>
  )
}
