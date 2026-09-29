import { DataTable } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import clientAPIService from '@/services/clientAPIService'
import { useNavigate } from 'react-router-dom'

export default function Programs() {
  const [search, setSearch] = useState('')
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true)
        const data = await clientAPIService.getClientPrograms()
        setPrograms(data || [])
      } catch (error) {
        console.error('Failed to fetch client programs:', error)
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  // Transform API data to match DataTable format
  const tableData = programs.map((program) => ({
    id: program.id,
    program: program.name,
    enrolled: new Date(program.enrolledOn).toLocaleDateString('en-GB'),
  }))

  const tableColumns = [
    { key: 'program', label: 'Program Name' },
    { key: 'enrolled', label: 'Enrolled On' },
  ]

  const tableActions = [
    {
      label: 'View Details',
      onClick: (row) => navigate(`/client-dashboard/service/${row.id}`),
    },
  ]

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-6 tracking-wide'>
        Services
      </h2>

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
          title='My Programs'
          data={tableData}
          columns={tableColumns}
          actions={tableActions}
          search={search}
        />
      </div>
    </div>
  )
}
