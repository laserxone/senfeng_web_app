"use client"

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import FilterSheet from "@/components/users/filterSheet";
import useUserDetail from "@/hooks/use-user-detail";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Spinner from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";


export default function Page() {

    const [filterVisible, setFilterVisible] = useState(false)
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const { userID, base_route } = useUserDetail()



    async function fetchData(start, end, user = null) {

        if (!userID)
            return

        setLoading(true)

        axios.get(`/${userID}/analytics?user=${user || ""}&start=${start}&end=${end}`).then((response) => {
            console.log(response.data)
            setData(response.data)
        }).finally(() => {
            setLoading(false)
        })

    }

    return (

        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex items-start justify-between">
                <Heading title="Analytics" description="View team analytics" />
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


const SalesTable = ({ data = [], base_route = "", loading }) => {

    const [total, setTotal] = useState(0)

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
                <CardHeader>

                    <div className="flex justify-between items-center w-full">
                        <CardTitle className="text-xl font-semibold">Sales Report</CardTitle>
                        <span className="text-lg font-bold">Total: {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "PKR",
                        }).format(total || 0)}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
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
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Link className="hover:underline" href={`/${base_route}/member/${sale.customer_id}`} target="blank">
                                                {sale.name}
                                            </Link>



                                        </TableCell>
                                        <TableCell>{sale.owner}</TableCell>
                                        <TableCell>
                                            <Link className="hover:underline" target="blank" href={`/${base_route}/member/${sale.customer_id}/${sale.sale_id}`}>
                                                {sale.serial_no}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{sale.power}</TableCell>
                                        <TableCell className="font-medium">{sale.price}</TableCell>
                                        <TableCell>{sale.user_name ?? "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                </CardContent>
            </Card>
    )
}