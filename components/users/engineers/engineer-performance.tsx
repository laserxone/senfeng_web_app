"use client"

import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { EngineerPerformanceResponse } from "@/lib/types"
import { CheckCircle2, ClipboardList, Clock, Filter, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { CategoryDonutChart } from "./category-donut-chart"
import { OverviewChart } from "./overview-chart"
import { PerformanceBarChart } from "./performance-bar-chart"
import { StatCard } from "./stat-card"
import { StatusDonutChart } from "./status-donut-chart"
import { TopPerformers } from "./top-performer"
import { Button } from "@/components/ui/button"
import FilterSheet from "../filterSheet"

export default function EngineerPerformance() {

    const [data, setData] = useState<EngineerPerformanceResponse>()
     const [filterVisible, setFilterVisible] = useState(false);
    const { userID } = useUserDetail()

    useEffect(() => {
        if (userID) {
            fetchData()
        }
    }, [userID])

    async function fetchData(start = "", end = "") {

        try {
            const res = await axios.get(`/${userID}/performance?start_date=${start}&end_date=${end}`)
            setData(res.data)
        } catch (error) {

        }
    }

    return (
        <div className="flex flex-1 flex-col space-y-4 pb-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    Hi, Welcome back 👋
                </h2>
                 <Button
                  onClick={() => setFilterVisible(true)}
                  variant="ghost"
                  className="p-0 w-8"
                >
                  <Filter />
                </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Assigned"
                    value={data?.overview.total_assigned.toLocaleString()}
                    icon={ClipboardList}
                    variant="primary"
                    trend={{ value: 12.5, isPositive: true }}
                />
                <StatCard
                    title="Completed"
                    value={data?.overview.total_completed.toLocaleString()}
                    icon={CheckCircle2}
                    variant="success"
                    trend={{ value: 8.2, isPositive: true }}
                />
                <StatCard
                    title="Pending"
                    value={data?.overview.total_pending.toLocaleString()}
                    icon={Clock}
                    variant="warning"
                    trend={{ value: 3.1, isPositive: false }}
                />
                <StatCard
                    title="Completion Rate"
                    value={`${data?.overview.completion_rate}%`}
                    icon={TrendingUp}
                    variant="primary"
                    trend={{ value: 5.4, isPositive: true }}
                />
            </div>

            {/* Overview Chart */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                            <div className="lg:col-span-2">
                                <OverviewChart data={data?.performance_trend || []} />
                            </div>

                            <div className="lg:col-span-1">
                                <CategoryDonutChart
                                    data={data?.complaints_by_category || []}
                                />
                            </div>

                        </div>

                        <div className=" grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="lg:col-span-2">

                                <PerformanceBarChart data={data?.performance_trend || []} />
                            </div>
                            <div className="lg:col-span-1">
                                <StatusDonutChart data={data?.complaints_by_status || []} />
                            </div>
                        </div>
                    </div>

                </div>

                <div className="lg:col-span-1">
                        <TopPerformers performers={data?.top_performers || []} />
                </div>

            </div>

   <FilterSheet 
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onReturn={async (val) => {
            fetchData(val.start, val.end);
          }}
        />

        </div>
    )
}