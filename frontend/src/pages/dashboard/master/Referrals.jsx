import { useState, useEffect } from 'react'
import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import authService from '@/services/authService'

export default function Referrals() {
  const [referralsData, setReferralsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchReferralsData = async () => {
      try {
        setLoading(true)
        const data = await authService.getAdminReferrals()
        setReferralsData(data)
      } catch (err) {
        setError('Failed to load referrals data')
        console.error('Referrals error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReferralsData()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-600 text-center'>
          <p className='text-lg font-semibold'>Error Loading Referrals</p>
          <p className='text-sm'>{error}</p>
        </div>
      </div>
    )
  }

  // Prepare metrics data from API response
  const metricsData = [
    {
      title: 'TOTAL USERS VIA REFERRALS',
      value: referralsData?.totalUsersViaReferrals || 0,
    },
    {
      title: 'TOTAL REFERRALS',
      value: referralsData?.referrals?.length || 0,
    },
    {
      title: 'CONVERTED REFERRALS',
      value:
        referralsData?.referrals?.filter((ref) => ref.is_converted).length || 0,
    },
  ]

  // Prepare referrals data for the table
  const referralsTableData =
    referralsData?.referrals?.map((referral) => ({
      id: referral.id,
      referrer: referral.referrer?.name || 'N/A',
      referred_user: referral.referred_user?.name || 'N/A',
      status: referral.is_converted ? 'CONVERTED' : 'PENDING',
      created_at: new Date(referral.created_at).toLocaleDateString(),
    })) || []

  // Filter referrals based on search
  const filteredReferrals = referralsTableData.filter(
    (referral) =>
      referral.referrer.toLowerCase().includes(search.toLowerCase()) ||
      referral.referred_user.toLowerCase().includes(search.toLowerCase()),
  )

  const handleViewReferral = (referral) => {
    console.log('View referral:', referral)
    // TODO: Open referral details modal
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Referrals Management
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8'>
        {metricsData.map((metric, index) => (
          <MetricCard key={index} title={metric.title} value={metric.value} />
        ))}
      </div>

      <div>
        <div className='relative max-w-full lg:max-w-[40%] my-2 bg-white'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
          <Input
            placeholder='Search referrals...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
          />
        </div>

        <DataTable
          title='Referrals'
          data={filteredReferrals}
          onView={handleViewReferral}
          search={search}
        />
      </div>
    </div>
  )
}
