import { useEffect, useState } from 'react'
import { FileText, Lock, Wrench } from 'lucide-react'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'

const openFile = (file) => {
  const url = getAssetUrl(file?.url)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

const isRealProgramId = (id) => id !== null && id !== undefined && /^\d+$/.test(String(id))

/**
 * Left-hand column: every Learning Session of the selected program (opens its
 * PDF) with that session's toolkit files, plus the program's own toolkit.
 * Clients only receive materials for programs they purchased (server-enforced).
 */
export default function LearningMaterialsRail({ programId, programName, className = '' }) {
  const [state, setState] = useState({ loading: false, data: null, error: '' })

  useEffect(() => {
    if (!isRealProgramId(programId)) {
      setState({ loading: false, data: null, error: '' })
      return undefined
    }
    let cancelled = false
    setState({ loading: true, data: null, error: '' })
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
  }, [programId])

  const { loading, data, error } = state
  const sessions = data?.sessions || []
  const programToolkits = data?.programToolkits || []

  let body
  if (!isRealProgramId(programId)) {
    body = <p className='px-4 py-6 text-sm text-gray-500'>Select a program to see its learning sessions.</p>
  } else if (loading) {
    body = (
      <div className='flex justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  } else if (error) {
    body = <p className='px-4 py-6 text-sm text-red-600'>{error}</p>
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
  } else if (!sessions.length && !programToolkits.length) {
    body = <p className='px-4 py-6 text-sm text-gray-500'>No learning sessions have been added to this program yet.</p>
  } else {
    body = (
      <div className='divide-y divide-gray-100'>
        {sessions.map((session) => (
          <div key={session.id} className='px-4 py-3'>
            <button
              type='button'
              onClick={() => openFile(session.pdf)}
              disabled={!session.pdf}
              title={session.pdf ? 'Open Learning Session PDF' : 'PDF not uploaded yet'}
              className={`block w-full text-left ${session.pdf ? 'group cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            >
              <p className='text-xs text-gray-500 uppercase'>Learning Session {session.number}</p>
              <p className='text-sm font-semibold text-gray-900 group-hover:text-[#b8860b]'>{session.title}</p>
              <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-500'>
                <FileText className='h-3 w-3' />
                {session.pdf ? 'Open PDF' : 'PDF not available yet'}
              </p>
            </button>
            {session.toolkits.length > 0 && (
              <ul className='mt-2 space-y-1 border-l-2 border-[#F6B72D]/50 pl-3'>
                {session.toolkits.map((file) => (
                  <li key={file.id}>
                    <button
                      type='button'
                      onClick={() => openFile(file)}
                      className='flex items-center gap-1.5 text-left text-xs text-[#1a2332] hover:text-[#b8860b]'
                    >
                      <Wrench className='h-3 w-3 shrink-0' />
                      <span>
                        Toolkit: {file.title}
                        {file.fileExtension ? ` (${file.fileExtension.toUpperCase()})` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {programToolkits.length > 0 && (
          <div className='px-4 py-3 bg-[#F6B72D]/5'>
            <p className='text-xs font-semibold uppercase text-gray-600 mb-1.5'>Program Toolkit</p>
            <ul className='space-y-1'>
              {programToolkits.map((file) => (
                <li key={file.id}>
                  <button
                    type='button'
                    onClick={() => openFile(file)}
                    className='flex items-center gap-1.5 text-left text-xs text-[#1a2332] hover:text-[#b8860b]'
                  >
                    <Wrench className='h-3 w-3 shrink-0' />
                    <span>
                      {file.title}
                      {file.fileExtension ? ` (${file.fileExtension.toUpperCase()})` : ''}
                    </span>
                  </button>
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
        <div className='flex items-center justify-between'>
          <span className='text-sm font-extrabold uppercase tracking-wide text-black'>Learning Sessions</span>
          <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>{sessions.length}</span>
        </div>
        {(data?.program?.title || programName) && (
          <p className='text-xs text-black/70 mt-1 truncate'>{data?.program?.title || programName}</p>
        )}
      </div>
      <div className='flex-1 min-h-0 overflow-y-auto'>{body}</div>
    </div>
  )
}
