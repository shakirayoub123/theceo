import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function Meetings({ title = 'MEETINGS', data, onAction, onSchedule }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-full'>
      <CardHeader className='pb-4 flex flex-row items-center justify-between'>
        <CardTitle className='text-lg font-semibold text-foreground'>
          {title}
        </CardTitle>
        <Button
          size='sm'
          className='bg-[#F6B72D] text-xs px-2 py-1 h-6 font-exo'
          onClick={onSchedule}
        >
          SCHEDULE A MEETING
        </Button>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 font-exo'>
          <div className='grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground border-b pb-2'>
            <span>ID</span>
            <span>Date</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {data.map((meeting) => (
            <div
              key={meeting.id}
              className='grid grid-cols-4 gap-4 items-center py-2 text-sm'
            >
              <span className='text-foreground'>{meeting.id}</span>
              <span className='text-foreground'>{meeting.date}</span>
              <Badge
                className={getStatusColor(meeting.status)}
                variant='secondary'
              >
                {meeting.status.toUpperCase()}
              </Badge>
              <div className='flex gap-1'>
                {meeting.actions?.map((action) => (
                  <Button
                    key={action}
                    size='sm'
                    variant='outline'
                    className='text-xs px-2 py-1 h-6 bg-[#F6B72D] text-white border-[#F6B72D]'
                    onClick={() => onAction?.(meeting.id, action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
