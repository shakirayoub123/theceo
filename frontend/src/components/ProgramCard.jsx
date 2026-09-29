import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export function ProgramCard({
  title = 'PROGRAMS',
  data,
  onEnrollProgram,
  isShown = true,
}) {
  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-full'>
      <CardHeader className='pb-4'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-lg font-semibold text-foreground'>
            {title}
          </CardTitle>
          {isShown && onEnrollProgram && (
            <Button
              onClick={onEnrollProgram}
              className='bg-[#F6B72D] hover:bg-[#e6a02a] text-white'
              size='sm'
            >
              Enroll a Program
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 font-exo'>
          <div className='grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground border-b pb-2'>
            <span>ID</span>
            <span>Program Name</span>
            <span>Joined On</span>
          </div>
          {(data || []).map((program, idx) => {
            const key =
              program.programId ?? program.id ?? program.programName ?? idx
            const idDisplay = program.programId ?? program.id ?? idx + 1
            const name = program.programName ?? program.name ?? '—'
            const joined = program.enrolledAt
              ? formatDate(program.enrolledAt)
              : program.joinedOn ?? '—'

            return (
              <div
                key={key}
                className='grid grid-cols-3 gap-4 items-center py-2 text-sm'
              >
                <span className='text-foreground'>{idDisplay}</span>
                <span className='text-foreground'>{name}</span>
                <span className='text-foreground'>{joined}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
