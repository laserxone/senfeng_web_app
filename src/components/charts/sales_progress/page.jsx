import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const chartConfig = {
  completed_feedback: {
    label: "Call Completion %",
    color: "hsl(var(--chart-1))",
  },
  completed_monthly_target: {
    label: "Target Completion %",
    color: "hsl(var(--chart-2))",
  },
  completed_visit: {
    label: "Visit Completion %",
    color: "hsl(var(--chart-3))",
  },
};

export default function SalesTeamProgressChart({ passingData }) {
  const [data, setData] = useState([]);
  const [usd, setUsd] = React.useState("280");

  useEffect(() => {
  if (usd) {
    const updatedData = passingData.map((item) => {
      const totalFeedbacks = Number(item.total_feedbacks) || 0;
      const totalMembers = Number(item.total_members) || 0;
      const totalSalePrice = Number(item.total_sale_price) || 0;
      const monthlyTarget = Number(item.monthly_target) || 0;
      const totalVisit = Number(item.total_visits) || 0;
      const visitTarget = 15;

      const completedFeedback = totalMembers > 0
        ? Math.min((totalFeedbacks / totalMembers) * 100, 100)
        : 0;

      const completedMonthlyTarget = monthlyTarget > 0
        ? Math.min((totalSalePrice / monthlyTarget / Number(usd)) * 100, 100)
        : 0;

      const completedVisit = visitTarget > 0
        ? Math.min((totalVisit / visitTarget) * 100, 100)
        : 0;

      return {
        ...item,
        completed_feedback: completedFeedback.toFixed(2),
        completed_monthly_target: completedMonthlyTarget.toFixed(2),
        completed_visit: completedVisit.toFixed(2),
      };
    });

    setData(updatedData);
  }
}, [usd, passingData]);


 


  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 gap-2 justify-between px-6 py-5 sm:py-6 flex-wrap">
          <div className="flex flex-col justify-center gap-1">
            <CardTitle>Sales Team Progress</CardTitle>
            <CardDescription>
              Showing percentage completion across key activities
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Label>USD:</Label>
            <Input
              type="number"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  valueFormatter={(value) => `${value}%`}
                />
              }
            />
            <Bar
              dataKey="completed_feedback"
              fill="var(--color-completed_feedback)"
              name={chartConfig.completed_feedback.label}
            />
            <Bar
              dataKey="completed_monthly_target"
              fill="var(--color-completed_monthly_target)"
              name={chartConfig.completed_monthly_target.label}
            />
            <Bar
              dataKey="completed_visit"
              fill="var(--color-completed_visit)"
              name={chartConfig.completed_visit.label}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
