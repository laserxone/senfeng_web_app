'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export const description = 'An interactive bar chart';

const chartConfig = {
  total_machines_sold: {
    label: 'Machines Sold',
    color: 'hsl(var(--chart-1))'
  }
};

export function BarStats({ data }) {
  const [activeChart, setActiveChart] = React.useState('total_machines_sold');

  const totalMachinesSold = React.useMemo(
    () => data.reduce((acc, curr) => acc + (Number(curr.total_machines_sold) || 0), 0),
    [data]
  );

  return (
    <Card>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>
            Showing total machines sold for the last 3 months
          </CardDescription>
        </div>
        <div className='flex'>
          <button
            data-active={true}
            className='relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6' 
          >
            <span className='text-xs text-muted-foreground'>
              {chartConfig[activeChart].label}
            </span>
            <span className='text-lg font-bold leading-none sm:text-3xl'>
              {totalMachinesSold.toLocaleString()}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className='px-2 sm:p-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[280px] w-full'
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='total_machines_sold'
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar dataKey='total_machines_sold' fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
