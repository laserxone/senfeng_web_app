import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";

const chartConfig = {
  customers_assigned: {
    label: "Assigned Customers",
    color: "var(--chart-1)",
  },
  sale_produced_customers: {
    label: "Conversions",
    color: "var(--chart-2)",
  },
  repeated_customers: {
    label: "Repeated Customers",
    color: "var(--chart-3)",
  },
};

export default function SalesTeamProgressChartCRM({ passingData } : {passingData : any[]}) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!Array.isArray(passingData)) return;

    const updatedData = passingData.map((item) => ({
      ...item,
      name: item.name?.split(" ").slice(0, 2).join(" "),
      customers_assigned: Number(item.customers_assigned) || 0,
      sale_produced_customers: Number(item.sale_produced_customers) || 0,
      repeated_customers: Number(item.repeated_customers) || 0,
      customer_to_member_conversion:
        Number(item.customer_to_member_conversion) || 0,
    }));

    setData(updatedData);
  }, [passingData]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-wrap justify-between gap-2 px-6 py-5 sm:py-6">
          <div className="flex flex-col justify-center gap-1">
            <CardTitle>Sales Team Progress</CardTitle>
            <CardDescription>
              Showing assigned customers, conversions, and repeated customers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <RenderBarChart data={data} />
      </CardContent>
    </Card>
  );
}

const RenderBarChart = ({ data } : {data : any[]}) => {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[320px] w-full"
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[240px]"
              formatter={(value, name, item) => {
                const label =
                  chartConfig[name as keyof typeof chartConfig]?.label || name;

                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                );
              }}
            />
          }
        />

        <Bar
          dataKey="customers_assigned"
          fill="var(--color-customers_assigned)"
          name="customers_assigned"
          radius={[4, 4, 0, 0]}
        />

        <Bar
          dataKey="sale_produced_customers"
          fill="var(--color-sale_produced_customers)"
          name="sale_produced_customers"
          radius={[4, 4, 0, 0]}
        />

        <Bar
          dataKey="repeated_customers"
          fill="var(--color-repeated_customers)"
          name="repeated_customers"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};