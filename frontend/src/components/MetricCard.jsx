import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({ title, value, className, subtext }) {
  return (
    <Card className={cn('border-2 border-[#F6B72D] bg-white', className)}>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-base sm:text-lg font-extrabold uppercase tracking-wide text-gray-900'>
            {title}
          </h3>
          <p
            className={cn(
              'text-xl sm:text-2xl font-extrabold text-[#F6B72D] ml-3',
            )}
          >
            {value}
          </p>
        </div>
        {subtext ? (
          <p className='mt-2 text-xs sm:text-sm text-gray-600 font-exo text-right'>
            {subtext}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
