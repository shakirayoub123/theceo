import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClientsLineChart({ chartData, title }) {
  return (
    <Card className='border-2 border-[#F6B72D] bg-white'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg uppercase tracking-wide font-normal'>
            {title}
          </CardTitle>
          <span className='text-md text-gray-400 uppercase tracking-wide font-exo'>
            By Month
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-[300px] font-exo'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <XAxis
                dataKey='month'
                axisLine={true}
                tickLine={true}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis
                axisLine={true}
                tickLine={true}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                domain={[0, 10]}
                ticks={[2, 4, 6, 8, 10]}
              />
              <Tooltip />
              {/* <Legend /> */}
              <Line
                type='linear'
                dataKey='meetings'
                stroke='#F6B72D'
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
