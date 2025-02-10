'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';


export function AreaStats({data}) {

  

const chartConfig = {
  satisfactory: {
    label: 'Satisfactory',
    color: 'hsl(var(--chart-2))'
  },
  unsatisfactory: {
    label: 'Unsatisfactory',
    color: 'hsl(var(--chart-1))'
  }
}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>
          Showing feedback status from the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[310px] w-full'
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
             <Area
              dataKey='unsatisfactory'
              type='natural'
              fill='var(--color-unsatisfactory)'
              fillOpacity={0.4}
              stroke='var(--color-unsatisfactory)'
              stackId='a'
            />
            <Area
              dataKey='satisfactory'
              type='natural'
              fill='var(--color-satisfactory)'
              fillOpacity={0.4}
              stroke='var(--color-satisfactory)'
              stackId='a'
            />
           
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 font-medium leading-none'>
              Trending up by 5.2% this month <TrendingUp className='h-4 w-4' />
            </div>
            <div className='flex items-center gap-2 leading-none text-muted-foreground'>
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
