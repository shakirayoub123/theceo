import { useEffect, useState } from 'react'
import { X, Copy } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import authService from '@/services/authService'

const DEFAULT_CURRENCY = 'usd'
const WORLD_CURRENCIES = [
  'aed',
  'afn',
  'all',
  'amd',
  'ang',
  'aoa',
  'ars',
  'aud',
  'awg',
  'azn',
  'bam',
  'bbd',
  'bdt',
  'bgn',
  'bhd',
  'bif',
  'bmd',
  'bnd',
  'bob',
  'brl',
  'bsd',
  'btn',
  'bwp',
  'byn',
  'bzd',
  'cad',
  'cdf',
  'chf',
  'clp',
  'cny',
  'cop',
  'crc',
  'cuc',
  'cup',
  'cve',
  'czk',
  'djf',
  'dkk',
  'dop',
  'dzd',
  'egp',
  'ern',
  'etb',
  'eur',
  'fjd',
  'fkp',
  'gbp',
  'gel',
  'ghs',
  'gip',
  'gmd',
  'gnf',
  'gtq',
  'gyd',
  'hkd',
  'hnl',
  'hrk',
  'htg',
  'huf',
  'idr',
  'ils',
  'inr',
  'iqd',
  'irr',
  'isk',
  'jmd',
  'jod',
  'jpy',
  'kes',
  'kgs',
  'khr',
  'kmf',
  'kpw',
  'krw',
  'kwd',
  'kyd',
  'kzt',
  'lak',
  'lbp',
  'lkr',
  'lrd',
  'lsl',
  'lyd',
  'mad',
  'mdl',
  'mga',
  'mkd',
  'mmk',
  'mnt',
  'mop',
  'mru',
  'mur',
  'mvr',
  'mwk',
  'mxn',
  'myr',
  'mzn',
  'nad',
  'ngn',
  'nio',
  'nok',
  'npr',
  'nzd',
  'omr',
  'pab',
  'pen',
  'pgk',
  'php',
  'pkr',
  'pln',
  'pyg',
  'qar',
  'ron',
  'rsd',
  'rub',
  'rwf',
  'sar',
  'sbd',
  'scr',
  'sdg',
  'sek',
  'sgd',
  'shp',
  'sle',
  'sll',
  'sos',
  'srd',
  'ssp',
  'stn',
  'svc',
  'syp',
  'szl',
  'thb',
  'tjs',
  'tmt',
  'tnd',
  'top',
  'try',
  'ttd',
  'twd',
  'tzs',
  'uah',
  'ugx',
  'usd',
  'uyu',
  'uzs',
  'ves',
  'vnd',
  'vuv',
  'wst',
  'xaf',
  'xcd',
  'xcg',
  'xdr',
  'xof',
  'xpf',
  'xsu',
  'yer',
  'zar',
  'zmw',
  'zwg',
  'zwl',
]

export function CreatePaymentLinkModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
  initialProgramId = '',
}) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentLink, setPaymentLink] = useState('')
  const [programs, setPrograms] = useState([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setCurrency(DEFAULT_CURRENCY)
      setPaymentLink('')
      setSelectedProgramId(initialProgramId ? String(initialProgramId) : '')
    }
  }, [isOpen, initialProgramId])

  useEffect(() => {
    if (!isOpen) return

    const fetchPrograms = async () => {
      setIsLoadingPrograms(true)
      try {
        const response = await authService.getSalesAllPrograms()
        setPrograms(response?.programs || [])
      } catch (error) {
        console.error('Failed to load programs for payment link:', error)
        toast.error('Failed to load programs')
        setPrograms([])
      } finally {
        setIsLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCopyLink = async () => {
    if (!paymentLink) return
    try {
      await navigator.clipboard.writeText(paymentLink)
      toast.success('Payment link copied to clipboard')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleProgramChange = (programId) => {
    setSelectedProgramId(programId)
    const selectedProgram = programs.find(
      (program) => String(program.id) === String(programId),
    )
    const programPrice = selectedProgram?.price
    if (programPrice !== undefined && programPrice !== null && programPrice !== '') {
      setAmount(String(programPrice))
    }
  }

  useEffect(() => {
    if (!isOpen || !initialProgramId || programs.length === 0) return
    handleProgramChange(String(initialProgramId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialProgramId, programs])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!lead) return

    if (!selectedProgramId) {
      toast.error('Select the program this payment is for')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount greater than 0')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authService.createSalesPaymentLink({
        leadId: lead.uuid || lead.id || lead.lead_id,
        amount: parsedAmount,
        currency: String(currency || DEFAULT_CURRENCY).toLowerCase(),
        programId: selectedProgramId,
        leadEmail:
          lead.clientEmail ||
          lead.client_email ||
          lead.email ||
          lead.contact_email ||
          lead.primaryEmail ||
          null,
      })

      const link =
        response?.payment_link || response?.paymentLink || response?.url || ''

      if (!link) {
        toast.success('Payment link created successfully')
        onSuccess?.()
        onClose()
        return
      }

      setPaymentLink(link)
      toast.success('Payment link created successfully')
      onSuccess?.(link)
    } catch (err) {
      console.error('Failed to create payment link:', err)
      toast.error(err.message || 'Failed to create payment link')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !lead) {
    return null
  }

  const leadDisplayName =
    lead?.clientName ||
    lead?.client_name ||
    lead?.name ||
    lead?.full_name ||
    lead?.email ||
    'Lead'

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className='bg-white rounded-[10px] border-2 border-[#F6B72D] w-full max-w-lg mx-auto relative shadow-2xl overflow-hidden'>
        <div className='flex items-center justify-between p-5 border-b border-gray-200'>
          <div>
            <h2 className='text-lg font-bold text-gray-900 font-gt'>
              Create Payment Link
            </h2>
            <p className='text-sm text-gray-600 font-exo mt-1'>
              Lead: <span className='font-semibold'>{leadDisplayName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-5'>
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700 font-exo'>
              Program
            </label>
            <select
              value={selectedProgramId}
              onChange={(event) => handleProgramChange(event.target.value)}
              required
              disabled={isLoadingPrograms}
              className='w-full border border-gray-300 rounded-md px-3 py-2 font-exo focus:outline-none focus:ring-2 focus:ring-[#F6B72D] disabled:opacity-60'
            >
              <option value=''>
                {isLoadingPrograms ? 'Loading programs...' : 'Select program'}
              </option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700 font-exo'>
              Amount
            </label>
            <div className='flex gap-2'>
              <Input
                type='number'
                min='0'
                step='0.01'
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder='Enter amount'
                required
                className='font-exo'
              />
              <select
                value={currency}
                onChange={(event) =>
                  setCurrency(
                    String(event.target.value || DEFAULT_CURRENCY).toLowerCase(),
                  )
                }
                className='border border-gray-300 rounded-md px-3 py-2 font-exo focus:outline-none focus:ring-2 focus:ring-[#F6B72D]'
              >
                {WORLD_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {paymentLink && (
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700 font-exo'>
                Payment Link
              </label>
              <div className='flex gap-2'>
                <Input value={paymentLink} readOnly className='font-exo' />
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCopyLink}
                  className='flex items-center gap-2'
                >
                  <Copy className='h-4 w-4' />
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className='flex justify-end gap-3 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='font-exo'
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-[#F6B72D] text-black hover:bg-[#F6B72D]/90 font-exo'
              disabled={isSubmitting || isLoadingPrograms || !selectedProgramId}
            >
              {isSubmitting
                ? 'Generating...'
                : paymentLink
                  ? 'Generate Again'
                  : 'Generate Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
