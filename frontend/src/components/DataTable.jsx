import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { useState } from 'react'

export function DataTable({ data, columns = [], actions = [], search = '' }) {
  const [page, setPage] = useState(1)
  const [active, setActive] = useState('prev')
  const rowsPerPage = 5

  // Filter data based on search - check all string fields
  const filtered = data.filter((row) =>
    columns.some((col) => {
      const value = row[col.key]
      return (
        value && value.toString().toLowerCase().includes(search.toLowerCase())
      )
    }),
  )
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalPages = Math.ceil(filtered.length / rowsPerPage)

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1)
      setActive('prev')
    }
  }

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1)
      setActive('next')
    }
  }

  return (
    <Card className='border-2 border-[#F6B72D] shadow-md bg-white'>
      <CardContent>
        {/* Table */}
        <div className='overflow-x-auto font-exo'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-gray-300'>
                <TableHead className='font-bold'>S. #</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.key} className='font-bold'>
                    {col.label}
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className='font-bold'>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length ? (
                paginated.map((row, idx) => (
                  <TableRow
                    key={row.id || idx}
                    className='border-b border-gray-300'
                  >
                    <TableCell>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(row) : row[col.key]}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell className='space-x-2'>
                        {actions.map((action, actionIdx) => {
                          if (action.condition && !action.condition(row))
                            return null
                          return (
                            <button
                              key={actionIdx}
                              onClick={() => action.onClick(row)}
                              className='text-sm underline'
                            >
                              {typeof action.label === 'function' ? action.label(row) : action.label}
                            </button>
                          )
                        })}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow className='border-b border-gray-300'>
                  <TableCell
                    colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)}
                    className='text-center text-gray-500'
                  >
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className='flex justify-center mt-6 font-exo'>
          <div className='flex rounded-full overflow-hidden shadow-md bg-black'>
            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className={`flex items-center gap-2 px-6 py-2 text-white transition-colors 
            ${active === 'prev' ? 'bg-[#4c4c4c] rounded-full' : null}
            ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}
          `}
            >
              <ArrowLeft className='h-4 w-4 text-red-500' />
              Prev
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className={`flex items-center gap-2 px-6 py-2 text-white transition-colors 
            ${active === 'next' ? 'bg-[#4c4c4c] rounded-full' : null}
            ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
          `}
            >
              Next
              <ArrowRight className='h-4 w-4 text-green-500' />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
