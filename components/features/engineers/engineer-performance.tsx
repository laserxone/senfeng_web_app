"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Heading from "@/components/ui/heading"
import { Skeleton } from "@/components/ui/skeleton"
import { TIMEZONE } from "@/constants/data"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { EngineerPerformanceResponse } from "@/lib/types"
import { CheckCircle2, ClipboardList, Clock, Filter, TrendingUp } from "lucide-react"
import moment from "moment"
import momentT from "moment-timezone"
import { useEffect, useState } from "react"
import { FilterSheetMonth } from "@/components/features/users/filter-sheet"
import { CategoryDonutChart } from "./category-donut-chart"
import { OverviewChart } from "./overview-chart"
import { PerformanceBarChart } from "./performance-bar-chart"
import { StatCard } from "./stat-card"
import { StatusDonutChart } from "./status-donut-chart"
import { TopPerformers } from "./top-performer"

export default function EngineerPerformance() {

    const [data, setData] = useState<EngineerPerformanceResponse>()
    const [filterVisible, setFilterVisible] = useState(false);
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndData] = useState("")
    const [loading, setLoading] = useState(true)
    const { userID } = useUserDetail()

    useEffect(() => {
        if (userID) {
            const start_date = momentT
                .tz(TIMEZONE)
                .startOf("month")
                .startOf("day")
                .utc()
                .toISOString();
            const end_date = momentT
                .tz(TIMEZONE)
                .endOf("month")
                .endOf("day")
                .utc()
                .toISOString();
            fetchData(start_date, end_date)
        }
    }, [userID])

    async function fetchData(start = "", end = "") {
        if (!userID) return
        setLoading(true)
        try {
            const res = await axios.get(`/${userID}/performance?start_date=${start}&end_date=${end}`)
            setStartDate(start)
            setEndData(end)
            setData(res.data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col space-y-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <Heading panel title="Engineers Performance" description="Review engineering team performance" />
                <Button
                    onClick={() => setFilterVisible(true)}
                    variant="outline"
                >
                    <Filter />
                    {startDate && endDate && (
                        <Label>
                            {moment(startDate).format("DD MMM YYYY")} →{" "}
                            {moment(endDate).format("DD MMM YYYY")}
                        </Label>
                    )}
                </Button>
            </div>
            {loading ?
                <LoadingSkeleton />
                :
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <StatCard
                            title="Total Assigned"
                            value={data?.overview.total_assigned.toLocaleString()}
                            icon={ClipboardList}
                            variant="primary"
                            trend={{ value: data?.overview?.total_assigned_change?.value || 0, isPositive: data?.overview?.total_assigned_change?.positive || false }}
                        />
                        <StatCard
                            title="Completed"
                            value={data?.overview.total_completed.toLocaleString()}
                            icon={CheckCircle2}
                            variant="success"
                            trend={{ value: data?.overview?.total_completed_change?.value || 0, isPositive: data?.overview?.total_completed_change?.positive || false }}
                        />
                        <StatCard
                            title="Pending"
                            value={data?.overview.total_pending.toLocaleString()}
                            icon={Clock}
                            variant="warning"
                            trend={{ value: data?.overview?.total_pending_change?.value || 0, isPositive: data?.overview?.total_pending_change?.positive || false }}
                        />
                        <StatCard
                            title="Completion Rate"
                            value={`${data?.overview.completion_rate}%`}
                            icon={TrendingUp}
                            variant="primary"
                            trend={{ value: data?.overview?.completion_rate_change?.value || 0, isPositive: data?.overview?.completion_rate_change?.positive || false }}
                        />
                    </div>


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


                </>
            }

            <FilterSheetMonth
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                onReturn={async (val) => {
                    fetchData(val.start, val.end);
                }}
            />
        </div>
    )
}

const LoadingSkeleton = () => {
    return (
        <div className="space-y-4 w-full">

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
            </div>


            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                <div className="space-y-4 lg:col-span-2">

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Skeleton className="h-80 w-full rounded-xl" />
                        </div>

                        <div className="lg:col-span-1">
                            <Skeleton className="h-80 w-full rounded-xl" />
                        </div>
                    </div>


                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Skeleton className="h-80 w-full rounded-xl" />
                        </div>

                        <div className="lg:col-span-1">
                            <Skeleton className="h-80 w-full rounded-xl" />
                        </div>
                    </div>
                </div>


                <div className="space-y-4 lg:col-span-1">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}




