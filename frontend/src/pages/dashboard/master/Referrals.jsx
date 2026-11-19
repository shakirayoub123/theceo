import { useCallback, useEffect, useMemo, useState } from 'react'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import authService from '@/services/authService'

const money = (value, currency = 'usd') => {
  const amount = Number(value || 0)
  try {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    })
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString()
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  void: 'bg-gray-100 text-gray-500 border-gray-300',
}

const TYPE_STYLES = {
  tci: 'bg-[#F6B72D]/20 text-black border-[#F6B72D]',
  business: 'bg-[#0f172a] text-white border-[#0f172a]',
}

const TYPE_LABELS = { tci: 'TCI referral', business: 'Business partner' }

const fieldClass =
  'w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-exo focus:border-[#F6B72D] focus:outline-none bg-white'
const primaryButton =
  'inline-flex items-center justify-center rounded-lg bg-[#F6B72D] px-4 py-2 text-sm font-semibold text-black hover:bg-[#e6b82a] disabled:opacity-50 disabled:cursor-not-allowed'
const sectionClass = 'bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm mb-8'
const sectionHeader =
  'px-4 py-3 border-b border-black/10 bg-[#F6B72D] text-sm font-extrabold uppercase tracking-wide text-black'
const thClass = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'
const tdClass = 'px-3 py-2 text-sm text-gray-800 align-top'

// authService copies the API's error body onto the thrown Error.
const getErrorMessage = (err, fallback) => {
  if (err?.errors && typeof err.errors === 'object') {
    return Object.values(err.errors).join(' ')
  }
  return err?.error || err?.message || fallback
}

export default function Referrals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [feeFilter, setFeeFilter] = useState('pending')
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    email: '',
    partnerType: 'tci',
    referralCode: '',
  })
  const [linkForm, setLinkForm] = useState({ clientUserId: '', partnerId: '' })

  const load = useCallback(async () => {
    try {
      const response = await authService.getAdminReferrals()
      setData(response)
      setError('')
    } catch (err) {
      console.error('Referrals error:', err)
      setError('Failed to load referrals data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const runAction = async (action, successMessage) => {
    setBusy(true)
    setNotice('')
    try {
      const result = await action()
      setNotice(typeof successMessage === 'function' ? successMessage(result) : successMessage)
      await load()
      return true
    } catch (err) {
      setNotice(`Error: ${getErrorMessage(err, 'Something went wrong.')}`)
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleCreatePartner = async (event) => {
    event.preventDefault()
    const payload = { ...partnerForm }
    if (!payload.referralCode.trim()) delete payload.referralCode
    const ok = await runAction(
      () => authService.createReferralPartner(payload),
      (partner) => `Partner "${partner.name}" added (${partner.feePercent}% referral fee).`,
    )
    if (ok) setPartnerForm({ name: '', email: '', partnerType: 'tci', referralCode: '' })
  }

  const handleLinkClient = async (event) => {
    event.preventDefault()
    const ok = await runAction(
      () =>
        authService.linkClientReferral(
          Number(linkForm.clientUserId),
          Number(linkForm.partnerId),
        ),
      (result) =>
        `Linked ${result.clientName} to ${result.partnerName}.` +
        (result.feesCreated
          ? ` ${result.feesCreated} referral fee(s) recorded for payments already made.`
          : ' A fee will be recorded when their program payment is confirmed.'),
    )
    if (ok) setLinkForm({ clientUserId: '', partnerId: '' })
  }

  const setFeeStatus = (fee, status) => {
    let note
    if (status === 'paid') {
      const entered = window.prompt(
        `Mark ${money(fee.feeAmount, fee.currency)} to ${fee.partnerName} as paid.\nOptional payout note (e.g. transfer reference):`,
        fee.payoutNote || '',
      )
      if (entered === null) return
      note = entered
    }
    if (status === 'void' && !window.confirm('Void this referral fee? It will no longer be owed.')) {
      return
    }
    runAction(
      () => authService.setReferralFeeStatus(fee.id, status, note),
      `Fee for ${fee.clientName} marked ${status}.`,
    )
  }

  const setFeeAmount = (fee) => {
    const entered = window.prompt(
      `Set the referral fee for ${fee.clientName} (${fee.program || 'program'}) in USD:`,
      fee.feeAmount,
    )
    if (entered === null) return
    const amount = Number(entered)
    if (!Number.isFinite(amount) || amount < 0) {
      setNotice('Error: enter a valid amount.')
      return
    }
    runAction(
      () => authService.setReferralFeeStatus(fee.id, fee.status, undefined, amount.toFixed(2)),
      `Fee for ${fee.clientName} set to ${money(amount, fee.currency)}.`,
    )
  }

  const togglePartnerActive = (partner) =>
    runAction(
      () => authService.updateReferralPartner(partner.id, { isActive: !partner.isActive }),
      `${partner.name} ${partner.isActive ? 'deactivated' : 'activated'}.`,
    )

  const term = search.trim().toLowerCase()
  const matches = (...values) =>
    !term || values.some((value) => String(value || '').toLowerCase().includes(term))

  const fees = useMemo(() => data?.fees || [], [data])
  const visibleFees = fees.filter(
    (fee) =>
      (feeFilter === 'all' || fee.status === feeFilter) &&
      matches(fee.partnerName, fee.clientName, fee.clientEmail, fee.program),
  )
  const partners = (data?.partners || []).filter((p) =>
    matches(p.name, p.email, p.referralCode),
  )
  const referrals = (data?.referrals || []).filter((r) =>
    matches(r.clientName, r.clientEmail, r.partnerName, r.referredByText),
  )
  const setupRequired = Boolean(data?.setupRequired)
  const activePartners = (data?.partners || []).filter((p) => p.isActive)
  const clientOptions = data?.clients || []
  const summary = data?.summary || {}

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Referrals</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-2 tracking-wide'>
        Referrals Management
      </h2>
      <p className='text-sm text-gray-600 mb-6 font-exo max-w-3xl'>
        When a referred client&apos;s program payment is confirmed, the referrer earns a fee on
        the total price paid for that program: <strong>10% for TCI referrals</strong> and{' '}
        <strong>15% for business referral partners</strong>. Sales and Coaching can also add
        referrals from their <strong>Client Referrals</strong> tab (same percentages). Mark each fee
        paid once the referrer has been paid.
      </p>

      {setupRequired && (
        <div className='mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-exo text-amber-900'>
          <p className='font-semibold'>Referral fees are not set up in this database yet.</p>
          <p className='mt-1'>
            The referral tables are created when the latest backend update is deployed (database
            migration <code>lms 0037</code>). Until then, partners and fees can&apos;t be added here.
          </p>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
        <MetricCard title='FEES PENDING PAYOUT' value={money(summary.feesPending)} />
        <MetricCard title='FEES PAID' value={money(summary.feesPaid)} />
        <MetricCard
          title='PAID REFERRED CLIENTS'
          value={String(summary.paidReferredClients || 0)}
        />
        <MetricCard title='ACTIVE PARTNERS' value={String(summary.partners || 0)} />
      </div>

      {notice && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm font-exo ${notice.startsWith('Error')
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            }`}
        >
          {notice}
        </div>
      )}

      <div className='relative max-w-full lg:max-w-[40%] mb-6 bg-white'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
        <Input
          placeholder='Search partners, clients, programs...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
        />
      </div>

      {/* Referral fees */}
      <div className={sectionClass}>
        <div className={`${sectionHeader} flex flex-wrap items-center justify-between gap-2`}>
          <span>Referral Fees</span>
          <select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
            className='rounded-md border border-black/20 bg-white px-2 py-1 text-xs font-semibold normal-case'
          >
            <option value='pending'>Pending payout</option>
            <option value='paid'>Paid</option>
            <option value='void'>Void</option>
            <option value='all'>All</option>
          </select>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-100'>
            <thead>
              <tr>
                <th className={thClass}>Referrer</th>
                <th className={thClass}>Client</th>
                <th className={thClass}>Program</th>
                <th className={thClass}>Price Paid</th>
                <th className={thClass}>Rate</th>
                <th className={thClass}>Fee</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {visibleFees.length ? (
                visibleFees.map((fee) => (
                  <tr key={fee.id}>
                    <td className={tdClass}>
                      <p className='font-semibold'>{fee.partnerName}</p>
                      <span
                        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLES[fee.partnerType] || ''}`}
                      >
                        {TYPE_LABELS[fee.partnerType] || 'TCI referral'}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <p className='font-semibold'>{fee.clientName}</p>
                      <p className='text-xs text-gray-500'>{fee.clientEmail}</p>
                    </td>
                    <td className={tdClass}>{fee.program || '-'}</td>
                    <td className={tdClass}>{money(fee.amountPaid, fee.currency)}</td>
                    <td className={tdClass}>{fee.feeLabel || `${fee.feePercent}%`}</td>
                    <td className={`${tdClass} font-bold`}>{money(fee.feeAmount, fee.currency)}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[fee.status] || ''}`}
                      >
                        {fee.status === 'pending' ? 'Pending payout' : fee.status}
                      </span>
                      {fee.status === 'paid' && (
                        <p className='mt-1 text-xs text-gray-500'>
                          {formatDate(fee.paidAt)}
                          {fee.payoutNote ? ` · ${fee.payoutNote}` : ''}
                        </p>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div className='flex flex-wrap gap-2'>
                        {fee.status === 'pending' && (
                          <button
                            type='button'
                            disabled={busy}
                            onClick={() => setFeeAmount(fee)}
                            className='rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                          >
                            Set amount
                          </button>
                        )}
                        {fee.status !== 'paid' && (
                          <button
                            type='button'
                            disabled={busy}
                            onClick={() => setFeeStatus(fee, 'paid')}
                            className='rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'
                          >
                            Mark paid
                          </button>
                        )}
                        {fee.status !== 'pending' && (
                          <button
                            type='button'
                            disabled={busy}
                            onClick={() => setFeeStatus(fee, 'pending')}
                            className='rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50'
                          >
                            Reopen
                          </button>
                        )}
                        {fee.status !== 'void' && (
                          <button
                            type='button'
                            disabled={busy}
                            onClick={() => setFeeStatus(fee, 'void')}
                            className='rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50'
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='px-4 py-6 text-sm text-gray-500' colSpan={8}>
                    No referral fees {feeFilter !== 'all' ? `with status "${feeFilter}"` : ''} yet.
                    Fees appear automatically when a referred client&apos;s program payment is
                    confirmed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8'>
        {/* Add partner */}
        <form onSubmit={handleCreatePartner} className={`${sectionClass} mb-0`}>
          <div className={sectionHeader}>Add Referral Partner</div>
          <div className='p-4 grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <label className='text-xs font-semibold text-gray-600'>
              Name *
              <input
                required
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                className={`${fieldClass} mt-1`}
                placeholder='Person or business name'
              />
            </label>
            <label className='text-xs font-semibold text-gray-600'>
              Email
              <input
                type='email'
                value={partnerForm.email}
                onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                className={`${fieldClass} mt-1`}
                placeholder='partner@example.com'
              />
            </label>
            <label className='text-xs font-semibold text-gray-600'>
              Partner type *
              <select
                value={partnerForm.partnerType}
                onChange={(e) => setPartnerForm({ ...partnerForm, partnerType: e.target.value })}
                className={`${fieldClass} mt-1`}
              >
                <option value='tci'>TCI Referral (10%)</option>
                <option value='business'>Business Referral Partner (15%)</option>
              </select>
            </label>
            <label className='text-xs font-semibold text-gray-600'>
              Referral code
              <input
                value={partnerForm.referralCode}
                onChange={(e) => setPartnerForm({ ...partnerForm, referralCode: e.target.value })}
                className={`${fieldClass} mt-1`}
                placeholder='Auto-generated if empty'
              />
            </label>
            <p className='sm:col-span-2 text-xs text-gray-500'>
              Clients are linked automatically when their &quot;Referred By&quot; answer matches
              the partner&apos;s name, email, or referral code.
            </p>
            <div className='sm:col-span-2'>
              <button type='submit' disabled={busy || setupRequired} className={primaryButton}>
                Add partner
              </button>
            </div>
          </div>
        </form>

        {/* Link client */}
        <form onSubmit={handleLinkClient} className={`${sectionClass} mb-0`}>
          <div className={sectionHeader}>Link Client to Referrer</div>
          <div className='p-4 grid grid-cols-1 gap-3'>
            <label className='text-xs font-semibold text-gray-600'>
              Client *
              <select
                required
                value={linkForm.clientUserId}
                onChange={(e) => setLinkForm({ ...linkForm, clientUserId: e.target.value })}
                className={`${fieldClass} mt-1`}
              >
                <option value=''>Select a client</option>
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                    {client.referredBy ? ` - referred by "${client.referredBy}"` : ''}
                    {client.isLinked ? ' [linked]' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className='text-xs font-semibold text-gray-600'>
              Referred by partner *
              <select
                required
                value={linkForm.partnerId}
                onChange={(e) => setLinkForm({ ...linkForm, partnerId: e.target.value })}
                className={`${fieldClass} mt-1`}
              >
                <option value=''>Select a partner</option>
                {activePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} - {partner.feePercent}%
                  </option>
                ))}
              </select>
            </label>
            <p className='text-xs text-gray-500'>
              If the client has already paid for a program, the referral fee is recorded right
              away.
            </p>
            <div>
              <button
                type='submit'
                disabled={busy || setupRequired || !activePartners.length}
                className={primaryButton}
              >
                Link client
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Partners */}
      <div className={sectionClass}>
        <div className={sectionHeader}>Referral Partners</div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-100'>
            <thead>
              <tr>
                <th className={thClass}>Partner</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Code</th>
                <th className={thClass}>Clients</th>
                <th className={thClass}>Pending</th>
                <th className={thClass}>Paid</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {partners.length ? (
                partners.map((partner) => (
                  <tr key={partner.id} className={partner.isActive ? '' : 'opacity-60'}>
                    <td className={tdClass}>
                      <p className='font-semibold'>{partner.name}</p>
                      <p className='text-xs text-gray-500'>{partner.email || '-'}</p>
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLES[partner.partnerType] || ''}`}
                      >
                        {partner.partnerTypeLabel}
                      </span>
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>{partner.referralCode}</td>
                    <td className={tdClass}>{partner.referredClients}</td>
                    <td className={tdClass}>{money(partner.feesPending)}</td>
                    <td className={tdClass}>{money(partner.feesPaid)}</td>
                    <td className={tdClass}>
                      <button
                        type='button'
                        disabled={busy}
                        onClick={() => togglePartnerActive(partner)}
                        className='rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50'
                      >
                        {partner.isActive ? 'Active - deactivate' : 'Inactive - activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='px-4 py-6 text-sm text-gray-500' colSpan={7}>
                    No referral partners yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referred clients */}
      <div className={sectionClass}>
        <div className={sectionHeader}>Referred Clients</div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-100'>
            <thead>
              <tr>
                <th className={thClass}>Client</th>
                <th className={thClass}>Referred By</th>
                <th className={thClass}>Linked</th>
                <th className={thClass}>Fees</th>
                <th className={thClass}>Date</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {referrals.length ? (
                referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className={tdClass}>
                      <p className='font-semibold'>{referral.clientName}</p>
                      <p className='text-xs text-gray-500'>{referral.clientEmail}</p>
                    </td>
                    <td className={tdClass}>{referral.partnerName}</td>
                    <td className={tdClass}>
                      {referral.source === 'auto'
                        ? 'Auto-matched'
                        : referral.source === 'staff'
                          ? `By ${referral.addedBy || 'staff'}`
                          : 'By admin'}
                      {referral.hasAccount === false && (
                        <p className='text-xs text-amber-700'>No TCI account yet</p>
                      )}
                      {referral.referredByText && (
                        <p className='text-xs text-gray-500'>
                          &quot;{referral.referredByText}&quot;
                        </p>
                      )}
                    </td>
                    <td className={tdClass}>{referral.feesCount}</td>
                    <td className={tdClass}>{formatDate(referral.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='px-4 py-6 text-sm text-gray-500' colSpan={5}>
                    No referred clients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
