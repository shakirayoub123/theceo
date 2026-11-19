import { useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import authService from '@/services/authService'

const isRealProgramId = (id) => id !== null && id !== undefined && /^\d+$/.test(String(id))

/**
 * Right-hand "Programs" column with add / delete for TCI programs.
 * Delete archives the program (hidden from the website and dashboards, but
 * enrollments and payments are kept) and it can be restored from "Removed".
 */
export default function ProgramManagerRail({ programs, activeId, onSelect, onChanged, className = '' }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', shortDescription: '', price: '' })
  const [busy, setBusy] = useState(false)
  const [archived, setArchived] = useState(null) // null = hidden

  const run = async (action, message) => {
    setBusy(true)
    try {
      const result = await action()
      if (message) toast.success(message)
      return result || true
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Something went wrong.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const loadArchived = async () => {
    const result = await run(() => authService.getCoachPrograms('archived'))
    if (result) setArchived(result.programs || [])
  }

  const submit = async (event) => {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      toast.error('Enter a program title.')
      return
    }
    const result = await run(
      () => authService.createCoachProgram({ ...form, title, price: form.price || '0' }),
      'Program added.',
    )
    if (result) {
      setShowAdd(false)
      setForm({ title: '', shortDescription: '', price: '' })
      await onChanged?.(result.program?.id)
    }
  }

  const remove = async (program) => {
    const ok = window.confirm(
      `Remove "${program.name}"?\n\nIt will be hidden from the website and all dashboards. ` +
        'Enrolled clients and payments are kept, and you can restore it later from "Removed programs".',
    )
    if (!ok) return
    const result = await run(() => authService.archiveCoachProgram(program.id), 'Program removed.')
    if (result) {
      await onChanged?.()
      if (archived !== null) loadArchived()
    }
  }

  const restore = async (program) => {
    const result = await run(() => authService.restoreCoachProgram(program.id), 'Program restored.')
    if (result) {
      setArchived((list) => (list || []).filter((p) => p.id !== program.id))
      await onChanged?.(program.id)
    }
  }

  return (
    <div className={`bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm flex flex-col overflow-hidden ${className}`}>
      <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between gap-2'>
        <span className='text-sm font-extrabold uppercase tracking-wide text-black'>Programs</span>
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={() => setShowAdd((v) => !v)}
            className='inline-flex items-center gap-1 rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/80'
            title='Add a TCI program'
          >
            <Plus className='h-3 w-3' /> Add
          </button>
          <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>{programs.length}</span>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={submit} className='px-4 py-3 space-y-2 bg-[#F6B72D]/5 border-b border-gray-100'>
          <input
            type='text'
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder='Program title'
            maxLength={255}
            className='w-full rounded border border-gray-300 px-2 py-1.5 text-sm'
            autoFocus
          />
          <textarea
            value={form.shortDescription}
            onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            placeholder='Short description (optional)'
            rows={2}
            maxLength={500}
            className='w-full rounded border border-gray-300 px-2 py-1.5 text-sm'
          />
          <input
            type='number'
            min='0'
            step='0.01'
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder='Price in USD (optional)'
            className='w-full rounded border border-gray-300 px-2 py-1.5 text-sm'
          />
          <div className='flex gap-2'>
            <button
              type='submit'
              disabled={busy}
              className='rounded bg-[#F6B72D] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#e5a825] disabled:opacity-50'
            >
              {busy ? 'Saving…' : 'Add Program'}
            </button>
            <button
              type='button'
              onClick={() => setShowAdd(false)}
              className='rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className='flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100'>
        {programs.length ? (
          programs.map((program, idx) => {
            const isActive = String(activeId) === String(program.id)
            return (
              <div
                key={program.id || `${program.name}-${idx}`}
                className={`flex items-start gap-1 transition-colors ${isActive
                  ? 'bg-[#F6B72D]/15 border-l-4 border-[#F6B72D]'
                  : 'hover:bg-[#F6B72D]/10'
                  }`}
              >
                <button
                  type='button'
                  onClick={() => onSelect(program.id)}
                  className='block min-w-0 flex-1 text-left px-4 py-3'
                >
                  <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Program {idx + 1}</p>
                  <p className='text-sm font-semibold truncate text-black'>{program.name}</p>
                  <p className='text-xs text-gray-500'>
                    {program.clientName ? `Client: ${program.clientName}` : 'TCI Program'}
                  </p>
                </button>
                {isRealProgramId(program.id) && (
                  <button
                    type='button'
                    disabled={busy}
                    onClick={() => remove(program)}
                    title='Remove program'
                    className='m-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                )}
              </div>
            )
          })
        ) : (
          <div className='px-4 py-6 text-sm text-gray-500'>No programs available yet.</div>
        )}
      </div>

      <div className='border-t border-gray-100 px-4 py-2'>
        {archived === null ? (
          <button
            type='button'
            disabled={busy}
            onClick={loadArchived}
            className='text-[11px] font-semibold text-gray-500 hover:text-black hover:underline'
          >
            Show removed programs
          </button>
        ) : (
          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <p className='text-[11px] font-semibold uppercase text-gray-500'>Removed programs</p>
              <button
                type='button'
                onClick={() => setArchived(null)}
                className='text-[11px] text-gray-500 hover:underline'
              >
                Hide
              </button>
            </div>
            {archived.length === 0 && <p className='text-xs text-gray-500'>None.</p>}
            {archived.map((program) => (
              <div key={program.id} className='flex items-center justify-between gap-2'>
                <span className='truncate text-xs text-gray-600'>{program.title}</span>
                <button
                  type='button'
                  disabled={busy}
                  onClick={() => restore(program)}
                  className='inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#b8860b] hover:underline'
                >
                  <RotateCcw className='h-3 w-3' /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
