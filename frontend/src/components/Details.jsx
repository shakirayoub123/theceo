import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function ClientDetails({ title = 'CLIENT DETAILS', data, fields }) {
  // Support both data prop (object) and fields prop (array) for backward compatibility
  const displayFields =
    fields ||
    (data
      ? [
          { label: 'Name', value: data.name },
          { label: 'Joined On', value: data.joinedOn },
          { label: 'Email', value: data.email },
          { label: 'Sales Influencer', value: data.salesInfluencer || 'None' },
        ]
      : [])

  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-full'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold text-foreground'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 font-exo'>
        {displayFields.map(
          (field, idx) =>
            field.value && (
              <div key={idx} className='flex justify-between items-center'>
                <span className='text-sm font-medium text-muted-foreground'>
                  {field.label}:
                </span>
                <span className='text-sm text-foreground'>{field.value}</span>
              </div>
            ),
        )}
      </CardContent>
    </Card>
  )
}
