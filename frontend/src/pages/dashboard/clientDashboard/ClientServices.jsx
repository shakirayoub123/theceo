import { DataTable } from '@/components/DataTable'
import { MetricCard } from '@/components/MetricCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'

const clients = [
  {
    id: 1,
    client: 'John Riley (ID 0001)',
    program: 'Leadership Coaching 12-week Program',
    status: 'COMPLETED',
    enrolled: 12,
    advisors: 'Dr. Claire, James',
  },
  {
    id: 2,
    client: 'John Riley (ID 0001)',
    program: 'Leadership Coaching 12-week Program',
    status: 'ACTIVE',
    enrolled: 12,
    advisors: 'Dr. Claire, James',
  },
]
const metricsData = [
  { title: 'TOTAL CLIENTS', value: 24 },
  { title: 'ACTIVE CLIENTS', value: 24 },
  { title: 'CLIENTS AWAITING PURCHASE', value: 24 },
]

export default function ClientServices() {
  const [search, setSearch] = useState('')

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Products
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
            placeholder='Search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
          />
        </div>
        <DataTable
          title='Client Programs'
          data={clients}
          onView={(row) => console.log('View:', row)}
          onBlock={(row) => console.log('Block:', row)}
          search={search}
        />
      </div>
    </div>
  )
}
