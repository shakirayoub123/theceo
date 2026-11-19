import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Gift, Trash2, UserPlus } from 'lucide-react'
import authService from '@/services/authService'

const money = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

const STATUS_STYLES = {
  awaiting_signup: 'bg-gray-100 text-gray-700 border-gray-200',
  awaiting_payment: 'bg-blue-50 text-blue-700 border-blue-200',
  fee_due: 'bg-amber-50 text-amber-800 border-amber-300',
  fee_paid: 'bg-green-50 text-green-700 border-green-200',
}

const EMPTY_FORM = {
  referrerName: '',
  referrerEmail: '',
  referrerPhone: '',
  clientName: '',
  clientEmail: '',
  referrerType: 'tci',
  notes: '',
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#F6B72D] focus:outline-none focus:ring-1 focus:ring-[#F6B72D]'

/**
 * "Client Referrals" tab (Sales + Coaching dashboards): record who referred a
 * new client, and track the referral fee (10% TCI referral / 15% business
 * partner, same as the admin Referrals page) until admin has paid it.
 */
export default function ClientReferrals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setData(await authService.getStaffClientReferrals())
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Could not load client referrals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const partnerTypes = data?.partnerTypes || [
    { value: 'tci', label: 'TCI Referral (10%)', percent: 10 },
    { value: 'business', label: 'Business Referral Partner (15%)', percent: 15 },
  ]
  const referrals = data?.referrals || []
  const summary = data?.summary || {}

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.referrerName.trim() || !form.clientName.trim() || !form.clientEmail.trim()) {
      toast.error('Fill in the referrer name, client name and client email.')
      return
    }
    setSaving(true)
    try {
      const created = await authService.addStaffClientReferral(form)
      toast.success(`Referral added: ${created.clientName} referred by ${created.referrerName}.`)
      setForm(EMPTY_FORM)
      await load()
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Could not add the referral.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (referral) => {
    if (!window.confirm(`Remove the referral for ${referral.clientName}?`)) return
    try {
      await authService.deleteStaffClientReferral(referral.id)
      toast.success('Referral removed.')
      await load()
    } catch (err) {
      toast.error(err?.message || 'Could not remove the referral.')
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900'>Client Referrals</h1>
        <p className='mt-1 text-sm text-gray-600'>
          Add the person who referred a new client to TCI. They are paid a percentage of the program price once
          the new client has <strong>paid in full</strong> for a program.
        </p>
      </div>

      {data?.setupRequired && (
        <div className='rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900'>
          {data.message}
        </div>
      )}

      <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {[
          ['Referrals', summary.referrals ?? 0],
          ['Clients paid', summary.paidClients ?? 0],
          ['Fees due', money(summary.feesDue)],
          ['Fees paid', money(summary.feesPaid)],
        ].map(([label, value]) => (
          <div key={label} className='rounded-xl border-2 border-[#F6B72D] bg-white p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>{label}</p>
            <p className='mt-1 text-2xl font-extrabold text-gray-900'>{value}</p>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <form onSubmit={submit} className='space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2'>
          <h2 className='flex items-center gap-2 text-lg font-bold text-gray-900'>
            <UserPlus className='h-5 w-5 text-[#F6B72D]' /> Add a client referral
          </h2>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <fieldset className='space-y-2'>
              <legend className='mb-1 text-xs font-semibold uppercase text-gray-500'>Referred by (gets paid)</legend>
              <input className={inputClass} placeholder='Full name *' value={form.referrerName} onChange={update('referrerName')} maxLength={255} />
              <input className={inputClass} type='email' placeholder='Email' value={form.referrerEmail} onChange={update('referrerEmail')} />
              <input className={inputClass} placeholder='Phone' value={form.referrerPhone} onChange={update('referrerPhone')} maxLength={40} />
              <select className={inputClass} value={form.referrerType} onChange={update('referrerType')}>
                {partnerTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </fieldset>
            <fieldset className='space-y-2'>
              <legend className='mb-1 text-xs font-semibold uppercase text-gray-500'>New client</legend>
              <input className={inputClass} placeholder='Full name *' value={form.clientName} onChange={update('clientName')} maxLength={255} />
              <input className={inputClass} type='email' placeholder='Email * (used to match their account)' value={form.clientEmail} onChange={update('clientEmail')} />
            </fieldset>
          </div>
          <textarea className={inputClass} rows={2} placeholder='Notes (optional)' value={form.notes} onChange={update('notes')} maxLength={2000} />
          <button
            type='submit'
            disabled={saving || data?.setupRequired}
            className='rounded-lg bg-[#F6B72D] px-5 py-2 text-sm font-bold text-black hover:bg-[#e5a825] disabled:opacity-50'
          >
            {saving ? 'Saving…' : 'Add Referral'}
          </button>
        </form>

        <div className='rounded-xl border border-gray-200 bg-white p-5 shadow-sm'>
          <h2 className='flex items-center gap-2 text-lg font-bold text-gray-900'>
            <Gift className='h-5 w-5 text-[#F6B72D]' /> Referral fees
          </h2>
          <table className='mt-3 w-full text-sm'>
            <tbody className='divide-y divide-gray-100'>
              {partnerTypes.map((type) => (
                <tr key={type.value}>
                  <td className='py-2 font-semibold text-gray-900'>{type.label.replace(/\s*\(\d+%\)$/, '')}</td>
                  <td className='py-2 text-right text-lg font-extrabold'>{type.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className='mt-3 text-xs text-gray-500'>
            Percentage of the total price the new client pays for the program. Paid only after the client has paid
            in full. Admin pays the referrer and marks the fee paid.
          </p>
        </div>
      </div>

      <div className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='border-b border-gray-200 px-5 py-3'>
          <h2 className='text-lg font-bold text-gray-900'>Referral payment tracking</h2>
        </div>
        {referrals.length === 0 ? (
          <p className='px-5 py-8 text-center text-sm text-gray-500'>No client referrals added yet.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-sm'>
              <thead className='bg-gray-50 text-left text-xs uppercase text-gray-500'>
                <tr>
                  <th className='px-4 py-2'>New client</th>
                  <th className='px-4 py-2'>Referred by</th>
                  <th className='px-4 py-2'>Program / fee</th>
                  <th className='px-4 py-2'>Status</th>
                  <th className='px-4 py-2'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {referrals.map((r) => (
                  <tr key={r.id} className='align-top'>
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-gray-900'>{r.clientName}</p>
                      <p className='text-xs text-gray-500'>{r.clientEmail}</p>
                      <p className='text-[11px] text-gray-400'>
                        Added {new Date(r.createdAt).toLocaleDateString()} {r.addedBy ? `by ${r.addedBy}` : ''}
                      </p>
                    </td>
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-gray-900'>{r.referrerName}</p>
                      <p className='text-xs text-gray-500'>{[r.referrerEmail, r.referrerPhone].filter(Boolean).join(' · ')}</p>
                      <p className='text-[11px] font-semibold text-[#b8860b]'>{r.referrerTypeLabel}</p>
                    </td>
                    <td className='px-4 py-3'>
                      {r.fees.length === 0 ? (
                        <span className='text-xs text-gray-500'>No program paid yet ({r.feePercent}% when paid)</span>
                      ) : (
                        r.fees.map((f) => (
                          <div key={f.id} className='mb-1'>
                            <p className='text-xs font-semibold text-gray-900'>{f.program}</p>
                            <p className='text-xs text-gray-600'>
                              {money(f.feeAmount)} · {f.feeLabel} · {f.status === 'paid' ? `paid ${f.paidAt ? new Date(f.paidAt).toLocaleDateString() : ''}` : 'due'}
                            </p>
                          </div>
                        ))
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[r.status] || ''}`}>
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      {r.canDelete && (
                        <button
                          type='button'
                          onClick={() => remove(r)}
                          title='Remove referral'
                          className='rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
