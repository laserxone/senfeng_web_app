"use client"

import FilterSheet from "@/components/features/users/filter-sheet"
import CurrencyFormatter from "@/components/shared/common/currency-formatter"
import PageTable from "@/components/shared/tables/app-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Heading from "@/components/ui/heading"
import { Skeleton } from "@/components/ui/skeleton"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { FinanceProps } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Banknote, CircleDollarSign, Clock3 } from "lucide-react"
import moment from "moment"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false)
  const { userID, base_route } = useUserDetail()
  const [tableData, setTableData] = useState<FinanceProps[]>([])
  const [loading, setLoading] = useState(false)
  const [commulative, setCommulative] = useState({
    total: 0,
    pending: 0,
    received: 0,
  })
  const [commloading, setCommloading] = useState(false)
  const [filterDate, setFilterDate] = useState<{
    start: string | null
    end: string | null
  }>({ start: null, end: null })

  useEffect(() => {
    if (userID) fetchCommulative()
  }, [userID])

  async function fetchCommulative() {
    setCommloading(true)
    axios
      .get(`/${userID}/finance/all`)
      .then((response) => {
        setCommulative(response.data.summary)
        setTableData(response.data.items)
      })
      .finally(() => {
        setCommloading(false)
      })
  }

  const data = tableData.reduce(
    (acc, item) => {
      const total = Number(item.total_generated || item.machine_price || 0)
      const received = Number(item.amount || item.total_payment_received || 0)
      const pending = total - received

      acc.total += total
      acc.received += received
      acc.pending += pending

      return acc
    },
    {
      total: 0,
      received: 0,
      pending: 0,
    }
  )

  const columns: ColumnDef<FinanceProps>[] = [
    {
      accessorKey: "customer_owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("customer_owner")}</div>,
    },

    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Link
          target="blank"
          href={`/${base_route}/member/${row.original.customer_id}`}
          className="hover:underline"
        >
          <div>{row.getValue("customer_name")}</div>
        </Link>
      ),
    },
    {
      accessorKey: "machine_serial_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Machine
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Link
          target="blank"
          href={`/${base_route}/member/${row.original.customer_id}/${row.original.machine_id}`}
          className="hover:underline"
        >
          <div>{row.getValue("machine_serial_no")}</div>
        </Link>
      ),
    },

    {
      accessorKey: "machine_contract_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Contract Date
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("machine_contract_date")
            ? moment(new Date(row.getValue("machine_contract_date"))).format(
                "YYYY-MM-DD"
              )
            : "-"}
        </div>
      ),
    },

    {
      accessorKey: "sell_by_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sale Person
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("sell_by_name")}</div>,
    },

    {
      accessorKey: "total_generated",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("total_generated")}</div>,
    },

    {
      accessorKey: "total_payment_received",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Received
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("total_payment_received")}</div>,
    },

    {
      accessorKey: "total_balance",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Balance
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("total_balance")}</div>,
    },
  ]

  async function fetchData(
    startDate = "",
    endDate = "",
    user: string | null | number = null
  ) {
    try {
      const response = await axios.get(
        `/${userID}/finance?start_date=${startDate}&end_date=${endDate}&user=${user || ""}`
      )
      setTableData(response.data)
      setFilterDate({
        start: startDate,
        end: endDate,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between rounded-t-2xl border border-b-0 bg-card p-4 sm:p-5">
        <Heading panel title={"Finance"} description={"Manage finance"} />
      </div>
      <div className="!-mt-4 grid overflow-hidden rounded-b-2xl border bg-muted/20 shadow-sm sm:grid-cols-3 sm:divide-x">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <Banknote className="size-4 text-violet-600 dark:text-violet-400" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Bill generated
            </span>
            <span className="truncate text-sm font-bold">
              {commloading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <CurrencyFormatter amount={commulative?.total} />
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t px-4 py-3 sm:border-t-0 sm:px-5">
          <CircleDollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Received
            </span>
            <span className="truncate text-sm font-bold">
              {commloading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <CurrencyFormatter amount={commulative?.received} />
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t px-4 py-3 sm:border-t-0 sm:px-5">
          <Clock3 className="size-4 text-red-600 dark:text-red-400" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Pending
            </span>
            <span className="truncate text-sm font-bold">
              {commloading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <CurrencyFormatter amount={commulative?.pending} />
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-row flex-wrap justify-between gap-4">
        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardContent className="p-0 px-4 py-2">
            {filterDate?.start && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs">From</p>
                <p className="text-md font-bold text-blue-500">
                  {moment(filterDate.start).format("YYYY-MM-DD")}
                </p>
                <p className="text-xs">to</p>

                <p className="text-md font-bold text-blue-500">
                  {moment(filterDate.end).format("YYYY-MM-DD")}
                </p>
              </div>
            )}
            <div className="text-sm">Total Bill Generated</div>
            <div className="font-bold">
              <CurrencyFormatter amount={data?.total} />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardContent className="p-0 px-4 py-2">
            {filterDate?.start && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs">From</p>
                <p className="text-md font-bold text-blue-500">
                  {moment(filterDate.start).format("YYYY-MM-DD")}
                </p>
                <p className="text-xs">to</p>

                <p className="text-md font-bold text-blue-500">
                  {moment(filterDate.end).format("YYYY-MM-DD")}
                </p>
              </div>
            )}
            <div className="text-sm">Total Payment Received</div>
            <div className="font-bold text-green-400">
              <CurrencyFormatter amount={data?.received} />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardContent className="p-0 px-4 py-2">
            {filterDate?.start && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs">From</p>
                <p className="text-md font-bold text-blue-500">
                  {moment(filterDate.start).format("YYYY-MM-DD")}
                </p>
                <p className="text-xs">to</p>

                <p className="text-md font-bold text-blue-500">
                  {moment(filterDate.end).format("YYYY-MM-DD")}
                </p>
              </div>
            )}
            <div className="text-sm">Total Payment Pending</div>
            <div className="font-bold text-red-400">
              <CurrencyFormatter amount={data?.pending} />
            </div>
          </CardContent>
        </Card>
      </div>

      <PageTable
        loading={loading}
        columns={columns}
        data={tableData}
        onRowClick={(val, e) => {}}
        filter
        onFilterPress={() => setFilterVisible(true)}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={setFilterVisible}
        onReturn={async (val) => {
          setLoading(true)
          await fetchData(val.start, val.end, userID)
        }}
      />
    </div>
  )
}
