import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export function ModifyDetails({
  title = 'MODIFY DETAILS',
  programStatus,
  onUpdate,
}) {
  const handleUpdate = () => {
    onUpdate?.({
      programStatus: programStatus.value,
    })
  }

  return (
    <Card className='border-2 border-[#F6B72D] bg-white'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-sm font-semibold text-foreground'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 font-exo'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Program Status
          </label>
          <Select value={programStatus.value}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='z-10 bg-white border border-gray-200 rounded-md shadow-md font-exo'>
              {programStatus.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleUpdate}
          className='w-full bg-[#F6B72D] text-white font-medium'
        >
          UPDATE
        </Button>
      </CardContent>
    </Card>
  )
}
