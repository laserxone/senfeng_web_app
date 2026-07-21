"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Heading from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FilterSheet from "@/components/features/users/filter-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MachineProps } from "@/lib/types";
import { Filter } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function Page() {

    const [filterVisible, setFilterVisible] = useState(false)
    const [data, setData] = useState<MachineProps[]>([])
    const [loading, setLoading] = useState(false)
    const { userID, base_route } = useUserDetail()



    async function fetchData(start: string, end: string, user: number | null = null) {

        if (!userID)
            return

        setLoading(true)

        axios.get(`/${userID}/analytics?user=${user || ""}&start=${start}&end=${end}`).then((response) => {

            setData(response.data)
        }).finally(() => {
            setLoading(false)
        })

    }

    return (

        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <Heading panel title="Analytics" description="View team analytics" />
                <Button
                    disabled={!userID || loading}
                    onClick={() => setFilterVisible(true)}
                    variant="ghost"
                    className="p-0 w-8"
                >
                    <Filter />
                </Button>
            </div>



            <SalesTable data={data} base_route={base_route} loading={loading} />

            <FilterSheet
                user_disable={false}
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                onReturn={async (val) => {
                    await fetchData(
                        val.start,
                        val.end,
                        val.user
                    );
                }}
            />

        </div>
    )
}


const SalesTable = ({ data = [], base_route = "", loading }: { data: MachineProps[], base_route: string, loading: boolean }) => {

    const [total, setTotal] = useState(0)
    const isMobile = useIsMobile()

    useEffect(() => {
        async function fetchSales() {

            const totalPrice = data.reduce((sum, item) => sum + Number(item.price || 0), 0)
            setTotal(totalPrice)
        }

        fetchSales()
    }, [data])

    return (
        loading ?
            <Skeleton className="h-[300px] w-full" />
            :
            <Card className="w-full shadow-md rounded-2xl">

                <CardContent>
                    <CardHeader className="mb-2">
                        <div className="flex justify-between items-center w-full">
                            <CardTitle className="text-xl font-semibold">Sales Report</CardTitle>
                            <span className="text-lg font-bold">Total: {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "PKR",
                                maximumFractionDigits: 0,
                            }).format(total || 0)}</span>
                        </div>
                    </CardHeader>
                    <div
                        className={`relative flex flex-1 min-h-[calc(100dvh-230px)] ${isMobile && "w-[calc(100vw-44px)]"}`}
                    >
                        <div className="absolute bottom-0 left-0 right-0 top-0 flex rounded-md border md:overflow-auto custom-scrollbar overflow-auto">

                            <Table className="relative">
                                <TableHeader>
                                    <TableRow className="sticky top-0 z-1 bg-background">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Serial No</TableHead>
                                        <TableHead>Power</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>User</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((sale, idx) => (
                                        <TableRow key={idx} >
                                            <TableCell className="whitespace-normal break-words">
                                                <Link className="hover:underline" href={`/${base_route}/member/${sale.customer_id}`} target="blank">
                                                    {sale.name}
                                                </Link>
                                            </TableCell >
                                            <TableCell className="whitespace-normal break-words">{sale.owner}</TableCell>
                                            <TableCell className="whitespace-normal break-words">
                                                <Link className="hover:underline" target="blank" href={`/${base_route}/member/${sale.customer_id}/${sale.sale_id}`}>
                                                    {sale.serial_no}
                                                </Link>
                                            </TableCell >
                                            <TableCell className="whitespace-normal break-words">{sale.power}</TableCell>
                                            <TableCell className="font-medium whitespace-normal break-words">{sale.price}</TableCell>
                                            <TableCell className="whitespace-normal break-words">{sale.user_name ?? "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                </CardContent>
            </Card>
    )
}
