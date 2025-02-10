'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';


export function Stats({industryData}) {
  const chartConfig = React.useMemo(() => {
    const config = {
      customer_count: {
        label: "Customers",
      },
    };

    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))",
      "hsl(var(--chart-7))",
      "hsl(var(--chart-8))",
      
    ];
    let i = 0
    industryData.sort((a,b)=>Number(b.customer_count) - Number(a.customer_count)).forEach((industry, index) => {
      const key = industry.industry.toLowerCase().replace(/\s+/g, "");

      config[key] = {
        label: industry.industry,
        color: colors[i],
      };
      i++
      if(i === 9){
        i = 0
      }
    });

    return config;
  }, [industryData]);

  // Step 2: Transform Data to Match Normalized Keys
  const processedData = React.useMemo(() => {
    return industryData.map((industry) => ({
      industry: industry.industry.toLowerCase().replace(/\s+/g, ""), // Normalized key
      customer_count: Number(industry.customer_count),
      fill : `var(--color-${industry.industry.toLowerCase().replace(/\s+/g, "")})`
    }));
  }, [industryData]);

  // Step 3: Calculate Total Customers
  const totalCustomers = React.useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.customer_count, 0);
  }, [processedData]);
  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Working Industries</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[360px]'
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={processedData}
              dataKey='customer_count'
              nameKey='industry'
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalCustomers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground'
                        >
                          Customers
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        {/* <div className='flex items-center gap-2 font-medium leading-none'>
          Showing total industries you have worked with so far
        </div> */}
        <div className='leading-none text-muted-foreground'>
        Showing total industries you have worked with so far
        </div>
      </CardFooter>
    </Card>
  );
}
