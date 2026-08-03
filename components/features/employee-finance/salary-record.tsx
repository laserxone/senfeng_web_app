"use client"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import PageTable from "@/components/shared/tables/app-table"
import SalaryPdf from "@/components/features/salary/salaryPdf"
import axios from "@/lib/axios"
import moment from "moment"
import { FaRegFilePdf } from "react-icons/fa"
import { pdf } from "@react-pdf/renderer"
import { UserSalaryProps } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"

const SalaryRecord = ({
  id,
  height,
}: {
  id: number | string
  height?: string
}) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserSalaryProps[]>([])

  useEffect(() => {
    if (id) {
      fetchData(id)
    }
  }, [id])

  async function fetchData(id: number | string) {
    axios
      .get(`/${id}/record`)
      .then((response) => {
        setData(response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const columns: ColumnDef<UserSalaryProps>[] = [
    {
      accessorKey: "salary_month",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Salary Month
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("salary_month")
            ? moment(new Date(row.getValue("salary_month"))).format("MMMM YYYY")
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
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const payment = row.original

        return (
          <div className="flex gap-4">
            <FaRegFilePdf
              onClick={() => handleDownload(row.original)}
              className="h-7 w-7 text-red-500"
            />
          </div>
        )
      },
    },
  ]

  async function handleDownload(item: UserSalaryProps) {
    const blob = await pdf(<SalaryPdf data={item} />).toBlob()
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 600000)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1">
        <PageTable
          height={height}
          disableInput={true}
          loading={loading}
          columns={columns}
          data={data}
        />
      </div>
    </div>
  )
}

export default SalaryRecord
