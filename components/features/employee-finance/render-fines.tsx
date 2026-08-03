import PageTable from "@/components/shared/tables/app-table"
import { Button } from "@/components/ui/button"
import { TIMEZONE } from "@/constants/data"
import axios from "@/lib/axios"
import { UserFines } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Filter } from "lucide-react"
import moment from "moment"
import momentT from "moment-timezone"
import { useEffect, useState } from "react"
import FilterSheet from "@/components/features/users/filter-sheet"

const columns: ColumnDef<UserFines>[] = [
  {
    accessorKey: "created_at",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div>
        {row.getValue("created_at")
          ? moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")
          : ""}
      </div>
    ),
  },

  {
    accessorKey: "user_name",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
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
          Customer
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
  },

  {
    accessorKey: "amount",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("amount")}</div>,
  },

  {
    accessorKey: "reason",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reason
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("reason")}</div>,
  },
]

const RenderFines = ({
  height,
  onUpdateTotal,
  userID,
}: {
  height?: string
  onUpdateTotal?: (item: number) => void
  userID: number | string
}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterVisible, setFilterVisible] = useState(false)
  useEffect(() => {
    if (userID) {
      const startDate = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString()
      const endDate = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString()
      fetchData(startDate, endDate)
    }
  }, [userID])

  async function fetchData(startDate: string, endDate: string) {
    setLoading(true)
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/fine?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setData(response.data)
          onUpdateTotal?.(response.data?.length || 0)
          resolve(true)
        })
        .catch((e) => {
          console.log(e)
          reject(null)
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }

  return (
    <>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-1">
          <PageTable
            height={height}
            loading={loading}
            columns={columns}
            data={data}
            filter
            onFilterPress={() => setFilterVisible(true)}
          />
        </div>
      </div>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end)
        }}
      />
    </>
  )
}

export default RenderFines
